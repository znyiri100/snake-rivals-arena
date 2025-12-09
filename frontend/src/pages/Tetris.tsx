import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TetrisBoard } from '@/components/TetrisBoard';
import { TetrisControls } from '@/components/TetrisControls';
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
    const handleMoveLeft = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isPaused) return;
        setGameState(prev => movePiece(prev, 'left'));
    }, [isPlaying, gameState.isGameOver, gameState.isPaused]);

    const handleMoveRight = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isPaused) return;
        setGameState(prev => movePiece(prev, 'right'));
    }, [isPlaying, gameState.isGameOver, gameState.isPaused]);

    const handleSoftDrop = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isPaused) return;
        setGameState(prev => movePiece(prev, 'down'));
    }, [isPlaying, gameState.isGameOver, gameState.isPaused]);

    const handleRotate = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isPaused) return;
        setGameState(prev => rotatePieceInState(prev));
        playClick();
    }, [isPlaying, gameState.isGameOver, gameState.isPaused, playClick]);

    const handleHardDrop = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isPaused) return;
        setGameState(prev => hardDrop(prev));
        playEat();
    }, [isPlaying, gameState.isGameOver, gameState.isPaused, playEat]);

    // Handle keyboard input
    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (gameState.isGameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                handleMoveLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleMoveRight();
                break;
            case 'ArrowDown':
                e.preventDefault();
                handleSoftDrop();
                break;
            case 'ArrowUp':
                e.preventDefault();
                handleRotate();
                break;
            case ' ':
                e.preventDefault();
                handleHardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                handlePause();
                break;
        }
    }, [gameState.isGameOver, handleMoveLeft, handleMoveRight, handleSoftDrop, handleRotate, handleHardDrop]);

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
                            api.submitScore(newState.score, 'tetris')
                                .then(() => toast.success('Score submitted!'))
                                .catch(() => toast.error('Failed to submit score'));
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 pt-16 flex flex-col items-center">
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

                <TetrisControls
                    onMoveLeft={handleMoveLeft}
                    onMoveRight={handleMoveRight}
                    onSoftDrop={handleSoftDrop}
                    onRotate={handleRotate}
                    onHardDrop={handleHardDrop}
                    onPause={handlePause}
                    onRestart={resetGame}
                    isPaused={gameState.isPaused}
                />

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
