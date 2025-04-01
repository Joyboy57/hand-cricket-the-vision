
import React from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { X, Volume2, VolumeX, RotateCw } from 'lucide-react';

interface PauseMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestart: () => void;
  onResume: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({
  open,
  onOpenChange,
  onRestart,
  onResume,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-md mx-auto">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-center text-2xl">Game Paused</DrawerTitle>
            <DrawerDescription className="text-center">
              Take a break or adjust your settings
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Game Controls</h3>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={onResume}
              >
                Resume Game
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={onRestart}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Restart Game
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Settings</h3>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={onToggleSound}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Sound: On
                  </>
                ) : (
                  <>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Sound: Off
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Game Rules</h3>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-md space-y-2 text-sm">
                <p className="font-medium">How to Play:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Show 1-4 fingers to score 1-4 runs</li>
                  <li>Show open hand (all 5 fingers) to score 5 runs</li>
                  <li>Show only thumb up to score 6 runs</li>
                  <li>If your gesture matches the AI's, you're out!</li>
                  <li>The player with the highest score at the end of both innings wins</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PauseMenu;
