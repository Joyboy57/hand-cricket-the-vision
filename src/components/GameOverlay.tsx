
import React from 'react';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import GameResults from '@/components/GameResults';
import { HyperText } from '@/components/ui/hyper-text';

interface GameOverlayProps {
  aiThinking: boolean;
  countdown: number | null;
  showInningsEnd: boolean;
  showGameOver: boolean;
  playerScore: number;
  aiScore: number;
  target: number | null;
  onRestartGame: () => void;
  onContinueToNextInnings: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  aiThinking,
  countdown,
  showInningsEnd,
  showGameOver,
  playerScore,
  aiScore,
  target,
  onRestartGame,
  onContinueToNextInnings
}) => {
  return (
    <>
      {/* Countdown display */}
      {countdown !== null && (
        <div className="text-center my-2">
          <HyperText
            className="text-3xl font-bold text-primary"
            text={countdown.toString()}
            duration={800}
          />
        </div>
      )}
      
      {/* AI thinking overlay */}
      {aiThinking && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="text-center bg-background/80 p-8 rounded-xl">
            <TextShimmerWave
              className="text-2xl font-bold mb-2 [--base-color:#3b82f6] [--base-gradient-color:#60a5fa]"
              duration={1.5}
              spread={1.2}
              zDistance={20}
            >
              AI is thinking...
            </TextShimmerWave>
            <p className="text-muted-foreground mt-2">Please wait while the AI makes its move</p>
          </div>
        </div>
      )}
      
      {/* Game results overlay */}
      {(showInningsEnd || showGameOver) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <GameResults 
            isGameOver={showGameOver}
            isFirstInningsOver={showInningsEnd && !showGameOver}
            playerScore={playerScore}
            aiScore={aiScore}
            target={target}
            onRestartGame={onRestartGame}
            onContinueToNextInnings={onContinueToNextInnings}
          />
        </div>
      )}
    </>
  );
};

export default GameOverlay;
