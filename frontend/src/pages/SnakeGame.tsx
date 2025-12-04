import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameBoard } from '@/components/GameBoard';
import { MobileControls } from '@/components/MobileControls';
import { api } from '@/services/api';
import {
    getInitialGameState,
    moveSnake,
    isOppositeDirection,
    calculateGameSpeed,
    type Direction,
    type GameMode,
    type GameState
} from '@/utils/gameLogic';
import { Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { Link } from 'react-router-dom';

const SnakeGame = () => {
    const { playEat, playGameOver, playClick } = useSound();
    const [user, setUser] = useState(api.getCurrentUser());

    useEffect(() => {
        // Fetch user on mount to ensure we have the latest state (e.g. from token)
        const initUser = async () => {
            const u = await api.fetchCurrentUser();
            setUser(u);
        };
        initUser();
    }, []);

    const [selectedMode, setSelectedMode] = useState<GameMode>('snake');
    const [gameState, setGameState] = useState<GameState | null>(getInitialGameState('snake'));

    const startGame = (mode: GameMode) => {
        setSelectedMode(mode);
        setGameState(getInitialGameState(mode));
    };

    const resetGame = () => {
        setGameState(getInitialGameState('snake'));
    };

    const togglePause = () => {
        if (gameState && !gameState.isGameOver) {
            setGameState({ ...gameState, isPaused: !gameState.isPaused });
        }
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
            setGameState(prev => {
                if (!prev) return null;
                const newState = moveSnake(prev);
                if (newState.score > prev.score) {
                    playEat();
                }
                if (newState.isGameOver && !prev.isGameOver) {
                    playGameOver();
                }
                return newState;
            });
        }, speed);

        return () => clearInterval(interval);
    }, [gameState, playEat, playGameOver]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore key presses if user is typing in an input field
            if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement
            ) {
                return;
            }

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
    }, [changeDirection, togglePause, resetGame, playClick]);

    // Submit score on game over
    useEffect(() => {
        if (gameState?.isGameOver && user) {
            api.submitScore(gameState.score, 'snake');
        }
    }, [gameState?.isGameOver, user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/">
                        <Button variant="ghost" className="text-primary hover:text-primary/90">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Menu
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold text-primary neon-text font-orbitron">
                        SNAKE ARENA
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-4xl">
                {gameState && (
                    <Card className="p-6 bg-card/90 border-2 border-primary/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Mode</div>
                                <div className="text-lg font-bold text-foreground uppercase">
                                    SNAKE
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

                        <MobileControls onDirectionChange={changeDirection} onRestart={resetGame} />

                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={() => {
                                    playClick();
                                    togglePause();
                                }}
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
                                onClick={() => {
                                    playClick();
                                    resetGame();
                                }}
                                variant="outline"
                                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Restart
                            </Button>
                        </div>

                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            <p>Use Arrow Keys or WASD to move • Space to pause • R to restart</p>
                        </div>
                    </Card>
                )}
            </div>
        </div >
    );
};

export default SnakeGame;
