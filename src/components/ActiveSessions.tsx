import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockBackend, type GameSession } from '@/services/mockBackend';
import { Eye, TrendingUp } from 'lucide-react';

interface ActiveSessionsProps {
  onWatchSession: (sessionId: string) => void;
}

export const ActiveSessions = ({ onWatchSession }: ActiveSessionsProps) => {
  const [sessions, setSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    const data = await mockBackend.getActiveSessions();
    setSessions(data);
  };

  return (
    <Card className="bg-card/90 border-border p-4">
      <h2 className="text-xl font-bold text-secondary mb-4 neon-text flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        ACTIVE GAMES
      </h2>
      
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No active games</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border hover:border-secondary/50 transition-colors"
            >
              <div>
                <div className="font-semibold text-foreground">{session.username}</div>
                <div className="text-sm text-muted-foreground">
                  {session.gameMode} • Score: {session.score}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onWatchSession(session.id)}
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
              >
                <Eye className="w-4 h-4 mr-1" />
                Watch
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
