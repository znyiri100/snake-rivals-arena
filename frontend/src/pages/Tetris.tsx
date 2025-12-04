import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TetrisBoard } from '@/components/TetrisBoard';
import {
    createInitialState,
    movePiece,
    rotatePieceInState,
    hardDrop,
    dropPiece,
    togglePause,
    getDropSpeed,
    TetrisState,
} from '@/utils/tetrisLogic';
import { Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';

const Tetris = () => {
    const { playClick, playGameOver, playEat } = useSound();
    const [user, setUser] = useState(api.getCurrentUser());
    const [gameState, setGameState] = useState<TetrisState>(createInitialState());
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastDropTime, setLastDropTime] = useState(Date.now());

    // Fetch user on mount
    useEffect(() => {
        const initUser = async () => {
            const u = await api.fetchCurrentUser();
            setUser(u);
        };
        initUser();
    }, []);

    const startGame = () => {
        setGameState(createInitialState());
        setIsPlaying(true);
        setLastDropTime(Date.now());
        playClick();
    };

    const resetGame = () => {
        setGameState(createInitialState());
        setIsPlaying(false);
    };

    const handlePause = () => {
        setGameState(prev => togglePause(prev));
        playClick();
    };

    // Handle keyboard input
    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (gameState.isGameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                setGameState(prev => movePiece(prev, 'left'));
                break;
            case 'ArrowRight':
                e.preventDefault();
                setGameState(prev => movePiece(prev, 'right'));
                break;
            case 'ArrowDown':
                e.preventDefault();
                setGameState(prev => movePiece(prev, 'down'));
                break;
            case 'ArrowUp':
            case ' ':
                e.preventDefault();
                if (e.key === ' ') {
                    setGameState(prev => hardDrop(prev));
                    playEat();
                } else {
                    setGameState(prev => rotatePieceInState(prev));
                    playClick();
                }
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                handlePause();
                break;
        }
    }, [gameState.isGameOver, playClick, playEat]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    // Game loop - automatic dropping
    useEffect(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isPaused) return;

        const dropSpeed = getDropSpeed(gameState.level);

        const gameLoop = setInterval(() => {
            const now = Date.now();
            if (now - lastDropTime >= dropSpeed) {
                setGameState(prev => {
                    const newState = dropPiece(prev);

                    // Check if game over
                    if (newState.isGameOver && !prev.isGameOver) {
                        setIsPlaying(false);
                        playGameOver();
                        toast.error('Game Over!');
                        if (user) {
                            api.submitScore(newState.score, 'tetris');
                        }
                    }

                    // Play sound when lines are cleared
                    if (newState.lines > prev.lines) {
                        playEat();
                    }

                    return newState;
                });
                setLastDropTime(now);
            }
        }, 50); // Check every 50ms

        return () => clearInterval(gameLoop);
    }, [isPlaying, gameState.isGameOver, gameState.isPaused, gameState.level, lastDropTime, user, playEat, playGameOver]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
                <Link to="/">
                    <Button variant="ghost" className="text-primary hover:text-primary/90">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Menu
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold text-primary neon-text font-orbitron">
                    TETRIS
                </h1>
                <div className="w-[140px]"></div> {/* Spacer for centering */}
            </div>

            <Card className="p-8 bg-card/90 border-2 border-primary/50 flex flex-col items-center gap-6">
                <div className="flex w-full justify-between items-center px-4">
                    <div className="flex flex-col gap-2">
                        <div className="text-xl font-bold text-primary neon-text">
                            Score: {gameState.score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Level: {gameState.level}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Lines: {gameState.lines}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!isPlaying && !gameState.isGameOver && (
                            <Button
                                onClick={startGame}
                                variant="outline"
                                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Start Game
                            </Button>
                        )}
                        {isPlaying && !gameState.isGameOver && (
                            <Button
                                onClick={handlePause}
                                variant="outline"
                                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                            >
                                <Pause className="w-4 h-4 mr-2" />
                                {gameState.isPaused ? 'Resume' : 'Pause'}
                            </Button>
                        )}
                        <Button
                            onClick={resetGame}
                            variant="outline"
                            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restart
                        </Button>
                    </div>
                </div>

                <TetrisBoard gameState={gameState} />

                <div className="text-center text-sm text-muted-foreground">
                    <p>← → to move, ↑ to rotate, ↓ to soft drop, SPACE for hard drop, P to pause</p>
                    {!user && (
                        <p className="text-destructive mt-2">Login to save your score!</p>
                    )}
                </div>

                {gameState.isGameOver && (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <Button
                            onClick={startGame}
                            size="lg"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
                        >
                            Play Again
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Tetris;
