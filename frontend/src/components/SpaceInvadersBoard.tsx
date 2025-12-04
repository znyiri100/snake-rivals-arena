import { SpaceInvadersState } from '@/utils/spaceInvadersLogic';

interface SpaceInvadersBoardProps {
    gameState: SpaceInvadersState;
    gridWidth: number;
    gridHeight: number;
}

export const SpaceInvadersBoard = ({ gameState, gridWidth, gridHeight }: SpaceInvadersBoardProps) => {
    const cellSize = 16; // pixels

    return (
        <div
            className="relative bg-black border-2 border-primary/50 rounded-lg overflow-hidden"
            style={{
                width: `${gridWidth * cellSize}px`,
                height: `${gridHeight * cellSize}px`,
            }}
        >
            {/* Player */}
            <div
                className="absolute bg-primary rounded transition-all duration-100"
                style={{
                    left: `${gameState.player.x * cellSize}px`,
                    top: `${gameState.player.y * cellSize}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                }}
            >
                <div className="w-full h-full flex items-center justify-center text-xs">
                    🚀
                </div>
            </div>

            {/* Aliens */}
            {gameState.aliens.map((alien, index) =>
                alien.isAlive && (
                    <div
                        key={index}
                        className="absolute bg-destructive rounded transition-all duration-300"
                        style={{
                            left: `${alien.x * cellSize}px`,
                            top: `${alien.y * cellSize}px`,
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                        }}
                    >
                        <div className="w-full h-full flex items-center justify-center text-xs">
                            👾
                        </div>
                    </div>
                )
            )}

            {/* Player Bullets */}
            {gameState.playerBullets.map((bullet, index) => (
                <div
                    key={`player-bullet-${index}`}
                    className="absolute bg-accent rounded-full"
                    style={{
                        left: `${bullet.x * cellSize + cellSize / 4}px`,
                        top: `${bullet.y * cellSize}px`,
                        width: `${cellSize / 2}px`,
                        height: `${cellSize}px`,
                    }}
                />
            ))}

            {/* Alien Bullets */}
            {gameState.alienBullets.map((bullet, index) => (
                <div
                    key={`alien-bullet-${index}`}
                    className="absolute bg-destructive rounded-full"
                    style={{
                        left: `${bullet.x * cellSize + cellSize / 4}px`,
                        top: `${bullet.y * cellSize}px`,
                        width: `${cellSize / 2}px`,
                        height: `${cellSize}px`,
                    }}
                />
            ))}

            {/* Game Over Overlay */}
            {(gameState.isGameOver || gameState.isWon) && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className={`text-4xl font-bold mb-2 ${gameState.isWon ? 'text-accent' : 'text-destructive'} neon-text`}>
                            {gameState.isWon ? 'VICTORY!' : 'GAME OVER'}
                        </h2>
                        <p className="text-2xl text-primary">Score: {gameState.score}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
