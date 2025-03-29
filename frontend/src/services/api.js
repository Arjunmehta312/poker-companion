import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Game endpoints
  createGame: async (buyInAmount) => {
    const response = await axios.post(`${API_URL}/game/create`, { buyInAmount });
    return response.data;
  },
  
  joinGame: async (roomCode, playerName) => {
    const response = await axios.post(`${API_URL}/game/join`, { roomCode, playerName });
    return response.data;
  },
  
  getGameState: async (roomCode) => {
    const response = await axios.get(`${API_URL}/game/state/${roomCode}`);
    return response.data;
  },
  
  buyIn: async (playerId, amount) => {
    const response = await axios.post(`${API_URL}/game/buy-in`, { playerId, amount });
    return response.data;
  },
  
  endGame: async (roomCode) => {
    const response = await axios.post(`${API_URL}/game/end/${roomCode}`);
    return response.data;
  },
  
  resetGame: async (roomCode) => {
    const response = await axios.post(`${API_URL}/game/reset/${roomCode}`);
    return response.data;
  },
  
  kickPlayer: async (playerId) => {
    const response = await axios.post(`${API_URL}/game/kick`, { playerId });
    return response.data;
  },
  
  // Bet endpoints
  placeBet: async (playerId, amount, type, gameId) => {
    const response = await axios.post(`${API_URL}/bet/place`, { playerId, amount, type, gameId });
    return response.data;
  },
  
  getBetHistory: async (gameId) => {
    const response = await axios.get(`${API_URL}/bet/history/${gameId}`);
    return response.data;
  }
};

export default api; 