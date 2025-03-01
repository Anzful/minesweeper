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
  const [gameStarted, setGameStarted] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      console.log('New game created:', response.data);
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
    setGameStarted(true);
    setShowConfirmation(false);

    const { rows, cols, mines } = getBoardParams(diff);
    const newBoard = generateBoard(rows, cols, mines);
    setBoard(newBoard);
    setFlagsRemaining(mines);

    setTotalGames(prev => prev + 1);
    createNewGame(diff);
  }, [getBoardParams, createNewGame]);

  // Check if a game is in progress before starting a new one
  const handleNewGameClick = () => {
    if (gameStarted && !gameOver) {
      setShowConfirmation(true);
    } else {
      startNewGame(difficulty);
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect - Only run if game has started
  useEffect(() => {
    let interval = null;
    if (timerActive && !gameOver && gameStarted) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver, gameStarted]);

  const handleRevealCell = (r, c) => {
    if (gameOver || showConfirmation) return;

    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
    const cell = newBoard[r][c];

    // If flagged or already revealed, do nothing
    if (cell.flagged || cell.revealed) return;

    cell.revealed = true;

    if (cell.isMine) {
      // Game over - reveal all mines
      newBoard.forEach(row => {
        row.forEach(c => {
          if (c.isMine) c.revealed = true;
        });
      });
      
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
    if (gameOver || showConfirmation) return;

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
    if (!gameId) {
      console.warn('No gameId available, cannot update game status');
      return;
    }
    try {
      console.log(`Updating game ${gameId} status to ${status} with time ${timeTaken}`);
      const response = await API.put(`/games/${gameId}`, {
        status,
        timeTaken,
      });
      console.log('Game update response:', response.data);
      
      // Update stats when game is won
      if (status === 'won') {
        setGamesWon(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  // Check win condition after each render
  useEffect(() => {
    if (!gameOver && gameStarted && board.length > 0) {
      const didWin = checkWinCondition(board);
      if (didWin) {
        setGameOver(true);
        setWon(true);
        setTimerActive(false);
        updateGameStatus('won', time);
      }
    }
  }, [board, gameOver, checkWinCondition, time, gameStarted]);

  // Get cell color based on adjacent mines
  const getCellNumberColor = (number) => {
    switch (number) {
      case 1: return '#0000FF'; // blue
      case 2: return '#008000'; // green
      case 3: return '#FF0000'; // red
      case 4: return '#000080'; // dark blue
      case 5: return '#800000'; // maroon
      case 6: return '#008080'; // teal
      case 7: return '#000000'; // black
      case 8: return '#808080'; // gray
      default: return '#000000';
    }
  };

  return (
    <div className="game-container">
      {/* Game Stats */}
      <div className="game-stats">
        <div className="stats-item">Games: {totalGames}</div>
        <div className="stats-item">Wins: {gamesWon}</div>
        <div className="stats-item">Win Rate: {totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0}%</div>
      </div>
      
      {/* Top Controls: Difficulty & New Game */}
      <div className="game-topbar">
        <div className="difficulty-selector">
          <label htmlFor="difficulty-select">Difficulty:</label>
          <select 
            id="difficulty-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={gameStarted && !gameOver}
          >
            <option value="easy">Easy (8x8, 10 mines)</option>
            <option value="medium">Medium (16x16, 40 mines)</option>
            <option value="hard">Hard (16x30, 99 mines)</option>
          </select>
        </div>
        <button 
          className="new-game-btn"
          onClick={handleNewGameClick}
        >
          New Game
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item timer">
          <span className="status-icon">⏱️</span>
          <span className="status-value">{formatTime(time)}</span>
        </div>
        <div className="status-item flags">
          <span className="status-icon">🚩</span>
          <span className="status-value">{flagsRemaining}</span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to start a new game? Your current game will be lost.</p>
          <div className="dialog-buttons">
            <button onClick={() => startNewGame(difficulty)}>Yes, Start New Game</button>
            <button onClick={() => setShowConfirmation(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Show instructions if game hasn't started */}
      {!gameStarted && !showConfirmation && (
        <div className="instructions">
          <h3>Welcome to Minesweeper!</h3>
          <p>Select a difficulty and click "New Game" to start playing.</p>
          <ul className="game-rules">
            <li>Left-click to reveal a cell</li>
            <li>Right-click to place a flag</li>
            <li>Find all mines to win!</li>
          </ul>
        </div>
      )}

      {/* Board - Only show if game has started */}
      {gameStarted && (
        <div className={`game-board difficulty-${difficulty} ${gameOver ? 'game-over' : ''} ${showConfirmation ? 'dimmed' : ''}`}>
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
                let style = {};
                if (cell.flagged && !cell.revealed) {
                  content = '🚩';
                } else if (cell.revealed && cell.isMine) {
                  content = '💣';
                } else if (cell.revealed && cell.adjacentMines > 0) {
                  content = cell.adjacentMines;
                  style.color = getCellNumberColor(cell.adjacentMines);
                  style.fontWeight = 'bold';
                }

                return (
                  <div
                    key={c}
                    className={cellClass}
                    onClick={() => handleRevealCell(r, c)}
                    onContextMenu={(e) => handleFlagCell(r, c, e)}
                    style={style}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Win / Lose Messages - Only show if game has started */}
      {gameStarted && gameOver && !showConfirmation && (
        <div className={`game-result ${won ? 'win' : 'lose'}`}>
          {won ? (
            <>
              <h3 className="result-title">🎉 You Win! 🎉</h3>
              <p className="result-details">Time: {formatTime(time)}</p>
            </>
          ) : (
            <>
              <h3 className="result-title">💥 Game Over 💥</h3>
              <p className="result-details">Better luck next time!</p>
            </>
          )}
          <button className="play-again-btn" onClick={() => startNewGame(difficulty)}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
