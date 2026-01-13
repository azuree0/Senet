import init, { GameState, Player } from '../pkg/senet.js';

// Ensure WASM is initialized
let wasmInitialized = false;
async function ensureWasmInit() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

/**
   // Run tests
   testLightWinScenario()
   testDarkWinScenario()
 */
export async function testLightWin() {
  await ensureWasmInit();
  console.log('🧪 Testing Light Player Win Condition...');
  
  const game = new GameState();
  
  // Get initial board state (ensure it's an array)
  let initialBoard = game.get_board();
  if (!Array.isArray(initialBoard)) {
    initialBoard = Array.from(initialBoard || []);
  }
  console.log('Initial board state:', initialBoard);
  console.log('Initial Light pieces on board:', countPieces(initialBoard, 1));
  console.log('Initial Dark pieces on board:', countPieces(initialBoard, 2));
  
  console.log('\n📋 Test Strategy:');
  console.log('1. Light pieces start at positions 0-4');
  console.log('2. To win, all 5 Light pieces must be moved off board (position >= 30)');
  console.log('3. Win condition checks: light_count == 0');
  
  // Check current state
  let currentBoard = game.get_board();
  if (!Array.isArray(currentBoard)) {
    currentBoard = Array.from(currentBoard || []);
  }
  const lightCount = countPieces(currentBoard, 1);
  const darkCount = countPieces(currentBoard, 2);
  
  console.log('\n📊 Current Game State:');
  console.log(`Light pieces on board: ${lightCount}`);
  console.log(`Dark pieces on board: ${darkCount}`);
  console.log(`Game over: ${game.game_over}`);
  console.log(`Winner: ${game.winner}`);
  
  console.log('\n✅ Light Win Test Setup Complete');
  console.log('💡 To fully test, manually play until Light wins, or use testLightWinScenario()');
  
  return {
    success: true,
    message: 'Light win test initialized. Use testLightWinScenario() for automated test.',
    lightCount,
    darkCount,
    gameOver: game.game_over,
    winner: game.winner
  };
}

/**
 * Test function to verify Dark player win condition
 */
export async function testDarkWin() {
  await ensureWasmInit();
  console.log('🧪 Testing Dark Player Win Condition...');
  
  const game = new GameState();
  
  let initialBoard = game.get_board();
  if (!Array.isArray(initialBoard)) {
    initialBoard = Array.from(initialBoard || []);
  }
  console.log('Initial board state:', initialBoard);
  console.log('Initial Light pieces on board:', countPieces(initialBoard, 1));
  console.log('Initial Dark pieces on board:', countPieces(initialBoard, 2));
  
  console.log('\n📋 Test Strategy:');
  console.log('1. Dark pieces start at positions 5-9');
  console.log('2. To win, all 5 Dark pieces must be moved off board (position >= 30)');
  console.log('3. Win condition checks: dark_count == 0');
  
  let currentBoard = game.get_board();
  if (!Array.isArray(currentBoard)) {
    currentBoard = Array.from(currentBoard || []);
  }
  const lightCount = countPieces(currentBoard, 1);
  const darkCount = countPieces(currentBoard, 2);
  
  console.log('\n📊 Current Game State:');
  console.log(`Light pieces on board: ${lightCount}`);
  console.log(`Dark pieces on board: ${darkCount}`);
  console.log(`Game over: ${game.game_over}`);
  console.log(`Winner: ${game.winner}`);
  
  console.log('\n✅ Dark Win Test Setup Complete');
  console.log('💡 To fully test, manually play until Dark wins, or use testDarkWinScenario()');
  
  return {
    success: true,
    message: 'Dark win test initialized. Use testDarkWinScenario() for automated test.',
    lightCount,
    darkCount,
    gameOver: game.game_over,
    winner: game.winner
  };
}

/**
 * Helper function to count pieces of a specific type on the board
 */
function countPieces(board, pieceType) {
  // pieceType: 1 = Light, 2 = Dark
  // Ensure board is an array
  if (!Array.isArray(board)) {
    board = Array.from(board || []);
  }
  return board.filter(square => square === pieceType).length;
}

/**
 * Automated test scenario for Light win
 * This simulates moving all Light pieces off the board
 */
export async function testLightWinScenario() {
  await ensureWasmInit();
  console.log('🎮 Running Automated Light Win Scenario...');
  
  const game = new GameState();
  let moveCount = 0;
  const maxMoves = 1000; // Safety limit
  
  // Strategy: Move all Light pieces (starting at 0-4) off the board
  // We'll need to roll dice and make moves until all Light pieces are gone
  
  while (!game.game_over && moveCount < maxMoves) {
    // Roll dice
    const diceValue = game.roll_dice();
    const currentPlayer = game.current_player;
    
    // Get valid moves (convert from JsValue if needed)
    let validMoves = game.get_valid_moves();
    // Ensure it's an array
    if (!Array.isArray(validMoves)) {
      validMoves = Array.from(validMoves || []);
    }
    
    if (validMoves.length === 0) {
      // No valid moves, pass turn
      game.pass_turn();
      moveCount++;
      continue;
    }
    
    // If it's Light's turn, prioritize moves that get pieces closer to the end
    // or move pieces off the board
    if (currentPlayer === Player.Light) {
      // Find moves that move pieces off board (from + dice >= 30)
      const offBoardMoves = validMoves.filter(from => from + diceValue >= 30);
      
      if (offBoardMoves.length > 0) {
        // Move a piece off the board
        const moveFrom = offBoardMoves[0];
        game.make_move(moveFrom);
        moveCount++;
        
        // Check if Light won
        if (game.game_over && game.winner === Player.Light) {
          console.log(`\n🎉 Light Player Wins! (after ${moveCount} moves)`);
          let board = game.get_board();
          if (!Array.isArray(board)) {
            board = Array.from(board || []);
          }
          console.log(`Light pieces remaining: ${countPieces(board, 1)}`);
          console.log(`Dark pieces remaining: ${countPieces(board, 2)}`);
          return {
            success: true,
            winner: 'Light',
            moves: moveCount,
            message: 'Light win condition verified successfully!'
          };
        }
        continue;
      }
      
      // Otherwise, move the piece closest to the end
      const sortedMoves = validMoves.sort((a, b) => b - a); // Highest position first
      game.make_move(sortedMoves[0]);
      moveCount++;
    } else {
      // Dark's turn - make a random valid move
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      game.make_move(randomMove);
      moveCount++;
    }
    
    // Check win condition
    if (game.game_over) {
      const winner = game.winner === Player.Light ? 'Light' : 'Dark';
      console.log(`\n🏁 Game Over! Winner: ${winner} (after ${moveCount} moves)`);
      let board = game.get_board();
      if (!Array.isArray(board)) {
        board = Array.from(board || []);
      }
      console.log(`Light pieces remaining: ${countPieces(board, 1)}`);
      console.log(`Dark pieces remaining: ${countPieces(board, 2)}`);
      
      return {
        success: winner === 'Light',
        winner,
        moves: moveCount,
        message: winner === 'Light' 
          ? 'Light win condition verified successfully!'
          : `Dark won instead after ${moveCount} moves`
      };
    }
  }
  
  if (moveCount >= maxMoves) {
    console.log(`\n⚠️ Test stopped after ${maxMoves} moves (safety limit)`);
    let board = game.get_board();
    if (!Array.isArray(board)) {
      board = Array.from(board || []);
    }
    console.log(`Light pieces remaining: ${countPieces(board, 1)}`);
    console.log(`Dark pieces remaining: ${countPieces(board, 2)}`);
    return {
      success: false,
      message: 'Test incomplete - max moves reached',
      moves: moveCount
    };
  }
  
  return { success: false, message: 'Test incomplete' };
}

/**
 * Automated test scenario for Dark win
 */
export async function testDarkWinScenario() {
  await ensureWasmInit();
  console.log('🎮 Running Automated Dark Win Scenario...');
  
  const game = new GameState();
  let moveCount = 0;
  const maxMoves = 1000; // Safety limit
  
  while (!game.game_over && moveCount < maxMoves) {
    const diceValue = game.roll_dice();
    const currentPlayer = game.current_player;
    let validMoves = game.get_valid_moves();
    // Ensure it's an array
    if (!Array.isArray(validMoves)) {
      validMoves = Array.from(validMoves || []);
    }
    
    if (validMoves.length === 0) {
      game.pass_turn();
      moveCount++;
      continue;
    }
    
    // If it's Dark's turn, prioritize moves that get pieces closer to the end
    if (currentPlayer === Player.Dark) {
      const offBoardMoves = validMoves.filter(from => from + diceValue >= 30);
      
      if (offBoardMoves.length > 0) {
        const moveFrom = offBoardMoves[0];
        game.make_move(moveFrom);
        moveCount++;
        
        if (game.game_over && game.winner === Player.Dark) {
          console.log(`\n🎉 Dark Player Wins! (after ${moveCount} moves)`);
          const board = game.get_board();
          console.log(`Light pieces remaining: ${countPieces(board, 1)}`);
          console.log(`Dark pieces remaining: ${countPieces(board, 2)}`);
          return {
            success: true,
            winner: 'Dark',
            moves: moveCount,
            message: 'Dark win condition verified successfully!'
          };
        }
        continue;
      }
      
      const sortedMoves = validMoves.sort((a, b) => b - a);
      game.make_move(sortedMoves[0]);
      moveCount++;
    } else {
      // Light's turn - make a random valid move
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      game.make_move(randomMove);
      moveCount++;
    }
    
    if (game.game_over) {
      const winner = game.winner === Player.Light ? 'Light' : 'Dark';
      console.log(`\n🏁 Game Over! Winner: ${winner} (after ${moveCount} moves)`);
      let board = game.get_board();
      if (!Array.isArray(board)) {
        board = Array.from(board || []);
      }
      console.log(`Light pieces remaining: ${countPieces(board, 1)}`);
      console.log(`Dark pieces remaining: ${countPieces(board, 2)}`);
      
      return {
        success: winner === 'Dark',
        winner,
        moves: moveCount,
        message: winner === 'Dark'
          ? 'Dark win condition verified successfully!'
          : `Light won instead after ${moveCount} moves`
      };
    }
  }
  
  if (moveCount >= maxMoves) {
    console.log(`\n⚠️ Test stopped after ${maxMoves} moves (safety limit)`);
    let board = game.get_board();
    if (!Array.isArray(board)) {
      board = Array.from(board || []);
    }
    console.log(`Light pieces remaining: ${countPieces(board, 1)}`);
    console.log(`Dark pieces remaining: ${countPieces(board, 2)}`);
    return {
      success: false,
      message: 'Test incomplete - max moves reached',
      moves: moveCount
    };
  }
  
  return { success: false, message: 'Test incomplete' };
}

/**
 * Run both win condition tests
 */
export async function runAllWinTests() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 Running All Win Condition Tests');
  console.log('═══════════════════════════════════════\n');
  
  console.log('Test 1: Light Win Condition');
  console.log('───────────────────────────────────────');
  const lightResult = await testLightWinScenario();
  
  console.log('\n\nTest 2: Dark Win Condition');
  console.log('───────────────────────────────────────');
  const darkResult = await testDarkWinScenario();
  
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════');
  console.log(`Light Win Test: ${lightResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Dark Win Test: ${darkResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('═══════════════════════════════════════\n');
  
  return {
    lightWin: lightResult,
    darkWin: darkResult,
    allPassed: lightResult.success && darkResult.success
  };
}
