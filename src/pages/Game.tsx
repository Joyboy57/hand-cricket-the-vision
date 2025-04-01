
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/game-context';
import { Waves } from '@/components/ui/waves-background';
import { GooeyText } from '@/components/ui/gooey-text-morphing';
import { ButtonCta } from '@/components/ui/button-shiny';
import HandGestureDetector from '@/components/HandGestureDetector';
import { useTheme } from 'next-themes';

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
    startGame,
    makeChoice,
    resetGame,
  } = useGame();
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showHandDetector, setShowHandDetector] = useState(false);

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

  const handleGestureDetected = (gesture: number) => {
    // Only accept gestures if we're not in countdown and the game is in progress
    if (countdown === null && (gameState === 'batting' || gameState === 'bowling')) {
      makeChoice(gesture);
    }
  };

  // Handle toss outcome and start game
  const handleTossChoice = (choice: 'heads' | 'tails') => {
    const random = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = random === choice;
    const battingFirst = won ? (Math.random() > 0.5) : !(Math.random() > 0.5);
    startGame(battingFirst);
    
    // Show hand detector after toss
    setShowHandDetector(true);
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
      
      <div className="relative z-10 w-full max-w-4xl bg-background/60 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        {/* Game header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Cricket Hand Gesture Game</h1>
          <p className="text-muted-foreground">
            Welcome {user?.name || 'Guest'} to Hand Cricket!
          </p>
        </div>
        
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
            
            {/* Score display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-background/80 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium">Your Score</h3>
                <p className="text-3xl font-bold">{playerScore}</p>
              </div>
              <div className="bg-background/80 p-4 rounded-lg text-center">
                <h3 className="text-lg font-medium">AI Score</h3>
                <p className="text-3xl font-bold">{aiScore}</p>
              </div>
            </div>
            
            {/* Game info */}
            <div className="bg-background/80 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-medium mb-2">Game Info</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Innings: {innings}</div>
                <div>Target: {target > 0 ? target : 'N/A'}</div>
                <div>Your choice: {playerChoice !== null ? (playerChoice === 6 ? '👍' : playerChoice) : '-'}</div>
                <div>AI choice: {aiChoice !== null ? (aiChoice === 6 ? '👍' : aiChoice) : '-'}</div>
              </div>
            </div>
            
            {/* Game controls */}
            <div className="bg-background/80 p-4 rounded-lg">
              {gameState === 'toss' && (
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
              
              {gameState === 'gameOver' && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xl font-bold text-center">
                    {playerScore > aiScore ? 'You Won! 🎉' : 
                     playerScore < aiScore ? 'AI Won! 🤖' : 'It\'s a Tie! 🤝'}
                  </p>
                  <ButtonCta 
                    label="Play Again" 
                    onClick={resetGame}
                    className="w-full"
                  />
                </div>
              )}
              
              {(gameState === 'batting' || gameState === 'bowling') && countdown !== null && (
                <div className="flex justify-center items-center h-20">
                  <p className="text-3xl font-bold">Next ball in: {countdown}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Hand gesture detector */}
          <div className="flex-1">
            {showHandDetector ? (
              <HandGestureDetector onGestureDetected={handleGestureDetected} />
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
