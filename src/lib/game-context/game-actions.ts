
import { GameState, GameStateType } from '../game-types';
import { isGameOver } from '../game-utils';

// Handle all game actions
export const handleGameActions = (
  state: GameState,
  setGameState: (state: GameStateType) => void,
  setPlayerScore: (score: number) => void,
  setAiScore: (score: number) => void,
  setTarget: (target: number | null) => void,
  setUserBatting: (batting: boolean) => void,
  setIsOut: (isOut: boolean) => void,
  setInnings: (innings: number) => void,
  setBallsPlayed: (balls: number) => void,
  resetChoices: () => void
): void => {
  const { userBatting, playerChoice, aiChoice, isOut } = state;
  
  // Handle out case
  if (isOut) {
    handlePlayerOut(state, setGameState, setTarget, setUserBatting, setIsOut, setInnings, setBallsPlayed, resetChoices);
    return;
  }
  
  // Not out, update scores
  updateScores(state, setPlayerScore, setAiScore, setGameState, resetChoices);
};

// Handle player out scenario
export const handlePlayerOut = (
  state: GameState,
  setGameState: (state: GameStateType) => void,
  setTarget: (target: number | null) => void,
  setUserBatting: (batting: boolean) => void,
  setIsOut: (isOut: boolean) => void,
  setInnings: (innings: number) => void,
  setBallsPlayed: (balls: number) => void,
  resetChoices: () => void
): void => {
  const { userBatting, playerScore, aiScore, target } = state;
  
  if (userBatting) {
    handleBattingPlayerOut(
      playerScore,
      target,
      setGameState,
      setTarget,
      setUserBatting,
      setIsOut,
      setInnings,
      setBallsPlayed,
      resetChoices
    );
  } else {
    handleBowlingPlayerOut(
      aiScore,
      target,
      setGameState,
      setTarget,
      setUserBatting,
      setIsOut,
      setInnings,
      setBallsPlayed,
      resetChoices
    );
  }
};

// Handle batting player out
const handleBattingPlayerOut = (
  playerScore: number,
  target: number | null,
  setGameState: (state: GameStateType) => void,
  setTarget: (target: number | null) => void,
  setUserBatting: (batting: boolean) => void,
  setIsOut: (isOut: boolean) => void,
  setInnings: (innings: number) => void,
  setBallsPlayed: (balls: number) => void,
  resetChoices: () => void
): void => {
  if (target === null) {
    // First innings, set target for AI
    setTarget(playerScore + 1);
    setUserBatting(false);
    setIsOut(false);
    setGameState('bowling');
    setInnings(2);
    setBallsPlayed(0); // Reset balls played for second innings
    
    // Increased delay to let the OUT! message be seen longer
    setTimeout(() => {
      resetChoices();
    }, 3000);
  } else {
    // Second innings, game over
    setGameState('gameOver');
  }
};

// Handle bowling player out
const handleBowlingPlayerOut = (
  aiScore: number,
  target: number | null,
  setGameState: (state: GameStateType) => void,
  setTarget: (target: number | null) => void,
  setUserBatting: (batting: boolean) => void,
  setIsOut: (isOut: boolean) => void,
  setInnings: (innings: number) => void,
  setBallsPlayed: (balls: number) => void,
  resetChoices: () => void
): void => {
  if (target === null) {
    // First innings, set target for user
    setTarget(aiScore + 1);
    setUserBatting(true);
    setIsOut(false);
    setGameState('batting');
    setInnings(2);
    setBallsPlayed(0); // Reset balls played for second innings
    
    // Increased delay to let the OUT! message be seen longer
    setTimeout(() => {
      resetChoices();
    }, 3000);
  } else {
    // Second innings, game over
    setGameState('gameOver');
  }
};

// Update scores based on player and AI choices
export const updateScores = (
  state: GameState,
  setPlayerScore: (score: number) => void,
  setAiScore: (score: number) => void,
  setGameState: (state: GameStateType) => void,
  resetChoices: () => void
): void => {
  const { userBatting, playerScore, aiScore, playerChoice, aiChoice, innings, target } = state;
  
  if (!playerChoice || aiChoice === null) return;
  
  if (userBatting) {
    const newScore = playerScore + playerChoice;
    setPlayerScore(newScore);
    
    // Check if target achieved in second innings
    if (isGameOver(innings, newScore, target)) {
      setGameState('gameOver');
    } else {
      // Increased delay before resetting choices to make them visible longer
      setTimeout(() => {
        resetChoices();
      }, 4000); // Increased from 2500ms to 4000ms for better visibility
    }
  } else {
    const newScore = aiScore + aiChoice;
    setAiScore(newScore);
    
    // Check if target achieved in second innings
    if (isGameOver(innings, newScore, target)) {
      setGameState('gameOver');
    } else {
      // Increased delay before resetting choices to make them visible longer
      setTimeout(() => {
        resetChoices();
      }, 4000); // Increased from 2500ms to 4000ms for better visibility
    }
  }
};
