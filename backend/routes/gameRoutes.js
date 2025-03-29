const express = require('express');
const router = express.Router();
const { Game, Player, Bet } = require('../models');
const { 
  generateRoomCode, 
  calculateSettlements, 
  getGameState, 
  findAvailableSeat 
} = require('../utils/gameUtils');

// Create a new game
router.post('/create', async (req, res) => {
  try {
    const { buyInAmount = 100 } = req.body;
    
    const roomCode = generateRoomCode();
    
    const game = await Game.create({
      roomCode,
      buyInAmount,
      status: 'waiting'
    });

    res.status(201).json({
      success: true,
      game: {
        id: game.id,
        roomCode: game.roomCode,
        buyInAmount: game.buyInAmount,
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
      error: error.message
    });
  }
});

// Join a game
router.post('/join', async (req, res) => {
  try {
    const { roomCode, playerName } = req.body;
    
    if (!roomCode || !playerName) {
      return res.status(400).json({
        success: false,
        message: 'Room code and player name are required'
      });
    }
    
    // Find the game
    const game = await Game.findOne({
      where: { roomCode }
    });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Check if the player name is already taken in this game
    const existingPlayer = await Player.findOne({
      where: {
        GameId: game.id,
        name: playerName
      }
    });
    
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'Player name already taken in this game'
      });
    }
    
    // Find an available seat
    const seat = await findAvailableSeat(game.id);
    
    if (seat === null) {
      return res.status(400).json({
        success: false,
        message: 'Game is full'
      });
    }
    
    // Create the player
    const player = await Player.create({
      name: playerName,
      balance: game.buyInAmount,
      totalBuyIn: game.buyInAmount,
      seat,
      status: 'active',
      GameId: game.id
    });
    
    res.status(201).json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        balance: player.balance,
        seat: player.seat
      },
      game: {
        id: game.id,
        roomCode: game.roomCode,
        buyInAmount: game.buyInAmount
      }
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join game',
      error: error.message
    });
  }
});

// Get game state
router.get('/state/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Find the game
    const game = await Game.findOne({
      where: { roomCode },
      include: [
        {
          model: Player,
          attributes: ['id', 'name', 'balance', 'totalBuyIn', 'seat', 'status', 'currentBet', 'isConnected']
        }
      ]
    });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    res.status(200).json({
      success: true,
      gameState: {
        id: game.id,
        roomCode: game.roomCode,
        pot: game.pot,
        status: game.status,
        buyInAmount: game.buyInAmount,
        currentTurn: game.currentTurn,
        round: game.round,
        smallBlind: game.smallBlind,
        bigBlind: game.bigBlind,
        players: game.Players
      }
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game state',
      error: error.message
    });
  }
});

// Buy-in again
router.post('/buy-in', async (req, res) => {
  try {
    const { playerId, amount } = req.body;
    
    if (!playerId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Player ID and amount are required'
      });
    }
    
    // Find the player
    const player = await Player.findByPk(playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    // Update player's balance and total buy-in
    await player.update({
      balance: player.balance + amount,
      totalBuyIn: player.totalBuyIn + amount,
      status: 'active'
    });
    
    res.status(200).json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        balance: player.balance,
        totalBuyIn: player.totalBuyIn
      }
    });
  } catch (error) {
    console.error('Error processing buy-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process buy-in',
      error: error.message
    });
  }
});

// End game and calculate settlements
router.post('/end/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Find the game
    const game = await Game.findOne({
      where: { roomCode }
    });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Update game status
    await game.update({ status: 'finished' });
    
    // Calculate settlements
    const results = await calculateSettlements(game.id);
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end game',
      error: error.message
    });
  }
});

// Reset game for a new round
router.post('/reset/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Find the game
    const game = await Game.findOne({
      where: { roomCode },
      include: [Player]
    });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Reset game state
    await game.update({
      pot: 0,
      status: 'active',
      round: 'preflop',
      currentTurn: null
    });
    
    // Reset all players
    for (const player of game.Players) {
      await player.update({
        status: player.balance > 0 ? 'active' : 'out',
        currentBet: 0
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Game reset successfully'
    });
  } catch (error) {
    console.error('Error resetting game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset game',
      error: error.message
    });
  }
});

// Kick a player from the game
router.post('/kick', async (req, res) => {
  try {
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'Player ID is required'
      });
    }
    
    // Find the player
    const player = await Player.findByPk(playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    // Remove the player
    await player.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Player kicked successfully'
    });
  } catch (error) {
    console.error('Error kicking player:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to kick player',
      error: error.message
    });
  }
});

module.exports = router; 