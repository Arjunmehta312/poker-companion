const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bet = sequelize.define('Bet', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM('raise', 'call', 'fold', 'check', 'blind', 'all-in'),
      allowNull: false
    },
    round: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Bet;
}; 