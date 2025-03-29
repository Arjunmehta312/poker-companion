const { v4: uuidv4 } = require('uuid');
const { Game, Player, Bet } = require('../models');

// Generate a unique room code
const generateRoomCode = () => {
  // Generate a 6-character alphanumeric room code
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Calculate settlements at the end of the game
const calculateSettlements = async (gameId) => {
  // Get all players in the game
  const players = await Player.findAll({
    where: { GameId: gameId },
    attributes: ['id', 'name', 'balance', 'totalBuyIn']
  });

  // Calculate profit/loss for each player
  const settlements = [];
  
  players.forEach(player => {
    const profitLoss = player.balance - player.totalBuyIn;
    settlements.push({
      playerId: player.id,
      playerName: player.name,
      totalBuyIn: player.totalBuyIn,
      finalBalance: player.balance,
      profitLoss
    });
  });

  // Calculate who owes whom
  const debts = [];
  
  // Sort players by profit/loss (winners first)
  settlements.sort((a, b) => b.profitLoss - a.profitLoss);
  
  const winners = settlements.filter(player => player.profitLoss > 0);
  const losers = settlements.filter(player => player.profitLoss < 0);
  
  // Match losers to winners to settle debts
  losers.forEach(loser => {
    let remainingDebt = Math.abs(loser.profitLoss);
    
    for (const winner of winners) {
      if (remainingDebt <= 0) break;
      
      const winnerRemainingToCollect = winner.profitLoss;
      if (winnerRemainingToCollect <= 0) continue;
      
      const amountToTransfer = Math.min(remainingDebt, winnerRemainingToCollect);
      
      if (amountToTransfer > 0) {
        debts.push({
          from: loser.playerName,
          to: winner.playerName,
          amount: amountToTransfer
        });
        
        remainingDebt -= amountToTransfer;
        winner.profitLoss -= amountToTransfer;
      }
    }
  });
  
  return {
    playerResults: settlements,
    settlements: debts
  };
};

// Get full game state
const getGameState = async (gameId) => {
  const game = await Game.findByPk(gameId, {
    include: [
      {
        model: Player,
        attributes: ['id', 'name', 'balance', 'totalBuyIn', 'seat', 'status', 'currentBet', 'isConnected']
      }
    ]
  });
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  return {
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
  };
};

// Find the next available seat
const findAvailableSeat = async (gameId) => {
  const players = await Player.findAll({
    where: { GameId: gameId },
    attributes: ['seat']
  });
  
  const occupiedSeats = players.map(player => player.seat);
  // Assuming a maximum of 10 players in a poker game
  for (let seat = 1; seat <= 10; seat++) {
    if (!occupiedSeats.includes(seat)) {
      return seat;
    }
  }
  
  return null; // No available seats
};

// Determine the next player's turn
const getNextPlayerTurn = async (gameId) => {
  const game = await Game.findByPk(gameId, {
    include: [
      {
        model: Player,
        where: { status: 'active' },
        attributes: ['id', 'seat']
      }
    ]
  });
  
  if (!game || game.Players.length < 2) {
    return null;
  }
  
  // Sort players by seat number
  const activePlayers = [...game.Players].sort((a, b) => a.seat - b.seat);
  
  // If the current turn is not set or invalid, start with the first player
  if (!game.currentTurn) {
    return activePlayers[0].seat;
  }
  
  // Find the index of the current player
  const currentIndex = activePlayers.findIndex(player => player.seat === game.currentTurn);
  
  // If the current player wasn't found, start with the first player
  if (currentIndex === -1) {
    return activePlayers[0].seat;
  }
  
  // Get the next player's seat (wrapping around to the beginning if necessary)
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  return activePlayers[nextIndex].seat;
};

module.exports = {
  generateRoomCode,
  calculateSettlements,
  getGameState,
  findAvailableSeat,
  getNextPlayerTurn
}; 