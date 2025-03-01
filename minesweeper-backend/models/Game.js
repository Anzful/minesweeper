// minesweeper-backend/models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  timeTaken: {
    type: Number, // in seconds
  },
  status: {
    type: String,
    enum: ['in_progress', 'won', 'lost'],
    default: 'in_progress',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
