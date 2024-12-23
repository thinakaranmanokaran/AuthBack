const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId, // Optional, for existing users
    email: { type: String, required: true },
    otp: { type: String, required: true },
    name: { type: String }, // Temporarily store name
    password: { type: String }, // Temporarily store hashed password
    createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 5 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
