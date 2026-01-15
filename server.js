const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ================= MODELS ================= */
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
}));

const Transaction = mongoose.model("Transaction", new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  category: String,
  description: String,
  date: { type: Date, default: Date.now }
}));

/* ================= ROUTES ================= */

// Pages
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public/login.html")));
app.get("/signup", (_, res) => res.sendFile(path.join(__dirname, "public/signup.html")));
app.get("/dashboard", (_, res) => res.sendFile(path.join(__dirname, "public/dashboard.html")));

/* ---------- SIGNUP ---------- */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.findOne({ email })) {
    return res.status(400).json({ message: "User exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  res.json({ success: true });
});

/* ---------- LOGIN ---------- */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ success: true, userId: user._id });
});

/* ---------- TRANSACTIONS ---------- */
app.post("/transaction", async (req, res) => {
  await Transaction.create(req.body);
  res.json({ success: true });
});

app.get("/transactions/:userId", async (req, res) => {
  const txns = await Transaction.find({ userId: req.params.userId });
  res.json(txns);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
