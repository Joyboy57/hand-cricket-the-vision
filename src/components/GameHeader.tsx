
import React from 'react';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { GameState } from '@/lib/game-context';

interface GameHeaderProps {
  gameState: GameState;
  userName?: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ gameState, userName }) => {
  const getGameStateText = () => {
    switch (gameState) {
      case 'toss': return 'Choose Heads or Tails';
      case 'batting': return 'You are BATTING';
      case 'bowling': return 'You are BOWLING';
      case 'gameOver': return 'Game Over!';
      default: return 'Hand Cricket';
    }
  };

  return (
    <div className="mb-6 text-center">
      <h1 className="text-3xl font-bold mb-2">Cricket Hand Gesture Game</h1>
      <p className="text-muted-foreground">
        Welcome {userName || 'Guest'} to Hand Cricket!
      </p>
      <div className="h-24 flex items-center justify-center bg-background/80 rounded-lg mt-4">
        <GooeyText
          texts={[getGameStateText()]}
          className="font-bold"
          textClassName="text-4xl"
        />
      </div>
    </div>
  );
};

export default GameHeader;
