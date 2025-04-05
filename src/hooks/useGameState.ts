
import { useState } from 'react';

export const useGameState = () => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showHandDetector, setShowHandDetector] = useState(false);
  const [wonToss, setWonToss] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [showInningsEnd, setShowInningsEnd] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  
  const resetGameState = () => {
    setCountdown(null);
    setShowHandDetector(false);
    setWonToss(false);
    setIsPaused(false);
    setAiThinking(false);
    setShowInningsEnd(false);
    setShowGameOver(false);
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
    setCountdown,
    setShowHandDetector,
    setWonToss,
    setIsPaused,
    setSoundEnabled,
    setAiThinking,
    setShowInningsEnd,
    setShowGameOver,
    resetGameState
  };
};
