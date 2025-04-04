
import { PlayerStatistics } from '../game-types';

// Local storage key
const STATISTICS_KEY = 'hand_cricket_statistics';

// Initial statistics
export const INITIAL_STATISTICS: PlayerStatistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  highestScore: 0,
  totalRuns: 0,
  strikeRate: 0,
  bestFigures: {
    runs: 0,
    innings: 0
  }
};

// Load statistics from local storage
export const loadStatistics = (): PlayerStatistics | null => {
  try {
    const storedStats = localStorage.getItem(STATISTICS_KEY);
    if (storedStats) {
      return JSON.parse(storedStats);
    }
    return null;
  } catch (error) {
    console.error('Error loading statistics:', error);
    return null;
  }
};

// Save statistics to local storage
export const saveStatistics = (statistics: PlayerStatistics): void => {
  try {
    localStorage.setItem(STATISTICS_KEY, JSON.stringify(statistics));
  } catch (error) {
    console.error('Error saving statistics:', error);
  }
};

// Format statistics for display
export const formatStatistics = (statistics: PlayerStatistics) => {
  return {
    gamesPlayed: statistics.gamesPlayed,
    gamesWon: statistics.gamesWon,
    winRate: statistics.gamesPlayed > 0 ? 
      `${Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)}%` : '0%',
    highestScore: statistics.highestScore,
    totalRuns: statistics.totalRuns,
    strikeRate: `${statistics.strikeRate}`,
    bestFigures: statistics.bestFigures.runs > 0 ? 
      `${statistics.bestFigures.runs} (Innings ${statistics.bestFigures.innings})` : 'None'
  };
};
