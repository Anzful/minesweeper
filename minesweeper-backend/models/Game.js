// minesweeper-backend/models/Game.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
  },
  timeTaken: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'won', 'lost'),
    defaultValue: 'in_progress',
  },
});

// Association
Game.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Game, { foreignKey: 'userId' });

module.exports = Game;
