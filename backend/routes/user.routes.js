// routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// PATCH /api/user/password - Update user password
router.patch('/password', userController.updatePassword);

// PATCH /api/user/profile - Update user profile details
router.patch('/profile', userController.updateProfile);

// GET /api/user/profile - Get current user's profile (Optional)
// router.get('/profile', (req, res) => { /* Fetch user data from DB using req.user.userId */});

module.exports = router;