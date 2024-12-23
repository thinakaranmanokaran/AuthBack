const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const OTP = require('./models/Verification'); // Import OTP model



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
app.post('/api/users/register', async (req, res) => {
    // console.log('Request received at /api/users/register'); // Add this
    const { name, email, password } = req.body;
    // console.log('Request body:', req.body); // Add this to verify payload

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a random OTP
        const otp = crypto.randomInt(10000, 99999).toString();

        // Save OTP and user data in the OTP collection
        const otpEntry = new OTP({ email, name, password: hashedPassword, otp });
        await otpEntry.save();

        // Send the OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Verification',
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent successfully. Verify to complete registration.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during registration', error: error.message });
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

const transporter = nodemailer.createTransport({
    service: 'gmail', // Replace with your email provider
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS  // Your email password
    }
});

// app.post('/api/auth/send-otp', async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ message: 'Email is required' });
//     }

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Generate a random 6-digit OTP
//         const otp = crypto.randomInt(10000, 99999).toString();

//         // Save OTP in the database
//         const otpEntry = new OTP({ userId: user._id, otp });
//         await otpEntry.save();

//         // Send the OTP via email
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Your OTP for Verification',
//             text: `Your OTP is ${otp}. It is valid for 5 minutes.`
//         };

//         await transporter.sendMail(mailOptions);

//         res.status(200).json({ message: 'OTP sent successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error sending OTP', error: error.message });
//     }
// });

app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        // Check if OTP is valid
        const otpEntry = await OTP.findOne({ email, otp });
        if (!otpEntry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Create the user in the database
        const newUser = await User.create({
            name: otpEntry.name,
            email: otpEntry.email,
            password: otpEntry.password
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, name: newUser.name },
            process.env.JWT_SECRET || "defaultSecretKey",
            { expiresIn: '30d' }
        );

        // Delete the OTP entry
        await OTP.deleteOne({ _id: otpEntry._id });

        res.status(201).json({ token, user: newUser, message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying OTP', error: error.message });
    }
});



// http://localhost:5000/api/users/check-email?email=dheena@mail.com

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
