
import React from 'react';
import { ButtonCta } from '@/components/ui/button-shiny';
import { GameState } from '@/lib/game-context';
import TossControls from './TossControls';

interface GameControlsProps {
  gameState: GameState;
  wonToss: boolean;
  countdown: number | null;
  playerScore: number;
  aiScore: number;
  onTossChoice: (choice: 'heads' | 'tails') => void;
  onBatBowlChoice: (isBatting: boolean) => void;
  onRestartGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  wonToss,
  countdown,
  playerScore,
  aiScore,
  onTossChoice,
  onBatBowlChoice,
  onRestartGame
}) => {
  return (
    <div className="bg-background/80 p-4 rounded-lg">
      {gameState === 'toss' && (
        <TossControls 
          wonToss={wonToss} 
          onTossChoice={onTossChoice} 
          onBatBowlChoice={onBatBowlChoice} 
        />
      )}
      
      {gameState === 'gameOver' && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xl font-bold text-center">
            {playerScore > aiScore ? 'You Won! 🎉' : 
             playerScore < aiScore ? 'AI Won! 🤖' : 'It\'s a Tie! 🤝'}
          </p>
          <ButtonCta 
            label="Play Again" 
            onClick={onRestartGame}
            className="w-full"
          />
        </div>
      )}
      
      {(gameState === 'batting' || gameState === 'bowling') && countdown !== null && (
        <div className="flex justify-center items-center h-20">
          <p className="text-3xl font-bold">Next ball in: {countdown}</p>
        </div>
      )}
      
      {(gameState === 'batting' || gameState === 'bowling') && countdown === null && (
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-primary">
            {gameState === 'batting' 
              ? "Show your hand gesture to score runs!" 
              : "Show your hand gesture to try and get the AI out!"}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            1-4 fingers = score 1-4 | Open hand = 5 | Thumbs up = 6
          </div>
        </div>
      )}
    </div>
  );
};

export default GameControls;
