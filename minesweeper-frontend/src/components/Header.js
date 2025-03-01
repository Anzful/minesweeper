// src/components/Header.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { user } = useContext(AuthContext);

  return (
    <header>
      <h1>Minesweeper</h1>
      <div className="header-right">
        {user ? (
          <span style={{ color: '#fff' }}>
            Welcome, {user.username}
          </span>
        ) : (
          <span style={{ color: '#fff' }}>Please log in or register</span>
        )}
      </div>
    </header>
  );
};

export default Header;
