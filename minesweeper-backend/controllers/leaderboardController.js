// minesweeper-backend/controllers/leaderboardController.js
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    // Fetch top records sorted by bestTime
    const records = await Leaderboard.find({ difficulty })
      .populate('userId', 'username')
      .sort({ bestTime: 1 })
      .limit(10); // top 10
    
    // Format the response to match previous structure, with better error handling
    const formattedRecords = records.map(record => {
      // Check if userId is populated properly
      const username = record.userId ? record.userId.username : 'Unknown User';
      
      return {
        _id: record._id,
        id: record._id, // Add id for frontend compatibility
        difficulty: record.difficulty,
        bestTime: record.bestTime,
        User: {
          username
        },
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });

    console.log(`Fetched ${formattedRecords.length} records for ${difficulty} difficulty`);
    res.status(200).json({ leaderboard: formattedRecords });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
