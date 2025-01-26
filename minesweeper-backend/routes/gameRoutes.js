// minesweeper-backend/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const { authRequired } = require('../middlewares/authMiddleware');
const gameController = require('../controllers/gameController');

router.post('/', authRequired, gameController.createGame);
router.put('/:gameId', authRequired, gameController.updateGameStatus);

module.exports = router;
