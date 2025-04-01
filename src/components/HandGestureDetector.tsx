
import React, { useEffect, useRef, useState } from 'react';
import { mediaPipeService } from '@/lib/mediapipe-service';
import { Button } from '@/components/ui/button';
import { ButtonCta } from '@/components/ui/button-shiny';
import { toast } from '@/hooks/use-toast';

interface HandGestureDetectorProps {
  onGestureDetected: (gesture: number) => void;
}

const HandGestureDetector: React.FC<HandGestureDetectorProps> = ({ onGestureDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const lastGestureTimeRef = useRef<number>(0);
  
  // Add gesture throttling to prevent too frequent updates
  const throttledGestureDetection = (gesture: number) => {
    const now = Date.now();
    // Only process gestures at most once per 750ms
    if (now - lastGestureTimeRef.current > 750 && gesture > 0) {
      lastGestureTimeRef.current = now;
      onGestureDetected(gesture);
    }
  };

  useEffect(() => {
    // Initialize MediaPipe when component mounts
    if (videoRef.current && canvasRef.current) {
      mediaPipeService.initialize(
        videoRef.current,
        canvasRef.current,
        throttledGestureDetection
      );
    }

    return () => {
      // Clean up when component unmounts
      mediaPipeService.stopCamera();
    };
  }, [onGestureDetected]);

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationComplete(false);
    setCountdown(5);
    
    // Start the countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          mediaPipeService.startCalibration();
          
          toast({
            title: "Calibration in progress",
            description: "Please show your hand clearly with all fingers extended",
          });
          
          // Set calibration complete after 5 seconds
          setTimeout(() => {
            setIsCalibrating(false);
            setCalibrationComplete(true);
            toast({
              title: "Calibration complete",
              description: "You can now play. Show 1-5 fingers or thumbs up (6)",
              variant: "success"
            });
          }, 5000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md bg-background rounded-lg overflow-hidden">
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
        
        {isCalibrating && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-white text-4xl font-bold">
              Calibration starting in {countdown}
            </div>
          </div>
        )}
        
        {isCalibrating && countdown === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-white text-2xl font-bold">
              Please show your hand clearly in frame...
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4">
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
