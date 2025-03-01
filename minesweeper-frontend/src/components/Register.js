// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await API.post('/users/register', { username, password });
      setLoading(false);
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      setLoading(false);
      setError(error.response?.data?.message || 'Error registering');
    }
  };

  return (
    <div className="form-card">
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Username:</label>
          <input 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)} 
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            required
            disabled={loading}
          />
        </div>
        <button 
          className="btn-submit" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;
