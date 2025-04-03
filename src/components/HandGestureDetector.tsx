import React, { useEffect, useRef, useState } from 'react';
import { mediaPipeService } from '@/lib/mediapipe-service';
import { Button } from '@/components/ui/button';
import { ButtonCta } from '@/components/ui/button-shiny';
import { toast } from '@/hooks/use-toast';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Camera, CameraOff } from 'lucide-react';

interface HandGestureDetectorProps {
  onGestureDetected: (gesture: number) => void;
  onCalibrationComplete?: () => void;
  onCameraStatusChange?: (isActive: boolean) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  disabled?: boolean;
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
  const cameraTimeoutRef = useRef<number | null>(null);
  const restartAttemptsRef = useRef<number>(0);
  const lastDetectedGestureRef = useRef<number>(0);
  const handDetectedRef = useRef<boolean>(false);
  const userInitiatedRestartRef = useRef<boolean>(false);
  const lastCameraRestartRef = useRef<number>(0);
  const currentGestureRef = useRef<number>(0);
  const gestureConfidenceRef = useRef<{[key: number]: number}>({});

  const throttledGestureDetection = (gesture: number) => {
    if (disabled) return;
    
    const now = Date.now();
    
    if (gesture > 0) {
      handDetectedRef.current = true;
    }
    
    if (calibrationLockRef.current) {
      console.log("Gesture ignored due to calibration lock", gesture);
      return;
    }
    
    if (gesture > 0) {
      Object.keys(gestureConfidenceRef.current).forEach(key => {
        if (parseInt(key) !== gesture) {
          gestureConfidenceRef.current[parseInt(key)] = 0;
        }
      });
      
      gestureConfidenceRef.current[gesture] = (gestureConfidenceRef.current[gesture] || 0) + 1;
      
      console.log(`Gesture ${gesture} confidence: ${gestureConfidenceRef.current[gesture]}/3`);
      
      if (gestureConfidenceRef.current[gesture] >= 3 && currentGestureRef.current !== gesture) {
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
      
      cameraTimeoutRef.current = window.setTimeout(() => {
        if (!mediaPipeService.isCameraRunning()) {
          console.log("Camera initialization timeout - retrying");
          if (restartAttemptsRef.current < 2) {
            handleRestartCamera();
          }
        }
      }, 5000);
      
      if (onCameraStatusChange) {
        onCameraStatusChange(true);
      }
    }

    return () => {
      mediaPipeService.stopCamera();
      
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
      
      if (cameraTimeoutRef.current) {
        clearTimeout(cameraTimeoutRef.current);
      }
    };
  }, [onGestureDetected, cameraActive]);

  useEffect(() => {
    const cameraWatchdog = setInterval(() => {
      if (cameraActive && mediaPipeService.isInitialized() && !mediaPipeService.isCameraRunning() && 
          (userInitiatedRestartRef.current || restartAttemptsRef.current < 2)) {
          
        const now = Date.now();
        if (now - lastCameraRestartRef.current > 15000 || userInitiatedRestartRef.current) {
          console.log("Camera watchdog detected non-running camera, restarting");
          
          if (restartAttemptsRef.current < 2 || userInitiatedRestartRef.current) {
            restartAttemptsRef.current++;
            lastCameraRestartRef.current = now;
            handleRestartCamera();
            userInitiatedRestartRef.current = false;
          } else {
            if (restartAttemptsRef.current === 2) {
              restartAttemptsRef.current++;
              toast({
                title: "Camera issues detected",
                description: "Please try clicking the restart camera button in the top left corner",
                variant: "destructive"
              });
            }
          }
        }
      }
    }, 10000);
    
    return () => {
      clearInterval(cameraWatchdog);
    };
  }, [cameraActive]);

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
    userInitiatedRestartRef.current = true;
    
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
          
          if (userInitiatedRestartRef.current) {
            toast({
              title: "Camera restarted",
              description: "Camera has been restarted successfully",
            });
          }
        }
      }, 500);
    }, 500);
  };

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
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-white text-4xl font-bold">
              Calibration starting in {countdown}
            </div>
          </div>
        )}
        
        {isCalibrating && countdown === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
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
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div>1-4 fingers = score 1-4</div>
              <div>Open hand = score 5</div>
              <div>Thumbs up = score 6</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandGestureDetector;
