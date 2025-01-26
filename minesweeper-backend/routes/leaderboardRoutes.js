// minesweeper-backend/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

router.get('/:difficulty', leaderboardController.getLeaderboard);

module.exports = router;
