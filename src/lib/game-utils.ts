
// Basic utility functions for the game logic

/**
 * Generate a random AI move (1-6)
 */
export const generateAiMove = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

/**
 * Generate a smarter AI move based on game state
 */
export const generateSmartAiMove = (
  playerScore: number,
  aiScore: number,
  innings: number,
  target: number | null,
  playerBatting: boolean,
  ballsPlayed: number,
  playerLastMove?: number
): number => {
  // If it's the second innings and AI is trying to defend a total
  if (innings === 2 && !playerBatting) {
    // Try to get the player out by matching their last move with higher probability
    if (playerLastMove && Math.random() < 0.4) {
      return playerLastMove;
    }
  }
  
  // If it's the second innings and AI needs just a few runs to win
  if (innings === 2 && !playerBatting && target !== null) {
    const runsNeeded = target - aiScore;
    if (runsNeeded > 0 && runsNeeded <= 6) {
      // Try to score exactly what we need
      return runsNeeded;
    }
  }
  
  // Default to random move with some weighted probabilities
  const weights = [0.2, 0.15, 0.15, 0.15, 0.15, 0.2]; // Higher weights for 1 and 6
  const randomValue = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (randomValue < cumulativeWeight) {
      return i + 1;
    }
  }
  
  return 1; // Fallback
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

/**
 * Format the current score as a string
 */
export const formatScore = (runs: number, wickets: number = 0): string => {
  return `${runs}${wickets > 0 ? `/${wickets}` : ''}`;
};

/**
 * Calculate strike rate (runs per ball)
 */
export const calculateStrikeRate = (runs: number, balls: number): number => {
  if (balls === 0) return 0;
  return Math.round((runs / balls) * 100);
};

/**
 * Calculate required run rate
 */
export const calculateRequiredRunRate = (target: number | null, currentScore: number, ballsRemaining: number): number => {
  if (!target || ballsRemaining === 0) return 0;
  const runsRequired = target - currentScore;
  return runsRequired <= 0 ? 0 : parseFloat((runsRequired / (ballsRemaining / 6)).toFixed(2));
};

/**
 * Calculate match prediction percentage
 */
export const calculateMatchPrediction = (
  playerScore: number,
  aiScore: number,
  innings: number,
  target: number | null,
  userBatting: boolean,
  ballsPlayed: number
): { playerWinChance: number, aiWinChance: number } => {
  // Default even chances
  let playerWinChance = 50;
  let aiWinChance = 50;
  
  // First innings - simple calculations
  if (innings === 1) {
    if (userBatting) {
      // If player is batting well in first innings
      playerWinChance = 50 + Math.min(30, playerScore / 3);
    } else {
      // If AI is batting well in first innings
      aiWinChance = 50 + Math.min(30, aiScore / 3);
    }
  } 
  // Second innings - more complex
  else if (target !== null) {
    const maxBalls = 30; // Assume max 30 balls per innings
    const ballsRemaining = Math.max(0, maxBalls - ballsPlayed);
    
    if (userBatting) {
      // Player is chasing
      const runsNeeded = target - playerScore;
      if (runsNeeded <= 0) {
        // Player has won
        playerWinChance = 100;
        aiWinChance = 0;
      } else {
        // Calculate based on required rate
        const reqRate = calculateRequiredRunRate(target, playerScore, ballsRemaining);
        if (reqRate > 6) {
          // Difficult chase
          playerWinChance = Math.max(10, 100 - (reqRate * 10));
        } else {
          // Manageable chase
          playerWinChance = Math.min(90, 100 - (reqRate * 5));
        }
        aiWinChance = 100 - playerWinChance;
      }
    } else {
      // AI is chasing
      const runsNeeded = target - aiScore;
      if (runsNeeded <= 0) {
        // AI has won
        playerWinChance = 0;
        aiWinChance = 100;
      } else {
        // Calculate based on required rate
        const reqRate = calculateRequiredRunRate(target, aiScore, ballsRemaining);
        if (reqRate > 6) {
          // Difficult chase for AI
          aiWinChance = Math.max(10, 100 - (reqRate * 10));
        } else {
          // Manageable chase for AI
          aiWinChance = Math.min(90, 100 - (reqRate * 5));
        }
        playerWinChance = 100 - aiWinChance;
      }
    }
  }
  
  return { playerWinChance, aiWinChance };
};
