import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Bet = sequelize.define('Bet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('raise', 'call', 'check', 'fold', 'all-in'),
      allowNull: false
    },
    round: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Bet;
}; 