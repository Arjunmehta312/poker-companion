import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const Controller = () => {
  const { roomCode } = useParams();
  const { 
    gameState, 
    player, 
    loading, 
    error, 
    placeBet, 
    buyIn, 
    isPlayerTurn,
    isPlayerReady,
    setPlayerReady,
    leaveGame 
  } = useGame();
  const [betAmount, setBetAmount] = useState(0);
  const [buyInAmount, setBuyInAmount] = useState(0);
  const [showBuyIn, setShowBuyIn] = useState(false);
  const navigate = useNavigate();
  
  // If no game state or player, redirect to home
  useEffect(() => {
    if (!gameState && !loading) {
      navigate('/');
    }
  }, [gameState, loading, navigate]);
  
  // Set a default bet amount based on current state
  useEffect(() => {
    if (gameState && player) {
      // Set default bet amount to current highest bet or big blind
      const currentBets = gameState.players.map(p => p.currentBet);
      const highestBet = Math.max(...currentBets, 0);
      const callAmount = Math.max(highestBet - (player.currentBet || 0), 0);
      
      // Set default raise amount to call + big blind
      const raiseAmount = callAmount + (gameState.bigBlind || 10);
      
      setBetAmount(raiseAmount);
    }
  }, [gameState, player]);
  
  const handleToggleReady = async () => {
    await setPlayerReady(!isPlayerReady());
  };
  
  const handlePlaceBet = async (type) => {
    let amount = 0;
    
    if (type === 'raise' || type === 'call') {
      // For raise, use the entered bet amount
      if (type === 'raise') {
        amount = Number(betAmount);
      } else {
        // For call, calculate the amount to match the highest bet
        const currentBets = gameState.players.map(p => p.currentBet);
        const highestBet = Math.max(...currentBets, 0);
        amount = highestBet - (player.currentBet || 0);
      }
      
      // Check if player has enough balance
      if (amount > player.balance) {
        // Not enough funds, automatically switch to all-in
        type = 'all-in';
        amount = player.balance;
      }
    }
    
    await placeBet(type, amount);
  };
  
  const handleBuyIn = async () => {
    if (buyInAmount > 0) {
      const success = await buyIn(Number(buyInAmount));
      if (success) {
        setShowBuyIn(false);
      }
    }
  };
  
  const handleLeaveGame = () => {
    leaveGame();
    navigate('/');
  };
  
  // If still loading, show loading indicator
  if (loading) {
    return <div className="loading">Loading game...</div>;
  }
  
  // If error, show error message
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  // If no game state or player, return null
  if (!gameState || !player) {
    return null;
  }
  
  // Get game and player status
  const gameStarted = gameState.isStarted;
  const canPlay = isPlayerTurn() && gameState.status === 'active';
  const isBusted = player.balance === 0 && player.status !== 'all-in';
  const isFolded = player.status === 'folded';
  const isAllIn = player.status === 'all-in';
  const isReady = isPlayerReady();
  
  return (
    <div className="controller-container">
      <div className="player-info">
        <h1>{player.name}</h1>
        <div className="balance">${player.balance}</div>
        <div className="game-code">Game: {roomCode}</div>
        <div className="status">Status: {player.status}</div>
        
        {player.currentBet > 0 && (
          <div className="current-bet">Current Bet: ${player.currentBet}</div>
        )}
        
        <button className="leave-button" onClick={handleLeaveGame}>
          Leave Game
        </button>
      </div>
      
      <div className="game-info">
        <div className="pot">Pot: ${gameState.pot}</div>
        <div className="round">Round: {gameState.round}</div>
      </div>
      
      {/* Ready button before game starts */}
      {!gameStarted && (
        <div className="ready-container">
          <h2>Waiting for game to start</h2>
          <p>Set yourself as ready when you want to play!</p>
          <button
            className={`btn-ready ${isReady ? 'ready' : 'not-ready'}`}
            onClick={handleToggleReady}
          >
            {isReady ? 'I\'m Ready!' : 'Get Ready'}
          </button>
          
          <div className="player-list">
            <h3>Players:</h3>
            <ul>
              {gameState.players.map(p => (
                <li key={p.id} className={p.isReady ? 'ready' : 'not-ready'}>
                  {p.name} {p.isReady ? '(Ready)' : '(Not Ready)'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Buy-in section */}
      {gameStarted && isBusted && !showBuyIn && (
        <div className="busted-message">
          <p>You're out of chips!</p>
          <button 
            className="btn-primary"
            onClick={() => setShowBuyIn(true)}
          >
            Buy In Again
          </button>
        </div>
      )}
      
      {showBuyIn && (
        <div className="buy-in-container">
          <h2>Buy In</h2>
          <div className="form-group">
            <label htmlFor="buyInAmount">Amount:</label>
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
              className="btn-primary"
              onClick={handleBuyIn}
              disabled={buyInAmount <= 0}
            >
              Buy In
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowBuyIn(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Betting controls */}
      {gameStarted && !isBusted && !showBuyIn && !isAllIn && (
        <div className="betting-controls">
          <div className="betting-info">
            {canPlay ? (
              <div className="your-turn">Your Turn</div>
            ) : (
              <div className="waiting">Waiting for your turn...</div>
            )}
          </div>
          
          {!isFolded && (
            <div className="bet-amount-container">
              <label htmlFor="betAmount">Bet Amount:</label>
              <input
                type="number"
                id="betAmount"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={gameState.bigBlind || 10}
                max={player.balance}
                disabled={!canPlay}
              />
              
              <div className="bet-slider">
                <input
                  type="range"
                  min={gameState.bigBlind || 10}
                  max={player.balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={!canPlay}
                />
              </div>
            </div>
          )}
          
          <div className="action-buttons">
            {!isFolded && (
              <>
                <button
                  className="btn-action raise"
                  onClick={() => handlePlaceBet('raise')}
                  disabled={!canPlay || betAmount <= 0}
                >
                  Raise ${betAmount}
                </button>
                
                <button
                  className="btn-action call"
                  onClick={() => handlePlaceBet('call')}
                  disabled={!canPlay}
                >
                  Call
                </button>
                
                <button
                  className="btn-action check"
                  onClick={() => handlePlaceBet('check')}
                  disabled={!canPlay}
                >
                  Check
                </button>
                
                <button
                  className="btn-action all-in"
                  onClick={() => handlePlaceBet('all-in')}
                  disabled={!canPlay || player.balance <= 0}
                >
                  All In
                </button>
              </>
            )}
            
            {!isFolded && (
              <button
                className="btn-action fold"
                onClick={() => handlePlaceBet('fold')}
                disabled={!canPlay}
              >
                Fold
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Controller; 