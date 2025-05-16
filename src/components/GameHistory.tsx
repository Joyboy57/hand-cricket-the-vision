
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface GameHistoryEntry {
  id: string;
  created_at: string;
  player_score: number;
  ai_score: number;
  balls_played: number;
  result: string;
  user_batting: boolean;
}

interface GameHistoryProps {
  userId: string | null;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('game_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(expanded ? 20 : 5);
          
        if (error) throw error;
        
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching game history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [userId, expanded]);
  
  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded text-xs">Win</span>;
      case 'loss':
        return <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded text-xs">Loss</span>;
      case 'draw':
        return <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded text-xs">Draw</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">Unknown</span>;
    }
  };
  
  const formatOvers = (balls: number): string => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };
  
  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">Sign in to view your game history</p>
        <Button variant="outline" size="sm">Login / Sign Up</Button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-background/40">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-5 w-[80px]" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No games played yet. Start playing to record your history!</p>
        </div>
      ) : (
        <>
          {history.map(game => (
            <div key={game.id} className="p-4 rounded-lg bg-background/40 hover:bg-background/70 transition-colors">
              <div className="flex justify-between mb-1">
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
                </div>
                <div>{getResultBadge(game.result)}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="text-xl font-bold">{game.player_score} - {game.ai_score}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatOvers(game.balls_played)} overs
                    <span className="inline-block mx-2">•</span>
                    {game.user_batting ? 'Batted First' : 'Bowled First'}
                  </div>
                </div>
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
