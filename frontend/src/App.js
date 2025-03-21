import React, { useState, useEffect } from "react";

const socket = new WebSocket("ws://localhost:5000");

function App() {
  const [gameState, setGameState] = useState({ players: {}, pot: 0 });
  const [betAmount, setBetAmount] = useState(0);

  useEffect(() => {
    socket.onmessage = (event) => {
      setGameState(JSON.parse(event.data));
    };
  }, []);

  const placeBet = () => {
    socket.send(JSON.stringify({ type: "bet", playerId: "Player1", amount: betAmount }));
  };

  return (
    <div className="container mt-5">
      <h1 className="text-primary">Poker Companion</h1>
      <h2>Pot Size: ${gameState.pot}</h2>
      <input
        type="number"
        className="form-control"
        value={betAmount}
        onChange={(e) => setBetAmount(Number(e.target.value))}
      />
      <button className="btn btn-success mt-3" onClick={placeBet}>Place Bet</button>
    </div>
  );
}

export default App;
