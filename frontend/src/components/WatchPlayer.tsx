import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameBoard } from './GameBoard';
import { api, type GameSession } from '@/services/api';
import { Eye, X } from 'lucide-react';

interface WatchPlayerProps {
  sessionId: string | null;
  onClose: () => void;
}

export const WatchPlayer = ({ sessionId, onClose }: WatchPlayerProps) => {
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      const data = await api.getSessionById(sessionId);
      setSession(data);
    };

    loadSession();
    const interval = setInterval(loadSession, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId || !session) {
    return null;
  }

  return (
    <Card className="bg-card/90 border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-bold text-secondary neon-text">
            Watching: {session.username}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Mode:</span>
          <span className="text-foreground font-semibold uppercase">{session.gameMode}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Score:</span>
          <span className="text-primary font-bold text-lg neon-text">{session.score}</span>
        </div>
        <div className="flex justify-center mt-4">
          <div className="scale-75 origin-center">
            {/* This would show the actual game state in a real implementation */}
            <div className="text-center text-muted-foreground text-sm p-8 border border-border rounded">
              Live gameplay would appear here
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
