
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ButtonCta } from '@/components/ui/button-shiny';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { RetroGrid } from '@/components/ui/retro-grid';
import { useGame } from '@/lib/game-context';

interface InningsTransitionCardProps {
  playerScore: number;
  aiScore: number;
  target: number | null;
  ballsPlayed: number;
  onContinue: () => void;
  disabled?: boolean;
}

const InningsTransitionCard: React.FC<InningsTransitionCardProps> = ({
  playerScore,
  aiScore,
  target,
  ballsPlayed,
  onContinue,
  disabled = false
}) => {
  const { userBatting } = useGame();
  
  // Format balls played as cricket-style overs (e.g., 1.3 means 1 over and 3 balls)
  const formatOvers = (balls: number): string => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const handleContinueClick = () => {
    if (!disabled) {
      onContinue();
    }
  };

  return (
    <Card className="w-full max-w-lg bg-card/95 backdrop-blur-sm relative overflow-hidden animate-scale-in">
      {/* Background effect */}
      <div className="absolute inset-0 -z-10">
        <RetroGrid angle={45} />
      </div>
      
      <CardHeader className="text-center">
        <CardTitle>
          <TextShimmerWave
            className="text-2xl font-bold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
            duration={2}
            spread={1.5}
          >
            End of First Innings
          </TextShimmerWave>
        </CardTitle>
        <CardDescription>Innings Summary</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background/80 p-4 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">
              {userBatting ? "Your" : "AI"} Score
            </h3>
            <div className="flex justify-center">
              <AnimatedCounter value={userBatting ? playerScore : aiScore} />
            </div>
          </div>
          <div className="bg-background/80 p-4 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">Overs Played</h3>
            <div className="text-2xl font-bold">
              {formatOvers(ballsPlayed)}
            </div>
          </div>
        </div>
        
        {/* Target information */}
        {target && (
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <div className="font-medium text-primary">
              {userBatting ? (
                <span>Target to Defend: {playerScore} runs</span>
              ) : (
                <span>Target to Chase: {aiScore + 1} runs</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {userBatting ? (
                <span>AI will need to score {playerScore + 1} to win</span>
              ) : (
                <span>You will need to score {aiScore + 1} to win</span>
              )}
            </div>
          </div>
        )}
        
        {/* Next innings information */}
        <div className="bg-background/80 p-4 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Next Innings</h3>
          <div className="text-sm">
            <p><strong>{userBatting ? "AI" : "You"}</strong> will bat</p>
            <p><strong>{userBatting ? "You" : "AI"}</strong> will bowl</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center pb-6">
        <ButtonCta
          label="Continue to Next Innings"
          onClick={handleContinueClick}
          className="w-full max-w-xs"
          data-testid="continue-innings-button"
          disabled={disabled}
        />
      </CardFooter>
    </Card>
  );
};

export default InningsTransitionCard;
