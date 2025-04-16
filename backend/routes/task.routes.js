// routes/task.routes.js
const express = require('express');
const taskController = require('../controllers/task.controller');
const authenticateToken = require('../middleware/authenticateToken'); // Import auth middleware
const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(authenticateToken);

// POST /api/tasks - Create a new task
router.post('/', taskController.createTask);

// GET /api/tasks - Get all tasks for the user
router.get('/', taskController.getTasks);

// PATCH /api/tasks/:taskId - Update a specific task (e.g., status)
router.patch('/:taskId', taskController.updateTask);

// DELETE /api/tasks/:taskId - Delete a specific task (Optional)
router.delete('/:taskId', taskController.deleteTask);


module.exports = router;