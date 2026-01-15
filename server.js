const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "expense-tracker-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // OK for Render
  })
);

app.use(express.static(path.join(__dirname, "public")));

/* ---------------- DATABASE ---------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error(err));

/* ---------------- SCHEMAS ---------------- */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const TransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String, // income / expense
  amount: Number,
  category: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);

/* ---------------- AUTH ---------------- */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: false });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ success: false });

  req.session.userId = user._id; // 🔥 IMPORTANT
  res.json({ success: true });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* ---------------- TRANSACTIONS ---------------- */
app.post("/transaction", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({});

  const { type, amount, category, description } = req.body;

  await Transaction.create({
    userId: req.session.userId, // 🔥 KEY FIX
    type,
    amount,
    category,
    description
  });

  res.json({ success: true });
});

app.get("/transactions", async (req, res) => {
  if (!req.session.userId) return res.status(401).json([]);

  const data = await Transaction.find({ userId: req.session.userId });
  res.json(data);
});

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
