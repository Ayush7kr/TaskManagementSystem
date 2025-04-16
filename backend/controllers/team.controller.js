// controllers/team.controller.js
const User = require('../models/User');

// Get all users (team members)
exports.getTeamMembers = async (req, res) => {
  console.log(`\n--- GET /api/team/members START - User: ${req.user?.userId} ---`);
  // Future: Add filtering/permissions based on req.user if needed

  try {
    console.log("GET /api/team/members: Fetching all users...");
    // Fetch all users, exclude password, sort by username
    const members = await User.find({})
                               .select('-password')
                               .sort({ username: 1 }); // Sort alphabetically by username

    console.log(`GET /api/team/members: Found ${members.length} members.`);

    // If you need assigned task counts per user, that would require a more complex aggregation query here or separate endpoint calls from the frontend.
    // Returning the plain user list for now.

    console.log("GET /api/team/members: Sending 200 response...");
    res.status(200).json(members);

  } catch (error) {
    console.error("GET /api/team/members: CATCH block - Error:", error);
    console.log("GET /api/team/members: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error fetching team members." });
  } finally {
      console.log(`--- GET /api/team/members END ---`);
  }
};

// Add a new team member (similar to registration)
exports.addTeamMember = async (req, res) => {
  // Future: Check if req.user.role === 'admin' or similar permission check
  console.log(`\n--- POST /api/team/members START - User: ${req.user?.userId} ---`);
  const { username, email, password, role } = req.body;
  console.log("POST /api/team/members: Received data:", { username, email, role }); // Don't log password

  // --- Validation ---
  if (!username || !email || !password) {
    console.log("POST /api/team/members: Missing fields - Sending 400");
    return res.status(400).json({ message: "Username, email, and password are required." });
  }
  if (password.length < 6) {
    console.log("POST /api/team/members: Password too short - Sending 400");
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }
  // Validate role against schema enum if provided
  if (role) {
    const validRoles = User.schema.path('role').enumValues;
    if (!validRoles.includes(role)) {
        console.log("POST /api/team/members: Invalid role specified - Sending 400");
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }
  }
  // Add email format validation if desired

  try {
    // --- Check for existing user ---
    console.log("POST /api/team/members: Checking existing user...");
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("POST /api/team/members: User exists - Sending 400");
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} already exists.` });
    }

    // --- Create and save new user ---
    console.log("POST /api/team/members: Creating new User instance...");
    const newUser = new User({
      username,
      email,
      password, // Hashing handled by pre-save hook
      role: role || 'user', // Use provided role or default to 'user'
    });
    console.log("POST /api/team/members: Saving new user...");
    const savedUser = await newUser.save();
    console.log("POST /api/team/members: User saved successfully.");

    // --- Prepare response (exclude password) ---
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      phone: savedUser.phone,
      bio: savedUser.bio,
      avatarUrl: savedUser.avatarUrl,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };

    console.log("POST /api/team/members: Sending 201 response...");
    res.status(201).json({ message: "Team member added successfully!", user: userResponse });

    // TODO: Optionally send a welcome email here

  } catch (error) {
    console.error("POST /api/team/members: CATCH block - Error:", error);
    if (error.name === 'ValidationError') {
      console.log("POST /api/team/members: Validation Error - Sending 400");
      const errors = Object.values(error.errors).map(el => el.message);
      return res.status(400).json({ message: "Validation Error", errors: errors });
    }
    // Handle potential duplicate key errors during save (safety net)
    if (error.code === 11000) {
        const field = error.keyPattern.email ? 'Email' : 'Username';
        console.log(`POST /api/team/members: Duplicate ${field} error on save - Sending 400`);
        return res.status(400).json({ message: `${field} already exists.` });
    }
    console.log("POST /api/team/members: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error adding team member." });
  } finally {
      console.log("--- POST /api/team/members END ---");
  }
};