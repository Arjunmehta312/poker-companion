const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Player = sequelize.define('Player', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalBuyIn: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    seat: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'folded', 'all-in', 'out'),
      defaultValue: 'active'
    },
    currentBet: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    socketId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Player;
}; 