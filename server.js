const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ===================== SESSION ===================== */
app.use(
  session({
    secret: "expense-tracker-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

/* ===================== DB ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error(err));

/* ===================== MODELS ===================== */
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
  })
);

const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String, // income / expense
    amount: Number,
    category: String,
    description: String,
    date: { type: Date, default: Date.now },
  })
);

/* ===================== AUTH ===================== */
function isAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

/* ===================== ROUTES ===================== */

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid login" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "Invalid login" });

  req.session.userId = user._id;
  res.json({ success: true });
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Dashboard
app.get("/dashboard", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Add transaction
app.post("/transactions", isAuth, async (req, res) => {
  const tx = await Transaction.create({
    userId: req.session.userId,
    ...req.body,
  });
  res.json(tx);
});

// Get transactions
app.get("/transactions", isAuth, async (req, res) => {
  const txs = await Transaction.find({ userId: req.session.userId });
  res.json(txs);
});

/* ===================== START ===================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));
