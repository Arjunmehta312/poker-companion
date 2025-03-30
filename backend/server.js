import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Load environment variables
dotenv.config();

// Import routes
import gameRoutes from './routes/gameRoutes.js';
import betRoutes from './routes/betRoutes.js';
import { getGameState } from './utils/gameUtils.js';

// Initialize express app
const app = express();
const server = http.createServer(app);

// CORS config
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// API routes
app.use("/api/game", gameRoutes);
app.use("/api/bet", betRoutes);

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Test database connection
async function testDbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Call the function to test connection
testDbConnection();

// Sync database models
async function syncDatabase() {
  try {
    console.log('Syncing database models...');
    await sequelize.sync({ force: true }); // force: true will drop tables if they exist
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Error syncing database models:', error);
  }
}

// Call the function to sync database
syncDatabase();

// Helper function to make API calls
const makeApiCall = async (endpoint, method, data = null) => {
  try {
    const url = `http://localhost:${process.env.PORT || 5000}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    return { success: false, error: error.message };
  }
};

// Socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Get query parameters from client
  const { roomCode, playerId } = socket.handshake.query;
  
  if (roomCode) {
    // Join the room
    socket.join(roomCode);
    console.log(`Client ${socket.id} joined room: ${roomCode}`);
    
    // Emit initial game state
    const emitGameState = async () => {
      try {
        const gameState = await getGameState(roomCode);
        io.to(roomCode).emit('gameState', gameState);
      } catch (error) {
        console.error('Error emitting game state:', error);
        socket.emit('error', { message: 'Failed to get game state' });
      }
    };
    
    // Emit initial game state
    emitGameState();
    
    // Handle player ready status
    socket.on('playerReady', async ({ roomCode, playerId, isReady }) => {
      try {
        const result = await makeApiCall('/api/game/ready', 'POST', { playerId, isReady });
        
        if (result.success) {
          // Get updated game state
          const gameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameState', gameState);
          
          // Check if all players are ready
          if (gameState.status === 'ready') {
            io.to(roomCode).emit('gameReady', gameState);
          }
        } else {
          socket.emit('error', { message: result.error || 'Failed to set player ready status' });
        }
      } catch (error) {
        console.error('Error handling player ready:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle start game
    socket.on('startGame', async ({ roomCode }) => {
      try {
        const result = await makeApiCall(`/api/game/start/${roomCode}`, 'POST');
        
        if (result.success) {
          // Get updated game state
          const gameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameStarted', gameState);
          io.to(roomCode).emit('gameState', gameState);
        } else {
          socket.emit('error', { message: result.error || 'Failed to start game' });
        }
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle player action (bet, check, fold, etc.)
    socket.on('placeBet', async ({ betType, amount }) => {
      try {
        // Check if game has started before allowing actions other than 'buy-in'
        const gameState = await getGameState(roomCode);
        
        if (!gameState.isStarted && betType !== 'buy-in') {
          socket.emit('error', { message: 'Game has not started yet' });
          return;
        }
        
        const result = await makeApiCall('/api/game/bet', 'POST', {
          roomCode,
          playerId,
          betType,
          amount: betType === 'all-in' ? gameState.players.find(p => p.id === playerId)?.balance || 0 : amount
        });
        
        if (result.success) {
          // Get updated game state
          const updatedGameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameState', updatedGameState);
        } else {
          socket.emit('error', { message: result.error || 'Failed to place bet' });
        }
      } catch (error) {
        console.error('Error placing bet:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle buy-in
    socket.on('buyIn', async ({ amount }) => {
      try {
        const result = await makeApiCall('/api/game/buyin', 'POST', {
          roomCode,
          playerId,
          amount
        });
        
        if (result.success) {
          // Get updated game state
          const gameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameState', gameState);
        } else {
          socket.emit('error', { message: result.error || 'Failed to buy in' });
        }
      } catch (error) {
        console.error('Error buying in:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle end game
    socket.on('endGame', async ({ roomCode }) => {
      try {
        const result = await makeApiCall(`/api/game/end/${roomCode}`, 'POST');
        
        if (result.success) {
          // Get updated game state
          const gameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameState', gameState);
        } else {
          socket.emit('error', { message: result.error || 'Failed to end game' });
        }
      } catch (error) {
        console.error('Error ending game:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle reset game
    socket.on('resetGame', async ({ roomCode }) => {
      try {
        const result = await makeApiCall(`/api/game/reset/${roomCode}`, 'POST');
        
        if (result.success) {
          // Get updated game state
          const gameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameState', gameState);
        } else {
          socket.emit('error', { message: result.error || 'Failed to reset game' });
        }
      } catch (error) {
        console.error('Error resetting game:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle kick player
    socket.on('kickPlayer', async ({ roomCode, playerId }) => {
      try {
        const result = await makeApiCall('/api/game/kick', 'POST', {
          roomCode,
          playerId
        });
        
        if (result.success) {
          // Get updated game state
          const gameState = await getGameState(roomCode);
          io.to(roomCode).emit('gameState', gameState);
          
          // Also notify the kicked player
          io.to(roomCode).emit('playerKicked', { playerId });
        } else {
          socket.emit('error', { message: result.error || 'Failed to kick player' });
        }
      } catch (error) {
        console.error('Error kicking player:', error);
        socket.emit('error', { message: 'Server error' });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      if (playerId) {
        try {
          // Update player connection status
          const result = await makeApiCall('/api/game/connection', 'POST', {
            roomCode,
            playerId,
            isConnected: false
          });
          
          if (result.success) {
            // Notify other players
            const gameState = await getGameState(roomCode);
            io.to(roomCode).emit('gameState', gameState);
            io.to(roomCode).emit('playerDisconnected', { playerId });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  }
});

// Sync database and start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
