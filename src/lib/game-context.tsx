
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Enum for game state
export enum GameState {
  TOSS = 'toss',
  BATTING = 'batting',
  BOWLING = 'bowling',
  GAME_OVER = 'game_over'
}

// Type for game context
type GameContextType = {
  gameState: GameState;
  userScore: number;
  aiScore: number;
  target: number | null;
  userBatting: boolean;
  lastUserMove: number | null;
  lastAiMove: number | null;
  isOut: boolean;
  tossResult: string | null;
  setGameState: (state: GameState) => void;
  resetGame: () => void;
  makeMove: (userMove: number) => void;
  chooseToss: (choice: 'heads' | 'tails') => void;
  chooseBatOrBowl: (choice: 'bat' | 'bowl') => void;
};

// Initial state for game context
const initialState = {
  gameState: GameState.TOSS,
  userScore: 0,
  aiScore: 0,
  target: null,
  userBatting: false,
  lastUserMove: null,
  lastAiMove: null,
  isOut: false,
  tossResult: null,
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.TOSS);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [userBatting, setUserBatting] = useState(false);
  const [lastUserMove, setLastUserMove] = useState<number | null>(null);
  const [lastAiMove, setLastAiMove] = useState<number | null>(null);
  const [isOut, setIsOut] = useState(false);
  const [tossResult, setTossResult] = useState<string | null>(null);

  // Reset game state
  const resetGame = () => {
    setGameState(GameState.TOSS);
    setUserScore(0);
    setAiScore(0);
    setTarget(null);
    setUserBatting(false);
    setLastUserMove(null);
    setLastAiMove(null);
    setIsOut(false);
    setTossResult(null);
  };

  // Generate AI move (1-6)
  const generateAiMove = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  // Handle user move
  const makeMove = (userMove: number) => {
    if (userMove < 1 || userMove > 6) {
      throw new Error('Invalid move: Must be between 1 and 6');
    }

    const aiMove = generateAiMove();
    setLastUserMove(userMove);
    setLastAiMove(aiMove);

    // Check if out
    if (userMove === aiMove) {
      setIsOut(true);
      
      if (userBatting) {
        // User was batting and got out
        if (target === null) {
          // First innings, set target for AI
          setTarget(userScore + 1);
          setUserBatting(false);
          setIsOut(false);
          setGameState(GameState.BOWLING);
        } else {
          // Second innings, game over
          setGameState(GameState.GAME_OVER);
        }
      } else {
        // AI was batting and got out
        if (target === null) {
          // First innings, set target for user
          setTarget(aiScore + 1);
          setUserBatting(true);
          setIsOut(false);
          setGameState(GameState.BATTING);
        } else {
          // Second innings, game over
          setGameState(GameState.GAME_OVER);
        }
      }
      return;
    }

    // Not out, update scores
    if (userBatting) {
      setUserScore(prev => prev + userMove);
      
      // Check if target achieved in second innings
      if (target !== null && userScore + userMove >= target) {
        setUserScore(prev => prev + userMove);
        setGameState(GameState.GAME_OVER);
      }
    } else {
      setAiScore(prev => prev + aiMove);
      
      // Check if target achieved in second innings
      if (target !== null && aiScore + aiMove >= target) {
        setAiScore(prev => prev + aiMove);
        setGameState(GameState.GAME_OVER);
      }
    }
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
      setGameState(aiChoice ? GameState.BOWLING : GameState.BATTING);
    }
    
    // If user won, they need to choose bat or bowl
    // This will be handled by chooseBatOrBowl
  };

  // Handle bat or bowl choice after winning toss
  const chooseBatOrBowl = (choice: 'bat' | 'bowl') => {
    setUserBatting(choice === 'bat');
    setGameState(choice === 'bat' ? GameState.BATTING : GameState.BOWLING);
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        userScore,
        aiScore,
        target,
        userBatting,
        lastUserMove,
        lastAiMove,
        isOut,
        tossResult,
        setGameState,
        resetGame,
        makeMove,
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
