// controllers/auth.controller.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config'); // Import secret from central config

// Register a new user
exports.register = async (req, res) => {
  console.log("\n--- POST /api/auth/register START ---");
  const { username, email, password } = req.body;
  console.log("Register attempt:", { username, email }); // Don't log password

  // Basic Validation
  if (!username || !email || !password) {
    console.log("Register: Missing fields - Sending 400");
    return res.status(400).json({ message: "Username, email, and password are required." });
  }
  if (password.length < 6) {
    console.log("Register: Password too short - Sending 400");
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }
  // You might add email format validation here too

  try {
    console.log("Register: Checking existing user...");
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("Register: User exists - Sending 400");
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({ message: `User with this ${field} already exists.` });
    }

    console.log("Register: Creating new User instance...");
    const newUser = new User({ username, email, password }); // Hashing happens via pre-save hook in model
    console.log("Register: Saving new user...");
    await newUser.save();
    console.log("Register: User saved successfully.");

    // Prepare response (exclude password)
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
    console.log("Register: Sending 201 response...");
    res.status(201).json({ message: "User registered successfully!", user: userResponse });

  } catch (error) {
    console.error("Register: CATCH block - Error:", error);
    if (error.name === 'ValidationError') {
      console.log("Register: Validation Error - Sending 400");
      // Extract specific validation messages
      const errors = Object.values(error.errors).map(el => el.message);
      return res.status(400).json({ message: "Validation Error", errors: errors });
    }
    console.log("Register: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error during registration." });
  } finally {
    console.log("--- POST /api/auth/register END ---");
  }
};

// Login a user
exports.login = async (req, res) => {
  console.log("\n--- POST /api/auth/login START ---");
  const { email, password } = req.body;
  console.log("Login attempt:", { email }); // Don't log password

  if (!email || !password) {
    console.log("Login: Missing fields - Sending 400");
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    console.log("Login: Finding user by email (including password for comparison)...");
    // Find user by email and explicitly include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log("Login: User not found - Sending 401");
      return res.status(401).json({ message: "Invalid credentials." }); // Use generic message
    }

    console.log("Login: User found, comparing password...");
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log("Login: Password mismatch - Sending 401");
      return res.status(401).json({ message: "Invalid credentials." }); // Use generic message
    }

    console.log("Login: Password matches, generating JWT...");
    // Create JWT Payload
    const payload = {
      userId: user._id,
      username: user.username, // Include username if useful on frontend
      role: user.role,       // Include role for potential authorization checks
    };

    // Sign the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" }); // Or use config value for expiry
    console.log("Login: JWT generated.");

    // Prepare user object for response (exclude password)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log("Login: Sending 200 response with token and user profile...");
    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: userResponse,
    });

  } catch (error) {
    console.error("Login: CATCH block - Error:", error);
    console.log("Login: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error during login." });
  } finally {
    console.log("--- POST /api/auth/login END ---");
  }
};