
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Key for Xyris AI API
const XYRIS_API_KEY = 'xyris-ge4bj1-e940a3818a2649f0853c2f53751a6bd274a2459e654e28e5';

interface AiOpponentState {
  isLoading: boolean;
  error: string | null;
}

export const useAiOpponent = () => {
  const [state, setState] = useState<AiOpponentState>({
    isLoading: false,
    error: null,
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
        innings
      );

      setState({ isLoading: false, error: null });
      return aiMoveFromApi;
    } catch (error) {
      console.error("Error getting AI move from API:", error);
      
      // Fallback to rule-based AI if API fails
      setState({ isLoading: false, error: error instanceof Error ? error.message : "Unknown error" });
      
      const ruleMovePromise = getRuleBasedAiMove(
        playerChoice,
        userBatting,
        ballsPlayed,
        playerScore,
        aiScore,
        innings
      );
      return ruleMovePromise;
    }
  }, []);

  // Function to fetch AI move from the Xyris API
  const fetchAiMoveFromApi = async (
    playerChoice: number,
    userBatting: boolean,
    ballsPlayed: number,
    playerScore: number,
    aiScore: number,
    innings: number
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
        gameType: "hand-cricket"
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

  // Fallback: Rule-based AI logic
  const getRuleBasedAiMove = async (
    playerChoice: number,
    userBatting: boolean,
    ballsPlayed: number,
    playerScore: number,
    aiScore: number,
    innings: number
  ): Promise<number> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("Using rule-based AI fallback");
    
    // Show toast message about using fallback AI
    toast({
      title: "Using AI fallback",
      description: "The advanced AI is not available. Using built-in AI instead.",
      variant: "default",
      duration: 3000
    });
    
    // Basic strategy patterns
    const target = innings === 2 ? (userBatting ? aiScore + 1 : playerScore + 1) : null;
    
    // If we're in the second innings and chasing
    if (innings === 2) {
      // If AI is batting and needs to chase player's score
      if (!userBatting) {
        // If we need just a few runs
        if (target && (target - aiScore) <= 6) {
          // Try to score exactly what we need, or try to avoid getting out
          return target - aiScore;
        }
      }
      // If player is batting and AI is bowling
      else if (userBatting) {
        // If player is close to winning, try to get them out by matching their patterns
        if (target && (target - playerScore) <= 12) {
          // Increased chance to match player's last move to get them out
          if (Math.random() < 0.4) {
            return playerChoice;
          }
        }
      }
    }

    // Pattern recognition
    if (ballsPlayed > 2) {
      // If player tends to choose the same number repeatedly
      if (playerChoice === 5 || playerChoice === 6) {
        // Try to match their choice to get them out
        if (Math.random() < 0.3) {
          return playerChoice;
        }
      }
    }
    
    // Basic intelligence - adapt to player's history
    let aiMove = Math.floor(Math.random() * 6) + 1;
    
    // Try to avoid obvious choices
    if (playerChoice === aiMove && Math.random() < 0.7) {
      aiMove = ((aiMove + Math.floor(Math.random() * 3) + 1) % 6) + 1;
    }
    
    // Semi-randomized decision with weighted probability
    if (Math.random() < 0.2) {
      // Sometimes pick 1, 3, or 5 (odd numbers)
      aiMove = [1, 3, 5][Math.floor(Math.random() * 3)];
    } else if (Math.random() < 0.2) {
      // Sometimes pick 2, 4, or 6 (even numbers)
      aiMove = [2, 4, 6][Math.floor(Math.random() * 3)];
    }
    
    console.log(`Rule-based AI move: ${aiMove}`);
    return aiMove;
  };

  return {
    getAiMove,
    isLoading: state.isLoading,
    error: state.error,
  };
};
