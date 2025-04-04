
// Game state types
export type GameStateType = 'toss' | 'batting' | 'bowling' | 'gameOver';

// Type for game context
export interface GameContextType {
  gameState: GameStateType;
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
  statistics: PlayerStatistics;
  startGame: (battingFirst: boolean) => void;
  resetGame: () => void;
  makeChoice: (userMove: number, aiMoveOverride?: number) => void;
  chooseToss: (choice: 'heads' | 'tails') => void;
  chooseBatOrBowl: (choice: 'bat' | 'bowl') => void;
  refreshCamera: () => void;
}

// Initial state interface
export interface GameState {
  gameState: GameStateType;
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
  statistics: PlayerStatistics;
}

export interface InningsState {
  playerScore: number;
  aiScore: number;
  userBatting: boolean;
  target: number | null;
}

export interface PlayerStatistics {
  gamesPlayed: number;
  gamesWon: number;
  highestScore: number;
  totalRuns: number;
  strikeRate: number;
  bestFigures: {
    runs: number;
    innings: number;
  };
}
