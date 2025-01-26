// minesweeper-backend/controllers/leaderboardController.js
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const { difficulty } = req.params;
    // Fetch top records sorted by bestTime
    const records = await Leaderboard.findAll({
      where: { difficulty },
      include: [{ model: User, attributes: ['username'] }],
      order: [['bestTime', 'ASC']],
      limit: 10, // top 10
    });

    res.status(200).json({ leaderboard: records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
