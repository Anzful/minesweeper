// minesweeper-frontend/src/components/Leaderboard.js
import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Leaderboard = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/leaderboard/${difficulty}`);
        setRecords(data.leaderboard);
        setError(null);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [difficulty]);

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      <div className="leaderboard-controls">
        <label htmlFor="difficulty-select">Difficulty: </label>
        <select 
          id="difficulty-select"
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value='easy'>Easy</option>
          <option value='medium'>Medium</option>
          <option value='hard'>Hard</option>
        </select>
      </div>

      {loading && <p>Loading leaderboard...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        records.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Best Time (s)</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.User?.username}</td>
                  <td>{item.bestTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No records found for this difficulty level.</p>
        )
      )}
    </div>
  );
};

export default Leaderboard;
