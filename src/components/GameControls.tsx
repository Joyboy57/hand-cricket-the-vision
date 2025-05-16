import React from 'react';
import { GameStateType } from '@/lib/game-types';
import TossControls from './TossControls';
import { Button } from '@/components/ui/button';

export interface GameControlsProps {
  gameState: GameStateType;
  wonToss: boolean;
  countdown: number;
  playerScore: number;
  aiScore: number;
  onTossChoice: (choice: 'heads' | 'tails') => void;
  onBatBowlChoice: (isBatting: boolean) => void;
  onRestartGame: () => void;
  dataTour?: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  wonToss,
  countdown,
  playerScore,
  aiScore,
  onTossChoice,
  onBatBowlChoice,
  onRestartGame,
  dataTour
}) => {
  const renderControls = () => {
    switch (gameState) {
      case 'toss':
        return (
          <TossControls
            wonToss={wonToss}
            countdown={countdown}
            onTossChoice={onTossChoice}
            onBatBowlChoice={onBatBowlChoice}
          />
        );
      case 'batting':
      case 'bowling':
        return (
          <div>
            <p>Game in progress...</p>
          </div>
        );
      case 'gameOver':
        return (
          <div>
            <p>Your Score: {playerScore}</p>
            <p>AI Score: {aiScore}</p>
            <Button onClick={onRestartGame}>Restart Game</Button>
          </div>
        );
      default:
        return <p>Loading...</p>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-4" data-tour={dataTour}>
      {renderControls()}
    </div>
  );
};

export default GameControls;
