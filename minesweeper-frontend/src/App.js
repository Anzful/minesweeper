// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

import { AuthContext, AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';

// Navigation component to access auth context
const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <nav>
      <Link to="/">Game</Link>
      <Link to="/leaderboard">Leaderboard</Link>
      {!user ? (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      ) : (
        <Link to="/" onClick={logout}>Logout</Link>
      )}
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Router>
          <Header />
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<GameBoard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login" element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              } />
              <Route path="/register" element={
                <AuthRedirect>
                  <Register />
                </AuthRedirect>
              } />
            </Routes>
          </main>
          <Footer />
        </Router>
      </div>
    </AuthProvider>
  );
}

// Redirects logged in users away from auth pages
const AuthRedirect = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default App;
