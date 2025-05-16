
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ButtonCta } from '@/components/ui/button-shiny';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Waves } from '@/components/ui/waves-background';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GameHistory } from '@/components/GameHistory';
import { Leaderboard } from '@/components/Leaderboard';
import { HyperText } from '@/components/ui/hyper-text';
import { RetroGrid } from '@/components/ui/retro-grid';
import { Trophy } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  
  const handleStartGame = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Waves
          lineColor={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}
          backgroundColor="transparent"
          waveSpeedX={0.015}
          waveSpeedY={0.01}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="w-64 h-64 mx-auto mb-4">
            <img 
              src="/lovable-uploads/e09979c0-a977-43d3-86c7-53b2b69c5dab.png" 
              alt="Hand Cricket The Vision Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <TextShimmerWave
            className="text-4xl font-bold mb-2 [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
            duration={2}
            spread={1.5}
          >
            Hand Cricket The Vision
          </TextShimmerWave>
          
          <p className="text-muted-foreground">
            Welcome {isAuthenticated ? user?.name : 'Guest'} to the ultimate hand cricket experience!
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Left Column: User Profile */}
          <div className="md:col-span-1">
            <Card className="bg-card/80 backdrop-blur-sm h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={isAuthenticated ? `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}` : undefined} />
                  <AvatarFallback className="text-lg">
                    {isAuthenticated 
                      ? user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() 
                      : 'G'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{isAuthenticated ? user?.name : 'Guest'}</CardTitle>
                  <CardDescription>
                    {isAuthenticated 
                      ? 'Logged in and ready to play!'
                      : 'Sign in to track your stats'}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <ButtonCta
                    label="Start Game"
                    onClick={handleStartGame}
                    className="w-full max-w-xs"
                  />
                </div>
                
                {!isAuthenticated && (
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Sign in to track your scores and compete on the leaderboard
                    </p>
                    <Button 
                      variant="link"
                      onClick={() => navigate('/')}
                      className="mt-2"
                    >
                      Login / Sign Up
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Stats, Leaderboard, Game History */}
          <div className="md:col-span-2">
            <div className="space-y-8">
              {/* Tabs for Leaderboard and History */}
              <div className="flex space-x-2">
                <Button 
                  variant={showLeaderboard ? "default" : "outline"}
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
                <Button 
                  variant={!showLeaderboard ? "default" : "outline"}
                  onClick={() => setShowLeaderboard(false)}
                  className="flex items-center gap-2"
                  disabled={!isAuthenticated}
                >
                  <span>Game History</span>
                  {!isAuthenticated && <span className="text-xs">(Login required)</span>}
                </Button>
              </div>
              
              {/* Content Area */}
              <Card className="bg-card/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                  <RetroGrid angle={45} />
                </div>
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {showLeaderboard ? (
                      <HyperText 
                        className="text-2xl" 
                        text="Top Players" 
                        duration={800}
                      />
                    ) : (
                      <HyperText 
                        className="text-2xl" 
                        text="Your Game History" 
                        duration={800} 
                      />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {showLeaderboard 
                      ? "Players with the highest scores"
                      : "Your recent cricket matches"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="min-h-[400px]">
                  {showLeaderboard ? (
                    <Leaderboard />
                  ) : (
                    <GameHistory userId={isAuthenticated ? user?.id : null} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
