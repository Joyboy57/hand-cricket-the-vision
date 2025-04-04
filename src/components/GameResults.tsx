
import React from 'react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ButtonCta } from '@/components/ui/button-shiny';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getResultMessage } from '@/lib/game-utils';
import { RetroGrid } from '@/components/ui/retro-grid';

interface GameResultsProps {
  isGameOver: boolean;
  isFirstInningsOver: boolean;
  playerScore: number;
  aiScore: number;
  target: number | null;
  onRestartGame: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({
  isGameOver,
  isFirstInningsOver,
  playerScore,
  aiScore,
  target,
  onRestartGame,
}) => {
  const navigate = useNavigate();
  
  // Determine result message for game over
  const resultMessage = isGameOver
    ? getResultMessage(playerScore, aiScore)
    : "First innings complete!";

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleContinueClick = () => {
    // Make sure onRestartGame is properly called for continuing to next innings
    onRestartGame();
  };

  return (
    <div className="relative w-full max-w-lg p-6 bg-card/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 -z-10">
        <RetroGrid angle={55} />
      </div>
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {isGameOver ? (
            <TextShimmerWave
              className="text-2xl font-bold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
              duration={2}
              spread={1.5}
            >
              Game Over!
            </TextShimmerWave>
          ) : (
            <TextShimmerWave
              className="text-2xl font-bold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
              duration={2}
              spread={1.5}
            >
              Innings Complete!
            </TextShimmerWave>
          )}
        </h2>
        <p className="text-muted-foreground">
          {isFirstInningsOver && !isGameOver
            ? "Get ready for the second innings!"
            : resultMessage}
        </p>
      </div>
      
      {/* Score display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background/80 p-4 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Your Score</h3>
          <div className="flex justify-center">
            <AnimatedCounter value={playerScore} />
          </div>
        </div>
        <div className="bg-background/80 p-4 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">AI Score</h3>
          <div className="flex justify-center">
            <AnimatedCounter value={aiScore} />
          </div>
        </div>
      </div>
      
      {/* Target information */}
      {isFirstInningsOver && !isGameOver && target && (
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
      
      {/* Actions */}
      <div className="flex flex-col gap-3">
        <ButtonCta
          label={isGameOver ? "Play Again" : "Continue to Next Innings"}
          onClick={handleContinueClick}
          className="w-full"
        />
        
        {isGameOver && (
          <Button
            variant="outline"
            onClick={handleHomeClick}
            className="w-full"
          >
            Return to Home Screen
          </Button>
        )}
      </div>
    </div>
  );
};

export default GameResults;
