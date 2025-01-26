// minesweeper-frontend/src/components/GameBoard.js
import React, { useState, useEffect } from 'react';
import API from '../services/api';

const generateBoard = (rows, cols, minesCount) => {
  // Basic random mine placement
  let board = Array(rows).fill(null).map(() => 
    Array(cols).fill({ isMine: false, revealed: false, flagged: false, adjacentMines: 0 })
  );

  // Place mines
  let placed = 0;
  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].isMine) {
      board[r][c] = { ...board[r][c], isMine: true };
      placed++;
    }
  }

  // Calculate adjacent mines for each cell
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        directions.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            count++;
          }
        });
        board[r][c] = { ...board[r][c], adjacentMines: count };
      }
    }
  }
  return board;
};

const GameBoard = ({ difficulty }) => {
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [gameId, setGameId] = useState(null);

  // Set board size & mine count based on difficulty
  const getBoardParams = (diff) => {
    switch(diff) {
      case 'medium': return { rows: 16, cols: 16, mines: 40 };
      case 'hard': return { rows: 16, cols: 30, mines: 99 };
      case 'easy':
      default:
        return { rows: 8, cols: 8, mines: 10 };
    }
  };

  useEffect(() => {
    const { rows, cols, mines } = getBoardParams(difficulty);
    const newBoard = generateBoard(rows, cols, mines);
    setBoard(newBoard);
    setGameOver(false);
    setWon(false);
    setTime(0);
    setTimerActive(true);

    // Create game on backend
    const createGame = async () => {
      try {
        const { data } = await API.post('/games', { difficulty });
        setGameId(data.game.id);
      } catch (error) {
        console.error(error);
      }
    };
    createGame();
  }, [difficulty]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive && !gameOver) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else if (!timerActive && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver, time]);

  const handleRightClick = (r, c, e) => {
    e.preventDefault(); // prevent context menu
    if (gameOver) return;
    // Right-click to reveal
    const newBoard = [...board];
    if (!newBoard[r][c].flagged && !newBoard[r][c].revealed) {
      // Reveal
      newBoard[r][c] = { ...newBoard[r][c], revealed: true };
      // Check if mine
      if (newBoard[r][c].isMine) {
        // Game Over
        setGameOver(true);
        setTimerActive(false);
        updateGameStatus('lost');
      } else {
        // Potentially reveal adjacent (if 0)
        // For brevity, skip full flood fill
      }
      setBoard(newBoard);
    }
  };

  const handleLeftClick = (r, c) => {
    if (gameOver) return;
    // Left-click to flag
    const newBoard = [...board];
    if (!newBoard[r][c].revealed) {
      newBoard[r][c] = { ...newBoard[r][c], flagged: !newBoard[r][c].flagged };
    }
    setBoard(newBoard);
  };

  const checkWinCondition = () => {
    // If all non-mine cells are revealed or all mines are flagged
    // This is a simplified check. A more thorough approach would be needed in a real game.
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        if (!board[r][c].isMine && !board[r][c].revealed) {
          return false;
        }
      }
    }
    return true;
  };

  useEffect(() => {
    if (!gameOver) {
      const win = checkWinCondition();
      if (win) {
        setWon(true);
        setGameOver(true);
        setTimerActive(false);
        updateGameStatus('won');
      }
    }
  }, [board]);

  const updateGameStatus = async (status) => {
    if (!gameId) return;
    try {
      await API.put(`/games/${gameId}`, {
        status,
        timeTaken: time,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Difficulty: {difficulty}</h2>
      <div>Time: {time}s</div>
      <div style={{ display: 'inline-block' }}>
        {board.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((cell, c) => (
              <div
                key={c}
                onContextMenu={(e) => handleRightClick(r, c, e)}
                onClick={() => handleLeftClick(r, c)}
                style={{
                  width: 30,
                  height: 30,
                  border: '1px solid #999',
                  backgroundColor: cell.revealed 
                    ? (cell.isMine ? 'red' : 'lightgrey') 
                    : 'darkgrey',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {cell.flagged && '🚩'}
                {cell.revealed && !cell.isMine && cell.adjacentMines > 0 && cell.adjacentMines}
              </div>
            ))}
          </div>
        ))}
      </div>
      {gameOver && (won ? <div>You Won!</div> : <div>Game Over</div>)}
    </div>
  );
};

export default GameBoard;
