import React from 'react';
import { Cell } from '@/utils/minesweeperLogic';
import { Flag, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinesweeperBoardProps {
    grid: Cell[][];
    onCellClick: (x: number, y: number) => void;
    onCellRightClick: (e: React.MouseEvent, x: number, y: number) => void;
    isGameOver: boolean;
}

export const MinesweeperBoard: React.FC<MinesweeperBoardProps> = ({
    grid,
    onCellClick,
    onCellRightClick,
    isGameOver,
}) => {
    return (
        <div className="inline-block bg-card/90 p-4 rounded-lg border-2 border-primary/50 neon-border">
            <div
                className="grid gap-1"
                style={{
                    gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
                }}
            >
                {grid.map((row, y) =>
                    row.map((cell, x) => (
                        <button
                            key={`${x}-${y}`}
                            onClick={() => onCellClick(x, y)}
                            onContextMenu={(e) => onCellRightClick(e, x, y)}
                            disabled={isGameOver && cell.status !== 'exploded'}
                            className={cn(
                                'w-8 h-8 flex items-center justify-center text-sm font-bold rounded transition-all duration-200',
                                cell.status === 'hidden' &&
                                'bg-secondary hover:bg-secondary/80 border border-secondary-foreground/20',
                                cell.status === 'revealed' &&
                                'bg-background border border-border cursor-default',
                                cell.status === 'flagged' &&
                                'bg-secondary border border-secondary-foreground/20',
                                cell.status === 'exploded' && 'bg-destructive animate-pulse',
                                isGameOver && cell.isMine && cell.status !== 'exploded' && cell.status !== 'flagged' && 'bg-destructive/50'
                            )}
                        >
                            {cell.status === 'revealed' && !cell.isMine && cell.neighborMines > 0 && (
                                <span
                                    className={cn(
                                        cell.neighborMines === 1 && 'text-blue-400',
                                        cell.neighborMines === 2 && 'text-green-400',
                                        cell.neighborMines === 3 && 'text-red-400',
                                        cell.neighborMines === 4 && 'text-purple-400',
                                        cell.neighborMines >= 5 && 'text-yellow-400'
                                    )}
                                >
                                    {cell.neighborMines}
                                </span>
                            )}
                            {cell.status === 'flagged' && (
                                <Flag className="w-4 h-4 text-accent" />
                            )}
                            {(cell.status === 'exploded' || (isGameOver && cell.isMine && cell.status !== 'flagged')) && (
                                <Bomb className="w-5 h-5 text-destructive-foreground" />
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
