
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonCta } from '@/components/ui/button-shiny';
import { Button } from '@/components/ui/button';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Home, RotateCw } from 'lucide-react';

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
  onRestartGame
}) => {
  const navigate = useNavigate();
  
  const handleHomeClick = () => {
    navigate('/');
  };
  
  // First innings completed announcement
  if (isFirstInningsOver && !isGameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm p-8 rounded-lg">
        <div className="text-center mb-6">
          <TextShimmerWave
            className="text-3xl font-bold mb-4 [--base-color:#3b82f6] [--base-gradient-color:#60a5fa]"
            duration={1.5}
            spread={1.2}
          >
            Innings Complete!
          </TextShimmerWave>
          
          <p className="text-xl font-medium mb-2">
            {target ? "Your" : "AI's"} innings has ended
          </p>
          
          <div className="flex items-center justify-center gap-4 my-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Target Score</p>
              <div className="flex justify-center">
                <AnimatedCounter value={target || 0} />
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {target 
              ? `You need to defend ${target} runs` 
              : `You need to score ${aiScore + 1} runs to win`
            }
          </p>
        </div>
        
        <ButtonCta
          label="Continue to Next Innings"
          onClick={onRestartGame}
          className="w-64"
        />
      </div>
    );
  }
  
  // Game over announcement
  if (isGameOver) {
    const playerWon = playerScore > aiScore;
    const isTie = playerScore === aiScore;
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm p-8 rounded-lg">
        <div className="text-center mb-6">
          <TextShimmerWave
            className={`text-3xl font-bold mb-4 ${
              playerWon 
                ? "[--base-color:#10b981] [--base-gradient-color:#34d399]" 
                : isTie
                  ? "[--base-color:#f59e0b] [--base-gradient-color:#fbbf24]"
                  : "[--base-color:#ef4444] [--base-gradient-color:#f87171]"
            }`}
            duration={1.5}
            spread={1.2}
          >
            {playerWon ? "You Won!" : isTie ? "It's a Tie!" : "AI Won!"}
          </TextShimmerWave>
          
          <div className="flex items-center justify-center gap-8 my-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <div className="flex justify-center">
                <AnimatedCounter value={playerScore} />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">AI Score</p>
              <div className="flex justify-center">
                <AnimatedCounter value={aiScore} />
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {playerWon 
              ? `Congratulations! You won by ${playerScore - aiScore} runs.` 
              : isTie 
                ? "What a match! It ended in a tie."
                : `Better luck next time. AI won by ${aiScore - playerScore} runs.`
            }
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
          
          <ButtonCta
            label="Play Again"
            onClick={onRestartGame}
            className="w-40"
            icon={<RotateCw className="w-4 h-4" />}
          />
        </div>
      </div>
    );
  }
  
  return null;
};

export default GameResults;
