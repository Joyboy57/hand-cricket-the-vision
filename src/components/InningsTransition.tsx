
import React, { useCallback } from 'react';
import { useGame } from '@/lib/game-context';
import InningsTransitionCard from './InningsTransitionCard';

interface InningsTransitionProps {
  playerScore: number;
  aiScore: number;
  target: number | null;
  onContinue: () => void;
  disabled?: boolean;
}

const InningsTransition: React.FC<InningsTransitionProps> = ({
  playerScore,
  aiScore,
  target,
  onContinue,
  disabled = false
}) => {
  // Get user batting status and ball count from context
  const { userBatting, ballsPlayed } = useGame();

  // Safely handle continue action
  const handleContinueClick = useCallback(() => {
    if (disabled) return;
    
    console.log("InningsTransition: Continue button clicked");
    // Execute transition immediately and prevent further clicks
    onContinue();
  }, [onContinue, disabled]);

  return (
    <div className="w-full max-w-lg">
      <InningsTransitionCard
        playerScore={playerScore}
        aiScore={aiScore}
        target={target}
        ballsPlayed={ballsPlayed}
        onContinue={handleContinueClick}
        disabled={disabled}
      />
    </div>
  );
};

export default InningsTransition;
