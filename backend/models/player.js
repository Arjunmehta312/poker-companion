import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Player = sequelize.define('Player', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    buyIn: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'folded', 'all-in', 'out'),
      defaultValue: 'active'
    },
    currentBet: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    seatNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isReady: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    cards: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });

  return Player;
}; 