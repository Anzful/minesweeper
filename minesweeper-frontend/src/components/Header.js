// minesweeper-frontend/src/components/Header.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header>
      <h1>Minesweeper</h1>
      <div>
        {user ? (
          <>
            <span>Welcome, {user.username}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <span>Please log in or register</span>
        )}
      </div>
    </header>
  );
};

export default Header;
