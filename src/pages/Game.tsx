
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/game-context';
import { Waves } from '@/components/ui/waves-background';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Pause } from 'lucide-react';
import { useTheme } from 'next-themes';
import PauseMenu from '@/components/PauseMenu';
import GameHeader from '@/components/GameHeader';
import ScoreDisplay from '@/components/ScoreDisplay';
import GameInfo from '@/components/GameInfo';
import GameControls from '@/components/GameControls';
import { useAiOpponent } from '@/hooks/useAiOpponent';
import GameCamera from '@/components/GameCamera';
import GameOverlay from '@/components/GameOverlay';

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
  const { getAiMove, resetHistory } = useAiOpponent();
  
  // Handle player/AI choice updates
  useEffect(() => {
    if (playerChoice !== null && aiChoice === null) {
      // AI is thinking - perform AI move calculation
      setAiThinking(true);
      
      // Use AI opponent to generate the AI's move
      const timer = setTimeout(async () => {
        const aiMove = await getAiMove(playerChoice, userBatting, ballsPlayed, playerScore, aiScore, innings);
        makeChoice(playerChoice, aiMove);
        setAiThinking(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [playerChoice, aiChoice]);
  
  // Handle innings and game state changes
  useEffect(() => {
    if (innings === 2 && target !== null && !showInningsEnd) {
      setShowInningsEnd(true);
    }
    
    if (gameState === 'gameOver' && !showGameOver) {
      setShowGameOver(true);
    }
  }, [innings, target, gameState, showInningsEnd, showGameOver]);

  const handleGestureDetected = (gesture: number) => {
    // Submit user's choice (AI move will be calculated in the effect above)
    makeChoice(gesture);
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
    console.log("Handle continue to next innings called");
    setShowInningsEnd(false);
    
    // Make sure hand detector is active for second innings
    if (!showHandDetector) {
      setShowHandDetector(true);
    }
    
    // Display toast to inform player about second innings start
    toast({
      title: `Second Innings Started!`,
      description: `${userBatting ? 'Your turn to bat' : 'AI batting'}. Target: ${target}`,
      duration: 3000,
    });
  };

  const handleRestartGame = () => {
    resetGame();
    resetHistory();
    setShowInningsEnd(false);
    setShowGameOver(false);
    setShowHandDetector(false);
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
          isCalibrating={showHandDetector && !showGameOver && !showInningsEnd}
          isProcessingGesture={aiThinking}
          isCamera={showHandDetector}
        />
        
        <GameOverlay
          aiThinking={aiThinking}
          countdown={countdown}
          showInningsEnd={showInningsEnd}
          showGameOver={showGameOver}
          playerScore={playerScore}
          aiScore={aiScore}
          target={target}
          onRestartGame={handleRestartGame}
          onContinueToNextInnings={handleContinueToNextInnings}
        />
        
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
            <GameCamera
              onGestureDetected={handleGestureDetected}
              disabled={isPaused}
              showHandDetector={showHandDetector}
              gameState={gameState}
              isPaused={isPaused}
              showInningsEnd={showInningsEnd}
              showGameOver={showGameOver}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
