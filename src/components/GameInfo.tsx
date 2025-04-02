
import React from 'react';

interface GameInfoProps {
  innings: number;
  target: number | null;
  playerChoice: number | null;
  aiChoice: number | null;
  isOut: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  innings, 
  target, 
  playerChoice, 
  aiChoice, 
  isOut 
}) => {
  return (
    <div className="bg-background/80 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">Game Info</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Innings: {innings}</div>
        <div>Target: {target ? <span className="font-medium text-primary">{target}</span> : 'N/A'}</div>
        <div>Your choice: {playerChoice !== null ? (playerChoice === 6 ? '👍' : playerChoice) : '-'}</div>
        <div>AI choice: {aiChoice !== null ? (aiChoice === 6 ? '👍' : aiChoice) : '-'}</div>
        {isOut && <div className="col-span-2 text-destructive font-medium">OUT! {playerChoice} = {aiChoice}</div>}
      </div>
    </div>
  );
};

export default GameInfo;
