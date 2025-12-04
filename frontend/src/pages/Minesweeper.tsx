import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MinesweeperBoard } from '@/components/MinesweeperBoard';
import {
    createBoard,
    revealCell,
    toggleFlag,
    MinesweeperState,
} from '@/utils/minesweeperLogic';
import { Play, RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSound } from '@/contexts/SoundContext';
import { toast } from 'sonner';

const Minesweeper = () => {
    const { playClick, playGameOver, playEat } = useSound(); // Reusing playEat for reveal/flag for now
    const [gameState, setGameState] = useState<MinesweeperState>(() => {
        const rows = 10;
        const cols = 10;
        const mineCount = 15;
        return {
            grid: createBoard(rows, cols, mineCount),
            rows,
            cols,
            mineCount,
            isGameOver: false,
            isWon: false,
            minesLeft: mineCount,
        };
    });



    const startNewGame = () => {
        const newGrid = createBoard(gameState.rows, gameState.cols, gameState.mineCount);
        setGameState({
            ...gameState,
            grid: newGrid,
            isGameOver: false,
            isWon: false,
            minesLeft: gameState.mineCount,
        });
    };

    const handleCellClick = (x: number, y: number) => {
        if (gameState.isGameOver || gameState.grid[y][x].status === 'flagged') return;

        playClick();
        const { grid, isGameOver, isWon } = revealCell(gameState.grid, x, y);

        if (isGameOver) {
            playGameOver();
            toast.error('Game Over! You hit a mine.');
        } else if (isWon) {
            // playWin(); // Need to add win sound or reuse
            toast.success('Congratulations! You won!');
        }

        setGameState({
            ...gameState,
            grid,
            isGameOver,
            isWon,
        });
    };

    const handleCellRightClick = (e: React.MouseEvent, x: number, y: number) => {
        e.preventDefault();
        if (gameState.isGameOver || gameState.grid[y][x].status === 'revealed') return;

        playClick();
        const { grid, minesLeftChange } = toggleFlag(gameState.grid, x, y);
        setGameState({
            ...gameState,
            grid,
            minesLeft: gameState.minesLeft + minesLeftChange,
        });
    };

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
                    MINESWEEPER
                </h1>
                <div className="w-[100px]"></div> {/* Spacer for centering */}
            </div>

            <Card className="p-8 bg-card/90 border-2 border-primary/50 flex flex-col items-center gap-6">
                <div className="flex w-full justify-between items-center px-4">
                    <div className="text-xl font-bold text-destructive">
                        Mines: {gameState.minesLeft}
                    </div>
                    <Button onClick={startNewGame} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restart
                    </Button>
                </div>

                <MinesweeperBoard
                    grid={gameState.grid}
                    onCellClick={handleCellClick}
                    onCellRightClick={handleCellRightClick}
                    isGameOver={gameState.isGameOver}
                />

                {gameState.isGameOver && (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-destructive mb-2">
                            {gameState.isWon ? 'VICTORY!' : 'GAME OVER'}
                        </h2>
                        <Button onClick={startNewGame} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border">
                            Play Again
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Minesweeper;
