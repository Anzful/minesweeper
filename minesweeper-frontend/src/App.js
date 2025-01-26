// minesweeper-frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <nav>
          <Link to='/'>Game</Link>
          <Link to='/leaderboard'>Leaderboard</Link>
          <Link to='/login'>Login</Link>
          <Link to='/register'>Register</Link>
        </nav>
        <Routes>
          <Route
            path='/'
            element={<GameBoard difficulty='easy' />}
          />
          <Route
            path='/leaderboard'
            element={<Leaderboard />}
          />
          <Route
            path='/login'
            element={<Login />}
          />
          <Route
            path='/register'
            element={<Register />}
          />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
