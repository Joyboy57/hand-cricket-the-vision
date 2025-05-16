
import React from 'react';
import { ButtonCta } from '@/components/ui/button-shiny';
import { toast } from '@/hooks/use-toast';

interface TossControlsProps {
  wonToss: boolean;
  onTossChoice: (choice: 'heads' | 'tails') => void;
  onBatBowlChoice: (isBatting: boolean) => void;
  // Add the countdown prop to match what's being passed in GameControls.tsx
  countdown?: number;
}

const TossControls: React.FC<TossControlsProps> = ({ 
  wonToss, 
  onTossChoice, 
  onBatBowlChoice,
  countdown 
}) => {
  const handleTossChoice = (choice: 'heads' | 'tails') => {
    onTossChoice(choice);
    toast({
      title: "Toss selection",
      description: `You chose ${choice}`,
      duration: 1500,
    });
  };

  if (!wonToss) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-medium">You won the toss! Choose to:</p>
      <div className="flex gap-4 justify-center">
        <ButtonCta 
          label="Bat First" 
          onClick={() => onBatBowlChoice(true)}
          className="w-32"
        />
        <ButtonCta 
          label="Bowl First" 
          onClick={() => onBatBowlChoice(false)}
          className="w-32"
        />
      </div>
    </div>
  );
};

export default TossControls;
