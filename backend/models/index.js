import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: join(__dirname, '../database.sqlite'),
  logging: false
});

// Import models
import Game from './game.js';
import Player from './player.js';
import Bet from './bet.js';

// Initialize models
const models = {
  Game: Game(sequelize),
  Player: Player(sequelize),
  Bet: Bet(sequelize)
};

// Set up associations
models.Game.hasMany(models.Player);
models.Player.belongsTo(models.Game);

models.Game.hasMany(models.Bet);
models.Bet.belongsTo(models.Game);

models.Player.hasMany(models.Bet);
models.Bet.belongsTo(models.Player);

// Export models and sequelize instance
export { sequelize };
export default models; 