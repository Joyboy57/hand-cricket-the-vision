
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/game-context';
import { Waves } from '@/components/ui/waves-background';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { ButtonCta } from '@/components/ui/button-shiny';
import { Button } from '@/components/ui/button';
import HandGestureDetector from '@/components/HandGestureDetector';
import GameResults from '@/components/GameResults';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { Pause, Info } from 'lucide-react';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import PauseMenu from '@/components/PauseMenu';

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
    tossResult,
    startGame,
    makeChoice,
    resetGame,
    chooseToss,
    chooseBatOrBowl,
  } = useGame();
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showHandDetector, setShowHandDetector] = useState(false);
  const [wonToss, setWonToss] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [showInningsEnd, setShowInningsEnd] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    // If a choice was made, start countdown for next move
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
  
  // Watch for innings changes and game over
  useEffect(() => {
    if (innings === 2 && target !== null && !showInningsEnd) {
      // First innings just ended
      setShowInningsEnd(true);
    }
    
    if (gameState === 'gameOver' && !showGameOver) {
      // Game is over
      setShowGameOver(true);
    }
  }, [innings, target, gameState, showInningsEnd, showGameOver]);

  const handleGestureDetected = (gesture: number) => {
    // Only accept gestures if we're not in countdown and the game is in progress
    if (countdown === null && 
        (gameState === 'batting' || gameState === 'bowling') && 
        !isPaused && 
        !showInningsEnd && 
        !showGameOver) {
      
      if (gesture >= 1 && gesture <= 6) {
        // Show AI thinking animation
        setAiThinking(true);
        
        // Add a slight delay for better UX
        setTimeout(() => {
          makeChoice(gesture);
          setAiThinking(false);
          
          // Add a visual feedback for the detected gesture
          toast({
            title: `Gesture detected: ${gesture}`,
            description: gesture === 6 ? "Thumbs up! 👍" : `${gesture} finger${gesture > 1 ? 's' : ''}`,
            duration: 1000,
          });
        }, 600);
      }
    }
  };

  // Handle toss outcome and let user choose
  const handleTossChoice = (choice: 'heads' | 'tails') => {
    const random = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = random === choice;
    
    if (won) {
      setWonToss(true);
      toast({
        title: "You won the toss!",
        description: "Choose whether to bat or bowl first",
        variant: "success"
      });
    } else {
      // AI chooses randomly
      const aiChoice = Math.random() > 0.5;
      
      // Show AI thinking before decision
      setAiThinking(true);
      
      setTimeout(() => {
        toast({
          title: "You lost the toss!",
          description: `AI has chosen to ${aiChoice ? 'bowl' : 'bat'} first`,
        });
        startGame(!aiChoice); // !aiChoice because if AI bowls, user bats
        setShowHandDetector(true);
        setAiThinking(false);
      }, 1500);
    }
  };

  // Handle user's choice after winning toss
  const handleBatBowlChoice = (isBatting: boolean) => {
    startGame(isBatting);
    setShowHandDetector(true);
    setWonToss(false);
    toast({
      title: `You chose to ${isBatting ? 'bat' : 'bowl'} first`,
      description: "Get ready to play!",
      variant: "success"
    });
  };
  
  // Handle continuing after first innings
  const handleContinueToNextInnings = () => {
    setShowInningsEnd(false);
  };
  
  // Handle restarting the game
  const handleRestartGame = () => {
    resetGame();
    setShowInningsEnd(false);
    setShowGameOver(false);
    setShowHandDetector(false);
  };
  
  // Pause game handlers
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
      {/* Background waves */}
      <div className="absolute inset-0 z-0">
        <Waves
          lineColor={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
          backgroundColor="transparent"
          waveSpeedX={0.015}
          waveSpeedY={0.01}
        />
      </div>
      
      {/* Pause Menu */}
      <PauseMenu 
        open={isPaused}
        onOpenChange={setIsPaused}
        onRestart={handleRestartGame}
        onResume={handleResume}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
      
      {/* Game content */}
      <div className="relative z-10 w-full max-w-4xl bg-background/60 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        {/* Pause button */}
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
        
        {/* Game header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Cricket Hand Gesture Game</h1>
          <p className="text-muted-foreground">
            Welcome {user?.name || 'Guest'} to Hand Cricket!
          </p>
        </div>
        
        {/* AI Thinking Overlay */}
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
        
        {/* Innings End or Game Over Overlay */}
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
        
        {/* Game content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Controls and info */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Game state display */}
            <div className="h-24 flex items-center justify-center bg-background/80 rounded-lg mb-4">
              <GooeyText
                texts={[
                  gameState === 'toss' ? 'Choose Heads or Tails' : 
                  gameState === 'batting' ? 'You are BATTING' :
                  gameState === 'bowling' ? 'You are BOWLING' :
                  gameState === 'gameOver' ? 'Game Over!' : 'Hand Cricket'
                ]}
                className="font-bold"
                textClassName="text-4xl"
              />
            </div>
            
            {/* Score display with animated counters */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-background/80 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">Your Score</h3>
                <div className="flex justify-center">
                  <AnimatedCounter value={playerScore} />
                </div>
              </div>
              <div className="bg-background/80 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">AI Score</h3>
                <div className="flex justify-center">
                  <AnimatedCounter value={aiScore} />
                </div>
              </div>
            </div>
            
            {/* Game info */}
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
            
            {/* Game controls */}
            <div className="bg-background/80 p-4 rounded-lg">
              {gameState === 'toss' && !wonToss && (
                <div className="flex flex-col gap-3">
                  <p className="text-center">Choose Heads or Tails for the toss:</p>
                  <div className="flex gap-4 justify-center">
                    <ButtonCta 
                      label="Heads" 
                      onClick={() => handleTossChoice('heads')}
                      className="w-32"
                    />
                    <ButtonCta 
                      label="Tails" 
                      onClick={() => handleTossChoice('tails')}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
              
              {gameState === 'toss' && wonToss && (
                <div className="flex flex-col gap-3">
                  <p className="text-center font-medium">You won the toss! Choose to:</p>
                  <div className="flex gap-4 justify-center">
                    <ButtonCta 
                      label="Bat First" 
                      onClick={() => handleBatBowlChoice(true)}
                      className="w-32"
                    />
                    <ButtonCta 
                      label="Bowl First" 
                      onClick={() => handleBatBowlChoice(false)}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
              
              {gameState === 'gameOver' && !showGameOver && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xl font-bold text-center">
                    {playerScore > aiScore ? 'You Won! 🎉' : 
                     playerScore < aiScore ? 'AI Won! 🤖' : 'It\'s a Tie! 🤝'}
                  </p>
                  <ButtonCta 
                    label="Play Again" 
                    onClick={handleRestartGame}
                    className="w-full"
                  />
                </div>
              )}
              
              {(gameState === 'batting' || gameState === 'bowling') && countdown !== null && (
                <div className="flex justify-center items-center h-20">
                  <p className="text-3xl font-bold">Next ball in: {countdown}</p>
                </div>
              )}
              
              {(gameState === 'batting' || gameState === 'bowling') && countdown === null && (
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-primary">
                    {gameState === 'batting' 
                      ? "Show your hand gesture to score runs!" 
                      : "Show your hand gesture to try and get the AI out!"}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    1-4 fingers = score 1-4 | Open hand = 5 | Thumbs up = 6
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Hand gesture detector */}
          <div className="flex-1">
            {showHandDetector ? (
              <HandGestureDetector 
                onGestureDetected={handleGestureDetected} 
                disabled={isPaused || showInningsEnd || showGameOver}
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
