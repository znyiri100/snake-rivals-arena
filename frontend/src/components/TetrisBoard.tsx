import { TetrisState, Tetromino, Position, GRID_WIDTH, GRID_HEIGHT, getGhostPosition } from '@/utils/tetrisLogic';

interface TetrisBoardProps {
    gameState: TetrisState;
}

export const TetrisBoard = ({ gameState }: TetrisBoardProps) => {
    const cellSize = 30; // pixels
    const ghostPosition = gameState.currentPiece ? getGhostPosition(gameState) : null;

    const renderCell = (x: number, y: number) => {
        const cell = gameState.grid[y][x];
        let cellColor = cell.filled ? cell.color : 'transparent';
        let isGhost = false;
        let isCurrent = false;

        // Check if current piece occupies this cell
        if (gameState.currentPiece) {
            const relX = x - gameState.currentPosition.x;
            const relY = y - gameState.currentPosition.y;

            if (
                relY >= 0 &&
                relY < gameState.currentPiece.shape.length &&
                relX >= 0 &&
                relX < gameState.currentPiece.shape[relY].length &&
                gameState.currentPiece.shape[relY][relX]
            ) {
                cellColor = gameState.currentPiece.color;
                isCurrent = true;
            }
        }

        // Check if ghost piece occupies this cell
        if (!isCurrent && ghostPosition && gameState.currentPiece) {
            const relX = x - ghostPosition.x;
            const relY = y - ghostPosition.y;

            if (
                relY >= 0 &&
                relY < gameState.currentPiece.shape.length &&
                relX >= 0 &&
                relX < gameState.currentPiece.shape[relY].length &&
                gameState.currentPiece.shape[relY][relX]
            ) {
                isGhost = true;
            }
        }

        return (
            <div
                key={`${x}-${y}`}
                className={`border border-muted/20 ${isGhost ? 'opacity-30' : ''}`}
                style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: isGhost ? gameState.currentPiece?.color : cellColor,
                }}
            />
        );
    };

    const renderNextPiece = () => {
        const size = gameState.nextPiece.shape.length;
        return (
            <div className="flex flex-col gap-1 p-2 bg-muted/30 rounded border border-primary/30">
                {gameState.nextPiece.shape.map((row, y) => (
                    <div key={y} className="flex gap-1">
                        {row.map((cell, x) => (
                            <div
                                key={x}
                                className="border border-muted/20"
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: cell ? gameState.nextPiece.color : 'transparent',
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex gap-4">
            {/* Main game board */}
            <div
                className="relative bg-black border-2 border-primary/50 rounded-lg overflow-hidden"
                style={{
                    width: `${GRID_WIDTH * cellSize}px`,
                    height: `${GRID_HEIGHT * cellSize}px`,
                }}
            >
                <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, ${cellSize}px)` }}>
                    {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                        Array.from({ length: GRID_WIDTH }, (_, x) => renderCell(x, y))
                    )}
                </div>

                {/* Game Over Overlay */}
                {gameState.isGameOver && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-4xl font-bold text-destructive neon-text mb-2">
                                GAME OVER
                            </h2>
                            <p className="text-2xl text-primary">Score: {gameState.score}</p>
                        </div>
                    </div>
                )}

                {/* Paused Overlay */}
                {gameState.isPaused && !gameState.isGameOver && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-4xl font-bold text-accent neon-text">
                                PAUSED
                            </h2>
                        </div>
                    </div>
                )}
            </div>

            {/* Next piece preview */}
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-2">NEXT</h3>
                    {renderNextPiece()}
                </div>
            </div>
        </div>
    );
};
