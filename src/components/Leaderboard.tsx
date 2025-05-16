
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, ChevronDown, ChevronUp, Medal } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  highest_score: number;
  total_games: number;
  rank?: number;
}

interface LeaderboardProps {
  userId?: string | null;
  onUserRankUpdate?: (rank: number | null) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ userId, onUserRankUpdate }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  
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
          `);
          
        if (error) throw error;
        
        // Process and format the leaderboard data
        const processedData: Record<string, LeaderboardEntry> = {};
        
        if (highScores) {
          for (const entry of highScores) {
            const userId = entry.user_id;
            const name = entry.profiles?.name || 'Anonymous';
            
            if (!processedData[userId]) {
              processedData[userId] = {
                user_id: userId,
                name,
                highest_score: entry.player_score,
                total_games: 1
              };
            } else {
              processedData[userId].highest_score = Math.max(processedData[userId].highest_score, entry.player_score);
              processedData[userId].total_games += 1;
            }
          }
        }
        
        // Convert to array and sort
        let leaderboardArray = Object.values(processedData)
          .sort((a, b) => b.highest_score - a.highest_score);
        
        // Add ranks
        leaderboardArray = leaderboardArray.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
          
        // Find user's position
        if (userId) {
          const userPosition = leaderboardArray.findIndex(entry => entry.user_id === userId);
          if (userPosition !== -1) {
            const rank = userPosition + 1;
            setUserRank(rank);
            setUserEntry(leaderboardArray[userPosition]);
            // Call the callback if provided
            if (onUserRankUpdate) {
              onUserRankUpdate(rank);
            }
          } else {
            setUserRank(null);
            setUserEntry(null);
            if (onUserRankUpdate) {
              onUserRankUpdate(null);
            }
          }
        }
          
        setLeaderboard(leaderboardArray.slice(0, expanded ? 20 : 5));
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [expanded, userId, onUserRankUpdate]);
  
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
  
  // Function to determine if this entry is the current user
  const isCurrentUser = (entry: LeaderboardEntry) => userId && entry.user_id === userId;

  return (
    <div className="space-y-3">
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No games played yet. Be the first on the leaderboard!</p>
        </div>
      ) : (
        <>
          {leaderboard.map((player) => (
            <div 
              key={player.user_id} 
              className={`flex items-center p-3 rounded-lg ${
                player.rank === 1 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : player.rank === 2 
                  ? 'bg-slate-400/10 border border-slate-400/30' 
                  : player.rank === 3 
                  ? 'bg-orange-400/10 border border-orange-400/30'
                  : isCurrentUser(player)
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-background/40'
              }`}
              data-current-user={isCurrentUser(player)}
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                {player.rank === 1 ? (
                  <Trophy className="h-4 w-4 text-amber-500" />
                ) : player.rank === 2 ? (
                  <Medal className="h-4 w-4 text-slate-400" />
                ) : player.rank === 3 ? (
                  <Medal className="h-4 w-4 text-orange-400" />
                ) : (
                  <span>{player.rank}</span>
                )}
              </div>
              
              <Avatar className="ml-3">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${player.name}`} />
                <AvatarFallback>
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="ml-3 flex-1">
                <p className={`font-medium ${isCurrentUser(player) ? 'text-primary' : ''}`}>
                  {player.name} {isCurrentUser(player) && <span>(You)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.total_games} {player.total_games === 1 ? 'game' : 'games'} played
                </p>
              </div>
              
              <div className="font-bold text-lg">
                {player.highest_score}
              </div>
            </div>
          ))}
          
          {/* Display user's position if not in top 5 and not expanded */}
          {!expanded && userRank && userRank > 5 && userEntry && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                  <span>{userRank}</span>
                </div>
                
                <Avatar className="ml-3">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEntry.name}`} />
                  <AvatarFallback>
                    {userEntry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-3 flex-1">
                  <p className="font-medium text-primary">{userEntry.name} <span>(You)</span></p>
                  <p className="text-xs text-muted-foreground">
                    {userEntry.total_games} {userEntry.total_games === 1 ? 'game' : 'games'} played
                  </p>
                </div>
                
                <div className="font-bold text-lg">
                  {userEntry.highest_score}
                </div>
              </div>
            </div>
          )}
          
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
