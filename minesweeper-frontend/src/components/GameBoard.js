// src/components/GameBoard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [compactView, setCompactView] = useState(false);
  // For touch handling
  const [isMobile, setIsMobile] = useState(false);
  const longPressTimer = useRef(null);
  const longPressDuration = 500; // ms

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 
                  'ontouchstart' in window || 
                  navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Choose rows, cols, mines based on difficulty
  const getBoardParams = useCallback((diff) => {
    switch (diff) {
      case 'medium':
        return { rows: 8, cols: 16, mines: 20 };
      case 'hard':
        return { rows: 16, cols: 16, mines: 40 };
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

  // Touch event handlers for mobile
  const handleTouchStart = (r, c) => {
    if (gameOver || showConfirmation) return;
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      handleFlagCell(r, c, new Event('longpress'));
      longPressTimer.current = null;
    }, longPressDuration);
  };

  const handleTouchEnd = (r, c, e) => {
    if (gameOver || showConfirmation) return;
    
    // Cancel long press timer if it exists
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      
      // If this was a short tap, reveal the cell
      handleRevealCell(r, c);
    }
    
    // Prevent default context menu
    e.preventDefault();
  };

  const handleTouchMove = () => {
    // Cancel long press if finger moved
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Update instructions text based on device
  const getInstructions = () => {
    if (isMobile) {
      return (
        <ul className="game-rules">
          <li>Tap to reveal a cell</li>
          <li>Long-press to place a flag</li>
          <li>Find all mines to win!</li>
        </ul>
      );
    } else {
      return (
        <ul className="game-rules">
          <li>Left-click to reveal a cell</li>
          <li>Right-click to place a flag</li>
          <li>Find all mines to win!</li>
        </ul>
      );
    }
  };

  // Get board class name based on difficulty and compact view
  const getBoardClassName = () => {
    let classNames = `game-board difficulty-${difficulty}`;
    if (gameOver) classNames += ' game-over';
    if (showConfirmation) classNames += ' dimmed';
    if (compactView && difficulty === 'hard') classNames += ' compact-view';
    return classNames;
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
            <option value="medium">Medium (8x16, 20 mines)</option>
            <option value="hard">Hard (16x16, 40 mines)</option>
          </select>
        </div>
        <div className="game-controls">
          {difficulty === 'hard' && gameStarted && (
            <button 
              className="view-toggle-btn"
              onClick={() => setCompactView(!compactView)}
              title={compactView ? "Switch to normal view" : "Switch to compact view"}
            >
              {compactView ? "Normal View" : "Compact View"}
            </button>
          )}
          <button 
            className="new-game-btn"
            onClick={handleNewGameClick}
          >
            New Game
          </button>
        </div>
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
          {getInstructions()}
        </div>
      )}

      {/* Game controls information for mobile if game has started */}
      {isMobile && gameStarted && !gameOver && !showConfirmation && (
        <div className="mobile-controls-hint">
          <p>Tap to reveal • Long-press to flag</p>
        </div>
      )}

      {/* Board - Only show if game has started */}
      {gameStarted && (
        <>
          {difficulty === 'hard' && (
            <div className="board-size-hint">
              <p>
                {compactView 
                  ? "Compact view enabled. The board is automatically scaled to fit your screen." 
                  : "Playing Hard difficulty (16x16). Use compact view to see more cells at once."}
              </p>
            </div>
          )}
          <div className="game-board-wrapper">
            <div className={getBoardClassName()}>
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

                    // Add different event handlers for mobile and desktop
                    const cellProps = isMobile ? {
                      onTouchStart: () => handleTouchStart(r, c),
                      onTouchEnd: (e) => handleTouchEnd(r, c, e),
                      onTouchMove: handleTouchMove,
                      onContextMenu: (e) => e.preventDefault(), // Prevent context menu on mobile
                    } : {
                      onClick: () => handleRevealCell(r, c),
                      onContextMenu: (e) => handleFlagCell(r, c, e),
                    };

                    return (
                      <div
                        key={c}
                        className={cellClass}
                        style={style}
                        {...cellProps}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
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
