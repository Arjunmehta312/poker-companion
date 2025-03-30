import axios from 'axios';

// Get API URL from environment variables or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const createGame = async (buyIn) => {
  try {
    const response = await apiClient.post('/api/game/create', { buyIn });
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

export const joinGame = async (roomCode, playerName) => {
  try {
    const response = await apiClient.post(`/api/game/join/${roomCode}`, { playerName });
    return response.data;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

export const getGameState = async (roomCode) => {
  try {
    const response = await apiClient.get(`/api/game/state/${roomCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
};

export const setPlayerReady = async (playerId, isReady) => {
  try {
    const response = await apiClient.post(`/api/game/ready`, { playerId, isReady });
    return response.data;
  } catch (error) {
    console.error('Error setting player ready state:', error);
    throw error;
  }
};

export const startGame = async (roomCode) => {
  try {
    const response = await apiClient.post(`/api/game/start/${roomCode}`);
    return response.data;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

export const placeBet = async (roomCode, playerId, betType, amount) => {
  try {
    const response = await apiClient.post(`/api/game/bet`, {
      roomCode,
      playerId,
      betType,
      amount,
    });
    return response.data;
  } catch (error) {
    console.error('Error placing bet:', error);
    throw error;
  }
};

export const buyIn = async (roomCode, playerId, amount) => {
  try {
    const response = await apiClient.post(`/api/game/buyin`, {
      roomCode,
      playerId,
      amount,
    });
    return response.data;
  } catch (error) {
    console.error('Error buying in:', error);
    throw error;
  }
};

export const endGame = async (roomCode) => {
  try {
    const response = await apiClient.post(`/api/game/end/${roomCode}`);
    return response.data;
  } catch (error) {
    console.error('Error ending game:', error);
    throw error;
  }
};

export const resetGame = async (roomCode) => {
  try {
    const response = await apiClient.post(`/api/game/reset/${roomCode}`);
    return response.data;
  } catch (error) {
    console.error('Error resetting game:', error);
    throw error;
  }
};

export const kickPlayer = async (roomCode, playerId) => {
  try {
    const response = await apiClient.post(`/api/game/kick`, {
      roomCode,
      playerId,
    });
    return response.data;
  } catch (error) {
    console.error('Error kicking player:', error);
    throw error;
  }
};

// Bet endpoints
export const getBetHistory = async (gameId) => {
  try {
    const response = await apiClient.get(`/api/bet/history/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting bet history:', error);
    throw error;
  }
}; 