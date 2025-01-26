// src/components/Header.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header>
      <h1>Minesweeper</h1>
      <div className="header-right">
        {user ? (
          <>
            <span style={{ marginRight: '1rem', color: '#fff' }}>
              Welcome, {user.username}
            </span>
            <button onClick={logout} style={{ cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <span style={{ color: '#fff' }}>Please log in or register</span>
        )}
      </div>
    </header>
  );
};

export default Header;
