
// Basic utility functions for the game logic

/**
 * Generate a random AI move (1-6)
 */
export const generateAiMove = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

/**
 * Check if a player is out (when player and AI choose the same number)
 */
export const isPlayerOut = (playerChoice: number, aiChoice: number): boolean => {
  return playerChoice === aiChoice;
};

/**
 * Determine if game is over based on scores and target
 */
export const isGameOver = (
  innings: number,
  battingTeamScore: number,
  target: number | null
): boolean => {
  // Game is over if:
  // 1. Second innings and batting team exceeds target
  // 2. Second innings and batting team gets all out
  return innings === 2 && target !== null && battingTeamScore >= target;
};

/**
 * Compute result message based on scores
 */
export const getResultMessage = (playerScore: number, aiScore: number): string => {
  if (playerScore > aiScore) {
    return `Congratulations! You won by ${playerScore - aiScore} runs.`;
  } else if (playerScore === aiScore) {
    return "What a match! It ended in a tie.";
  } else {
    return `Better luck next time. AI won by ${aiScore - playerScore} runs.`;
  }
};

/**
 * Get random toss result
 */
export const getTossResult = (): 'heads' | 'tails' => {
  return Math.random() > 0.5 ? 'heads' : 'tails';
};
