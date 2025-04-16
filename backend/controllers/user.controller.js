// controllers/user.controller.js
const User = require('../models/User');
const mongoose = require('mongoose'); // Might need for validation later

// Update user's password
exports.updatePassword = async (req, res) => {
  const userId = req.user.userId; // From authenticateToken middleware
  const { currentPassword, newPassword } = req.body;

  console.log(`\n--- PATCH /api/user/password START - User: ${userId} ---`);
  // console.log("PATCH /api/user/password: Received request (passwords redacted)");

  // Validation
  if (!currentPassword || !newPassword) {
    console.log("PATCH /api/user/password: Missing fields - Sending 400");
    return res.status(400).json({ message: "Current password and new password are required." });
  }
  if (newPassword.length < 6) {
    console.log("PATCH /api/user/password: New password too short - Sending 400");
    return res.status(400).json({ message: "New password must be at least 6 characters long." });
  }
  if (currentPassword === newPassword) {
    console.log("PATCH /api/user/password: New password same as old - Sending 400");
    return res.status(400).json({ message: "New password cannot be the same as the current password." });
  }

  try {
    // Find User (including password field for comparison)
    console.log(`PATCH /api/user/password: Finding user ${userId}...`);
    const user = await User.findById(userId).select('+password');
    if (!user) {
      console.log("PATCH /api/user/password: User not found (token invalid?) - Sending 404");
      return res.status(404).json({ message: "User not found." });
    }

    // Verify Current Password
    console.log(`PATCH /api/user/password: Verifying current password for user ${userId}...`);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log(`PATCH /api/user/password: Current password incorrect - Sending 401`);
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // Update Password (Hashing handled by pre-save hook in User model)
    console.log(`PATCH /api/user/password: Updating password for user ${userId}...`);
    user.password = newPassword; // Assign plain text, pre-save hook will hash
    await user.save(); // Trigger hook and save
    console.log(`PATCH /api/user/password: Password updated successfully for user ${userId}.`);

    // Success Response
    console.log("PATCH /api/user/password: Sending 200 response...");
    res.status(200).json({ message: "Password updated successfully!" });

  } catch (error) {
    console.error("PATCH /api/user/password: CATCH block - Error:", error);
    // Handle potential validation errors during save, although basic ones are caught above
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(el => el.message);
        console.log("PATCH /api/user/password: Validation Error during save - Sending 400");
        return res.status(400).json({ message: "Validation Error", errors: errors });
    }
    console.log("PATCH /api/user/password: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error updating password." });
  } finally {
      console.log(`--- PATCH /api/user/password END ---`);
  }
};

// Update user profile details (username, phone, bio, avatarUrl)
exports.updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username, phone, bio, avatarUrl } = req.body;

  console.log(`\n--- PATCH /api/user/profile START - User: ${userId} ---`);
  console.log("PATCH /api/user/profile: Received data:", req.body);

  // Build update object dynamically only with provided fields
  const updateData = {};
  if (username !== undefined) updateData.username = username.trim();
  if (phone !== undefined) updateData.phone = phone.trim();
  if (bio !== undefined) updateData.bio = bio.trim();
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    console.log("PATCH /api/user/profile: No fields to update - Sending 400");
    return res.status(400).json({ message: "No fields provided for update." });
  }

  // Basic Validation (add more specific ones as needed)
  if (updateData.username && updateData.username.length < 3) {
    console.log("PATCH /api/user/profile: Username too short - Sending 400");
    return res.status(400).json({ message: "Username must be at least 3 characters long." });
  }
  // TODO: Add validation for phone format, bio length, avatar URL format if required

  try {
    // Check Username Uniqueness (if it's being changed)
    if (updateData.username) {
      console.log(`PATCH /api/user/profile: Checking username uniqueness for "${updateData.username}"...`);
      const existingUser = await User.findOne({
        username: updateData.username,
        _id: { $ne: userId } // Check other users
      });
      if (existingUser) {
        console.log("PATCH /api/user/profile: Username already exists - Sending 400");
        return res.status(400).json({ message: "Username already taken." });
      }
      console.log("PATCH /api/user/profile: New username is unique.");
    }

    // Find user and update, return the updated document (excluding password)
    console.log(`PATCH /api/user/profile: Updating user ${userId} with:`, updateData);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true, context: 'query' } // Return updated doc, run schema validators
    ).select('-password'); // Exclude password

    if (!updatedUser) {
      // This shouldn't typically happen if the token is valid and user exists
      console.log("PATCH /api/user/profile: User not found during update - Sending 404");
      return res.status(404).json({ message: "User not found." });
    }

    console.log(`PATCH /api/user/profile: Profile updated successfully for user ${userId}.`);

    // Success Response with updated user data
    console.log("PATCH /api/user/profile: Sending 200 response...");
    res.status(200).json({
      message: "Profile updated successfully!",
      user: updatedUser, // Send back updated user (without password)
    });

  } catch (error) {
    console.error("PATCH /api/user/profile: CATCH block - Error:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      console.log("PATCH /api/user/profile: Validation Error - Sending 400");
      return res.status(400).json({ message: "Validation Error", errors: errors });
    }
    // Catch potential duplicate key error on username if unique index exists
    // (Should be caught by the check above, but this is a safety net)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
      console.log("PATCH /api/user/profile: Duplicate username error on save - Sending 400");
      return res.status(400).json({ message: "Username already exists." });
    }
    console.log("PATCH /api/user/profile: Generic Error - Sending 500");
    res.status(500).json({ message: "Server error updating profile." });
  } finally {
      console.log(`--- PATCH /api/user/profile END ---`);
  }
};