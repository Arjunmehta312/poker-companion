import { io } from 'socket.io-client';

// Get Socket.IO URL from environment variables or use default
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Socket.io connection
let socket;

const socketService = {
  // Initialize socket connection
  connect: (roomCode, playerId) => {
    if (socket) {
      socket.disconnect();
    }
    
    socket = io(SOCKET_URL, {
      query: {
        roomCode,
        playerId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io' // Default path
    });
    
    console.log('Socket connected with roomCode:', roomCode, 'playerId:', playerId);
    
    // Listen for connect events
    socket.on('connect', () => {
      console.log('Socket.io connected with ID:', socket.id);
    });
    
    // Listen for disconnect events
    socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
    });
    
    // Listen for error events
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
    
    return socket;
  },
  
  // Disconnect socket
  disconnect: () => {
    if (socket) {
      socket.disconnect();
    }
  },
  
  // Subscribe to game state updates
  onGameStateUpdate: (callback) => {
    if (!socket) return () => {};
    socket.on('gameState', callback);
    return () => socket.off('gameState', callback);
  },
  
  // Subscribe to error messages
  onError: (callback) => {
    if (!socket) return () => {};
    socket.on('error', callback);
    return () => socket.off('error', callback);
  },
  
  // Subscribe to player joined event
  onPlayerJoined: (callback) => {
    if (!socket) return () => {};
    socket.on('playerJoined', callback);
    return () => socket.off('playerJoined', callback);
  },
  
  // Subscribe to player left event
  onPlayerLeft: (callback) => {
    if (!socket) return () => {};
    socket.on('playerLeft', callback);
    return () => socket.off('playerLeft', callback);
  },
  
  // Subscribe to game ready event
  onGameReady: (callback) => {
    if (!socket) return () => {};
    socket.on('gameReady', callback);
    return () => socket.off('gameReady', callback);
  },
  
  // Subscribe to game started event
  onGameStarted: (callback) => {
    if (!socket) return () => {};
    socket.on('gameStarted', callback);
    return () => socket.off('gameStarted', callback);
  },
  
  // Place bet
  placeBet: (betType, amount) => {
    if (!socket) return;
    socket.emit('placeBet', { betType, amount });
  },
  
  // Buy in
  buyIn: (amount) => {
    if (!socket) return;
    socket.emit('buyIn', { amount });
  },
  
  // End game
  endGame: (roomCode) => {
    if (!socket) return;
    socket.emit('endGame', { roomCode });
  },
  
  // Reset game
  resetGame: (roomCode) => {
    if (!socket) return;
    socket.emit('resetGame', { roomCode });
  },
  
  // Set player ready
  setPlayerReady: (roomCode, playerId, isReady) => {
    if (!socket) return;
    socket.emit('playerReady', { roomCode, playerId, isReady });
  },
  
  // Start game
  startGame: (roomCode) => {
    if (!socket) return;
    socket.emit('startGame', { roomCode });
  },
  
  // Kick player
  kickPlayer: (roomCode, playerId) => {
    if (!socket) return;
    socket.emit('kickPlayer', { roomCode, playerId });
  },
  
  // Leave game
  leaveGame: () => {
    if (!socket) return;
    socket.emit('leaveGame');
  },
};

export default socketService; 