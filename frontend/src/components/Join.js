import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const Join = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { joinGame, loading, error } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [localError, setLocalError] = useState('');

  // Redirect if no room code
  useEffect(() => {
    if (!roomCode) {
      navigate('/');
    }
  }, [roomCode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    
    setLocalError('');
    const result = await joinGame(roomCode, playerName);
    
    // Navigation is handled in the joinGame function of the context
    if (!result) {
      setLocalError('Failed to join game. Please try again.');
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>Join Game</h1>
        <h2>Room Code: {roomCode}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {localError && <div className="error-message">{localError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="playerName">Your Name:</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>
        
        <div className="back-link">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Join; 