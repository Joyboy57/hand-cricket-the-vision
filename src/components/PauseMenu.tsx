
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Play,
  Flag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PauseMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestart: () => void;
  onResume: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onDeclareInnings?: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({
  open,
  onOpenChange,
  onRestart,
  onResume,
  soundEnabled,
  onToggleSound,
  onDeclareInnings
}) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Game Paused</SheetTitle>
          <SheetDescription>
            Take a break, adjust settings, or restart the game.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 flex flex-col space-y-4">
          <Button onClick={onResume} className="w-full flex items-center justify-center gap-2">
            <Play className="h-4 w-4" />
            Resume Game
          </Button>
          
          <Button onClick={onRestart} variant="outline" className="w-full flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Restart Game
          </Button>
          
          <Button onClick={handleHomeClick} variant="outline" className="w-full flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
          
          {onDeclareInnings && (
            <Button 
              onClick={onDeclareInnings} 
              variant="destructive" 
              className="w-full flex items-center justify-center gap-2"
            >
              <Flag className="h-4 w-4" />
              Declare Innings
            </Button>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="sound-toggle" className="cursor-pointer">Sound</Label>
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={onToggleSound}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PauseMenu;
