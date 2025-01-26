// minesweeper-frontend/src/components/Register.js
import React, { useState } from 'react';
import API from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/register', { username, password });
      alert('Registered successfully! Please log in.');
    } catch (error) {
      alert(error.response?.data?.message || 'Error registering');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Username: </label>
          <input 
            type='text' 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password: </label>
          <input 
            type='password' 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type='submit'>Register</button>
      </form>
    </div>
  );
};

export default Register;
