import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const Home = () => {
  const navigate = useNavigate();
  const { createGame, joinGame, loading, error } = useGame();
  
  const [buyIn, setBuyIn] = useState(100);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [localError, setLocalError] = useState('');
  
  const handleCreateGame = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (buyIn <= 0) {
      setLocalError('Buy-in amount must be greater than 0');
      return;
    }
    
    try {
      const result = await createGame(buyIn);
      console.log('Game created:', result);
      // Navigation happens in the context
    } catch (err) {
      setLocalError(err.message || 'Failed to create game');
    }
  };
  
  const handleJoinGame = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!roomCode.trim()) {
      setLocalError('Room code is required');
      return;
    }
    
    if (!playerName.trim()) {
      setLocalError('Player name is required');
      return;
    }
    
    try {
      const result = await joinGame(roomCode, playerName);
      console.log('Joined game:', result);
      // Navigation happens in the context
    } catch (err) {
      setLocalError(err.message || 'Failed to join game');
    }
  };
  
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="app-title">Poker Companion</h1>
        <p className="app-description">
          Play poker without physical chips - just use real cards and track everything digitally!
        </p>
        
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </button>
          <button 
            className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Game
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {localError && <div className="error-message">{localError}</div>}
        
        {activeTab === 'create' ? (
          <div className="tab-content">
            <form onSubmit={handleCreateGame}>
              <div className="form-group">
                <label htmlFor="buyIn">Buy-in Amount ($):</label>
                <input
                  type="number"
                  id="buyIn"
                  value={buyIn}
                  onChange={(e) => setBuyIn(Number(e.target.value))}
                  min="1"
                  required
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Game...' : 'Create Game'}
              </button>
            </form>
            
            <div className="info-box">
              <h3>How it works:</h3>
              <ol>
                <li>Create a game with a buy-in amount</li>
                <li>Share the room code with your friends</li>
                <li>Everyone joins with their phones</li>
                <li>Start playing with real cards!</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="tab-content">
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Joining Game...' : 'Join Game'}
              </button>
            </form>
          </div>
        )}
      </div>
      
      <footer className="footer">
        <p>Poker Companion &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Home; 