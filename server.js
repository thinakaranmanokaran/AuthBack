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
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register User
app.post('/api/users', async (req, res) => {
	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		return res.status(400).json({ message: "All fields are required" });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await User.create({ name, email, password: hashedPassword });

		// Generate JWT token

		const jwt = require('jsonwebtoken');

		// Define your secret key
		const jwtSecret = process.env.JWT_SECRET || "defaultSecretKey";

		// Create a JWT token
		const token = jwt.sign(
			{ id: newUser._id, email: newUser.email }, // Payload
			jwtSecret, // Secret key
			{ expiresIn: "30d" } // Expiration option
		);

		res.status(201).json({ message: "Registration successful", token, user: newUser });
	} catch (err) {
		if (err.code === 11000) {
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

app.get('/api/users/check-email', async (req, res) => {
	const { email } = req.query;

	if (!email) {
		return res.status(400).json({ message: 'Email is required' });
	}

	try {
		const user = await User.findOne({ email });
		if (user) {
			return res.status(200).json({ exists: true });
		} else {
			return res.status(200).json({ exists: false });
		}
	} catch (err) {
		return res.status(500).json({ message: 'Error checking email', error: err.message });
	}
});

// http://localhost:5000/api/users/check-email?email=dheena@mail.com

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
