
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ArrowRight, HelpCircle } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  element: string;
}

export const useGameTour = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const tourSteps: TourStep[] = [
    {
      title: "Welcome to Hand Cricket!",
      description: "Let's learn how to play the game with a quick tour.",
      element: "game-header"
    },
    {
      title: "Score Display",
      description: "Here you can see your score vs the AI's score, along with the current target in the second innings.",
      element: "score-display"
    },
    {
      title: "Game Information",
      description: "This area shows information about the current game state, including which innings it is and who's batting.",
      element: "game-info"
    },
    {
      title: "Game Controls",
      description: "Use these controls to make your choices during the game, including the toss at the start.",
      element: "game-controls"
    },
    {
      title: "Hand Detection",
      description: "Show your hand to the camera to make your move! Numbers 1-6 are recognized by showing your fingers.",
      element: "camera-section"
    },
    {
      title: "Pause Button",
      description: "Click this button to pause the game, adjust settings, or declare your innings if you're batting.",
      element: "pause-button"
    },
    {
      title: "Declare Innings",
      description: "If you're batting in the first innings, you can choose to declare your innings early.",
      element: "declare-button"
    },
    {
      title: "Let's Play!",
      description: "You're now ready to play Hand Cricket! Enjoy the game!",
      element: "game-header"
    }
  ];

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setOpen(true);
  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setOpen(false);
    }
  }, [currentStep, tourSteps.length]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Enhanced highlight function to ensure elements are properly highlighted
  React.useEffect(() => {
    if (open) {
      // Remove existing highlights
      const existingHighlights = document.querySelectorAll('.tour-highlight');
      existingHighlights.forEach((el) => el.classList.remove('tour-highlight'));

      // Force a small delay to ensure the DOM is ready
      setTimeout(() => {
        // Find elements to highlight
        const elementToHighlight = document.querySelector(`[data-tour="${tourSteps[currentStep].element}"]`);
        
        // Special case for specific elements like score-display
        if (tourSteps[currentStep].element === 'score-display') {
          // Try more specific selector with wildcard attribute
          const scoreElements = document.querySelectorAll('[data-tour*="score-display"]');
          if (scoreElements.length > 0) {
            scoreElements.forEach((element) => {
              element.classList.add('tour-highlight');
            });
          }
        } else if (elementToHighlight) {
          elementToHighlight.classList.add('tour-highlight');
        } else {
          console.warn(`Tour element not found: ${tourSteps[currentStep].element}`);
        }
      }, 100);
    }

    return () => {
      // Clean up highlights when unmounting
      const existingHighlights = document.querySelectorAll('.tour-highlight');
      existingHighlights.forEach((el) => el.classList.remove('tour-highlight'));
    };
  }, [open, currentStep, tourSteps]);

  const TourComponent = () => {
    if (!open) return null;

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {tourSteps[currentStep].title}
            </DialogTitle>
            <DialogDescription>
              {tourSteps[currentStep].description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row justify-between sm:justify-between mt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Skip Tour
              </Button>
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevStep}
                >
                  Previous
                </Button>
              )}
            </div>
            <Button 
              type="button" 
              size="sm"
              onClick={handleNextStep}
              className="gap-2"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    startTour,
    TourComponent,
  };
};
