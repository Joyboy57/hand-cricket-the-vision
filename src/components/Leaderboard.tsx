
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  highest_score: number;
  total_games: number;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        
        // First get the highest score for each player
        const { data: highScores, error } = await supabase
          .from('game_history')
          .select(`
            user_id,
            player_score,
            profiles(name)
          `)
          .order('player_score', { ascending: false })
          .limit(expanded ? 20 : 5);
          
        if (error) throw error;
        
        // Process and format the leaderboard data
        const processedData: Record<string, LeaderboardEntry> = {};
        
        if (highScores) {
          for (const entry of highScores) {
            const userId = entry.user_id;
            const name = entry.profiles?.name || 'Anonymous';
            
            if (!processedData[userId] || entry.player_score > processedData[userId].highest_score) {
              if (!processedData[userId]) {
                processedData[userId] = {
                  user_id: userId,
                  name,
                  highest_score: entry.player_score,
                  total_games: 1
                };
              } else {
                processedData[userId].highest_score = entry.player_score;
                processedData[userId].total_games += 1;
              }
            }
          }
        }
        
        // Convert to array and sort
        const leaderboardArray = Object.values(processedData)
          .sort((a, b) => b.highest_score - a.highest_score)
          .slice(0, expanded ? 20 : 5);
          
        setLeaderboard(leaderboardArray);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [expanded]);
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center p-3 rounded-lg bg-background/40">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-4 space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No games played yet. Be the first on the leaderboard!</p>
        </div>
      ) : (
        <>
          {leaderboard.map((player, index) => (
            <div 
              key={player.user_id} 
              className={`flex items-center p-3 rounded-lg ${
                index === 0 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : index === 1 
                  ? 'bg-slate-400/10 border border-slate-400/30' 
                  : index === 2 
                  ? 'bg-orange-400/10 border border-orange-400/30'
                  : 'bg-background/40'
              }`}
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                {index === 0 ? (
                  <Trophy className="h-4 w-4 text-amber-500" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              <Avatar className="ml-3">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${player.name}`} />
                <AvatarFallback>
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="ml-3 flex-1">
                <p className="font-medium">{player.name}</p>
                <p className="text-xs text-muted-foreground">
                  {player.total_games} {player.total_games === 1 ? 'game' : 'games'} played
                </p>
              </div>
              
              <div className="font-bold text-lg">
                {player.highest_score}
              </div>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            className="w-full mt-2" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <span className="flex items-center">
                <ChevronUp className="mr-1 h-4 w-4" /> Show Less
              </span>
            ) : (
              <span className="flex items-center">
                <ChevronDown className="mr-1 h-4 w-4" /> Show More
              </span>
            )}
          </Button>
        </>
      )}
    </div>
  );
};
