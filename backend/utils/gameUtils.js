import models from '../models/index.js';

// Generate a unique room code (6 characters, uppercase)
export const generateRoomCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing characters like I, O, 0, 1
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Get the next available seat in a game
export const getNextAvailableSeat = async (gameId) => {
  const players = await models.Player.findAll({
    where: { GameId: gameId },
    order: [['seatNumber', 'ASC']],
  });

  // If no players, start with seat 1
  if (players.length === 0) {
    return 1;
  }

  // Find the first available seat
  let seat = 1;
  for (const player of players) {
    if (player.seatNumber !== seat) {
      return seat;
    }
    seat++;
  }

  // All consecutive seats are taken, use the next one
  return players.length + 1;
};

// Calculate the next player's turn
export const getNextPlayerTurn = async (gameId, currentTurn = null) => {
  const players = await models.Player.findAll({
    where: { 
      GameId: gameId,
      status: ['active', 'all-in'] // Only active players or all-in can be in the turn order
    },
    order: [['seatNumber', 'ASC']],
  });

  if (players.length <= 1) {
    return players.length === 1 ? players[0].id : null;
  }

  // If no current turn, start with the first player
  if (!currentTurn) {
    return players[0].id;
  }

  // Find the index of the current player
  const currentIndex = players.findIndex(p => p.id === currentTurn);
  
  // If player not found, start with the first player
  if (currentIndex === -1) {
    return players[0].id;
  }

  // Move to the next player
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
};

// Get complete game state
export const getGameState = async (roomCode) => {
  const game = await models.Game.findOne({
    where: { roomCode },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  const players = await models.Player.findAll({
    where: { GameId: game.id },
    order: [['seatNumber', 'ASC']],
  });

  const bets = await models.Bet.findAll({
    where: { GameId: game.id },
    include: [models.Player],
    order: [['createdAt', 'DESC']],
  });

  return {
    id: game.id,
    roomCode: game.roomCode,
    status: game.status,
    isStarted: game.isStarted,
    pot: game.pot,
    round: game.round,
    smallBlind: game.smallBlind,
    bigBlind: game.bigBlind,
    currentTurn: game.currentTurn,
    dealerPosition: game.dealerPosition,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      balance: p.balance,
      buyIn: p.buyIn,
      status: p.status,
      currentBet: p.currentBet,
      seatNumber: p.seatNumber,
      isAdmin: p.isAdmin,
      isConnected: p.isConnected,
      isReady: p.isReady,
    })),
    recentBets: bets.slice(0, 10).map(b => ({
      id: b.id,
      amount: b.amount,
      type: b.type,
      round: b.round,
      player: b.Player ? b.Player.name : 'Unknown',
      timestamp: b.createdAt,
    })),
    startTime: game.startTime,
    endTime: game.endTime,
  };
};

// Calculate settlements between players
export const calculateSettlements = (players) => {
  const settlements = [];

  // Calculate net profit/loss for each player
  players.forEach(player => {
    const netAmount = player.balance - player.buyIn;
    
    if (netAmount !== 0) {
      settlements.push({
        playerId: player.id,
        playerName: player.name,
        amount: netAmount,
      });
    }
  });

  // Sort by amount (descending)
  settlements.sort((a, b) => b.amount - a.amount);

  // Calculate transfers to settle debts
  const transfers = [];
  
  // Create copies of settlements to work with
  const creditors = settlements.filter(s => s.amount > 0).map(s => ({ ...s }));
  const debtors = settlements.filter(s => s.amount < 0).map(s => ({ ...s }));

  // Match creditors with debtors
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    
    // Find the smaller amount
    const transferAmount = Math.min(creditor.amount, -debtor.amount);
    
    transfers.push({
      from: debtor.playerName,
      to: creditor.playerName,
      amount: transferAmount,
    });
    
    // Update remaining amounts
    creditor.amount -= transferAmount;
    debtor.amount += transferAmount;
    
    // Remove settled parties
    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }

  return {
    players: settlements,
    transfers,
  };
}; 