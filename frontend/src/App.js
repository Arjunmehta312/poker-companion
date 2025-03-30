import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './components/Home';
import Join from './components/Join';
import Table from './components/Table';
import Controller from './components/Controller';
import './App.css';

function App() {
  return (
    <Router>
      <GameProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join/:roomCode" element={<Join />} />
            <Route path="/table/:roomCode" element={<Table />} />
            <Route path="/controller/:roomCode" element={<Controller />} />
          </Routes>
        </div>
      </GameProvider>
    </Router>
  );
}

export default App;
