import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameBoard } from '@/components/GameBoard';
import { LoginModal } from '@/components/LoginModal';
import { Leaderboard } from '@/components/Leaderboard';
import { ActiveSessions } from '@/components/ActiveSessions';
import { WatchPlayer } from '@/components/WatchPlayer';
import { mockBackend } from '@/services/mockBackend';
import { 
  getInitialGameState, 
  moveSnake, 
  isOppositeDirection,
  calculateGameSpeed,
  type Direction,
  type GameMode,
  type GameState 
} from '@/utils/gameLogic';
import { Play, Pause, RotateCcw, LogOut, User, Trophy, Eye } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [user, setUser] = useState(mockBackend.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [watchingSessionId, setWatchingSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'game' | 'leaderboard' | 'watch'>('game');

  const startGame = (mode: GameMode) => {
    setSelectedMode(mode);
    setGameState(getInitialGameState(mode));
    setWatchingSessionId(null);
  };

  const resetGame = () => {
    if (selectedMode) {
      setGameState(getInitialGameState(selectedMode));
    }
  };

  const togglePause = () => {
    if (gameState && !gameState.isGameOver) {
      setGameState({ ...gameState, isPaused: !gameState.isPaused });
    }
  };

  const handleLogout = async () => {
    await mockBackend.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleLoginSuccess = () => {
    setUser(mockBackend.getCurrentUser());
  };

  const changeDirection = useCallback((newDirection: Direction) => {
    setGameState(prev => {
      if (!prev || prev.isGameOver || prev.isPaused) return prev;
      if (isOppositeDirection(prev.direction, newDirection)) return prev;
      return { ...prev, direction: newDirection };
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState || gameState.isGameOver || gameState.isPaused) return;

    const speed = calculateGameSpeed(gameState.score);
    const interval = setInterval(() => {
      setGameState(prev => prev ? moveSnake(prev) : null);
    }, speed);

    return () => clearInterval(interval);
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }

      const directionMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      };

      const direction = directionMap[e.key];
      if (direction) {
        e.preventDefault();
        changeDirection(direction);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, togglePause, resetGame]);

  // Submit score on game over
  useEffect(() => {
    if (gameState?.isGameOver && user && selectedMode) {
      mockBackend.submitScore(gameState.score, selectedMode);
    }
  }, [gameState?.isGameOver, user, selectedMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-primary neon-text font-orbitron">
            SNAKE ARENA
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded border border-primary/50">
                  <User className="w-4 h-4 text-secondary" />
                  <span className="text-foreground font-semibold">{user.username}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
              >
                <User className="w-4 h-4 mr-2" />
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* View Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2">
        <Button
          variant={view === 'game' ? 'default' : 'outline'}
          onClick={() => setView('game')}
          className={view === 'game' ? 'bg-primary text-primary-foreground' : ''}
        >
          <Play className="w-4 h-4 mr-2" />
          Play
        </Button>
        <Button
          variant={view === 'leaderboard' ? 'default' : 'outline'}
          onClick={() => setView('leaderboard')}
          className={view === 'leaderboard' ? 'bg-primary text-primary-foreground' : ''}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Leaderboard
        </Button>
        <Button
          variant={view === 'watch' ? 'default' : 'outline'}
          onClick={() => setView('watch')}
          className={view === 'watch' ? 'bg-primary text-primary-foreground' : ''}
        >
          <Eye className="w-4 h-4 mr-2" />
          Watch
        </Button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {view === 'game' && (
            <>
              {!gameState ? (
                <Card className="p-8 text-center bg-card/90 border-2 border-primary/50">
                  <h2 className="text-2xl font-bold mb-6 text-primary neon-text">
                    SELECT GAME MODE
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => startGame('passthrough')}
                      className="h-32 text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 neon-border"
                    >
                      <div>
                        <div className="font-bold mb-2">PASS-THROUGH</div>
                        <div className="text-sm opacity-90">Go through walls</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => startGame('walls')}
                      className="h-32 text-lg bg-accent text-accent-foreground hover:bg-accent/90 neon-border"
                    >
                      <div>
                        <div className="font-bold mb-2">WALLS</div>
                        <div className="text-sm opacity-90">Walls are deadly</div>
                      </div>
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 bg-card/90 border-2 border-primary/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Mode</div>
                      <div className="text-lg font-bold text-foreground uppercase">
                        {selectedMode}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Score</div>
                      <div className="text-3xl font-bold text-primary neon-text">
                        {gameState.score}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mb-4">
                    <GameBoard gameState={gameState} />
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={togglePause}
                      disabled={gameState.isGameOver}
                      variant="outline"
                      className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                    >
                      {gameState.isPaused ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restart
                    </Button>
                    <Button
                      onClick={() => setGameState(null)}
                      variant="outline"
                    >
                      Change Mode
                    </Button>
                  </div>

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>Use Arrow Keys or WASD to move • Space to pause • R to restart</p>
                  </div>
                </Card>
              )}
            </>
          )}

          {view === 'leaderboard' && (
            <Leaderboard gameMode={selectedMode || undefined} />
          )}

          {view === 'watch' && (
            <>
              <ActiveSessions onWatchSession={setWatchingSessionId} />
              {watchingSessionId && (
                <WatchPlayer
                  sessionId={watchingSessionId}
                  onClose={() => setWatchingSessionId(null)}
                />
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Leaderboard gameMode={selectedMode || undefined} />
          {view === 'game' && <ActiveSessions onWatchSession={setWatchingSessionId} />}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Index;
