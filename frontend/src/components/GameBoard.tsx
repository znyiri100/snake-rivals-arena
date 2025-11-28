import { useEffect, useRef } from 'react';
import type { GameState } from '@/utils/gameLogic';
import { GRID_SIZE, CELL_SIZE } from '@/utils/gameLogic';

interface GameBoardProps {
  gameState: GameState;
  isSpectating?: boolean;
}

export const GameBoard = ({ gameState, isSpectating = false }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(260, 40%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'hsl(260, 30%, 25%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food with glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'hsl(48, 100%, 50%)';
    ctx.fillStyle = 'hsl(48, 100%, 50%)';
    ctx.fillRect(
      gameState.food.x * CELL_SIZE + 2,
      gameState.food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
    ctx.shadowBlur = 0;

    // Draw snake with gradient and glow
    gameState.snake.forEach((segment, index) => {
      const isHead = index === 0;
      
      if (isHead) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'hsl(142, 76%, 50%)';
        ctx.fillStyle = 'hsl(142, 76%, 50%)';
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'hsl(142, 76%, 40%)';
        const alpha = 1 - (index / gameState.snake.length) * 0.3;
        ctx.fillStyle = `hsl(142, 76%, ${40 + index * 2}%, ${alpha})`;
      }

      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
    ctx.shadowBlur = 0;

    // Draw game over overlay
    if (gameState.isGameOver && !isSpectating) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 24px Orbitron, monospace';
      ctx.fillStyle = 'hsl(0, 100%, 60%)';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'hsl(0, 100%, 60%)';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      ctx.shadowBlur = 0;
    }

    // Draw pause overlay
    if (gameState.isPaused && !isSpectating) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 20px Orbitron, monospace';
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'hsl(180, 100%, 50%)';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.shadowBlur = 0;
    }
  }, [gameState, isSpectating]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="border-2 border-primary rounded-sm neon-border scanline"
      />
      {isSpectating && (
        <div className="absolute top-2 right-2 px-3 py-1 bg-card/90 border border-border rounded text-xs text-secondary neon-text">
          SPECTATING
        </div>
      )}
    </div>
  );
};
