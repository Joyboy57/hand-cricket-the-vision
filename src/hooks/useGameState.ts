
import { useState, useEffect } from 'react';
import { useGame } from '@/lib/game-context';

export const useGameState = () => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showHandDetector, setShowHandDetector] = useState(false);
  const [wonToss, setWonToss] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [showInningsEnd, setShowInningsEnd] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [inningsTransitionInProgress, setInningsTransitionInProgress] = useState(false);
  
  // Get game context to monitor state changes
  const { gameState, innings } = useGame();
  
  // Reset innings end display when game state changes
  useEffect(() => {
    // If we're now in the second innings and still showing innings end, hide it
    if ((gameState === 'batting' || gameState === 'bowling') && innings === 2 && showInningsEnd) {
      console.log("Auto-hiding innings end screen because we're now in second innings", {gameState, innings});
      setShowInningsEnd(false);
      setInningsTransitionInProgress(false);
    }
  }, [gameState, innings, showInningsEnd]);
  
  const resetGameState = () => {
    setCountdown(null);
    setShowHandDetector(false);
    setWonToss(false);
    setIsPaused(false);
    setAiThinking(false);
    setShowInningsEnd(false);
    setShowGameOver(false);
    setInningsTransitionInProgress(false);
  };
  
  return {
    countdown,
    showHandDetector,
    wonToss,
    isPaused,
    soundEnabled,
    aiThinking,
    showInningsEnd,
    showGameOver,
    inningsTransitionInProgress,
    setCountdown,
    setShowHandDetector,
    setWonToss,
    setIsPaused,
    setSoundEnabled,
    setAiThinking,
    setShowInningsEnd,
    setShowGameOver,
    setInningsTransitionInProgress,
    resetGameState
  };
};
