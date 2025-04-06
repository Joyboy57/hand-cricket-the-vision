
import React from 'react';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import GameResults from '@/components/GameResults';
import { HyperText } from '@/components/ui/hyper-text';
import InningsTransition from '@/components/InningsTransition';

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
  inningsTransitionInProgress: boolean;
  transitionCompleted: boolean;
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
  onContinueToNextInnings,
  inningsTransitionInProgress,
  transitionCompleted
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
      
      {/* Game transition overlays - only show ONE of these at a time */}
      {showInningsEnd && !showGameOver && !transitionCompleted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <InningsTransition
            playerScore={playerScore}
            aiScore={aiScore}
            target={target}
            onContinue={onContinueToNextInnings}
            disabled={inningsTransitionInProgress}
          />
        </div>
      )}
      
      {showGameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <GameResults 
            isGameOver={true}
            isFirstInningsOver={false}
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
