import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './components/Home';
import Table from './components/Table';
import Controller from './components/Controller';
import './App.css';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/table/:roomCode" element={<Table />} />
            <Route path="/controller/:roomCode" element={<Controller />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
