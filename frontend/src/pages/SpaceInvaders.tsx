import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SpaceInvadersBoard } from '@/components/SpaceInvadersBoard';
import { SpaceInvadersControls } from '@/components/SpaceInvadersControls';
import {
    createInitialState,
    movePlayer,
    shootPlayerBullet,
    updateGame,
    GRID_WIDTH,
    GRID_HEIGHT,
    SpaceInvadersState,
} from '@/utils/spaceInvadersLogic';
import { Play, RotateCcw, ArrowLeft } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';

const SpaceInvaders = () => {
    const { playClick, playGameOver, playEat } = useSound();
    const [user, setUser] = useState(api.getCurrentUser());
    const [gameState, setGameState] = useState<SpaceInvadersState>(createInitialState());
    const [isPlaying, setIsPlaying] = useState(false);

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
        playClick();
    };

    const resetGame = () => {
        setGameState(createInitialState());
        setIsPlaying(false);
    };

    // Handle keyboard input
    const handleMoveLeft = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isWon) return;
        setGameState(prev => movePlayer(prev, 'left'));
    }, [isPlaying, gameState.isGameOver, gameState.isWon]);

    const handleMoveRight = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isWon) return;
        setGameState(prev => movePlayer(prev, 'right'));
    }, [isPlaying, gameState.isGameOver, gameState.isWon]);

    const handleShoot = useCallback(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isWon) return;
        setGameState(prev => {
            const newState = shootPlayerBullet(prev);
            if (newState !== prev) {
                playEat(); // Reuse eat sound for shooting
            }
            return newState;
        });
    }, [isPlaying, gameState.isGameOver, gameState.isWon, playEat]);

    // Handle keyboard input
    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (!isPlaying || gameState.isGameOver || gameState.isWon) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                handleMoveLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleMoveRight();
                break;
            case ' ':
                e.preventDefault();
                handleShoot();
                break;
        }
    }, [isPlaying, gameState.isGameOver, gameState.isWon, handleMoveLeft, handleMoveRight, handleShoot]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    // Game loop
    useEffect(() => {
        if (!isPlaying || gameState.isGameOver || gameState.isWon) return;

        const gameLoop = setInterval(() => {
            setGameState(prev => {
                const { state: newState, aliensHit, playerHit } = updateGame(prev);

                // Play sounds
                if (aliensHit > 0) {
                    playEat(); // Reuse eat sound for hitting aliens
                }
                if (playerHit) {
                    playGameOver();
                }

                // Handle game over
                if (newState.isGameOver) {
                    setIsPlaying(false);
                    if (playerHit) {
                        toast.error('Game Over! You were hit!');
                    } else {
                        toast.error('Game Over! Aliens reached Earth!');
                    }
                    if (user) {
                        api.submitScore(newState.score, 'space_invaders');
                    }
                }

                // Handle victory
                if (newState.isWon) {
                    setIsPlaying(false);
                    toast.success('Victory! All aliens destroyed!');
                    if (user) {
                        api.submitScore(newState.score, 'space_invaders');
                    }
                }

                return newState;
            });
        }, 100); // 10 FPS

        return () => clearInterval(gameLoop);
    }, [isPlaying, gameState.isGameOver, gameState.isWon, user, playEat, playGameOver]);

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
                    SPACE INVADERS
                </h1>
                <div className="w-[140px]"></div> {/* Spacer for centering */}
            </div>

            <Card className="p-8 bg-card/90 border-2 border-primary/50 flex flex-col items-center gap-6">
                <div className="flex w-full justify-between items-center px-4">
                    <div className="text-xl font-bold text-primary neon-text">
                        Score: {gameState.score}
                    </div>
                    <div className="flex gap-2">
                        {!isPlaying && !gameState.isGameOver && !gameState.isWon && (
                            <Button
                                onClick={startGame}
                                variant="outline"
                                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Start Game
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
                    <div className="text-sm text-muted-foreground">
                        Aliens: {gameState.aliens.filter(a => a.isAlive).length}
                    </div>
                </div>

                <SpaceInvadersBoard
                    gameState={gameState}
                    gridWidth={GRID_WIDTH}
                    gridHeight={GRID_HEIGHT}
                />

                <SpaceInvadersControls
                    onMoveLeft={handleMoveLeft}
                    onMoveRight={handleMoveRight}
                    onShoot={handleShoot}
                    onRestart={resetGame}
                />

                <div className="text-center text-sm text-muted-foreground">
                    <p>Use ← → arrow keys to move, SPACE to shoot</p>
                    {!user && (
                        <p className="text-destructive mt-2">Login to save your score!</p>
                    )}
                </div>

                {(gameState.isGameOver || gameState.isWon) && (
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

export default SpaceInvaders;
