require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const { sequelize } = require("./models");
const gameRoutes = require("./routes/gameRoutes");
const betRoutes = require("./routes/betRoutes");
const { getGameState } = require("./utils/gameUtils");

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/game", gameRoutes);
app.use("/api/bet", betRoutes);

const server = http.createServer(app);

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // Join a game room
  socket.on("joinRoom", async ({ roomCode, playerId }) => {
    try {
      socket.join(roomCode);
      
      // If player ID is provided, update socket ID in player record
      if (playerId) {
        const { Player } = require("./models");
        const player = await Player.findByPk(playerId);
        
        if (player) {
          await player.update({
            socketId: socket.id,
            isConnected: true
          });
        }
      }
      
      // Get the game's state
      const game = await sequelize.models.Game.findOne({
        where: { roomCode }
      });
      
      if (game) {
        const gameState = await getGameState(game.id);
        io.to(roomCode).emit("gameStateUpdate", gameState);
      }
      
      console.log(`Client ${socket.id} joined room ${roomCode}`);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  });
  
  // Leave a game room
  socket.on("leaveRoom", async ({ roomCode, playerId }) => {
    try {
      socket.leave(roomCode);
      
      // If player ID is provided, update connection status
      if (playerId) {
        const { Player } = require("./models");
        const player = await Player.findByPk(playerId);
        
        if (player) {
          await player.update({
            isConnected: false
          });
        }
      }
      
      console.log(`Client ${socket.id} left room ${roomCode}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });
  
  // Handle player actions
  socket.on("playerAction", async ({ roomCode, playerId, action, amount }) => {
    try {
      const { Game, Player } = require("./models");
      
      // Find the player and game
      const player = await Player.findByPk(playerId);
      const game = await Game.findOne({ where: { roomCode } });
      
      if (!player || !game) {
        socket.emit("error", { message: "Player or game not found" });
        return;
      }
      
      // Make the appropriate API request based on the action
      const fetch = require("node-fetch");
      const baseUrl = `http://localhost:${process.env.PORT || 5000}/api`;
      
      let response;
      
      switch (action) {
        case "bet":
          response = await fetch(`${baseUrl}/bet/place`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              amount,
              type: "raise",
              gameId: game.id
            })
          });
          break;
          
        case "call":
          response = await fetch(`${baseUrl}/bet/place`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              amount,
              type: "call",
              gameId: game.id
            })
          });
          break;
          
        case "fold":
          response = await fetch(`${baseUrl}/bet/place`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              amount: 0,
              type: "fold",
              gameId: game.id
            })
          });
          break;
          
        case "check":
          response = await fetch(`${baseUrl}/bet/place`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              amount: 0,
              type: "check",
              gameId: game.id
            })
          });
          break;
          
        case "all-in":
          response = await fetch(`${baseUrl}/bet/place`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              amount: 0,
              type: "all-in",
              gameId: game.id
            })
          });
          break;
          
        case "buy-in":
          response = await fetch(`${baseUrl}/game/buy-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              amount
            })
          });
          break;
          
        default:
          socket.emit("error", { message: "Invalid action" });
          return;
      }
      
      // Get updated game state
      const gameState = await getGameState(game.id);
      io.to(roomCode).emit("gameStateUpdate", gameState);
      
    } catch (error) {
      console.error("Error processing player action:", error);
      socket.emit("error", { message: "Failed to process action" });
    }
  });
  
  // Handle disconnect
  socket.on("disconnect", async () => {
    try {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Update player connection status if this socket belongs to a player
      const { Player } = require("./models");
      const player = await Player.findOne({
        where: { socketId: socket.id }
      });
      
      if (player) {
        await player.update({
          isConnected: false
        });
        
        // Notify others in the same game
        const game = await sequelize.models.Game.findByPk(player.GameId);
        if (game) {
          const gameState = await getGameState(game.id);
          io.to(game.roomCode).emit("gameStateUpdate", gameState);
        }
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
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
