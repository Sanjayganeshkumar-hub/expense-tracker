const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(console.error);

/* ================= SESSION ================= */
app.use(
  session({
    name: "expense-tracker-session",
    secret: process.env.SESSION_SECRET || "expense_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    })
  })
);

/* ================= MODELS ================= */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const TransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  category: String,
  description: String,
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);

/* ================= ROUTES ================= */
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);

app.post("/signup", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    await User.create({ ...req.body, password: hashed });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "User exists" });
  }
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.sendStatus(401);

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.sendStatus(401);

  req.session.userId = user._id;
  res.json({ success: true });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.post("/transaction", async (req, res) => {
  if (!req.session.userId) return res.sendStatus(401);

  await Transaction.create({
    ...req.body,
    userId: req.session.userId
  });

  res.json({ success: true });
});

app.get("/transactions", async (req, res) => {
  if (!req.session.userId) return res.sendStatus(401);
  res.json(await Transaction.find({ userId: req.session.userId }));
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
