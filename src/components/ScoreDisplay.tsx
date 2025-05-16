
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface ScoreDisplayProps {
  playerScore: number;
  aiScore: number;
  target: number | null;
  innings: number;
  dataTour?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  playerScore, 
  aiScore, 
  target,
  innings,
  dataTour = "score-display" // Default value to ensure it always has the attribute
}) => {
  return (
    <Card className="bg-card/90 backdrop-blur-sm border-primary/20" data-tour={dataTour}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">You</p>
            <div className="text-4xl font-bold">
              <AnimatedCounter value={playerScore} />
            </div>
          </div>
          
          <div className="text-center px-4">
            <p className="text-xs text-muted-foreground">vs</p>
            <p className="text-sm font-medium">Innings {innings}</p>
          </div>
          
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">AI</p>
            <div className="text-4xl font-bold">
              <AnimatedCounter value={aiScore} />
            </div>
          </div>
        </div>
        
        {target !== null && innings === 2 && (
          <div className="mt-2 text-center border-t border-primary/20 pt-2">
            <p className="text-sm text-muted-foreground">
              Target: <span className="font-medium text-foreground">{target}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;
