import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import socketService from '../services/socket';

// Create the context
const GameContext = createContext();

// Custom hook to use the game context
export const useGame = () => useContext(GameContext);

// Game provider component
export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settlements, setSettlements] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    socketService.connect();

    // Subscribe to game state updates
    const unsubscribe = socketService.onGameStateUpdate((newGameState) => {
      setGameState(newGameState);
    });

    // Subscribe to error messages
    const errorUnsubscribe = socketService.onError((errorMsg) => {
      setError(errorMsg.message);
    });

    return () => {
      unsubscribe();
      errorUnsubscribe();
      socketService.disconnect();
    };
  }, []);

  // Create a new game
  const createGame = async (buyInAmount = 100) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.createGame(buyInAmount);
      
      if (response.success) {
        return response.game;
      } else {
        setError(response.message || 'Failed to create game');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join a game
  const joinGame = async (roomCode, playerName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.joinGame(roomCode, playerName);
      
      if (response.success) {
        setPlayer(response.player);
        socketService.joinRoom(roomCode, response.player.id);
        
        // Get initial game state
        const gameStateResponse = await api.getGameState(roomCode);
        if (gameStateResponse.success) {
          setGameState(gameStateResponse.gameState);
        }
        
        return response.player;
      } else {
        setError(response.message || 'Failed to join game');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to join game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Place a bet
  const placeBet = async (type, amount = 0) => {
    try {
      if (!player || !gameState) {
        setError('Player or game not found');
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      socketService.sendPlayerAction(
        gameState.roomCode,
        player.id,
        type,
        amount
      );
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to place bet');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buy in again
  const buyIn = async (amount) => {
    try {
      if (!player) {
        setError('Player not found');
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      socketService.sendPlayerAction(
        gameState.roomCode,
        player.id,
        'buy-in',
        amount
      );
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to buy in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // End the game and calculate settlements
  const endGame = async () => {
    try {
      if (!gameState) {
        setError('Game not found');
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await api.endGame(gameState.roomCode);
      
      if (response.success) {
        setSettlements(response.results);
        return response.results;
      } else {
        setError(response.message || 'Failed to end game');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to end game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Reset the game for a new round
  const resetGame = async () => {
    try {
      if (!gameState) {
        setError('Game not found');
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await api.resetGame(gameState.roomCode);
      
      if (response.success) {
        setSettlements(null);
        return true;
      } else {
        setError(response.message || 'Failed to reset game');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to reset game');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Kick a player
  const kickPlayer = async (playerId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.kickPlayer(playerId);
      
      return response.success;
    } catch (err) {
      setError(err.message || 'Failed to kick player');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Leave the game
  const leaveGame = () => {
    if (player && gameState) {
      socketService.leaveRoom(gameState.roomCode, player.id);
    }
    
    setPlayer(null);
    setGameState(null);
    setSettlements(null);
  };

  // Check if it's the current player's turn
  const isPlayerTurn = () => {
    if (!player || !gameState) return false;
    
    const currentPlayer = gameState.players.find(p => p.id === player.id);
    return currentPlayer && gameState.currentTurn === currentPlayer.seat;
  };

  // Find player by ID
  const getPlayerById = (playerId) => {
    if (!gameState || !gameState.players) return null;
    
    return gameState.players.find(p => p.id === playerId);
  };

  // Update player data when game state changes
  useEffect(() => {
    if (gameState && player) {
      const updatedPlayer = gameState.players.find(p => p.id === player.id);
      if (updatedPlayer) {
        setPlayer(updatedPlayer);
      }
    }
  }, [gameState, player]);

  // Context value
  const contextValue = {
    gameState,
    player,
    loading,
    error,
    settlements,
    createGame,
    joinGame,
    placeBet,
    buyIn,
    endGame,
    resetGame,
    kickPlayer,
    leaveGame,
    isPlayerTurn,
    getPlayerById
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}; 