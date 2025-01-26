// minesweeper-backend/controllers/gameController.js
const Game = require('../models/Game');
const Leaderboard = require('../models/Leaderboard');

exports.createGame = async (req, res) => {
  try {
    const { difficulty } = req.body;
    const userId = req.user.id; // from JWT middleware

    // Create a new game entry
    const newGame = await Game.create({
      userId,
      difficulty,
      status: 'in_progress',
    });

    res.status(201).json({ message: 'Game created', game: newGame });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGameStatus = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { status, timeTaken } = req.body;

    const game = await Game.findByPk(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Update game status
    game.status = status;
    if (timeTaken) game.timeTaken = timeTaken;
    await game.save();

    // If the user won, update the leaderboard
    if (status === 'won' && timeTaken) {
      const existingRecord = await Leaderboard.findOne({
        where: { userId: game.userId, difficulty: game.difficulty },
      });
      if (existingRecord) {
        // If current time is better (lower) than the bestTime
        if (timeTaken < existingRecord.bestTime) {
          existingRecord.bestTime = timeTaken;
          await existingRecord.save();
        }
      } else {
        // Create new leaderboard entry
        await Leaderboard.create({
          userId: game.userId,
          difficulty: game.difficulty,
          bestTime: timeTaken,
        });
      }
    }

    return res.status(200).json({ message: 'Game updated', game });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
