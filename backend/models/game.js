import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Game = sequelize.define('Game', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roomCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('waiting', 'ready', 'active', 'finished'),
      defaultValue: 'waiting'
    },
    buyIn: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 100
    },
    pot: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    round: {
      type: DataTypes.STRING,
      defaultValue: 'pre-flop'
    },
    smallBlind: {
      type: DataTypes.FLOAT,
      defaultValue: 5
    },
    bigBlind: {
      type: DataTypes.FLOAT,
      defaultValue: 10
    },
    currentTurn: {
      type: DataTypes.UUID,
      allowNull: true
    },
    dealerPosition: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isStarted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return Game;
}; 