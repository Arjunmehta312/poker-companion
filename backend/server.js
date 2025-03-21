require("dotenv").config();
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

let gameState = {
  players: {},
  pot: 0,
};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    
    if (data.type === "join") {
      gameState.players[data.playerId] = { balance: 1000, status: "playing" };
    } else if (data.type === "bet") {
      gameState.pot += data.amount;
      gameState.players[data.playerId].balance -= data.amount;
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(gameState));
      }
    });
  });

  ws.send(JSON.stringify(gameState));
});

server.listen(5000, () => console.log("Server running on port 5000"));
