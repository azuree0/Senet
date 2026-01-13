import { useState, useEffect } from 'react';
import init, { GameState, Player } from '../pkg/senet.js';
import './App.css';
import {
  initDatabase,
  createGame,
  saveMove,
  updateGame,
  getGameMoves,
  getGameStats
} from './database.js';

function App() {
  const [game, setGame] = useState(null);
  const [board, setBoard] = useState([]);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(Player.Light);
  const [diceValue, setDiceValue] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [status, setStatus] = useState('');
  const [currentGameId, setCurrentGameId] = useState(null);
  const [moveNumber, setMoveNumber] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [gameMoves, setGameMoves] = useState([]);

  useEffect(() => {
    async function loadGame() {
      // Initialize database
      try {
        await initDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }

      await init();
      const newGame = new GameState();
      setGame(newGame);
      updateGameState(newGame);
      
      // Create a new game in database
      const gameId = createGame();
      setCurrentGameId(gameId);
      setMoveNumber(0);
    }
    loadGame();
  }, []);

  function loadCurrentGameMoves() {
    if (currentGameId) {
      const moves = getGameMoves(currentGameId);
      setGameMoves(moves);
    } else {
      setGameMoves([]);
    }
  }

  function updateGameState(gameInstance) {
    if (!gameInstance) return;
    
    const newBoard = gameInstance.get_board();
    const newValidMoves = gameInstance.get_valid_moves();
    const newCurrentPlayer = gameInstance.current_player;
    const newDiceValue = gameInstance.dice_value;
    const newGameOver = gameInstance.game_over;
    
    setBoard(newBoard);
    setValidMoves(newValidMoves);
    setCurrentPlayer(newCurrentPlayer);
    setDiceValue(newDiceValue);
    setGameOver(newGameOver);
    if (newGameOver) {
      setWinner(gameInstance.winner);
      const winnerName = gameInstance.winner === Player.Light ? 'Light' : 'Dark';
      setStatus(`Game Over! ${winnerName} Player Wins!`);
      
      // Update game in database with winner
      if (currentGameId) {
        updateGame(currentGameId, winnerName, moveNumber);
      }
    } else {
      setWinner(null);
      if (newDiceValue === 0) {
        setStatus('');
      } else {
        setStatus('Select a piece to move');
      }
    }
  }

  function handleRollDice() {
    if (!game || gameOver) return;
    
    const rolledValue = game.roll_dice();
    updateGameState(game);
    
    // Check if there are valid moves
    const moves = game.get_valid_moves();
    if (moves.length === 0 && rolledValue !== 0) {
      setStatus('No valid moves. Turn passes.');
      setTimeout(() => {
        game.pass_turn();
        updateGameState(game);
      }, 1000);
    }
  }

  function handleReset() {
    if (!game) return;
    
    // Create a new game in database
    const gameId = createGame();
    setCurrentGameId(gameId);
    setMoveNumber(0);
    
    game.reset();
    
    // Explicitly clear winner and status before updating game state
    setWinner(null);
    setStatus('');
    
    // Clear moves history for the new game
    setGameMoves([]);
    
    updateGameState(game);
  }

  function handleSquareClick(squareIndex) {
    if (!game || gameOver) return;
    
    if (diceValue === 0) return;
    
    if (!validMoves.includes(squareIndex)) return;
    
    // Calculate source square (destination - dice value)
    const squareFrom = squareIndex - diceValue;
    const playerName = currentPlayer === Player.Light ? 'Light' : 'Dark';
    
    const success = game.make_move(squareIndex);
    if (success) {
      // Record move in database
      // Check if currentGameId is not null/undefined (0 is a valid ID but shouldn't happen)
      if (currentGameId != null && currentGameId > 0) {
        const newMoveNumber = moveNumber + 1;
        setMoveNumber(newMoveNumber);
        saveMove(
          currentGameId,
          playerName,
          squareFrom >= 0 ? squareFrom : null,
          squareIndex,
          diceValue,
          newMoveNumber
        );
        // Refresh moves in history panel if it's open
        if (showHistory) {
          loadCurrentGameMoves();
        }
      }
      
      updateGameState(game);
    }
  }

  const playerName = currentPlayer === Player.Light ? 'Light' : 'Dark';
  const layout = [
    ...Array.from({ length: 10 }, (_, i) => i),           // 0-9
    ...Array.from({ length: 10 }, (_, i) => 19 - i),      // 19-10 (reversed)
    ...Array.from({ length: 10 }, (_, i) => 20 + i),     // 20-29
  ];

  return (
    <div className="container">
      <header>
        <h1>Senet</h1>
      </header>
      
      <div className="game-info">
        <div className="player-info">
          <div id="current-player" className={`player-indicator ${currentPlayer === Player.Dark ? 'dark' : ''}`}>
            <span>Current Player: </span>
            <span id="player-name">{playerName}</span>
          </div>
          <div id="dice-display">
            <span>Dice: </span>
            <span id="dice-value">{diceValue || '-'}</span>
          </div>
        </div>
        <div className="controls">
          <button 
            id="roll-btn" 
            className="btn btn-primary"
            onClick={handleRollDice}
            disabled={diceValue !== 0 || gameOver}
          >
            Roll Dice
          </button>
          <button 
            id="reset-btn" 
            className="btn btn-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className="btn btn-history"
            onClick={() => {
              if (!showHistory) {
                loadCurrentGameMoves();
              }
              setShowHistory(!showHistory);
            }}
          >
            History
          </button>
        </div>
      </div>
      
      <div id="game-board" className="board">
        {layout.map((squareIndex, displayIndex) => {
          const squareType = board[squareIndex];
          let content = '';
          let specialClass = '';
          let hieroglyph = '';
          
          let squareClassName = 'square';
          
          // Add starting area classes
          if (squareIndex >= 0 && squareIndex < 5) {
            squareClassName += ' start-light';
          } else if (squareIndex >= 5 && squareIndex < 10) {
            squareClassName += ' start-dark';
          }
          
          // Determine hieroglyph based on square index
          if (squareIndex === 14) {
            hieroglyph = '𓊃';
            squareClassName += ' safe-house';
            specialClass = 'safe-house';
          } else if (squareIndex === 25) {
            hieroglyph = '𓄤';
            squareClassName += ' house-of-happiness';
            specialClass = 'house-of-happiness';
          } else if (squareIndex === 26) {
            hieroglyph = '𓈗';
            squareClassName += ' house-of-water';
            specialClass = 'house-of-water';
          } else if (squareIndex === 27) {
            hieroglyph = '𓁹';
            squareClassName += ' house-of-three-truths';
            specialClass = 'house-of-three-truths';
          } else if (squareIndex === 28) {
            hieroglyph = '𓇳';
            squareClassName += ' house-of-re-atum';
            specialClass = 'house-of-re-atum';
          }
          
          switch (squareType) {
            case 1: // LightPiece
              content = '○';
              squareClassName += ' light-piece';
              break;
            case 2: // DarkPiece
              content = '●';
              squareClassName += ' dark-piece';
              break;
            case 3: // SafeHouse (empty)
            case 4: // HouseOfHappiness (empty)
            case 5: // HouseOfWater (empty)
            case 6: // HouseOfThreeTruths (empty)
            case 7: // HouseOfReAtum (empty)
              content = hieroglyph;
              break;
            default:
              if (!hieroglyph) {
                squareClassName += ' empty';
              }
          }
          
          if (validMoves.includes(squareIndex)) {
            squareClassName += ' valid-move';
          }
          
          return (
            <div
              key={squareIndex}
              className={squareClassName}
              onClick={() => handleSquareClick(squareIndex)}
            >
              {hieroglyph && (squareType === 1 || squareType === 2) && (
                <span className="hieroglyph">{hieroglyph}</span>
              )}
              {(squareType === 1 || squareType === 2) ? (
                <span className="piece">{squareType === 1 ? '○' : '●'}</span>
              ) : (
                content
              )}
              <span className="square-number">{squareIndex + 1}</span>
            </div>
          );
        })}
      </div>
      
      <div 
        id="status" 
        className="status"
        style={{ color: gameOver ? '#ff6347' : '#667eea' }}
      >
        {status}
      </div>

      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h2>Record</h2>
            {currentGameId && (
              <div className="history-game-info">
                <span>Game #{currentGameId}</span>
              </div>
            )}
          </div>
          
          {gameMoves.length === 0 ? (
            <div className="history-empty">No moves.</div>
          ) : (
            <div className="history-content">
              <div className="history-moves">
                <h3>Moves</h3>
                <div className="moves-list">
                  {gameMoves.map((move) => (
                    <div key={move.id} className="move-item">
                      <span className="move-number">#{move.move_number}</span>
                      <span className={`move-player ${move.player.toLowerCase()}`}>
                        {move.player}
                      </span>
                      <span className="move-details">
                        {move.square_from !== null ? `Square ${move.square_from + 1}` : 'Start'} 
                        {' → '} 
                        Square {move.square_to + 1}
                      </span>
                      <span className="move-dice">🎲 {move.dice_value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
