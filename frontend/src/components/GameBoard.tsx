import { useEffect, useRef } from 'react';
import type { GameState } from '@/utils/gameLogic';
import { GRID_SIZE, CELL_SIZE } from '@/utils/gameLogic';

interface GameBoardProps {
  gameState: GameState;
  isSpectating?: boolean;
}

export const GameBoard = ({ gameState, isSpectating = false }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<{ apple: HTMLImageElement; head: HTMLImageElement } | null>(null);

  useEffect(() => {
    // Load images
    const appleImg = new Image();
    appleImg.src = '/apple.png';

    const headImg = new Image();
    headImg.src = '/snake-head.jpg';

    imagesRef.current = { apple: appleImg, head: headImg };
  }, []);

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

    // Draw food
    if (imagesRef.current?.apple.complete) {
      ctx.drawImage(
        imagesRef.current.apple,
        gameState.food.x * CELL_SIZE,
        gameState.food.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    } else {
      // Fallback
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
    }

    // Draw snake
    gameState.snake.forEach((segment, index) => {
      const isHead = index === 0;

      if (isHead && imagesRef.current?.head.complete) {
        // Save context to rotate head
        ctx.save();
        const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.translate(centerX, centerY);

        // Determine rotation based on direction (if we had previous position, but for now just draw it)
        // Since we don't have direction easily in segment, we might need to infer it or just draw it upright
        // For now, let's just draw it. If we want rotation, we need to know where the next segment is.
        if (gameState.snake.length > 1) {
          const next = gameState.snake[1];
          const dx = segment.x - next.x;
          const dy = segment.y - next.y;
          let angle = 0;
          // Assuming the image points UP (towards negative Y) by default
          if (dx === 1) angle = Math.PI / 2; // Moving Right (head at x, next at x-1) -> rotate 90 deg clockwise from UP
          else if (dx === -1) angle = -Math.PI / 2; // Moving Left (head at x, next at x+1) -> rotate 90 deg counter-clockwise from UP
          else if (dy === 1) angle = Math.PI; // Moving Down (head at y, next at y-1) -> rotate 180 deg from UP
          else if (dy === -1) angle = 0; // Moving Up (head at y, next at y+1) -> no rotation from UP

          ctx.rotate(angle);
        }

        // Draw circular clip for head
        const HEAD_SCALE = 1.5;
        const HEAD_SIZE = CELL_SIZE * HEAD_SCALE;

        ctx.beginPath();
        ctx.arc(0, 0, HEAD_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(
          imagesRef.current.head,
          -HEAD_SIZE / 2,
          -HEAD_SIZE / 2,
          HEAD_SIZE,
          HEAD_SIZE
        );
        ctx.restore();
      } else {
        if (isHead) {
          // Fallback for head if image not loaded
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
      }
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
