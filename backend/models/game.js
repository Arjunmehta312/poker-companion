const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Game = sequelize.define('Game', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    pot: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('waiting', 'active', 'finished'),
      defaultValue: 'waiting'
    },
    buyInAmount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    currentTurn: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    round: {
      type: DataTypes.STRING,
      defaultValue: 'preflop'
    },
    smallBlind: {
      type: DataTypes.FLOAT,
      defaultValue: 5
    },
    bigBlind: {
      type: DataTypes.FLOAT,
      defaultValue: 10
    }
  });

  return Game;
}; 