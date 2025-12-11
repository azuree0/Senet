import init, { GameState, Player } from './pkg/senet.js';

let game = null;

async function run() {
    await init();
    game = new GameState();
    renderBoard();
    updateUI();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('roll-btn').addEventListener('click', () => {
        if (!game || game.game_over()) {
            return;
        }
        
        const diceValue = game.roll_dice();
        renderBoard();
        updateUI();
        
        // Check if there are valid moves
        const validMoves = game.get_valid_moves();
        if (validMoves.length === 0 && diceValue !== 0) {
            document.getElementById('status').textContent = 'No valid moves. Turn passes.';
            setTimeout(() => {
                game.pass_turn();
                renderBoard();
                updateUI();
            }, 1000);
        }
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if (!game) {
            return;
        }
        game.reset();
        renderBoard();
        updateUI();
    });
}

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    const boardArray = game.get_board();
    const validMoves = game.get_valid_moves();
    
    // Senet board layout: 3 rows of 10 squares
    // Row 1: squares 0-9 (left to right)
    // Row 2: squares 10-19 (right to left)
    // Row 3: squares 20-29 (left to right)
    
    const layout = [
        ...Array.from({ length: 10 }, (_, i) => i),           // 0-9
        ...Array.from({ length: 10 }, (_, i) => 19 - i),      // 19-10 (reversed)
        ...Array.from({ length: 10 }, (_, i) => 20 + i),     // 20-29
    ];
    
    layout.forEach((squareIndex, displayIndex) => {
        const square = document.createElement('div');
        square.className = 'square';
        square.dataset.index = squareIndex;
        
        const squareType = boardArray[squareIndex];
        let content = '';
        let specialClass = '';
        let hieroglyph = '';
        
        // Add starting area classes (squares 1-5 light brown, 6-10 dark brown)
        if (squareIndex >= 0 && squareIndex < 5) { // Squares 1-5
            square.className += ' start-light';
        } else if (squareIndex >= 5 && squareIndex < 10) { // Squares 6-10
            square.className += ' start-dark';
        }
        
        // Determine hieroglyph based on square index (special squares)
        if (squareIndex === 14) { // Square 15 - Safe House
            hieroglyph = '𓊃'; // Hieroglyph for protection/safe
            square.className += ' safe-house';
            specialClass = 'safe-house';
        } else if (squareIndex === 25) { // Square 26 - House of Happiness
            hieroglyph = '𓄤'; // Hieroglyph for good/beautiful/happiness
            square.className += ' house-of-happiness';
            specialClass = 'house-of-happiness';
        } else if (squareIndex === 26) { // Square 27 - House of Water
            hieroglyph = '𓈗'; // Hieroglyph for water
            square.className += ' house-of-water';
            specialClass = 'house-of-water';
        } else if (squareIndex === 27) { // Square 28 - House of Three Truths
            hieroglyph = '𓁹'; // Hieroglyph for truth/justice (eye of Horus)
            square.className += ' house-of-three-truths';
            specialClass = 'house-of-three-truths';
        } else if (squareIndex === 28) { // Square 29 - House of Re-Atum
            hieroglyph = '𓇳'; // Hieroglyph for sun/Re
            square.className += ' house-of-re-atum';
            specialClass = 'house-of-re-atum';
        }
        
        switch (squareType) {
            case 1: // LightPiece
                content = '○';
                square.className += ' light-piece';
                break;
            case 2: // DarkPiece
                content = '●';
                square.className += ' dark-piece';
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
                    square.className += ' empty';
                }
        }
        
        if (validMoves.includes(squareIndex)) {
            square.className += ' valid-move';
        }
        
        // Add hieroglyph if present (as separate element for styling)
        if (hieroglyph && (squareType === 1 || squareType === 2)) {
            const hieroEl = document.createElement('span');
            hieroEl.className = 'hieroglyph';
            hieroEl.textContent = hieroglyph;
            square.appendChild(hieroEl);
        }
        
        // Add piece content
        if (squareType === 1 || squareType === 2) {
            const pieceEl = document.createElement('span');
            pieceEl.className = 'piece';
            pieceEl.textContent = squareType === 1 ? '○' : '●';
            square.appendChild(pieceEl);
        } else {
            square.textContent = content;
        }
        
        // Add square number
        const number = document.createElement('span');
        number.className = 'square-number';
        number.textContent = squareIndex + 1;
        square.appendChild(number);
        
        square.addEventListener('click', () => handleSquareClick(squareIndex));
        board.appendChild(square);
    });
}

function updateUI() {
    const currentPlayer = game.current_player;
    const playerName = currentPlayer === Player.Light ? 'Light' : 'Dark';
    const playerNameEl = document.getElementById('player-name');
    playerNameEl.textContent = playerName;
    playerNameEl.className = currentPlayer === Player.Light ? '' : 'dark';
    
    const diceValue = game.dice_value;
    document.getElementById('dice-value').textContent = diceValue || '-';
    
    const rollBtn = document.getElementById('roll-btn');
    rollBtn.disabled = diceValue !== 0 || game.game_over;
    
    const statusEl = document.getElementById('status');
    if (game.game_over) {
        const winner = game.winner;
        const winnerName = winner === Player.Light ? 'Light' : 'Dark';
        statusEl.textContent = `Game Over! ${winnerName} Player Wins!`;
        statusEl.style.color = '#ff6347';
    } else if (diceValue === 0) {
        statusEl.textContent = '';
        statusEl.style.color = '#667eea';
    } else {
        statusEl.textContent = 'Select a piece to move';
        statusEl.style.color = '#667eea';
    }
}

function handleSquareClick(squareIndex) {
    if (!game || game.game_over) {
        return;
    }
    
    const diceValue = game.dice_value;
    if (diceValue === 0) {
        return;
    }
    
    const validMoves = game.get_valid_moves();
    if (!validMoves.includes(squareIndex)) {
        return;
    }
    
    const success = game.make_move(squareIndex);
    if (success) {
        renderBoard();
        updateUI();
    }
}

run().catch(console.error);

