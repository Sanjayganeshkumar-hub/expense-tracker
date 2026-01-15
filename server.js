const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const app = express();

/* -------------------- CONFIG -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* -------------------- DB -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error(err));

/* -------------------- SESSION -------------------- */
app.use(
  session({
    name: "expense-tracker-session",
    secret: process.env.SESSION_SECRET || "expense_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    },
    store: MongoStore({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    })
  })
);


/* -------------------- MODELS -------------------- */
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
  })
);

const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    amount: Number,
    category: String,
    description: String,
    date: { type: Date, default: Date.now }
  })
);

/* -------------------- ROUTES -------------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* SIGNUP */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });
    res.json({ success: true });
  } catch {
    res.status(400).json({ success: false });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ success: false });

  req.session.userId = user._id;
  res.json({ success: true });
});

/* AUTH CHECK */
app.get("/auth", (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  res.json({ loggedIn: true });
});

/* DASHBOARD */
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* ADD TRANSACTION */
app.post("/transaction", async (req, res) => {
  if (!req.session.userId) return res.status(401).end();

  const { type, amount, category, description } = req.body;
  await Transaction.create({
    userId: req.session.userId,
    type,
    amount,
    category,
    description
  });
  res.json({ success: true });
});

/* GET TRANSACTIONS */
app.get("/transactions", async (req, res) => {
  if (!req.session.userId) return res.status(401).end();
  const data = await Transaction.find({ userId: req.session.userId });
  res.json(data);
});

/* LOGOUT */
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

/* -------------------- START -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
