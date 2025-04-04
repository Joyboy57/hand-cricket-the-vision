
import React, { useState, useEffect, useRef } from 'react';
import HandGestureDetector from '@/components/HandGestureDetector';
import { toast } from '@/hooks/use-toast';
import { useGame } from '@/lib/game-context';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  const { refreshCamera } = useGame();
  
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

  const handleRefreshCamera = () => {
    refreshCamera();
    toast({
      title: "Camera refreshed",
      description: "Hand detection has been reset.",
      duration: 1500,
    });
  };

  useEffect(() => {
    // Keyboard shortcut for refreshing camera
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRefreshCamera();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {showHandDetector ? (
        <div className="relative">
          <HandGestureDetector 
            onGestureDetected={handleGestureDetected} 
            disabled={disabled || isPaused || showInningsEnd || showGameOver || gestureProcessingRef.current}
            onCalibrationComplete={handleCalibrationComplete}
            onCameraStatusChange={handleCameraStatusChange}
          />
          
          {/* Camera refresh button */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute top-2 right-2 bg-background/70 hover:bg-background/90"
            onClick={handleRefreshCamera}
            title="Refresh Camera (Press 'R')"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
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
