import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import socketService from '../services/socket';

// Create the context
const GameContext = createContext();

// Custom hook to use the game context
export const useGame = () => useContext(GameContext);

// Game provider component
export const GameProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // State variables
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGameReady, setIsGameReady] = useState(false);

  // Connect to socket when game and player info is available
  useEffect(() => {
    if (gameState && player) {
      // Connect to socket
      socketService.connect(gameState.roomCode, player.id);
      
      // Subscribe to game state updates
      const unsubGameState = socketService.onGameStateUpdate((newGameState) => {
        setGameState(newGameState);
        
        // Check if game is ready
        if (newGameState.status === 'ready') {
          setIsGameReady(true);
        } else {
          setIsGameReady(false);
        }
      });
      
      // Subscribe to game ready event
      const unsubGameReady = socketService.onGameReady(() => {
        setIsGameReady(true);
      });
      
      // Subscribe to game started event
      const unsubGameStarted = socketService.onGameStarted((newGameState) => {
        setGameState(newGameState);
      });
      
      // Subscribe to errors
      const unsubError = socketService.onError((errorData) => {
        setError(errorData.message);
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      });
      
      // Cleanup subscriptions on unmount
      return () => {
        unsubGameState();
        unsubGameReady();
        unsubGameStarted();
        unsubError();
        socketService.disconnect();
      };
    }
  }, [gameState, player]);

  // Create a new game
  const createGame = async (buyIn) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.createGame(buyIn);
      
      if (response) {
        navigate(`/join/${response.game.roomCode}`);
      }
      
      return response;
    } catch (error) {
      setError(error.message || 'Failed to create game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join an existing game
  const joinGame = async (roomCode, playerName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.joinGame(roomCode, playerName);
      
      if (response) {
        setPlayer(response.player);
        setGameState(await api.getGameState(roomCode));
        
        // Navigate to the correct page based on player role
        if (response.player.isAdmin) {
          navigate(`/table/${roomCode}`);
        } else {
          navigate(`/controller/${roomCode}`);
        }
      }
      
      return response;
    } catch (error) {
      setError(error.message || 'Failed to join game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Set player ready status
  const setPlayerReady = async (isReady) => {
    if (!player) return false;
    
    try {
      setError(null);
      
      // Emit socket event to set player ready
      socketService.setPlayerReady(gameState.roomCode, player.id, isReady);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to set ready status');
      return false;
    }
  };

  // Start the game (admin only)
  const startGame = async () => {
    if (!gameState || !isAdmin()) return false;
    
    try {
      setError(null);
      
      // Emit socket event to start game
      socketService.startGame(gameState.roomCode);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to start game');
      return false;
    }
  };

  // Place a bet
  const placeBet = async (betType, amount = 0) => {
    if (!player || !gameState) return false;
    
    try {
      setError(null);
      
      // Check if it's the player's turn
      if (!isPlayerTurn() && betType !== 'buy-in') {
        setError('It\'s not your turn');
        return false;
      }
      
      // Emit socket event for bet
      socketService.placeBet(betType, amount);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to place bet');
      return false;
    }
  };

  // Buy in to the game
  const buyIn = async (amount) => {
    if (!player || !gameState) return false;
    
    try {
      setError(null);
      
      // Emit socket event for buy-in
      socketService.buyIn(amount);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to buy in');
      return false;
    }
  };

  // End the game (admin only)
  const endGame = async () => {
    if (!gameState || !isAdmin()) return false;
    
    try {
      setError(null);
      
      // Emit socket event to end game
      socketService.endGame(gameState.roomCode);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to end game');
      return false;
    }
  };

  // Reset the game for a new round (admin only)
  const resetGame = async () => {
    if (!gameState || !isAdmin()) return false;
    
    try {
      setError(null);
      
      // Emit socket event to reset game
      socketService.resetGame(gameState.roomCode);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to reset game');
      return false;
    }
  };

  // Kick a player from the game (admin only)
  const kickPlayer = async (playerId) => {
    if (!gameState || !isAdmin()) return false;
    
    try {
      setError(null);
      
      // Emit socket event to kick player
      socketService.kickPlayer(gameState.roomCode, playerId);
      
      return true;
    } catch (error) {
      setError(error.message || 'Failed to kick player');
      return false;
    }
  };

  // Leave the game
  const leaveGame = () => {
    socketService.leaveGame();
    setGameState(null);
    setPlayer(null);
  };

  // Helper: Check if the current player is the admin
  const isAdmin = () => {
    return player && player.isAdmin;
  };

  // Helper: Check if it's the player's turn
  const isPlayerTurn = () => {
    return gameState && player && gameState.currentTurn === player.id;
  };

  // Helper: Check if the player is ready
  const isPlayerReady = () => {
    return player && player.isReady;
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
    isGameReady,
    createGame,
    joinGame,
    setPlayerReady,
    startGame,
    placeBet,
    buyIn,
    endGame,
    resetGame,
    kickPlayer,
    leaveGame,
    isAdmin,
    isPlayerTurn,
    isPlayerReady,
    getPlayerById
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}; 