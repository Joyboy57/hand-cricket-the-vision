
import React, { useState, useEffect, useRef } from 'react';
import HandGestureDetector from '@/components/HandGestureDetector';
import { toast } from '@/hooks/use-toast';

interface GameCameraProps {
  onGestureDetected: (gesture: number) => void;
  disabled: boolean;
  showHandDetector: boolean;
  gameState: string;
  isPaused: boolean;
  showInningsEnd: boolean;
  showGameOver: boolean;
}

const GameCamera: React.FC<GameCameraProps> = ({
  onGestureDetected,
  disabled,
  showHandDetector,
  gameState,
  isPaused,
  showInningsEnd,
  showGameOver
}) => {
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const gestureProcessingRef = useRef(false);
  
  const handleGestureDetected = (gesture: number) => {
    if (calibrationComplete && 
        (gameState === 'batting' || gameState === 'bowling') && 
        !isPaused && 
        !showInningsEnd && 
        !showGameOver &&
        !gestureProcessingRef.current) {
      
      setHandDetected(true);
      
      if (gesture >= 1 && gesture <= 6) {
        gestureProcessingRef.current = true;
        
        console.log(`Gesture detected: ${gesture}`);
        
        toast({
          title: `Gesture detected: ${gesture}`,
          description: gesture === 6 ? "Thumbs up! 👍" : `${gesture} finger${gesture > 1 ? 's' : ''}`,
          duration: 1000,
        });
        
        // Submit user's choice
        onGestureDetected(gesture);
        
        setTimeout(() => {
          gestureProcessingRef.current = false;
        }, 1000);
      }
    }
  };

  const handleCalibrationComplete = () => {
    setCalibrationComplete(true);
    toast({
      title: "Calibration complete!",
      description: "You can now play. Show 1-5 fingers or thumbs up (6).",
      duration: 3000,
    });
  };

  const handleCameraStatusChange = (isActive: boolean) => {
    if (!isActive) {
      setHandDetected(false);
    }
  };

  return (
    <>
      {showHandDetector ? (
        <HandGestureDetector 
          onGestureDetected={handleGestureDetected} 
          disabled={disabled || isPaused || showInningsEnd || showGameOver || gestureProcessingRef.current}
          onCalibrationComplete={handleCalibrationComplete}
          onCameraStatusChange={handleCameraStatusChange}
        />
      ) : (
        <div className="bg-background/80 p-6 rounded-lg h-full flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Complete the toss to start the game and enable hand tracking.
          </p>
        </div>
      )}
    </>
  );
};

export default GameCamera;
