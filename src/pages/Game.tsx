
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Hand, ThumbsUp, ThumbsDown, RotateCcw, X, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GAME_MODES = ["Batting", "Bowling"] as const;
type GameMode = typeof GAME_MODES[number];

const POSSIBLE_ACTIONS = [0, 1, 2, 3, 4, 6] as const;
type CricketAction = typeof POSSIBLE_ACTIONS[number];

const Game = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("Batting");
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [currentAction, setCurrentAction] = useState<CricketAction | null>(null);
  const [computerAction, setComputerAction] = useState<CricketAction | null>(null);
  const [isOut, setIsOut] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countDown, setCountDown] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  const resetGame = () => {
    setGameStarted(false);
    setPlayerScore(0);
    setComputerScore(0);
    setCurrentAction(null);
    setComputerAction(null);
    setIsOut(false);
    setGameOver(false);
    setTarget(null);
    setResult(null);
  };

  const startGame = (mode: GameMode) => {
    resetGame();
    setGameMode(mode);
    setGameStarted(true);
    
    if (mode === "Bowling") {
      // If bowling, computer bats first and sets a target
      const randomScore = Math.floor(Math.random() * 50) + 20; // Random score between 20-70
      setComputerScore(randomScore);
      setTarget(randomScore + 1);
      toast({
        title: "Computer's Innings Complete",
        description: `Computer scored ${randomScore} runs. Your target: ${randomScore + 1} runs.`,
      });
    }
  };

  const getRandomComputerAction = (): CricketAction => {
    const randomIndex = Math.floor(Math.random() * POSSIBLE_ACTIONS.length);
    return POSSIBLE_ACTIONS[randomIndex];
  };

  const handleAction = (action: CricketAction) => {
    if (gameOver) return;
    
    setCurrentAction(action);
    setCountDown(3);
  };

  const processGameLogic = () => {
    if (currentAction === null) return;
    
    const cpuAction = getRandomComputerAction();
    setComputerAction(cpuAction);
    
    if (currentAction === cpuAction) {
      // Out!
      setIsOut(true);
      toast({
        title: "Out!",
        description: `You're out! Both chose ${currentAction}`,
        variant: "destructive"
      });
      
      if (gameMode === "Batting") {
        // If batting and out, game over and check if batting first
        if (target) {
          setGameOver(true);
          setResult(playerScore >= target ? "You won!" : "Computer won!");
        } else {
          // Batting first, set target for computer
          setTarget(playerScore + 1);
          setGameMode("Bowling");
          setPlayerScore(0);
          setIsOut(false);
          toast({
            title: "Your Innings Complete",
            description: `You scored ${playerScore} runs. Computer needs ${playerScore + 1} to win.`,
          });
        }
      } else {
        // If bowling and got the computer out
        setGameOver(true);
        setResult(computerScore >= target! ? "Computer won!" : "You won!");
      }
    } else {
      // Not out, add runs
      if (gameMode === "Batting") {
        const newScore = playerScore + currentAction;
        setPlayerScore(newScore);
        
        // Check if target achieved while batting
        if (target && newScore >= target) {
          setGameOver(true);
          setResult("You won!");
        }
      } else {
        // Bowling mode - computer scores
        const newScore = computerScore + cpuAction;
        setComputerScore(newScore);
        
        // Check if target achieved while bowling
        if (newScore >= target!) {
          setGameOver(true);
          setResult("Computer won!");
        }
      }
    }
    
    setCurrentAction(null);
  };

  useEffect(() => {
    if (countDown === null) return;
    
    if (countDown > 0) {
      const timer = setTimeout(() => {
        setCountDown(countDown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      processGameLogic();
      setCountDown(null);
    }
  }, [countDown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          
          {gameStarted && (
            <Button 
              variant="outline" 
              onClick={resetGame}
              className="border-indigo-200"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Game
            </Button>
          )}
        </header>
        
        {!gameStarted ? (
          <Card className="shadow-lg border-indigo-100 mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Gesture Cricket Challenge</CardTitle>
              <CardDescription className="text-center">
                Choose your game mode to start playing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button 
                  onClick={() => startGame("Batting")} 
                  className="flex-1 py-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Hand className="mr-2 h-6 w-6" />
                  Start Batting
                </Button>
                <Button 
                  onClick={() => startGame("Bowling")} 
                  className="flex-1 py-8 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Hand className="mr-2 h-6 w-6" />
                  Start Bowling
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                Choose a number (0-6) using gestures and compete against the computer!
              </p>
            </CardFooter>
          </Card>
        ) : (
          <>
            <Card className="shadow-lg border-indigo-100 mb-6">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  {gameMode === "Batting" ? "Your Batting" : "Your Bowling"}
                </CardTitle>
                <CardDescription className="text-center">
                  {target 
                    ? `Target: ${target} runs` 
                    : "Set a high score for the computer to chase"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-10 items-center mb-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">You</p>
                    <p className="text-4xl font-bold">{playerScore}</p>
                  </div>
                  <p className="text-xl font-semibold">vs</p>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Computer</p>
                    <p className="text-4xl font-bold">{computerScore}</p>
                  </div>
                </div>
                
                {countDown !== null ? (
                  <div className="text-center my-8">
                    <p className="text-lg mb-2">Get ready...</p>
                    <p className="text-6xl font-bold text-indigo-600">{countDown}</p>
                  </div>
                ) : (
                  <>
                    {gameOver ? (
                      <div className="text-center my-8">
                        <div className="inline-block p-4 rounded-full bg-indigo-100 mb-4">
                          <Award className="h-12 w-12 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{result}</h2>
                        <p className="text-gray-500">
                          {gameMode === "Batting" 
                            ? `You: ${playerScore} runs | Computer: ${computerScore} runs` 
                            : `Computer: ${computerScore} runs | Your target: ${target} runs`}
                        </p>
                      </div>
                    ) : (
                      <>
                        {isOut ? (
                          <div className="text-center my-8">
                            <div className="inline-block p-4 rounded-full bg-red-100 mb-4">
                              <X className="h-12 w-12 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">You're Out!</h2>
                            <p className="text-gray-500">Both chose the same number</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4 my-8">
                            {currentAction !== null && computerAction !== null ? (
                              <div className="col-span-3 flex justify-center gap-16 items-center">
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">You chose</p>
                                  <p className="text-5xl font-bold text-indigo-600">{currentAction}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-500">Computer chose</p>
                                  <p className="text-5xl font-bold text-indigo-600">{computerAction}</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                {POSSIBLE_ACTIONS.map((action) => (
                                  <Button
                                    key={action}
                                    onClick={() => handleAction(action)}
                                    className="py-8 text-xl bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    {action}
                                  </Button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                {gameOver ? (
                  <Button 
                    onClick={resetGame} 
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Play Again
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    {isOut 
                      ? "Click to continue to the next innings"
                      : "Choose a number to continue the game"}
                  </p>
                )}
              </CardFooter>
            </Card>
            
            <Card className="shadow-lg border-indigo-100">
              <CardHeader>
                <CardTitle className="text-xl">How to Play</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>1. Choose a number between 0 and 6 by clicking on the buttons.</p>
                  <p>2. The computer randomly selects a number.</p>
                  <p>3. If you're batting, you score runs equal to your number, unless it matches the computer's (then you're out).</p>
                  <p>4. If you're bowling, the computer scores runs equal to its number, unless it matches yours (then it's out).</p>
                  <p>5. The highest score at the end of both innings wins!</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;
