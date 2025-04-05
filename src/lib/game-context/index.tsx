
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { GameContextType, GameStateType, GameState, PlayerStatistics } from '../game-types';
import { handleGameActions } from './game-actions';
import { INITIAL_STATISTICS, loadStatistics, saveStatistics } from './statistics';
import { useGameControls } from './hooks/useGameControls';

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
  
  // Game controls hook
  const { 
    resetGame, 
    resetChoices, 
    makeChoice, 
    startGame, 
    chooseToss, 
    chooseBatOrBowl 
  } = useGameControls({
    setGameState,
    setPlayerScore,
    setAiScore,
    setInnings,
    setTarget,
    setUserBatting,
    setPlayerChoice,
    setAiChoice,
    setIsOut,
    setTossResult,
    setBallsPlayed,
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
    statistics
  });

  // Handle declaration of innings
  const declareInnings = useCallback(() => {
    if (innings === 1 && userBatting) {
      console.log("Declaring innings", {innings, playerScore});
      
      // Set target for AI (current score + 1)
      setTarget(playerScore + 1);
      
      // Switch to bowling (player now bowls to AI)
      setUserBatting(false);
      
      // Reset choices and switch to second innings
      setInnings(2);
      resetChoices();
      setBallsPlayed(0);
      setGameState('bowling');
    }
  }, [innings, playerScore, userBatting]);

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
        refreshCamera,
        declareInnings,
        setInnings
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
