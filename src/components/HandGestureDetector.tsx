
import React, { useEffect, useRef, useState } from 'react';
import { mediaPipeService } from '@/lib/mediapipe-service';
import { Button } from '@/components/ui/button';
import { ButtonCta } from '@/components/ui/button-shiny';
import { toast } from '@/hooks/use-toast';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Camera, CameraOff } from 'lucide-react';
import { HyperText } from '@/components/ui/hyper-text';
import { GameStateType } from '@/lib/game-types';

interface HandGestureDetectorProps {
  onGestureDetected: (gesture: number) => void;
  onCalibrationComplete?: () => void;
  onCameraStatusChange?: (isActive: boolean) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  disabled?: boolean;
  // Add these new props to match what's being passed in GameCamera.tsx
  gameState?: GameStateType;
  isPaused?: boolean;
  showInningsEnd?: boolean;
  showGameOver?: boolean;
}

const HandGestureDetector: React.FC<HandGestureDetectorProps> = ({ 
  onGestureDetected,
  onCalibrationComplete,
  onCameraStatusChange,
  onProcessingChange,
  disabled = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const lastGestureTimeRef = useRef<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const calibrationLockRef = useRef<boolean>(true);
  const calibrationTimeoutRef = useRef<number | null>(null);
  const lastDetectedGestureRef = useRef<number>(0);
  const handDetectedRef = useRef<boolean>(false);
  const currentGestureRef = useRef<number>(0);
  const gestureConfidenceRef = useRef<{[key: number]: number}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [motionDetected, setMotionDetected] = useState<boolean>(false);
  const [handedness, setHandedness] = useState<string>('Unknown');

  // Enhanced gesture detection with improved confidence system
  const throttledGestureDetection = (gesture: number, handednessValue: string, motionDetected: boolean) => {
    if (disabled) return;
    
    setHandedness(handednessValue);
    setMotionDetected(motionDetected);
    
    const now = Date.now();
    
    if (gesture > 0) {
      handDetectedRef.current = true;
    }
    
    if (calibrationLockRef.current) {
      console.log("Gesture ignored due to calibration lock", gesture);
      return;
    }
    
    if (gesture > 0) {
      // Update debug info
      setDebugInfo(mediaPipeService.getDebugInfo());
      
      Object.keys(gestureConfidenceRef.current).forEach(key => {
        if (parseInt(key) !== gesture) {
          gestureConfidenceRef.current[parseInt(key)] = 0;
        }
      });
      
      gestureConfidenceRef.current[gesture] = (gestureConfidenceRef.current[gesture] || 0) + 1;
      
      console.log(`Gesture ${gesture} confidence: ${gestureConfidenceRef.current[gesture]}/3`);
      
      // Only proceed with high confidence (3+ detections) and if motion is detected
      if (gestureConfidenceRef.current[gesture] >= 3 && 
          currentGestureRef.current !== gesture && 
          (motionDetected || gesture !== lastDetectedGestureRef.current)) {
          
        lastDetectedGestureRef.current = gesture;
        currentGestureRef.current = gesture;
        
        console.log(`Detected gesture: ${gesture} with confidence: ${gestureConfidenceRef.current[gesture]}`);
        
        if (now - lastGestureTimeRef.current > 800) {
          lastGestureTimeRef.current = now;
          setIsProcessing(true);
          
          if (onProcessingChange) {
            onProcessingChange(true);
          }
          
          console.log(`Processing gesture: ${gesture}`);
          
          // Show visual feedback for the detected gesture
          toast({
            title: `Gesture detected: ${gesture}`,
            description: gesture === 6 ? "Thumbs up! 👍" : `${gesture} finger${gesture > 1 ? 's' : ''}`,
            duration: 1000,
          });
          
          setTimeout(() => {
            onGestureDetected(gesture);
            setIsProcessing(false);
            
            if (onProcessingChange) {
              onProcessingChange(false);
            }
            
            setTimeout(() => {
              currentGestureRef.current = 0;
              gestureConfidenceRef.current = {};
            }, 1000);
          }, 300);
        }
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const initPromise = mediaPipeService.initialize(
        videoRef.current,
        canvasRef.current,
        throttledGestureDetection
      );
      
      if (onCameraStatusChange) {
        onCameraStatusChange(true);
      }
    }

    return () => {
      mediaPipeService.stopCamera();
      
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
    };
  }, [onGestureDetected, cameraActive]);

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationComplete(false);
    setCountdown(5);
    calibrationLockRef.current = true;
    currentGestureRef.current = 0;
    gestureConfidenceRef.current = {};
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          mediaPipeService.startCalibration();
          toast({
            title: "Calibration in progress",
            description: "Please show your hand clearly with all fingers extended",
          });
          
          let progress = 0;
          const progressTimer = setInterval(() => {
            progress += 5;
            setCalibrationProgress(progress);
            
            if (progress >= 100) {
              clearInterval(progressTimer);
              setTimeout(() => {
                setIsCalibrating(false);
                setCalibrationComplete(true);
                
                calibrationTimeoutRef.current = window.setTimeout(() => {
                  calibrationLockRef.current = false;
                  
                  if (onCalibrationComplete) {
                    onCalibrationComplete();
                  }
                  
                  toast({
                    title: "Calibration complete",
                    description: "You can now play. Show 1-5 fingers or thumbs up (6)",
                    variant: "default"
                  });
                }, 3000);
              }, 300);
            }
          }, 250);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRestartCamera = () => {
    mediaPipeService.stopCamera();
    
    setCameraActive(false);
    
    if (onCameraStatusChange) {
      onCameraStatusChange(false);
    }
    
    setTimeout(() => {
      setCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current && canvasRef.current) {
          mediaPipeService.initialize(
            videoRef.current,
            canvasRef.current,
            throttledGestureDetection
          );
          
          if (onCameraStatusChange) {
            onCameraStatusChange(true);
          }
          
          toast({
            title: "Camera restarted",
            description: "Camera has been restarted successfully",
          });
        }
      }, 500);
    }, 500);
  };

  // Render gesture info helper
  const renderGestureGuide = () => (
    <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
      <div>1-4 fingers = score 1-4</div>
      <div>Open hand = score 5</div>
      <div>Thumbs up = score 6</div>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md bg-background rounded-lg overflow-hidden">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-auto rounded-lg"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              width="640"
              height="480"
            />
          </>
        ) : (
          <div className="w-full aspect-video bg-muted/50 flex items-center justify-center rounded-lg">
            <CameraOff className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {isCalibrating && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-primary text-4xl font-bold">
              Calibration starting in {countdown}
            </div>
          </div>
        )}
        
        {isCalibrating && countdown === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <TextShimmerWave
              className="text-2xl font-semibold mb-4 [--base-color:#ffffff] [--base-gradient-color:#60a5fa]"
              duration={1.2}
              spread={1.5}
            >
              Calibrating your hand...
            </TextShimmerWave>
            <div className="w-64 mt-4">
              <Progress value={calibrationProgress} className="h-2" />
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute top-4 right-4 bg-primary/20 px-3 py-2 rounded-md">
            <TextShimmerWave
              className="text-sm font-medium [--base-color:#ffffff] [--base-gradient-color:#60a5fa]"
              duration={0.8}
              spread={2}
            >
              Processing...
            </TextShimmerWave>
          </div>
        )}
        
        <div className="absolute top-4 left-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRestartCamera}
            className="bg-background/50 hover:bg-background"
            title="Restart camera if you're having issues"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Enhanced debug info overlay */}
        {debugInfo && (
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs text-white">
            {debugInfo}
            <div>Hand: {handedness} | Motion: {motionDetected ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
      
      <div className="mt-4 w-full">
        {!calibrationComplete ? (
          <ButtonCta
            label="Start Calibration"
            onClick={startCalibration}
            className="w-full"
          />
        ) : (
          <div className="bg-green-500/20 p-3 rounded-lg text-center">
            <span className="text-green-500 font-medium">
              Calibration complete! You can now play.
            </span>
            {renderGestureGuide()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HandGestureDetector;
