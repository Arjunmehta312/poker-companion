import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const Home = () => {
  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(100);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const { createGame, joinGame, loading, error } = useGame();
  const navigate = useNavigate();

  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    const game = await createGame(buyInAmount);
    
    if (game) {
      // Now join the game as the creator
      setRoomCode(game.roomCode);
      setJoinMode(true);
      setCreateMode(false);
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    const player = await joinGame(roomCode, playerName);
    
    if (player) {
      if (player.seat === 1) {
        // First player (admin) goes to table display
        navigate(`/table/${roomCode}`);
      } else {
        // Other players go to controller
        navigate(`/controller/${roomCode}`);
      }
    }
  };

  return (
    <div className="home-container">
      <h1>Poker Companion</h1>
      <p>The digital chip manager for your home poker games</p>
      
      {!createMode && !joinMode ? (
        <div className="button-group">
          <button 
            className="btn-primary"
            onClick={() => setCreateMode(true)}
          >
            Create New Game
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setJoinMode(true)}
          >
            Join Existing Game
          </button>
        </div>
      ) : null}
      
      {createMode && (
        <div className="form-container">
          <h2>Create a New Game</h2>
          <form onSubmit={handleCreateGame}>
            <div className="form-group">
              <label htmlFor="buyInAmount">Buy-in Amount:</label>
              <input
                type="number"
                id="buyInAmount"
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="button-group">
              <button 
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCreateMode(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {joinMode && (
        <div className="form-container">
          <h2>Join a Game</h2>
          <form onSubmit={handleJoinGame}>
            <div className="form-group">
              <label htmlFor="roomCode">Room Code:</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                required
                readOnly={createMode}
              />
            </div>
            <div className="form-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="button-group">
              <button 
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setJoinMode(false);
                  setRoomCode('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default Home; 