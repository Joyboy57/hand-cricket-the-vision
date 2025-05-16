
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const TOUR_STEPS = [
  {
    target: 'game-header',
    title: 'Game Status',
    content: 'This area shows the current state of the game - whether you are batting, bowling, or at the toss stage.'
  },
  {
    target: 'score-display',
    title: 'Score Display',
    content: 'Here you can see your score and the AI score. In the second innings, the target will also be displayed.'
  },
  {
    target: 'game-info',
    title: 'Game Information',
    content: 'This section shows details about the current game state, including innings, your choice, AI choice, and whether you are out.'
  },
  {
    target: 'game-controls',
    title: 'Game Controls',
    content: 'These controls let you interact with the game during the toss and other key moments.'
  },
  {
    target: 'camera-section',
    title: 'Hand Gesture Camera',
    content: 'The camera detects your hand gestures to determine your score. Show 1 to 5 fingers for scores 1-5, or a thumbs up for 6.'
  },
  {
    target: 'pause-button',
    title: 'Pause Button',
    content: 'Click here to pause the game, adjust settings, or restart.'
  },
  {
    target: 'declare-button',
    title: 'Declare Button',
    content: 'When batting in the first innings, you can declare your innings to start bowling.'
  }
];

export const useGameTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTourButton, setShowTourButton] = useState(true);
  
  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setShowTourButton(false);
    
    // Highlight the first element
    highlightElement(TOUR_STEPS[0].target);
  }, []);
  
  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Highlight the next element
      highlightElement(TOUR_STEPS[currentStep + 1].target);
    } else {
      // End tour
      endTour();
    }
  }, [currentStep]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      
      // Highlight the previous element
      highlightElement(TOUR_STEPS[currentStep - 1].target);
    }
  }, [currentStep]);
  
  const endTour = useCallback(() => {
    setIsActive(false);
    
    // Remove highlight from any element
    const highlightedElement = document.querySelector('.tour-highlight');
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
    }
    
    // Show the tour button again after a delay
    setTimeout(() => {
      setShowTourButton(true);
    }, 1000);
  }, []);
  
  // Helper function to highlight an element
  const highlightElement = (targetId: string) => {
    // Remove highlight from any element
    const highlightedElement = document.querySelector('.tour-highlight');
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
    }
    
    // Add highlight to the target element
    const targetElement = document.querySelector(`[data-tour="${targetId}"]`);
    if (targetElement) {
      targetElement.classList.add('tour-highlight');
      
      // Scroll to the element if needed
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };
  
  // Tour Component
  const TourComponent = () => {
    if (!isActive) {
      return showTourButton ? (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 bg-background/80 hover:bg-background shadow-lg"
          onClick={startTour}
        >
          Game Tour
        </Button>
      ) : null;
    }
    
    const step = TOUR_STEPS[currentStep];
    
    return (
      <>
        {/* Tour overlay */}
        <div className="fixed inset-0 z-40 bg-black/20" onClick={endTour} />
        
        {/* Tour card */}
        <Card className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {step.title}
            </CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{step.content}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={prevStep} 
                disabled={currentStep === 0}
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="ghost" onClick={endTour} size="sm">
                Skip
              </Button>
              <Button onClick={nextStep} size="sm">
                {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </>
    );
  };

  return {
    startTour,
    nextStep,
    prevStep,
    endTour,
    isActive,
    currentStep,
    TourComponent
  };
};
