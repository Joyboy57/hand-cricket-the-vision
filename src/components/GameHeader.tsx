
import React from 'react';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { GameStateType } from '@/lib/game-types';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';

interface GameHeaderProps {
  gameState: GameStateType;
  userName?: string;
  isCalibrating?: boolean;
  isProcessingGesture?: boolean;
  isCamera?: boolean;
  useTextShimmer?: boolean;
  dataTour?: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  gameState, 
  userName,
  isCalibrating = false,
  isProcessingGesture = false,
  isCamera = true,
  useTextShimmer = false,
  dataTour
}) => {
  const getGameStateText = () => {
    if (!isCamera) return 'Camera Not Available';
    if (isCalibrating) return 'Calibrating Your Hand...';
    if (isProcessingGesture) return 'Processing Your Gesture...';
    
    switch (gameState) {
      case 'toss': return 'Choose Heads or Tails';
      case 'batting': return 'You are BATTING';
      case 'bowling': return 'You are BOWLING';
      case 'gameOver': return 'Game Over!';
      default: return 'Hand Cricket';
    }
  };

  return (
    <div className="mb-6 text-center" data-tour={dataTour}>
      <h1 className="text-3xl font-bold mb-2">Cricket Hand Gesture Game</h1>
      <p className="text-muted-foreground">
        Welcome {userName || 'Guest'} to Hand Cricket!
      </p>
      <div className="h-24 flex items-center justify-center bg-background/80 rounded-lg mt-4">
        {isProcessingGesture ? (
          <TextShimmerWave
            className="font-bold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
            duration={0.8}
            spread={1.5}
            textClassName="text-2xl"
          >
            Processing your gesture...
          </TextShimmerWave>
        ) : useTextShimmer ? (
          <TextShimmerWave
            className="font-bold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
            duration={1.5}
            spread={1.5}
            textClassName="text-4xl"
          >
            {getGameStateText()}
          </TextShimmerWave>
        ) : (
          <GooeyText
            texts={[getGameStateText()]}
            className="font-bold"
            textClassName="text-4xl"
          />
        )}
      </div>
    </div>
  );
};

export default GameHeader;
