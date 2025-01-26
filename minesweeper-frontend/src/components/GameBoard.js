// src/components/GameBoard.js
import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

/** Helper function: Return an array of valid neighbor coordinates */
const getNeighbors = (r, c, rows, cols) => {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  const neighbors = [];
  for (let [dr, dc] of directions) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push([nr, nc]);
    }
  }
  return neighbors;
};

const generateBoard = (rows, cols, minesCount) => {
  let board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
    }))
  );

  // Randomly place mines
  let placed = 0;
  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        getNeighbors(r, c, rows, cols).forEach(([nr, nc]) => {
          if (board[nr][nc].isMine) count++;
        });
        board[r][c].adjacentMines = count;
      }
    }
  }

  return board;
};

const floodFillReveal = (board, startR, startC) => {
  const rows = board.length;
  const cols = board[0].length;
  const queue = [[startR, startC]];
  const visited = new Set([`${startR},${startC}`]);

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    board[r][c].revealed = true;
    board[r][c].flagged = false;

    if (board[r][c].adjacentMines === 0) {
      getNeighbors(r, c, rows, cols).forEach(([nr, nc]) => {
        if (!visited.has(`${nr},${nc}`) && !board[nr][nc].revealed) {
          visited.add(`${nr},${nc}`);
          queue.push([nr, nc]);
        }
      });
    }
  }

  return board;
};

const GameBoard = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [flagsRemaining, setFlagsRemaining] = useState(0);

  // Choose rows, cols, mines based on difficulty
  const getBoardParams = useCallback((diff) => {
    switch (diff) {
      case 'medium':
        return { rows: 16, cols: 16, mines: 40 };
      case 'hard':
        return { rows: 16, cols: 30, mines: 99 };
      case 'easy':
      default:
        return { rows: 8, cols: 8, mines: 10 };
    }
  }, []);

  const createNewGame = useCallback(async (diff) => {
    try {
      const response = await API.post('/games', { difficulty: diff });
      setGameId(response.data.game.id);
    } catch (error) {
      console.error('Error creating new game:', error);
    }
  }, []);

  const startNewGame = useCallback((diff) => {
    setGameOver(false);
    setWon(false);
    setTime(0);
    setTimerActive(true);

    const { rows, cols, mines } = getBoardParams(diff);
    const newBoard = generateBoard(rows, cols, mines);
    setBoard(newBoard);
    setFlagsRemaining(mines);

    createNewGame(diff);
  }, [getBoardParams, createNewGame]);

  // Whenever difficulty changes, start a new game
  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty, startNewGame]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive && !gameOver) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver]);

  const handleRevealCell = (r, c) => {
    if (gameOver) return;

    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
    const cell = newBoard[r][c];

    // If flagged or already revealed, do nothing
    if (cell.flagged || cell.revealed) return;

    cell.revealed = true;

    if (cell.isMine) {
      // Game over
      setBoard(newBoard);
      setGameOver(true);
      setTimerActive(false);
      updateGameStatus('lost', time);
      return;
    }

    // If it's 0 => flood-fill
    if (cell.adjacentMines === 0) {
      floodFillReveal(newBoard, r, c);
    }

    setBoard(newBoard);
  };

  const handleFlagCell = (r, c, e) => {
    e.preventDefault();
    if (gameOver) return;

    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
    const cell = newBoard[r][c];

    if (cell.revealed) return;

    if (cell.flagged) {
      cell.flagged = false;
      setFlagsRemaining((prev) => prev + 1);
    } else {
      if (flagsRemaining > 0) {
        cell.flagged = true;
        setFlagsRemaining((prev) => prev - 1);
      }
    }
    setBoard(newBoard);
  };

  const checkWinCondition = useCallback((board) => {
    for (let row of board) {
      for (let cell of row) {
        if (!cell.isMine && !cell.revealed) {
          return false;
        }
      }
    }
    return true;
  }, []);

  const updateGameStatus = async (status, timeTaken) => {
    if (!gameId) return;
    try {
      await API.put(`/games/${gameId}`, {
        status,
        timeTaken,
      });
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  // Check win condition after each render
  useEffect(() => {
    if (!gameOver) {
      const didWin = checkWinCondition(board);
      if (didWin) {
        setGameOver(true);
        setWon(true);
        setTimerActive(false);
        updateGameStatus('won', time);
      }
    }
  }, [board, gameOver, checkWinCondition, time]);

  return (
    <div className="game-container">
      {/* Top Controls: Difficulty & New Game */}
      <div className="game-topbar">
        <div>
          <label style={{ marginRight: '0.5rem' }}>Difficulty:</label>
          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button onClick={() => startNewGame(difficulty)}>
          New Game
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div>Time: {time}s</div>
        <div>Flags: {flagsRemaining}</div>
      </div>

      {/* Board */}
      {board.map((row, r) => (
        <div className="board-row" key={r}>
          {row.map((cell, c) => {
            let cellClass = 'board-cell ';
            if (cell.revealed) {
              cellClass += 'revealed ';
              if (cell.isMine) {
                cellClass += 'mine ';
              }
            } else {
              cellClass += 'hidden ';
              if (cell.flagged) {
                cellClass += 'flagged ';
              }
            }

            let content = '';
            if (cell.flagged && !cell.revealed) {
              content = '🚩';
            } else if (cell.revealed && cell.isMine) {
              content = '💣';
            } else if (cell.revealed && cell.adjacentMines > 0) {
              content = cell.adjacentMines;
            }

            return (
              <div
                key={c}
                className={cellClass}
                onClick={() => handleRevealCell(r, c)}
                onContextMenu={(e) => handleFlagCell(r, c, e)}
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}

      {/* Win / Lose Messages */}
      {gameOver && (
        won ? (
          <div className="win-message">You Win!</div>
        ) : (
          <div className="lose-message">Game Over - You Lost!</div>
        )
      )}
    </div>
  );
};

export default GameBoard;
