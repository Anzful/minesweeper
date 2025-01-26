// minesweeper-frontend/src/components/Leaderboard.js
import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Leaderboard = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await API.get(`/leaderboard/${difficulty}`);
        setRecords(data.leaderboard);
      } catch (error) {
        console.error(error);
      }
    };
    fetchLeaderboard();
  }, [difficulty]);

  return (
    <div>
      <h2>Leaderboard</h2>
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value='easy'>Easy</option>
        <option value='medium'>Medium</option>
        <option value='hard'>Hard</option>
      </select>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Best Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item, i) => (
            <tr key={item.id}>
              <td>{i + 1}</td>
              <td>{item.User.username}</td>
              <td>{item.bestTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
