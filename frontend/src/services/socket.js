import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Initialize socket connection
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

const socketService = {
  // Connect to the socket server
  connect: () => {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  },
  
  // Disconnect from the socket server
  disconnect: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },
  
  // Join a game room
  joinRoom: (roomCode, playerId) => {
    socket.emit('joinRoom', { roomCode, playerId });
  },
  
  // Leave a game room
  leaveRoom: (roomCode, playerId) => {
    socket.emit('leaveRoom', { roomCode, playerId });
  },
  
  // Send player action
  sendPlayerAction: (roomCode, playerId, action, amount) => {
    socket.emit('playerAction', { roomCode, playerId, action, amount });
  },
  
  // Subscribe to game state updates
  onGameStateUpdate: (callback) => {
    socket.on('gameStateUpdate', callback);
    return () => socket.off('gameStateUpdate', callback);
  },
  
  // Subscribe to error messages
  onError: (callback) => {
    socket.on('error', callback);
    return () => socket.off('error', callback);
  },
  
  // Get socket instance
  getSocket: () => socket
};

export default socketService; 