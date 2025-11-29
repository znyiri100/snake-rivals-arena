import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, type LeaderboardEntry } from '@/services/api';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardProps {
  gameMode?: 'passthrough' | 'walls';
}

export const Leaderboard = ({ gameMode }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [gameMode]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeaderboard(gameMode);
      setEntries(data.slice(0, 10));
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-neon-yellow" />;
    if (index === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (index === 2) return <Medal className="w-5 h-5 text-accent" />;
    return null;
  };

  return (
    <Card className="bg-card/90 border-border p-4 h-full">
      <h2 className="text-xl font-bold text-primary mb-4 neon-text flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        LEADERBOARD
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4 bg-red-500/10 rounded border border-red-500/50">
          {error}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-foreground">
                  {getRankIcon(index) || `#${index + 1}`}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{entry.username}</div>
                  <Badge variant="outline" className="text-xs">
                    {entry.gameMode}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary neon-text">
                  {entry.score}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
