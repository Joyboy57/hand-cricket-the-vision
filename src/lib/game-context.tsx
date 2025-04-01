
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Game state types
export type GameState = 'toss' | 'batting' | 'bowling' | 'gameOver';

// Type for game context
type GameContextType = {
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
  startGame: (battingFirst: boolean) => void;
  resetGame: () => void;
  makeChoice: (userMove: number) => void;
  chooseToss: (choice: 'heads' | 'tails') => void;
  chooseBatOrBowl: (choice: 'bat' | 'bowl') => void;
};

// Initial state for game context
const initialState = {
  gameState: 'toss' as GameState,
  playerScore: 0,
  aiScore: 0,
  innings: 1,
  target: null,
  playerChoice: null,
  aiChoice: null,
  userBatting: false,
  isOut: false,
  tossResult: null,
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('toss');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState<number | null>(null);
  const [userBatting, setUserBatting] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<number | null>(null);
  const [aiChoice, setAiChoice] = useState<number | null>(null);
  const [isOut, setIsOut] = useState(false);
  const [tossResult, setTossResult] = useState<string | null>(null);

  // Reset game state
  const resetGame = () => {
    setGameState('toss');
    setPlayerScore(0);
    setAiScore(0);
    setInnings(1);
    setTarget(null);
    setUserBatting(false);
    setPlayerChoice(null);
    setAiChoice(null);
    setIsOut(false);
    setTossResult(null);
  };

  // Generate AI move (1-6)
  const generateAiMove = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  // Handle user move
  const makeChoice = (userMove: number) => {
    if (userMove < 1 || userMove > 6) {
      throw new Error('Invalid move: Must be between 1 and 6');
    }

    const aiMove = generateAiMove();
    setPlayerChoice(userMove);
    setAiChoice(aiMove);

    // Check if out
    if (userMove === aiMove) {
      setIsOut(true);
      
      if (userBatting) {
        // User was batting and got out
        if (target === null) {
          // First innings, set target for AI
          setTarget(playerScore + 1);
          setUserBatting(false);
          setIsOut(false);
          setGameState('bowling');
          setInnings(2);
          
          // Small delay to let the OUT! message be seen
          setTimeout(() => {
            setPlayerChoice(null);
            setAiChoice(null);
          }, 1500);
        } else {
          // Second innings, game over
          setGameState('gameOver');
        }
      } else {
        // AI was batting and got out
        if (target === null) {
          // First innings, set target for user
          setTarget(aiScore + 1);
          setUserBatting(true);
          setIsOut(false);
          setGameState('batting');
          setInnings(2);
          
          // Small delay to let the OUT! message be seen
          setTimeout(() => {
            setPlayerChoice(null);
            setAiChoice(null);
          }, 1500);
        } else {
          // Second innings, game over
          setGameState('gameOver');
        }
      }
      return;
    }

    // Not out, update scores
    if (userBatting) {
      const newScore = playerScore + userMove;
      setPlayerScore(newScore);
      
      // Check if target achieved in second innings
      if (target !== null && newScore >= target) {
        setGameState('gameOver');
      } else {
        // Reset choices after a short delay
        setTimeout(() => {
          setPlayerChoice(null);
          setAiChoice(null);
          setIsOut(false);
        }, 1000);
      }
    } else {
      const newScore = aiScore + aiMove;
      setAiScore(newScore);
      
      // Check if target achieved in second innings
      if (target !== null && newScore >= target) {
        setGameState('gameOver');
      } else {
        // Reset choices after a short delay
        setTimeout(() => {
          setPlayerChoice(null);
          setAiChoice(null);
          setIsOut(false);
        }, 1000);
      }
    }
  };

  // Start game after toss
  const startGame = (battingFirst: boolean) => {
    setUserBatting(battingFirst);
    setGameState(battingFirst ? 'batting' : 'bowling');
    
    // Clear any previous choices when starting a new game
    setPlayerChoice(null);
    setAiChoice(null);
    setIsOut(false);
  };

  // Handle toss choice
  const chooseToss = (choice: 'heads' | 'tails') => {
    const tossOutcome = Math.random() > 0.5 ? 'heads' : 'tails';
    const userWonToss = choice === tossOutcome;
    
    setTossResult(userWonToss ? 'You won the toss!' : 'AI won the toss!');
    
    if (!userWonToss) {
      // AI chooses to bat or bowl
      const aiChoice = Math.random() > 0.5;
      setUserBatting(!aiChoice);
      // We don't set gameState here, this is handled by the UI
    }
    
    // If user won, they need to choose bat or bowl
    // This will be handled by chooseBatOrBowl
  };

  // Handle bat or bowl choice after winning toss
  const chooseBatOrBowl = (choice: 'bat' | 'bowl') => {
    setUserBatting(choice === 'bat');
    setGameState(choice === 'bat' ? 'batting' : 'bowling');
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        playerScore,
        aiScore,
        innings,
        target,
        playerChoice,
        aiChoice,
        userBatting,
        isOut,
        tossResult,
        startGame,
        resetGame,
        makeChoice,
        chooseToss,
        chooseBatOrBowl,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
