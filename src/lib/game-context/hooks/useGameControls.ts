
import { GameStateType, GameState, PlayerStatistics } from '@/lib/game-types';
import { handleGameActions } from '../game-actions';

interface GameControlsProps {
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
  setPlayerScore: React.Dispatch<React.SetStateAction<number>>;
  setAiScore: React.Dispatch<React.SetStateAction<number>>;
  setInnings: React.Dispatch<React.SetStateAction<number>>;
  setTarget: React.Dispatch<React.SetStateAction<number | null>>;
  setUserBatting: React.Dispatch<React.SetStateAction<boolean>>;
  setPlayerChoice: React.Dispatch<React.SetStateAction<number | null>>;
  setAiChoice: React.Dispatch<React.SetStateAction<number | null>>;
  setIsOut: React.Dispatch<React.SetStateAction<boolean>>;
  setTossResult: React.Dispatch<React.SetStateAction<string | null>>;
  setBallsPlayed: React.Dispatch<React.SetStateAction<number>>;
  gameState: GameStateType;
  playerScore: number;
  aiScore: number;
  innings: number;
  target: number | null;
  playerChoice: number | null;
  aiChoice: number | null;
  userBatting: boolean;
  isOut: boolean;
  tossResult: string | null;
  ballsPlayed: number;
  statistics: PlayerStatistics;
}

export const useGameControls = ({
  setGameState,
  setPlayerScore,
  setAiScore,
  setInnings,
  setTarget,
  setUserBatting,
  setPlayerChoice,
  setAiChoice,
  setIsOut,
  setTossResult,
  setBallsPlayed,
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
  ballsPlayed,
  statistics
}: GameControlsProps) => {
  
  // Reset game state
  const resetGame = () => {
    setGameState('toss');
    setPlayerScore(0);
    setAiScore(0);
    setInnings(1);
    setTarget(null);
    setUserBatting(false);
    setPlayerChoice(null);
    setAiChoice(null);
    setIsOut(false);
    setTossResult(null);
    setBallsPlayed(0);
  };
  
  // Reset choices without resetting the game
  const resetChoices = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setIsOut(false);
  };

  // Handle user move with optional AI move override
  const makeChoice = (userMove: number, aiMoveOverride?: number) => {
    if (userMove < 1 || userMove > 6) {
      throw new Error('Invalid move: Must be between 1 and 6');
    }

    const aiMove = aiMoveOverride !== undefined ? aiMoveOverride : Math.floor(Math.random() * 6) + 1;
    setPlayerChoice(userMove);
    setAiChoice(aiMove);
    
    // Increment balls played
    setBallsPlayed(prev => prev + 1);

    const currentState: GameState = {
      gameState,
      playerScore,
      aiScore,
      innings,
      target,
      playerChoice: userMove,
      aiChoice: aiMove,
      userBatting,
      isOut: userMove === aiMove,
      tossResult,
      ballsPlayed: ballsPlayed + 1,
      statistics
    };
    
    handleGameActions(
      currentState,
      setGameState,
      setPlayerScore,
      setAiScore,
      setTarget,
      setUserBatting,
      setIsOut,
      setInnings,
      setBallsPlayed,
      resetChoices
    );
  };

  // Start game after toss
  const startGame = (battingFirst: boolean) => {
    setUserBatting(battingFirst);
    setGameState(battingFirst ? 'batting' : 'bowling');
    setBallsPlayed(0);
    resetChoices();
  };

  // Handle toss choice
  const chooseToss = (choice: 'heads' | 'tails') => {
    const tossOutcome = Math.random() > 0.5 ? 'heads' : 'tails';
    const userWonToss = choice === tossOutcome;
    
    setTossResult(userWonToss ? 'You won the toss!' : 'AI won the toss!');
    
    if (!userWonToss) {
      // AI chooses to bat or bowl
      const aiChoice = Math.random() > 0.5;
      setUserBatting(!aiChoice);
    }
  };

  // Handle bat or bowl choice after winning toss
  const chooseBatOrBowl = (choice: 'bat' | 'bowl') => {
    setUserBatting(choice === 'bat');
    setGameState(choice === 'bat' ? 'batting' : 'bowling');
  };

  return {
    resetGame,
    resetChoices,
    makeChoice,
    startGame,
    chooseToss,
    chooseBatOrBowl
  };
};
