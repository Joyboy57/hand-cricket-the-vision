
import React, { useCallback } from 'react';
import { ButtonCta } from '@/components/ui/button-shiny';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { useGame } from '@/lib/game-context';

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
  // Get user batting status from context
  const { userBatting, innings } = useGame();

  // Safely handle continue action
  const handleContinueClick = useCallback(() => {
    if (disabled) return;
    
    console.log("InningsTransition: Continue button clicked");
    // Execute transition immediately and prevent further clicks
    onContinue();
  }, [onContinue, disabled]);

  // Determine which side will be batting/bowling in the next innings
  const nextInningsBattingSide = userBatting ? "AI" : "You";
  const nextInningsBowlingSide = userBatting ? "You" : "AI";

  return (
    <div className="w-full max-w-lg p-6 bg-card/95 backdrop-blur-sm rounded-xl shadow-xl">
      <div className="text-center mb-6">
        <TextShimmerWave
          className="text-2xl font-bold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
          duration={2}
          spread={1.5}
        >
          First Innings Complete!
        </TextShimmerWave>
        <p className="text-muted-foreground mt-2">
          Get ready for the second innings!
        </p>
      </div>
      
      {/* Score display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background/80 p-4 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Your Score</h3>
          <div className="text-2xl font-bold">{playerScore}</div>
        </div>
        <div className="bg-background/80 p-4 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">AI Score</h3>
          <div className="text-2xl font-bold">{aiScore}</div>
        </div>
      </div>
      
      {/* Target information */}
      {target && (
        <div className="bg-primary/10 p-4 rounded-lg text-center mb-6">
          <div className="font-medium text-primary">
            Target to {playerScore > aiScore ? "Defend" : "Chase"}: {target}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {playerScore > aiScore
              ? "AI needs to score this many runs to win"
              : "You need to score this many runs to win"}
          </div>
        </div>
      )}

      {/* Next innings information */}
      <div className="bg-background/80 p-4 rounded-lg text-center mb-6">
        <h3 className="text-lg font-medium mb-2">Second Innings</h3>
        <div className="text-sm">
          <p><strong>{nextInningsBattingSide}</strong> will bat</p>
          <p><strong>{nextInningsBowlingSide}</strong> will bowl</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col gap-3">
        <ButtonCta
          label="Start Second Innings"
          onClick={handleContinueClick}
          className="w-full"
          data-testid="continue-innings-button"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default InningsTransition;
