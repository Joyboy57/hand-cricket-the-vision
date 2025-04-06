
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
  const { userBatting, playerScore, aiScore, target, innings } = state;
  
  if (userBatting) {
    handleBattingPlayerOut(
      playerScore,
      target,
      innings,
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
      innings,
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
  currentInnings: number,
  setGameState: (state: GameStateType) => void,
  setTarget: (target: number | null) => void,
  setUserBatting: (batting: boolean) => void,
  setIsOut: (isOut: boolean) => void,
  setInnings: (innings: number) => void,
  setBallsPlayed: (balls: number) => void,
  resetChoices: () => void
): void => {
  // Only transition to second innings if we're still in the first innings
  if (target === null && currentInnings === 1) {
    // First innings, set target for AI
    setTarget(playerScore + 1);
    setUserBatting(false);
    setIsOut(false);
    setGameState('bowling');
    setInnings(2); // This will trigger inningsEnd screen
    setBallsPlayed(0); // Reset balls played for second innings
    console.log("First innings complete. Setting target:", playerScore + 1);
    
    // Increased delay to let the OUT! message be seen longer
    setTimeout(() => {
      resetChoices();
    }, 1000); // Reduced delay to prevent multiple UI states
  } else {
    // Second innings, game over
    console.log("Game over - player out in second innings");
    setGameState('gameOver');
  }
};

// Handle bowling player out
const handleBowlingPlayerOut = (
  aiScore: number,
  target: number | null,
  currentInnings: number,
  setGameState: (state: GameStateType) => void,
  setTarget: (target: number | null) => void,
  setUserBatting: (batting: boolean) => void,
  setIsOut: (isOut: boolean) => void,
  setInnings: (innings: number) => void,
  setBallsPlayed: (balls: number) => void,
  resetChoices: () => void
): void => {
  // Only transition to second innings if we're still in the first innings
  if (target === null && currentInnings === 1) {
    // First innings, set target for user
    setTarget(aiScore + 1);
    setUserBatting(true);
    setIsOut(false);
    setGameState('batting');
    setInnings(2); // This will trigger inningsEnd screen
    setBallsPlayed(0); // Reset balls played for second innings
    console.log("First innings complete. Setting target:", aiScore + 1);
    
    // Increased delay to let the OUT! message be seen longer
    setTimeout(() => {
      resetChoices();
    }, 1000); // Reduced delay to prevent multiple UI states
  } else {
    // Second innings, game over
    console.log("Game over - AI out in second innings");
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
      console.log("Game over - player achieved target");
      setGameState('gameOver');
    } else {
      // Increased delay before resetting choices to make them visible longer
      setTimeout(() => {
        resetChoices();
      }, 2000); // Reduced from 4000ms to 2000ms to improve game flow
    }
  } else {
    const newScore = aiScore + aiChoice;
    setAiScore(newScore);
    
    // Check if target achieved in second innings
    if (isGameOver(innings, newScore, target)) {
      console.log("Game over - AI achieved target");
      setGameState('gameOver');
    } else {
      // Increased delay before resetting choices to make them visible longer
      setTimeout(() => {
        resetChoices();
      }, 2000); // Reduced from 4000ms to 2000ms to improve game flow
    }
  }
};
