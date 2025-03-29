const express = require('express');
const router = express.Router();
const { Game, Player, Bet } = require('../models');
const { getGameState, getNextPlayerTurn } = require('../utils/gameUtils');

// Place a bet
router.post('/place', async (req, res) => {
  try {
    const { playerId, amount, type, gameId } = req.body;
    
    if (!playerId || !type || !gameId) {
      return res.status(400).json({
        success: false,
        message: 'Player ID, bet type, and game ID are required'
      });
    }
    
    // Find the game
    const game = await Game.findByPk(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
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
    
    // Check if it's the player's turn
    if (game.currentTurn !== null && player.seat !== game.currentTurn) {
      return res.status(400).json({
        success: false,
        message: 'Not your turn'
      });
    }
    
    // Process the bet based on its type
    switch (type) {
      case 'fold':
        // Player folds
        await player.update({ status: 'folded' });
        break;
        
      case 'check':
        // Player checks (no action needed)
        break;
        
      case 'call':
      case 'raise':
        // Check if player has enough balance
        if (amount > player.balance) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance'
          });
        }
        
        // Update player's balance and current bet
        await player.update({
          balance: player.balance - amount,
          currentBet: player.currentBet + amount
        });
        
        // Update game pot
        await game.update({
          pot: game.pot + amount
        });
        
        // Handle all-in situation
        if (player.balance === 0) {
          await player.update({ status: 'all-in' });
        }
        break;
        
      case 'all-in':
        const allInAmount = player.balance;
        
        // Update player's balance and current bet
        await player.update({
          balance: 0,
          currentBet: player.currentBet + allInAmount,
          status: 'all-in'
        });
        
        // Update game pot
        await game.update({
          pot: game.pot + allInAmount
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid bet type'
        });
    }
    
    // Record the bet
    await Bet.create({
      amount: type === 'all-in' ? player.balance : (amount || 0),
      type,
      round: game.round,
      GameId: gameId,
      PlayerId: playerId
    });
    
    // Determine the next player's turn
    const nextTurn = await getNextPlayerTurn(gameId);
    
    // Update the game's current turn
    await game.update({ currentTurn: nextTurn });
    
    // Get the updated game state
    const gameState = await getGameState(gameId);
    
    res.status(200).json({
      success: true,
      message: 'Bet placed successfully',
      gameState
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place bet',
      error: error.message
    });
  }
});

// Get bet history for a game
router.get('/history/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game
    const game = await Game.findByPk(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Get bet history
    const bets = await Bet.findAll({
      where: { GameId: gameId },
      include: [
        {
          model: Player,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      bets
    });
  } catch (error) {
    console.error('Error getting bet history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bet history',
      error: error.message
    });
  }
});

module.exports = router; 