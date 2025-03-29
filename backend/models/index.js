const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

// Import models
const Game = require('./game')(sequelize);
const Player = require('./player')(sequelize);
const Bet = require('./bet')(sequelize);

// Define relationships
Game.hasMany(Player, { onDelete: 'CASCADE' });
Player.belongsTo(Game);

Game.hasMany(Bet, { onDelete: 'CASCADE' });
Player.hasMany(Bet, { onDelete: 'CASCADE' });
Bet.belongsTo(Game);
Bet.belongsTo(Player);

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Game,
  Player,
  Bet
}; 