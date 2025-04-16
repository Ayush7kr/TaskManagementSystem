// routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const taskRoutes = require('./task.routes');
const userRoutes = require('./user.routes');
const teamRoutes = require('./team.routes');

const router = express.Router();

// Mount authentication routes under /auth
router.use('/auth', authRoutes);

// Mount task routes under /tasks
router.use('/tasks', taskRoutes);

// Mount user profile routes under /user
router.use('/user', userRoutes);

// Mount team routes under /team
router.use('/team', teamRoutes);

module.exports = router;