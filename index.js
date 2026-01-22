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
        if (!game || game.game_over) {
            return;
        }
        
        const diceValue = game.roll_dice();
        renderBoard();
        updateUI();
        
        // Check if there are valid moves
        const validMoves = game.get_valid_moves();
        if (validMoves.length === 0 && diceValue !== 0) {
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
    
    const squares = game.get_all_squares_render_info();
    
    squares.forEach((squareInfo) => {
        const square = document.createElement('div');
        square.className = squareInfo.classes;
        square.dataset.index = squareInfo.index;
        
        // Add hieroglyph if present (as separate element for styling)
        if (squareInfo.hieroglyph && (squareInfo.square_type === 1 || squareInfo.square_type === 2)) {
            const hieroEl = document.createElement('span');
            hieroEl.className = 'hieroglyph';
            hieroEl.textContent = squareInfo.hieroglyph;
            square.appendChild(hieroEl);
        }
        
        // Add piece content
        if (squareInfo.square_type === 1 || squareInfo.square_type === 2) {
            const pieceEl = document.createElement('span');
            pieceEl.className = 'piece';
            pieceEl.textContent = squareInfo.square_type === 1 ? '○' : '●';
            square.appendChild(pieceEl);
        } else {
            square.textContent = squareInfo.content;
        }
        
        // Add square number
        const number = document.createElement('span');
        number.className = 'square-number';
        number.textContent = squareInfo.display_number;
        square.appendChild(number);
        
        square.addEventListener('click', () => handleSquareClick(squareInfo.index));
        board.appendChild(square);
    });
}

function updateUI() {
    const uiState = game.get_ui_state();
    
    const playerNameEl = document.getElementById('player-name');
    playerNameEl.textContent = uiState.current_player_name;
    playerNameEl.className = game.current_player === Player.Light ? '' : 'dark';
    
    document.getElementById('dice-value').textContent = uiState.dice_display;
    
    const rollBtn = document.getElementById('roll-btn');
    rollBtn.disabled = uiState.roll_button_disabled;
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
