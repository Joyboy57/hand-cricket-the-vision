import React from 'react';
import { GameStateType } from '@/lib/game-types';
import HandGestureDetector from './HandGestureDetector';

export interface GameCameraProps {
  onGestureDetected: (gesture: number) => void;
  disabled: boolean;
  showHandDetector: boolean;
  gameState: GameStateType;
  isPaused: boolean;
  showInningsEnd: boolean;
  showGameOver: boolean;
  dataTour?: string;
}

const GameCamera: React.FC<GameCameraProps> = ({
  onGestureDetected,
  disabled,
  showHandDetector,
  gameState,
  isPaused,
  showInningsEnd,
  showGameOver,
  dataTour
}) => {
  return (
    <div className="flex flex-col items-center" data-tour={dataTour}>
      {showHandDetector && (
        <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
          <HandGestureDetector
            onGestureDetected={onGestureDetected}
            disabled={disabled}
            gameState={gameState}
            isPaused={isPaused}
            showInningsEnd={showInningsEnd}
            showGameOver={showGameOver}
          />
        </div>
      )}
      {!showHandDetector && (
        <div className="text-center mt-4">
          {gameState !== 'toss' ? (
            <p>Camera is off. Turn on camera to play.</p>
          ) : (
            <p>Camera is off. Turn on camera to make your toss choice.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GameCamera;
