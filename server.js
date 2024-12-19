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
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
