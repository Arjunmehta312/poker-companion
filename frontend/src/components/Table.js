import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const Table = () => {
  const { roomCode } = useParams();
  const { 
    gameState, 
    player, 
    loading, 
    error, 
    settlements,
    isGameReady,
    startGame,
    endGame,
    resetGame,
    kickPlayer,
    isAdmin
  } = useGame();
  const [showSettlements, setShowSettlements] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(true);
  const navigate = useNavigate();
  
  // If no game state or player, redirect to home
  useEffect(() => {
    if (!gameState && !loading) {
      navigate('/');
    }
  }, [gameState, loading, navigate]);
  
  // Auto-hide the room code after 60 seconds
  useEffect(() => {
    if (showRoomCode) {
      const timer = setTimeout(() => {
        setShowRoomCode(false);
      }, 60000);
      
      return () => clearTimeout(timer);
    }
  }, [showRoomCode]);
  
  const handleStartGame = async () => {
    await startGame();
  };
  
  const handleEndGame = async () => {
    const results = await endGame();
    if (results) {
      setShowSettlements(true);
    }
  };
  
  const handleResetGame = async () => {
    const success = await resetGame();
    if (success) {
      setShowSettlements(false);
    }
  };
  
  const handleKickPlayer = async (playerId) => {
    await kickPlayer(playerId);
  };
  
  // If still loading, show loading indicator
  if (loading) {
    return <div className="loading">Loading game...</div>;
  }
  
  // If error, show error message
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  // If no game state, return null
  if (!gameState) {
    return null;
  }
  
  // Get the status message based on game state
  const getStatusMessage = () => {
    if (gameState.status === 'waiting') {
      return 'Waiting for players to get ready...';
    } else if (gameState.status === 'ready') {
      return 'All players ready! Game can start.';
    } else if (gameState.status === 'active') {
      return 'Game in progress';
    } else if (gameState.status === 'finished') {
      return 'Game has ended';
    }
    return '';
  };
  
  // Calculate positions for players around the table
  const getPlayerPosition = (seatNumber, totalSeats) => {
    const angle = (Math.PI * 2 / totalSeats) * (seatNumber - 1) - Math.PI / 2;
    const radius = 40; // % of container
    
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    
    return { x, y };
  };
  
  return (
    <div className="table-container">
      <div className="header">
        <div className="title-section">
          <h1>Poker Game</h1>
          {showRoomCode ? (
            <div className="room-code-display">
              <span>Room Code: </span>
              <span className="room-code">{roomCode}</span>
              <button 
                className="toggle-room-code"
                onClick={() => setShowRoomCode(false)}
              >
                Hide
              </button>
            </div>
          ) : (
            <button 
              className="toggle-room-code"
              onClick={() => setShowRoomCode(true)}
            >
              Show Room Code
            </button>
          )}
        </div>
        
        <div className="game-status">
          <div className="status-message">{getStatusMessage()}</div>
        </div>
        
        <div className="game-info">
          <div className="pot">Pot: ${gameState.pot}</div>
          <div className="blinds">
            Blinds: ${gameState.smallBlind} / ${gameState.bigBlind}
          </div>
          <div className="round">Round: {gameState.round}</div>
        </div>
        
        {isAdmin() && (
          <div className="admin-controls">
            {!gameState.isStarted && isGameReady && (
              <button 
                className="btn-success"
                onClick={handleStartGame}
              >
                Start Game
              </button>
            )}
            
            {gameState.isStarted && (
              <button 
                className="btn-danger"
                onClick={handleEndGame}
                disabled={gameState.status === 'finished'}
              >
                End Game
              </button>
            )}
            
            {gameState.status === 'finished' && (
              <button 
                className="btn-primary"
                onClick={handleResetGame}
              >
                New Game
              </button>
            )}
          </div>
        )}
      </div>
      
      {!gameState.isStarted && (
        <div className="waiting-message">
          <h2>Waiting for players to join...</h2>
          <p>Share the room code with your friends to join!</p>
          <div className="player-list">
            <h3>Players ({gameState.players.length}):</h3>
            <ul>
              {gameState.players.map(tablePlayer => (
                <li key={tablePlayer.id} className={tablePlayer.isReady ? 'ready' : 'not-ready'}>
                  {tablePlayer.name} {tablePlayer.isReady ? '(Ready)' : '(Not Ready)'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Poker table */}
      {gameState.isStarted && (
        <div className="poker-table">
          {/* Center pot display */}
          <div className="table-center">
            <div className="pot-amount">${gameState.pot}</div>
          </div>
          
          {/* Players around the table */}
          {gameState.players && gameState.players.map(tablePlayer => {
            const position = getPlayerPosition(tablePlayer.seat, 10);
            const isCurrentTurn = gameState.currentTurn === tablePlayer.seat;
            
            return (
              <div 
                key={tablePlayer.id}
                className={`player-spot ${isCurrentTurn ? 'current-turn' : ''} ${tablePlayer.status}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <div className="player-name">{tablePlayer.name}</div>
                <div className="player-balance">${tablePlayer.balance}</div>
                {tablePlayer.currentBet > 0 && (
                  <div className="player-bet">${tablePlayer.currentBet}</div>
                )}
                <div className="player-status">{tablePlayer.status}</div>
                
                {/* Kick button (only for admin and not for self) */}
                {isAdmin() && player.id !== tablePlayer.id && (
                  <button 
                    className="kick-button"
                    onClick={() => handleKickPlayer(tablePlayer.id)}
                  >
                    Kick
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Settlements modal */}
      {showSettlements && settlements && (
        <div className="settlements-modal">
          <div className="settlements-content">
            <h2>Game Results</h2>
            
            <div className="player-results">
              <h3>Player Results</h3>
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Buy-In</th>
                    <th>Final Balance</th>
                    <th>Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.playerResults.map(result => (
                    <tr key={result.playerId}>
                      <td>{result.playerName}</td>
                      <td>${result.totalBuyIn}</td>
                      <td>${result.finalBalance}</td>
                      <td className={result.profitLoss >= 0 ? 'profit' : 'loss'}>
                        {result.profitLoss >= 0 ? '+' : ''}{result.profitLoss}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="settlement-transfers">
              <h3>Settlements</h3>
              {settlements.settlements.length > 0 ? (
                <ul>
                  {settlements.settlements.map((transfer, index) => (
                    <li key={index}>
                      <strong>{transfer.from}</strong> pays <strong>{transfer.to}</strong>: ${transfer.amount}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No settlements needed</p>
              )}
            </div>
            
            {isAdmin() && (
              <button 
                className="btn-primary"
                onClick={handleResetGame}
              >
                Start New Game
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Table; 