const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error(err));

/* ================= MODELS ================= */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", UserSchema);

const TransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  category: String,
  description: String,
  date: { type: Date, default: Date.now }
});
const Transaction = mongoose.model("Transaction", TransactionSchema);

/* ================= ROUTES ================= */

// Login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Signup page
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public/signup.html"));
});

// Dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

/* ================= AUTH ================= */

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ success: true, userId: user._id });
});

/* ================= TRANSACTIONS ================= */

// ADD TRANSACTION
app.post("/transaction", async (req, res) => {
  try {
    await Transaction.create(req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Transaction failed" });
  }
});

// GET USER TRANSACTIONS
app.get("/transactions/:userId", async (req, res) => {
  const txns = await Transaction.find({ userId: req.params.userId });
  res.json(txns);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
