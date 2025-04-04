
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { GameContextType, GameStateType, GameState, PlayerStatistics } from '../game-types';
import { handleGameActions } from './game-actions';
import { INITIAL_STATISTICS, loadStatistics, saveStatistics } from './statistics';

// Initial state for game context
const initialState: GameState = {
  gameState: 'toss',
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
  statistics: INITIAL_STATISTICS
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
  const [statistics, setStatistics] = useState<PlayerStatistics>(INITIAL_STATISTICS);
  const [cameraKey, setCameraKey] = useState(0); // For camera refresh

  // Load statistics on initial load
  useEffect(() => {
    const savedStats = loadStatistics();
    if (savedStats) {
      setStatistics(savedStats);
    }
  }, []);

  // Save statistics when game ends
  useEffect(() => {
    if (gameState === 'gameOver') {
      const updatedStats = {
        ...statistics,
        gamesPlayed: statistics.gamesPlayed + 1,
        gamesWon: playerScore > aiScore ? statistics.gamesWon + 1 : statistics.gamesWon,
        highestScore: Math.max(statistics.highestScore, playerScore),
        totalRuns: statistics.totalRuns + playerScore
      };
      
      // Calculate strike rate
      if (ballsPlayed > 0) {
        updatedStats.strikeRate = Math.round((playerScore / ballsPlayed) * 100);
      }
      
      // Check if this is a new best figure
      if (playerScore > statistics.bestFigures.runs) {
        updatedStats.bestFigures = {
          runs: playerScore,
          innings
        };
      }
      
      setStatistics(updatedStats);
      saveStatistics(updatedStats);
    }
  }, [gameState]);

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

  // Refresh camera by updating key
  const refreshCamera = useCallback(() => {
    setCameraKey(prev => prev + 1);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        refreshCamera();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshCamera]);

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

    const currentState: GameState = {
      gameState,
      playerScore,
      aiScore,
      innings,
      target,
      playerChoice: userMove,
      aiChoice: aiMove,
      userBatting,
      isOut: userMove === aiMove,
      tossResult,
      ballsPlayed: ballsPlayed + 1,
      statistics
    };
    
    handleGameActions(
      currentState,
      setGameState,
      setPlayerScore,
      setAiScore,
      setTarget,
      setUserBatting,
      setIsOut,
      setInnings,
      setBallsPlayed,
      resetChoices
    );
  };

  // Start game after toss
  const startGame = (battingFirst: boolean) => {
    setUserBatting(battingFirst);
    setGameState(battingFirst ? 'batting' : 'bowling');
    setBallsPlayed(0);
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
        statistics,
        startGame,
        resetGame,
        makeChoice,
        chooseToss,
        chooseBatOrBowl,
        refreshCamera
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
