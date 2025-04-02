
import React from 'react';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface ScoreDisplayProps {
  playerScore: number;
  aiScore: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ playerScore, aiScore }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
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
  );
};

export default ScoreDisplay;
