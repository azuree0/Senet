use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum Player {
    Light,
    Dark,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SquareType {
    Empty,
    LightPiece,
    DarkPiece,
    SafeHouse,      // Squares 15, 26, 27, 28, 29
    HouseOfHappiness, // Square 26
    HouseOfWater,     // Square 27
    HouseOfThreeTruths, // Square 28
    HouseOfReAtum,     // Square 29
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Square {
    piece: Option<Player>,
    square_type: SquareType,
}

impl Default for Square {
    fn default() -> Self {
        Square {
            piece: None,
            square_type: SquareType::Empty,
        }
    }
}

#[derive(Debug, Clone)]
#[wasm_bindgen]
pub struct GameState {
    board: [Square; 30],
    current_player: Player,
    dice_value: u8,
    game_over: bool,
    winner: Option<Player>,
}

#[wasm_bindgen]
impl GameState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameState {
        let mut board = [Square {
            piece: None,
            square_type: SquareType::Empty,
        }; 30];
        
        // Initialize board: Light pieces start at positions 0-4, Dark at 5-9
        for i in 0..5 {
            board[i] = Square {
                piece: Some(Player::Light),
                square_type: SquareType::Empty,
            };
        }
        for i in 5..10 {
            board[i] = Square {
                piece: Some(Player::Dark),
                square_type: SquareType::Empty,
            };
        }
        
        // Mark special squares (preserve their type even with pieces)
        board[14] = Square {
            piece: board[14].piece,
            square_type: SquareType::SafeHouse,
        }; // Square 15 (0-indexed: 14)
        board[25] = Square {
            piece: board[25].piece,
            square_type: SquareType::HouseOfHappiness,
        }; // Square 26
        board[26] = Square {
            piece: board[26].piece,
            square_type: SquareType::HouseOfWater,
        }; // Square 27
        board[27] = Square {
            piece: board[27].piece,
            square_type: SquareType::HouseOfThreeTruths,
        }; // Square 28
        board[28] = Square {
            piece: board[28].piece,
            square_type: SquareType::HouseOfReAtum,
        }; // Square 29
        
        GameState {
            board,
            current_player: Player::Light,
            dice_value: 0,
            game_over: false,
            winner: None,
        }
    }
    
    #[wasm_bindgen(getter)]
    pub fn current_player(&self) -> Player {
        self.current_player
    }
    
    #[wasm_bindgen(getter)]
    pub fn dice_value(&self) -> u8 {
        self.dice_value
    }
    
    #[wasm_bindgen(getter)]
    pub fn game_over(&self) -> bool {
        self.game_over
    }
    
    #[wasm_bindgen(getter)]
    pub fn winner(&self) -> Option<Player> {
        self.winner
    }
    
    pub fn get_board(&self) -> JsValue {
        // Convert board to a format JavaScript can understand
        let board_array: Vec<u8> = self.board.iter().map(|sq| {
            match (sq.piece, &sq.square_type) {
                (Some(Player::Light), _) => 1, // LightPiece
                (Some(Player::Dark), _) => 2,  // DarkPiece
                (None, SquareType::SafeHouse) => 3,
                (None, SquareType::HouseOfHappiness) => 4,
                (None, SquareType::HouseOfWater) => 5,
                (None, SquareType::HouseOfThreeTruths) => 6,
                (None, SquareType::HouseOfReAtum) => 7,
                _ => 0, // Empty
            }
        }).collect();
        serde_wasm_bindgen::to_value(&board_array).unwrap()
    }
    
    pub fn roll_dice(&mut self) -> u8 {
        // Use JavaScript Math.random for better randomness
        // Senet uses throwing sticks that give values 1-4
        let random = js_sys::Math::random();
        self.dice_value = ((random * 4.0).floor() as u8) + 1;
        self.dice_value
    }
    
    pub fn can_move(&self, from: usize) -> bool {
        if from >= 30 || self.game_over {
            return false;
        }
        
        let square = &self.board[from];
        let is_player_piece = match square.piece {
            Some(p) => p == self.current_player,
            None => false,
        };
        
        if !is_player_piece {
            return false;
        }
        
        if self.dice_value == 0 {
            return false;
        }
        
        let to = from + self.dice_value as usize;
        
        if to >= 30 {
            // Can move off board if exact roll
            return true;
        }
        
        // Check destination
        let dest = &self.board[to];
        
        // Can't land on own piece
        if let Some(piece_player) = dest.piece {
            if piece_player == self.current_player {
                return false;
            }
        }
        
        // Special rules for House of Water (square 27)
        if to == 26 && dest.piece.is_some() {
            return false; // Must be empty to enter
        }
        
        true
    }
    
    pub fn get_valid_moves(&self) -> JsValue {
        let mut moves = Vec::new();
        
        for i in 0..30 {
            if self.can_move(i) {
                moves.push(i);
            }
        }
        
        serde_wasm_bindgen::to_value(&moves).unwrap()
    }
    
    pub fn make_move(&mut self, from: usize) -> bool {
        if !self.can_move(from) {
            return false;
        }
        
        let to = from + self.dice_value as usize;
        let piece = self.board[from].piece.unwrap();
        let from_square_type = self.board[from].square_type;
        
        // Remove piece from starting position (preserve square type)
        self.board[from] = Square {
            piece: None,
            square_type: from_square_type,
        };
        
        // Handle moving off board
        if to >= 30 {
            // Piece successfully moved off board
            self.dice_value = 0;
            self.check_win_condition();
            if !self.game_over {
                self.switch_player();
            }
            return true;
        }
        
        // Handle House of Water (square 27) - must start over
        if to == 26 {
            match self.current_player {
                Player::Light => {
                    // Move to first empty square from start
                    for i in 0..10 {
                        if self.board[i].piece.is_none() {
                            self.board[i].piece = Some(piece);
                            break;
                        }
                    }
                }
                Player::Dark => {
                    // Move to first empty square from start
                    for i in 5..15 {
                        if self.board[i].piece.is_none() {
                            self.board[i].piece = Some(piece);
                            break;
                        }
                    }
                }
            }
            self.dice_value = 0;
            self.switch_player();
            return true;
        }
        
        // Handle capturing opponent piece
        let dest = &mut self.board[to];
        if let Some(opponent_piece) = dest.piece {
            if opponent_piece != self.current_player {
                // Swap positions - send opponent back
                match opponent_piece {
                    Player::Light => {
                        // Find first empty square for light piece
                        for i in 0..10 {
                            if self.board[i].piece.is_none() {
                                self.board[i].piece = Some(Player::Light);
                                break;
                            }
                        }
                    }
                    Player::Dark => {
                        // Find first empty square for dark piece
                        for i in 5..15 {
                            if self.board[i].piece.is_none() {
                                self.board[i].piece = Some(Player::Dark);
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // Place piece at destination (preserve square type)
        let dest_type = self.board[to].square_type;
        self.board[to] = Square {
            piece: Some(piece),
            square_type: dest_type,
        };
        
        self.dice_value = 0;
        self.check_win_condition();
        if !self.game_over {
            self.switch_player();
        }
        
        true
    }
    
    pub fn pass_turn(&mut self) {
        // Pass turn when no valid moves available
        if self.dice_value != 0 {
            self.dice_value = 0;
            self.switch_player();
        }
    }
    
    fn switch_player(&mut self) {
        self.current_player = match self.current_player {
            Player::Light => Player::Dark,
            Player::Dark => Player::Light,
        };
    }
    
    fn check_win_condition(&mut self) {
        // Check if all pieces are off the board
        let light_count = self.board.iter()
            .filter(|s| s.piece == Some(Player::Light))
            .count();
        let dark_count = self.board.iter()
            .filter(|s| s.piece == Some(Player::Dark))
            .count();
        
        if light_count == 0 {
            self.game_over = true;
            self.winner = Some(Player::Light);
        } else if dark_count == 0 {
            self.game_over = true;
            self.winner = Some(Player::Dark);
        }
    }
    
    pub fn reset(&mut self) {
        *self = GameState::new();
    }
}

#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
}

