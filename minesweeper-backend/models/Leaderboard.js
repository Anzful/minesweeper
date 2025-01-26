// minesweeper-backend/models/Leaderboard.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Leaderboard = sequelize.define('Leaderboard', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
  },
  bestTime: {
    type: DataTypes.INTEGER, // store best (lowest) time
    allowNull: false,
  },
});

// Association
Leaderboard.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Leaderboard, { foreignKey: 'userId' });

module.exports = Leaderboard;
