const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// ---------- CONFIG ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'expense-secret';

// ---------- MIDDLEWARE (VERY IMPORTANT) ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔥 REQUIRED
app.use(express.static(path.join(__dirname, 'public')));

// ---------- DEFAULT ROUTE ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ---------- DB CONNECTION ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB error:', err));

// ---------- MODELS ----------
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  category: String,
  description: String,
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ---------- AUTH MIDDLEWARE ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
}

// ---------- REGISTER ----------
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed
    });

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// ---------- DASHBOARD ----------
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const tx = await Transaction.find({ userId: req.userId });

  let income = 0, expense = 0;
  tx.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  });

  res.json({
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense
  });
});

// ---------- TRANSACTIONS ----------
app.get('/api/transactions', authenticateToken, async (req, res) => {
  const tx = await Transaction.find({ userId: req.userId });
  res.json(tx);
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  const t = await Transaction.create({
    ...req.body,
    userId: req.userId
  });
  res.json(t);
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  await Transaction.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
