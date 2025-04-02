import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/game-context';
import { Waves } from '@/components/ui/waves-background';
import { Button } from '@/components/ui/button';
import HandGestureDetector from '@/components/HandGestureDetector';
import GameResults from '@/components/GameResults';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { Pause } from 'lucide-react';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import PauseMenu from '@/components/PauseMenu';
import GameHeader from '@/components/GameHeader';
import ScoreDisplay from '@/components/ScoreDisplay';
import GameInfo from '@/components/GameInfo';
import GameControls from '@/components/GameControls';

const Game = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    gameState,
    playerScore,
    aiScore,
    innings,
    target,
    playerChoice,
    aiChoice,
    userBatting,
    isOut,
    ballsPlayed,
    startGame,
    makeChoice,
    resetGame,
    chooseToss,
  } = useGame();
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showHandDetector, setShowHandDetector] = useState(false);
  const [wonToss, setWonToss] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [showInningsEnd, setShowInningsEnd] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [autoGestureTimer, setAutoGestureTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (playerChoice !== null && aiChoice !== null) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [playerChoice, aiChoice]);
  
  useEffect(() => {
    if (innings === 2 && target !== null && !showInningsEnd) {
      setShowInningsEnd(true);
    }
    
    if (gameState === 'gameOver' && !showGameOver) {
      setShowGameOver(true);
    }
  }, [innings, target, gameState, showInningsEnd, showGameOver]);

  useEffect(() => {
    if (calibrationComplete && 
        (gameState === 'batting' || gameState === 'bowling') && 
        !isPaused && 
        !showInningsEnd && 
        !showGameOver &&
        playerChoice === null &&
        aiChoice === null) {
      
      if (autoGestureTimer) {
        clearInterval(autoGestureTimer);
      }
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) return 3;
          if (prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      setAutoGestureTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else if (playerChoice !== null || isPaused || showInningsEnd || showGameOver) {
      if (autoGestureTimer) {
        clearInterval(autoGestureTimer);
        setAutoGestureTimer(null);
      }
    }
  }, [calibrationComplete, gameState, isPaused, showInningsEnd, showGameOver, playerChoice, aiChoice]);

  const handleGestureDetected = (gesture: number) => {
    if (calibrationComplete && 
        (gameState === 'batting' || gameState === 'bowling') && 
        !isPaused && 
        !showInningsEnd && 
        !showGameOver) {
      
      if (gesture >= 1 && gesture <= 6) {
        setAiThinking(true);
        
        setTimeout(() => {
          makeChoice(gesture);
          setAiThinking(false);
          
          toast({
            title: `Gesture detected: ${gesture}`,
            description: gesture === 6 ? "Thumbs up! 👍" : `${gesture} finger${gesture > 1 ? 's' : ''}`,
            duration: 1000,
          });
        }, 600);
      }
    }
  };

  const handleCalibrationComplete = () => {
    setCalibrationComplete(true);
  };

  const handleTossChoice = (choice: 'heads' | 'tails') => {
    const random = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = random === choice;
    
    if (won) {
      setWonToss(true);
      toast({
        title: "You won the toss!",
        description: "Choose whether to bat or bowl first",
        variant: "default"
      });
    } else {
      const aiChoice = Math.random() > 0.5;
      
      setAiThinking(true);
      
      setTimeout(() => {
        toast({
          title: "You lost the toss!",
          description: `AI has chosen to ${aiChoice ? 'bowl' : 'bat'} first`,
        });
        startGame(!aiChoice);
        setShowHandDetector(true);
        setAiThinking(false);
      }, 1500);
    }
  };

  const handleBatBowlChoice = (isBatting: boolean) => {
    startGame(isBatting);
    setShowHandDetector(true);
    setWonToss(false);
    toast({
      title: `You chose to ${isBatting ? 'bat' : 'bowl'} first`,
      description: "Get ready to play!",
      variant: "default"
    });
  };

  const handleContinueToNextInnings = () => {
    setShowInningsEnd(false);
  };

  const handleRestartGame = () => {
    resetGame();
    setShowInningsEnd(false);
    setShowGameOver(false);
    setShowHandDetector(false);
    setCalibrationComplete(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast({
      title: soundEnabled ? "Sound disabled" : "Sound enabled",
      duration: 1500,
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Waves
          lineColor={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
          backgroundColor="transparent"
          waveSpeedX={0.015}
          waveSpeedY={0.01}
        />
      </div>
      
      <PauseMenu 
        open={isPaused}
        onOpenChange={setIsPaused}
        onRestart={handleRestartGame}
        onResume={handleResume}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
      
      <div className="relative z-10 w-full max-w-4xl bg-background/60 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        <div className="absolute top-4 right-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePause}
            className="bg-background/80 hover:bg-background"
          >
            <Pause className="h-4 w-4" />
          </Button>
        </div>
        
        <GameHeader 
          gameState={gameState} 
          userName={user?.name} 
          isCalibrating={!calibrationComplete && showHandDetector}
          isProcessingGesture={aiThinking}
          isCamera={showHandDetector}
        />
        
        {aiThinking && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <TextShimmerWave
                className="text-2xl font-bold mb-2 [--base-color:#3b82f6] [--base-gradient-color:#60a5fa]"
                duration={1.5}
                spread={1.2}
                zDistance={20}
              >
                AI is thinking...
              </TextShimmerWave>
              <p className="text-muted-foreground mt-2">Please wait while the AI makes its move</p>
            </div>
          </div>
        )}
        
        {(showInningsEnd || showGameOver) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <GameResults 
              isGameOver={showGameOver}
              isFirstInningsOver={showInningsEnd && !showGameOver}
              playerScore={playerScore}
              aiScore={aiScore}
              target={target}
              onRestartGame={showGameOver ? handleRestartGame : handleContinueToNextInnings}
            />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <ScoreDisplay 
              playerScore={playerScore} 
              aiScore={aiScore} 
              target={target} 
              innings={innings} 
            />
            
            <GameInfo 
              innings={innings} 
              target={target} 
              playerChoice={playerChoice} 
              aiChoice={aiChoice} 
              isOut={isOut} 
              userBatting={userBatting}
              ballsPlayed={ballsPlayed}
            />
            
            <GameControls 
              gameState={gameState}
              wonToss={wonToss}
              countdown={countdown}
              playerScore={playerScore}
              aiScore={aiScore}
              onTossChoice={handleTossChoice}
              onBatBowlChoice={handleBatBowlChoice}
              onRestartGame={handleRestartGame}
            />
          </div>
          
          <div className="flex-1">
            {showHandDetector ? (
              <HandGestureDetector 
                onGestureDetected={handleGestureDetected} 
                disabled={isPaused || showInningsEnd || showGameOver}
                onCalibrationComplete={handleCalibrationComplete}
              />
            ) : (
              <div className="bg-background/80 p-6 rounded-lg h-full flex items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Complete the toss to start the game and enable hand tracking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
