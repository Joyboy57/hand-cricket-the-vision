import React from 'react';

export interface GameInfoProps {
  innings: number;
  target: number;
  playerChoice: number;
  aiChoice: number;
  isOut: boolean;
  userBatting: boolean;
  ballsPlayed: number;
  dataTour?: string;
}

const GameInfo: React.FC<GameInfoProps> = ({
  innings,
  target,
  playerChoice,
  aiChoice,
  isOut,
  userBatting,
  ballsPlayed,
  dataTour
}) => {
  return (
    <div className="mb-4" data-tour={dataTour}>
      <h3 className="text-xl font-semibold mb-2">Game Information</h3>
      <p>
        <strong>Innings:</strong> {innings}
      </p>
      {innings === 2 && (
        <p>
          <strong>Target:</strong> {target}
        </p>
      )}
      <p>
        <strong>Your Choice:</strong> {playerChoice}
      </p>
      <p>
        <strong>AI Choice:</strong> {aiChoice}
      </p>
      <p>
        <strong>Balls Played:</strong> {ballsPlayed}
      </p>
      <p>
        <strong>You are:</strong> {userBatting ? 'Batting' : 'Bowling'}
      </p>
      <p>
        <strong>Out:</strong> {isOut ? 'Yes' : 'No'}
      </p>
    </div>
  );
};

export default GameInfo;
