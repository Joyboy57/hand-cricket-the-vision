
import React from 'react';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';

interface GameInfoProps {
  innings: number;
  target: number | null;
  playerChoice: number | null;
  aiChoice: number | null;
  isOut: boolean;
  userBatting: boolean;
  ballsPlayed: number;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  innings, 
  target, 
  playerChoice, 
  aiChoice, 
  isOut,
  userBatting,
  ballsPlayed
}) => {
  // Format balls played as cricket-style overs (e.g., 1.3 means 1 over and 3 balls)
  const formatOvers = (balls: number): string => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  return (
    <div className="bg-background/80 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">Game Info</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Innings: {innings}</div>
        <div>
          {target ? (
            <span className="font-medium text-primary">Target: {target}</span>
          ) : (
            <span>Target: N/A</span>
          )}
        </div>
        <div>Your choice: {playerChoice !== null ? (playerChoice === 6 ? '👍' : playerChoice) : '-'}</div>
        <div>AI choice: {aiChoice !== null ? (aiChoice === 6 ? '👍' : aiChoice) : '-'}</div>
        <div className="font-medium">Overs: {formatOvers(ballsPlayed)}</div>
        <div>Status: {userBatting ? "Batting" : "Bowling"}</div>
        
        {isOut && (
          <div className="col-span-2 p-2 bg-destructive/10 rounded mt-1 text-destructive font-medium">
            OUT! {playerChoice} = {aiChoice}
          </div>
        )}
        
        {target && innings === 2 && (
          <div className="col-span-2 mt-2 p-2 bg-primary/10 rounded">
            <TextShimmerWave
              className="text-sm font-medium [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
              duration={1.5}
              spread={1}
            >
              {userBatting ? 
                `You need ${target - (playerChoice !== null && !isOut ? playerChoice : 0)} more runs to win` : 
                `AI needs ${target - (aiChoice !== null && !isOut ? aiChoice : 0)} more runs to win`}
            </TextShimmerWave>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInfo;
