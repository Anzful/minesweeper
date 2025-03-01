// minesweeper-frontend/src/components/Leaderboard.js
import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Leaderboard = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/leaderboard/${difficulty}`);
        console.log('Leaderboard data:', data);
        setRecords(data.leaderboard || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [difficulty, refreshKey]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get medal emoji based on rank
  const getMedalEmoji = (rank) => {
    switch(rank) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
      
      <div className="leaderboard-controls">
        <div className="difficulty-selector">
          <label htmlFor="difficulty-select">Difficulty: </label>
          <select 
            id="difficulty-select"
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={loading}
          >
            <option value='easy'>Easy (8x8, 10 mines)</option>
            <option value='medium'>Medium (16x16, 40 mines)</option>
            <option value='hard'>Hard (16x30, 99 mines)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && (
        records.length > 0 ? (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Best Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item, i) => (
                  <tr key={item._id || item.id || i} className={i < 3 ? `top-${i+1}` : ''}>
                    <td className="rank-cell">
                      <span className="rank-number">{i + 1}</span>
                      <span className="rank-medal">{getMedalEmoji(i)}</span>
                    </td>
                    <td className="player-cell">{item.User?.username || 'Unknown User'}</td>
                    <td className="time-cell">{formatTime(item.bestTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-records">
            <div className="empty-state-icon">🏆</div>
            <h3>No records yet!</h3>
            <p>Complete a game to see your score on the leaderboard.</p>
            <p className="empty-state-hint">
              Win the game by finding all mines to appear on the leaderboard.
            </p>
          </div>
        )
      )}

      <div className="leaderboard-footer">
        <p className="leaderboard-tip">
          💡 Tip: The leaderboard shows the fastest times for each difficulty level
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
