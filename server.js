const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// IMPORTANT: use environment PORT for hosting
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-secret';

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ---------- MONGODB CONNECTION (ATLAS) ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---------- SCHEMAS ----------
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String, // income | expense
  amount: Number,
  category: String,
  description: String,
  date: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ---------- AUTH MIDDLEWARE ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
}

// ---------- ROUTES ----------

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get all transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
  res.json(transactions);
});

// Add transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { type, amount, category, description, date } = req.body;

  const transaction = new Transaction({
    userId: req.userId,
    type,
    amount,
    category,
    description,
    date: date || new Date()
  });

  await transaction.save();
  res.json(transaction);
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  await Transaction.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Transaction deleted' });
});

// Dashboard summary
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const transactions = await Transaction.find({ userId: req.userId });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};

  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;

    if (t.type === 'expense') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  res.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryTotals
  });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
