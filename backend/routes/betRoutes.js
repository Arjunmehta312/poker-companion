import express from 'express';
import models from '../models/index.js';
import { getGameState, getNextPlayerTurn } from '../utils/gameUtils.js';

const router = express.Router();

// Place a bet
router.post('/place', async (req, res) => {
  try {
    const { playerId, gameId, type, amount } = req.body;

    if (!playerId || !gameId || !type) {
      return res.status(400).json({ success: false, error: 'Player ID, game ID, and bet type are required' });
    }

    // Find the player
    const player = await models.Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Find the game
    const game = await models.Game.findByPk(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Check if it's the player's turn
    if (game.currentTurn !== player.id) {
      return res.status(400).json({ success: false, error: 'It is not your turn' });
    }

    // Process the bet based on type
    let betAmount = 0;

    switch (type) {
      case 'fold':
        await player.update({ status: 'folded' });
        break;

      case 'check':
        // Check if player can check (no current bets)
        const highestBet = await models.Player.max('currentBet', { where: { GameId: gameId } });
        if (player.currentBet < highestBet) {
          return res.status(400).json({ success: false, error: 'Cannot check, must call or raise' });
        }
        break;

      case 'call':
        // Calculate call amount
        const callAmount = await models.Player.max('currentBet', { where: { GameId: gameId } }) - player.currentBet;
        
        if (callAmount <= 0) {
          return res.status(400).json({ success: false, error: 'Nothing to call' });
        }
        
        if (callAmount > player.balance) {
          return res.status(400).json({ success: false, error: 'Not enough balance to call' });
        }
        
        // Update player balance and current bet
        await player.update({
          balance: player.balance - callAmount,
          currentBet: player.currentBet + callAmount
        });
        
        // Update pot
        await game.update({ pot: game.pot + callAmount });
        
        betAmount = callAmount;
        break;

      case 'raise':
        if (!amount || amount <= 0) {
          return res.status(400).json({ success: false, error: 'Raise amount is required' });
        }
        
        // Check if player has enough balance
        if (amount > player.balance) {
          return res.status(400).json({ success: false, error: 'Not enough balance to raise' });
        }
        
        // Update player balance and current bet
        await player.update({
          balance: player.balance - amount,
          currentBet: player.currentBet + amount
        });
        
        // Update pot
        await game.update({ pot: game.pot + amount });
        
        betAmount = amount;
        break;

      case 'all-in':
        // Go all-in with remaining balance
        const allInAmount = player.balance;
        
        if (allInAmount <= 0) {
          return res.status(400).json({ success: false, error: 'No balance to go all-in' });
        }
        
        // Update player status, balance, and current bet
        await player.update({
          status: 'all-in',
          balance: 0,
          currentBet: player.currentBet + allInAmount
        });
        
        // Update pot
        await game.update({ pot: game.pot + allInAmount });
        
        betAmount = allInAmount;
        break;

      default:
        return res.status(400).json({ success: false, error: 'Invalid bet type' });
    }

    // Record the bet if not fold or check
    if (type !== 'fold' && type !== 'check') {
      await models.Bet.create({
        amount: betAmount,
        type,
        round: game.round,
        PlayerId: playerId,
        GameId: gameId
      });
    }

    res.status(200).json({
      success: true,
      bet: {
        type,
        amount: betAmount,
        round: game.round
      }
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ success: false, error: 'Failed to place bet' });
  }
});

// Get bet history for a game
router.get('/history/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Find all bets for the game
    const bets = await models.Bet.findAll({
      where: { GameId: gameId },
      include: [models.Player],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      bets: bets.map(bet => ({
        id: bet.id,
        amount: bet.amount,
        type: bet.type,
        round: bet.round,
        player: bet.Player ? bet.Player.name : 'Unknown',
        timestamp: bet.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting bet history:', error);
    res.status(500).json({ success: false, error: 'Failed to get bet history' });
  }
});

export default router; 