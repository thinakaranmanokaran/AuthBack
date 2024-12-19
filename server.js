const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

// Model Import
const User = require('./models/User');

// Routes
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Create new user
    const newUser = await User.create({ name, email, password });
    res.status(201).json(newUser);
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if user exists by email
app.get('/api/users/check-email', async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  if (user) {
    res.status(200).json({ exists: true });
  } else {
    res.status(200).json({ exists: false });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
