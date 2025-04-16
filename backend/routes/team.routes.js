// routes/team.routes.js
const express = require('express');
const teamController = require('../controllers/team.controller');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Apply authentication middleware to all team routes
router.use(authenticateToken);

// GET /api/team/members - Get list of all team members
router.get('/members', teamController.getTeamMembers);

// POST /api/team/members - Add a new team member (requires appropriate permission check in controller later)
router.post('/members', teamController.addTeamMember);

// Maybe add routes like GET /api/team/members/:memberId or PATCH /api/team/members/:memberId/role later

module.exports = router;