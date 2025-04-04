
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { isPlayerOut, isGameOver } from './game-utils';
import { GameContextType, GameState as GameStateType } from './game-types';
import { handlePlayerOut, updateScores } from './game-innings';

// Initial state for game context
const initialState = {
  gameState: 'toss' as GameStateType,
  playerScore: 0,
  aiScore: 0,
  innings: 1,
  target: null,
  playerChoice: null,
  aiChoice: null,
  userBatting: false,
  isOut: false,
  tossResult: null,
  ballsPlayed: 0,
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameStateType>('toss');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [innings, setInnings] = useState(1);
  const [target, setTarget] = useState<number | null>(null);
  const [userBatting, setUserBatting] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<number | null>(null);
  const [aiChoice, setAiChoice] = useState<number | null>(null);
  const [isOut, setIsOut] = useState(false);
  const [tossResult, setTossResult] = useState<string | null>(null);
  const [ballsPlayed, setBallsPlayed] = useState(0);

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
    setBallsPlayed(0);
  };
  
  // Reset choices without resetting the game
  const resetChoices = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setIsOut(false);
  };

  // Handle user move with optional AI move override
  const makeChoice = (userMove: number, aiMoveOverride?: number) => {
    if (userMove < 1 || userMove > 6) {
      throw new Error('Invalid move: Must be between 1 and 6');
    }

    const aiMove = aiMoveOverride !== undefined ? aiMoveOverride : Math.floor(Math.random() * 6) + 1;
    setPlayerChoice(userMove);
    setAiChoice(aiMove);
    
    // Increment balls played
    setBallsPlayed(prev => prev + 1);

    // Check if out
    if (isPlayerOut(userMove, aiMove)) {
      setIsOut(true);
      
      // Get current state
      const currentState = {
        gameState,
        playerScore,
        aiScore,
        innings,
        target,
        playerChoice: userMove,
        aiChoice: aiMove,
        userBatting,
        isOut: true,
        tossResult,
        ballsPlayed: ballsPlayed + 1,
      };
      
      // Handle player out using the extracted logic
      handlePlayerOut(
        currentState,
        setGameState,
        setTarget,
        setUserBatting,
        setIsOut,
        setInnings,
        setBallsPlayed,
        resetChoices
      );
      return;
    }

    // Not out, update scores
    const currentState = {
      gameState,
      playerScore,
      aiScore,
      innings,
      target,
      playerChoice: userMove,
      aiChoice: aiMove,
      userBatting,
      isOut,
      tossResult,
      ballsPlayed: ballsPlayed + 1,
    };
    
    updateScores(
      currentState,
      setPlayerScore,
      setAiScore,
      setGameState,
      resetChoices,
      isGameOver
    );
  };

  // Start game after toss
  const startGame = (battingFirst: boolean) => {
    setUserBatting(battingFirst);
    setGameState(battingFirst ? 'batting' : 'bowling');
    setBallsPlayed(0); // Reset balls played at the start of the game
    
    // Clear any previous choices when starting a new game
    resetChoices();
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
        ballsPlayed,
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
