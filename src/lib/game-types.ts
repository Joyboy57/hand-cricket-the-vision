
// Game state types
export type GameState = 'toss' | 'batting' | 'bowling' | 'gameOver';

// Type for game context
export interface GameContextType {
  gameState: GameState;
  playerScore: number;
  aiScore: number;
  innings: number;
  target: number | null;
  playerChoice: number | null;
  aiChoice: number | null;
  userBatting: boolean;
  isOut: boolean;
  tossResult: string | null;
  ballsPlayed: number;
  startGame: (battingFirst: boolean) => void;
  resetGame: () => void;
  makeChoice: (userMove: number, aiMoveOverride?: number) => void;
  chooseToss: (choice: 'heads' | 'tails') => void;
  chooseBatOrBowl: (choice: 'bat' | 'bowl') => void;
}

// Initial state interface
export interface GameState {
  gameState: GameState;
  playerScore: number;
  aiScore: number;
  innings: number;
  target: number | null;
  playerChoice: number | null;
  aiChoice: number | null;
  userBatting: boolean;
  isOut: boolean;
  tossResult: string | null;
  ballsPlayed: number;
}

export interface InningsState {
  playerScore: number;
  aiScore: number;
  userBatting: boolean;
  target: number | null;
}
