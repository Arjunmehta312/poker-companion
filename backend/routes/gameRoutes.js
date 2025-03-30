import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import models from '../models/index.js';
import { generateRoomCode, getGameState, getNextAvailableSeat, getNextPlayerTurn, calculateSettlements } from '../utils/gameUtils.js';

const router = express.Router();

// Create a new game
router.post('/create', async (req, res) => {
  try {
    const { buyIn = 100 } = req.body;

    // Generate a unique room code
    let roomCode = generateRoomCode();
    
    // Check if room code already exists
    let existingGame = await models.Game.findOne({ where: { roomCode } });
    while (existingGame) {
      roomCode = generateRoomCode();
      existingGame = await models.Game.findOne({ where: { roomCode } });
    }

    // Create the game
    const game = await models.Game.create({
      roomCode,
      buyIn,
      status: 'waiting',
      pot: 0,
      round: 'pre-flop',
      smallBlind: buyIn * 0.05, // 5% of buy-in
      bigBlind: buyIn * 0.1,    // 10% of buy-in
    });

    res.status(201).json({
      success: true,
      game: {
        id: game.id,
        roomCode: game.roomCode,
        buyIn: game.buyIn,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ success: false, error: 'Failed to create game' });
  }
});

// Join a game
router.post('/join/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { playerName } = req.body;

    if (!playerName) {
      return res.status(400).json({ success: false, error: 'Player name is required' });
    }

    // Find the game
    const game = await models.Game.findOne({ where: { roomCode } });
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Check if game has already started
    if (game.isStarted) {
      return res.status(400).json({ success: false, error: 'Game has already started' });
    }

    // Check if player name is already taken in this game
    const existingPlayer = await models.Player.findOne({
      where: { 
        name: playerName,
        GameId: game.id
      }
    });

    if (existingPlayer) {
      return res.status(400).json({ success: false, error: 'Player name already taken' });
    }

    // Get players in the game
    const players = await models.Player.findAll({ where: { GameId: game.id } });
    
    // Check if game is full (max 10 players)
    if (players.length >= 10) {
      return res.status(400).json({ success: false, error: 'Game is full' });
    }

    // Get the next available seat
    const seatNumber = await getNextAvailableSeat(game.id);

    // Create a new player
    const player = await models.Player.create({
      name: playerName,
      balance: game.buyIn,
      buyIn: game.buyIn,
      seatNumber,
      isAdmin: players.length === 0, // First player is admin
      isConnected: true,
      isReady: false,
      GameId: game.id
    });

    res.status(200).json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        balance: player.balance,
        seatNumber: player.seatNumber,
        isAdmin: player.isAdmin
      },
      game: {
        id: game.id,
        roomCode: game.roomCode,
        buyIn: game.buyIn,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ success: false, error: 'Failed to join game' });
  }
});

// Start the game
router.post('/start/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    // Find the game
    const game = await models.Game.findOne({ where: { roomCode } });
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Get players in the game
    const players = await models.Player.findAll({ where: { GameId: game.id } });
    
    // Check if there are at least 2 players
    if (players.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 players are needed to start the game' });
    }

    // Check if all players are ready
    const allReady = players.every(player => player.isReady);
    if (!allReady) {
      return res.status(400).json({ success: false, error: 'Not all players are ready' });
    }

    // Set the current turn
    const firstPlayer = players.find(p => p.seatNumber === 1) || players[0];

    // Update game status
    await game.update({
      status: 'active',
      isStarted: true,
      currentTurn: firstPlayer.id,
      startTime: new Date()
    });

    // Get updated game state
    const gameState = await getGameState(roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ success: false, error: 'Failed to start game' });
  }
});

// Set player ready
router.post('/ready', async (req, res) => {
  try {
    const { playerId, isReady } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, error: 'Player ID is required' });
    }

    // Find the player
    const player = await models.Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Update player ready status
    await player.update({ isReady });

    // Find the game
    const game = await models.Game.findByPk(player.GameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Get all players in the game
    const players = await models.Player.findAll({ where: { GameId: game.id } });
    
    // Check if all players are ready
    const allReady = players.every(p => p.isReady);
    
    // Update game status if all players are ready
    if (allReady && players.length >= 2 && game.status === 'waiting') {
      await game.update({ status: 'ready' });
    } else if (!allReady && game.status === 'ready') {
      await game.update({ status: 'waiting' });
    }

    // Get updated game state
    const gameState = await getGameState(game.roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error setting player ready:', error);
    res.status(500).json({ success: false, error: 'Failed to set player ready' });
  }
});

// Get game state
router.get('/state/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const gameState = await getGameState(roomCode);

    res.status(200).json(gameState);
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ success: false, error: 'Failed to get game state' });
  }
});

// Process a buy-in
router.post('/buyin', async (req, res) => {
  try {
    const { roomCode, playerId, amount } = req.body;

    if (!playerId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Player ID and amount are required' });
    }

    // Find the player
    const player = await models.Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Check if the player is out
    if (player.status !== 'out' && player.balance > 0) {
      return res.status(400).json({ success: false, error: 'Player is not eligible for buy-in' });
    }

    // Find the game
    const game = await models.Game.findByPk(player.GameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Update player balance and buy-in total
    await player.update({
      balance: player.balance + amount,
      buyIn: player.buyIn + amount,
      status: 'active'
    });

    // Get updated game state
    const gameState = await getGameState(game.roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error processing buy-in:', error);
    res.status(500).json({ success: false, error: 'Failed to process buy-in' });
  }
});

// Place a bet
router.post('/bet', async (req, res) => {
  try {
    const { roomCode, playerId, betType, amount } = req.body;

    if (!playerId || !betType) {
      return res.status(400).json({ success: false, error: 'Player ID and bet type are required' });
    }

    // Find the player
    const player = await models.Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Find the game
    const game = await models.Game.findByPk(player.GameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Check if it's the player's turn
    if (game.currentTurn !== player.id && betType !== 'buy-in') {
      return res.status(400).json({ success: false, error: 'It is not your turn' });
    }

    // Process the bet based on type
    switch (betType) {
      case 'fold':
        await player.update({ status: 'folded' });
        break;
        
      case 'check':
        // Check if player can check
        const highestBet = await models.Player.max('currentBet', { where: { GameId: game.id } });
        if (player.currentBet < highestBet) {
          return res.status(400).json({ success: false, error: 'Cannot check, must call or raise' });
        }
        break;
        
      case 'call':
        // Calculate call amount
        const callAmount = await models.Player.max('currentBet', { where: { GameId: game.id } }) - player.currentBet;
        
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
        
        break;
        
      case 'raise':
        if (!amount || amount <= 0) {
          return res.status(400).json({ success: false, error: 'Raise amount is required' });
        }
        
        // Check if player has enough balance
        if (amount > player.balance) {
          return res.status(400).json({ success: false, error: 'Not enough balance' });
        }
        
        // Update player balance and current bet
        await player.update({
          balance: player.balance - amount,
          currentBet: player.currentBet + amount
        });
        
        // Update pot
        await game.update({ pot: game.pot + amount });
        
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
        
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Invalid bet type' });
    }

    // Record the bet
    if (betType !== 'fold' && betType !== 'check') {
      await models.Bet.create({
        amount: betType === 'call' ? callAmount : (betType === 'all-in' ? allInAmount : amount),
        type: betType,
        round: game.round,
        PlayerId: player.id,
        GameId: game.id
      });
    }

    // Move to the next player's turn
    const nextPlayerId = await getNextPlayerTurn(game.id, player.id);
    await game.update({ currentTurn: nextPlayerId });

    // Get updated game state
    const gameState = await getGameState(game.roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ success: false, error: 'Failed to place bet' });
  }
});

// End the game
router.post('/end/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    // Find the game
    const game = await models.Game.findOne({ where: { roomCode } });
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Update game status
    await game.update({
      status: 'finished',
      endTime: new Date()
    });

    // Get all players in the game
    const players = await models.Player.findAll({
      where: { GameId: game.id },
      attributes: ['id', 'name', 'balance', 'buyIn']
    });

    // Calculate settlements
    const settlements = calculateSettlements(players);

    // Get updated game state
    const gameState = await getGameState(roomCode);

    res.status(200).json({
      success: true,
      gameState,
      settlements
    });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ success: false, error: 'Failed to end game' });
  }
});

// Reset game for a new round
router.post('/reset/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    // Find the game
    const game = await models.Game.findOne({ where: { roomCode } });
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Reset game state
    await game.update({
      status: 'waiting',
      isStarted: false,
      pot: 0,
      round: 'pre-flop',
      currentTurn: null,
      startTime: null,
      endTime: null
    });

    // Reset all players
    await models.Player.update(
      {
        currentBet: 0,
        status: 'active',
        isReady: false
      },
      { where: { GameId: game.id } }
    );

    // Get updated game state
    const gameState = await getGameState(roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error resetting game:', error);
    res.status(500).json({ success: false, error: 'Failed to reset game' });
  }
});

// Kick a player from the game
router.post('/kick', async (req, res) => {
  try {
    const { roomCode, playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, error: 'Player ID is required' });
    }

    // Find the player
    const player = await models.Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Find the game
    const game = await models.Game.findByPk(player.GameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Delete the player
    await player.destroy();

    // If it was the player's turn, move to the next player
    if (game.currentTurn === player.id) {
      const nextPlayerId = await getNextPlayerTurn(game.id);
      await game.update({ currentTurn: nextPlayerId });
    }

    // Get updated game state
    const gameState = await getGameState(game.roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error kicking player:', error);
    res.status(500).json({ success: false, error: 'Failed to kick player' });
  }
});

// Update player connection status
router.post('/connection', async (req, res) => {
  try {
    const { roomCode, playerId, isConnected } = req.body;

    if (!playerId) {
      return res.status(400).json({ success: false, error: 'Player ID is required' });
    }

    // Find the player
    const player = await models.Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Update connection status
    await player.update({ isConnected });

    // Find the game
    const game = await models.Game.findByPk(player.GameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    // Get updated game state
    const gameState = await getGameState(game.roomCode);

    res.status(200).json({
      success: true,
      gameState
    });
  } catch (error) {
    console.error('Error updating connection status:', error);
    res.status(500).json({ success: false, error: 'Failed to update connection status' });
  }
});

export default router; 