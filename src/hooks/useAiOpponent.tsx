import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Key for Xyris AI API
const XYRIS_API_KEY = 'xyris-ge4bj1-e940a3818a2649f0853c2f53751a6bd274a2459e654e28e5';

interface AiOpponentState {
  isLoading: boolean;
  error: string | null;
}

interface AiMoveHistory {
  playerMoves: number[];
  aiMoves: number[];
}

export const useAiOpponent = () => {
  const [state, setState] = useState<AiOpponentState>({
    isLoading: false,
    error: null,
  });
  const [moveHistory, setMoveHistory] = useState<AiMoveHistory>({
    playerMoves: [],
    aiMoves: []
  });

  // Function to get AI move using the Xyris AI API
  const getAiMove = useCallback(async (
    playerChoice: number,
    userBatting: boolean,
    ballsPlayed: number,
    playerScore: number,
    aiScore: number,
    innings: number
  ): Promise<number> => {
    // Update move history
    setMoveHistory(prev => ({
      playerMoves: [...prev.playerMoves, playerChoice],
      aiMoves: [...prev.aiMoves]
    }));

    // Start loading
    setState({ isLoading: true, error: null });

    try {
      // Try to use the Xyris AI API
      const aiMoveFromApi = await fetchAiMoveFromApi(
        playerChoice,
        userBatting,
        ballsPlayed,
        playerScore,
        aiScore,
        innings,
        moveHistory
      );

      // Update AI move history
      setMoveHistory(prev => ({
        playerMoves: prev.playerMoves,
        aiMoves: [...prev.aiMoves, aiMoveFromApi]
      }));

      setState({ isLoading: false, error: null });
      return aiMoveFromApi;
    } catch (error) {
      console.error("Error getting AI move from API:", error);
      
      // Fallback to rule-based AI if API fails
      setState({ isLoading: false, error: error instanceof Error ? error.message : "Unknown error" });
      
      const ruleMove = await getRuleBasedAiMove(
        playerChoice,
        userBatting,
        ballsPlayed,
        playerScore,
        aiScore,
        innings,
        moveHistory
      );

      // Update AI move history
      setMoveHistory(prev => ({
        playerMoves: prev.playerMoves,
        aiMoves: [...prev.aiMoves, ruleMove]
      }));

      return ruleMove;
    }
  }, [moveHistory]);

  // Function to fetch AI move from the Xyris API
  const fetchAiMoveFromApi = async (
    playerChoice: number,
    userBatting: boolean,
    ballsPlayed: number,
    playerScore: number,
    aiScore: number,
    innings: number,
    history: AiMoveHistory
  ): Promise<number> => {
    try {
      // Prepare the game state context for the AI
      const gameContext = {
        playerChoice,
        userBatting,
        ballsPlayed,
        playerScore,
        aiScore,
        innings,
        gameType: "hand-cricket",
        moveHistory: history
      };

      // Make the API request
      const response = await fetch('https://api.xyris.ai/v1/cricket-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XYRIS_API_KEY}`
        },
        body: JSON.stringify(gameContext)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Ensure the AI move is valid (between 1 and 6)
      const aiMove = Math.min(Math.max(Math.round(data.move), 1), 6);
      
      console.log(`AI API suggested move: ${aiMove}`);
      return aiMove;
    } catch (error) {
      console.error("Error calling Xyris AI API:", error);
      
      // Let the calling function handle the fallback
      throw error;
    }
  };

  // Improved rule-based AI logic
  const getRuleBasedAiMove = async (
    playerChoice: number,
    userBatting: boolean,
    ballsPlayed: number,
    playerScore: number,
    aiScore: number,
    innings: number,
    history: AiMoveHistory
  ): Promise<number> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("Using improved rule-based AI fallback");
    
    // Show toast message about using fallback AI
    toast({
      title: "Using AI fallback",
      description: "The advanced AI is not available. Using built-in AI instead.",
      variant: "default",
      duration: 3000
    });
    
    // Calculate the target for second innings
    const target = innings === 2 ? (userBatting ? aiScore + 1 : playerScore + 1) : null;
    
    // Analyze player's move history to find patterns
    const patternAnalysis = analyzePlayerPatterns(history.playerMoves);
    
    // Second innings strategy
    if (innings === 2) {
      // If AI is batting and needs to chase player's score
      if (!userBatting) {
        // If we need just a few runs
        if (target && (target - aiScore) <= 6) {
          // Try to score exactly what we need, or try to avoid getting out
          return target - aiScore;
        }
        
        // If we need a lot of runs, be more aggressive
        if (target && (target - aiScore) > 12) {
          // Try to score high runs (4, 5, 6) more often
          if (Math.random() < 0.6) {
            return [4, 5, 6][Math.floor(Math.random() * 3)];
          }
        }
      }
      // If player is batting and AI is bowling
      else if (userBatting) {
        // If player is close to winning, try to get them out
        if (target && (target - playerScore) <= 12) {
          // If we have a predicted move from pattern analysis, use it with high probability
          if (patternAnalysis.predictedNextMove && Math.random() < 0.6) {
            return patternAnalysis.predictedNextMove;
          }
          
          // Otherwise, try to match their last move with increased probability
          if (Math.random() < 0.4) {
            return playerChoice;
          }
        }
      }
    }
    
    // First innings strategy
    else {
      // If AI is batting, play more conservatively to build a score
      if (!userBatting) {
        // Avoid matching player's last move to prevent getting out
        if (patternAnalysis.mostCommonMove && Math.random() < 0.4) {
          // Avoid the most common move
          let aiMove;
          do {
            aiMove = Math.floor(Math.random() * 6) + 1;
          } while (aiMove === patternAnalysis.mostCommonMove);
          return aiMove;
        }
      }
      // If AI is bowling, try to get player out early
      else {
        // If we have a predicted move, use it
        if (patternAnalysis.predictedNextMove && Math.random() < 0.5) {
          return patternAnalysis.predictedNextMove;
        }
      }
    }
    
    // Basic intelligence with weighted choices
    let aiMove = Math.floor(Math.random() * 6) + 1;
    
    // Avoid obvious choices
    if (playerChoice === aiMove && Math.random() < 0.7) {
      // Pick something else
      aiMove = ((aiMove + Math.floor(Math.random() * 3) + 1) % 6) + 1;
    }
    
    // More varied distribution based on game situation
    if (userBatting && Math.random() < 0.3) {
      // When player is batting, favor choices that might get them out
      if (history.playerMoves.length >= 2) {
        // Look at their recent choices and try to match one
        const recentMoves = history.playerMoves.slice(-3);
        aiMove = recentMoves[Math.floor(Math.random() * recentMoves.length)];
      }
    } else if (!userBatting && Math.random() < 0.3) {
      // When AI is batting, favor high scoring choices
      aiMove = [4, 5, 6][Math.floor(Math.random() * 3)];
    }
    
    console.log(`Improved rule-based AI move: ${aiMove}`);
    return aiMove;
  };

  // Analyze player patterns to predict their next move
  const analyzePlayerPatterns = (playerMoves: number[]): { 
    mostCommonMove: number | null;
    predictedNextMove: number | null;
  } => {
    // Need at least 3 moves to analyze patterns
    if (playerMoves.length < 3) {
      return { mostCommonMove: null, predictedNextMove: null };
    }
    
    // Find most common move
    const moveCounts: {[key: number]: number} = {};
    playerMoves.forEach(move => {
      moveCounts[move] = (moveCounts[move] || 0) + 1;
    });
    
    let mostCommonMove = null;
    let maxCount = 0;
    
    Object.entries(moveCounts).forEach(([move, count]) => {
      if (count > maxCount) {
        mostCommonMove = parseInt(move);
        maxCount = count;
      }
    });
    
    // Try to predict next move based on patterns
    let predictedNextMove = null;
    
    // Look for simple patterns like repetition
    const lastMove = playerMoves[playerMoves.length - 1];
    const secondLastMove = playerMoves[playerMoves.length - 2];
    
    // Check if player repeats moves
    if (lastMove === secondLastMove) {
      // They might repeat again
      predictedNextMove = lastMove;
    } 
    // Check for alternating pattern (e.g., 1,2,1,2)
    else if (playerMoves.length >= 4) {
      const thirdLastMove = playerMoves[playerMoves.length - 3];
      const fourthLastMove = playerMoves[playerMoves.length - 4];
      
      if (lastMove === thirdLastMove && secondLastMove === fourthLastMove) {
        // Alternating pattern detected
        predictedNextMove = secondLastMove;
      }
    }
    
    // If no pattern detected, predict the most common move
    if (!predictedNextMove && mostCommonMove) {
      predictedNextMove = mostCommonMove;
    }
    
    return { 
      mostCommonMove, 
      predictedNextMove 
    };
  };

  const resetHistory = () => {
    setMoveHistory({
      playerMoves: [],
      aiMoves: []
    });
  };

  return {
    getAiMove,
    resetHistory,
    isLoading: state.isLoading,
    error: state.error,
  };
};
