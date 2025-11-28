import { describe, it, expect } from 'vitest';
import {
  getInitialGameState,
  generateFood,
  isOppositeDirection,
  getNextPosition,
  handlePassthrough,
  checkWallCollision,
  checkSelfCollision,
  checkFoodCollision,
  moveSnake,
  GRID_SIZE,
  type Position,
  type Direction,
} from '../gameLogic';

describe('gameLogic', () => {
  describe('getInitialGameState', () => {
    it('should create initial state for passthrough mode', () => {
      const state = getInitialGameState('passthrough');
      expect(state.gameMode).toBe('passthrough');
      expect(state.snake.length).toBe(3);
      expect(state.score).toBe(0);
      expect(state.isGameOver).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('should create initial state for walls mode', () => {
      const state = getInitialGameState('walls');
      expect(state.gameMode).toBe('walls');
      expect(state.snake.length).toBe(3);
    });
  });

  describe('generateFood', () => {
    it('should generate food not on snake', () => {
      const snake: Position[] = [{ x: 10, y: 10 }];
      const food = generateFood(snake);
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE);
      expect(snake.some(s => s.x === food.x && s.y === food.y)).toBe(false);
    });
  });

  describe('isOppositeDirection', () => {
    it('should detect opposite directions', () => {
      expect(isOppositeDirection('UP', 'DOWN')).toBe(true);
      expect(isOppositeDirection('DOWN', 'UP')).toBe(true);
      expect(isOppositeDirection('LEFT', 'RIGHT')).toBe(true);
      expect(isOppositeDirection('RIGHT', 'LEFT')).toBe(true);
    });

    it('should not detect same or perpendicular directions as opposite', () => {
      expect(isOppositeDirection('UP', 'UP')).toBe(false);
      expect(isOppositeDirection('UP', 'LEFT')).toBe(false);
      expect(isOppositeDirection('LEFT', 'UP')).toBe(false);
    });
  });

  describe('getNextPosition', () => {
    it('should calculate next position for each direction', () => {
      const head: Position = { x: 5, y: 5 };
      
      expect(getNextPosition(head, 'UP')).toEqual({ x: 5, y: 4 });
      expect(getNextPosition(head, 'DOWN')).toEqual({ x: 5, y: 6 });
      expect(getNextPosition(head, 'LEFT')).toEqual({ x: 4, y: 5 });
      expect(getNextPosition(head, 'RIGHT')).toEqual({ x: 6, y: 5 });
    });
  });

  describe('handlePassthrough', () => {
    it('should wrap position from right to left', () => {
      const pos = { x: GRID_SIZE, y: 10 };
      expect(handlePassthrough(pos)).toEqual({ x: 0, y: 10 });
    });

    it('should wrap position from left to right', () => {
      const pos = { x: -1, y: 10 };
      expect(handlePassthrough(pos)).toEqual({ x: GRID_SIZE - 1, y: 10 });
    });

    it('should wrap position from bottom to top', () => {
      const pos = { x: 10, y: GRID_SIZE };
      expect(handlePassthrough(pos)).toEqual({ x: 10, y: 0 });
    });

    it('should wrap position from top to bottom', () => {
      const pos = { x: 10, y: -1 };
      expect(handlePassthrough(pos)).toEqual({ x: 10, y: GRID_SIZE - 1 });
    });
  });

  describe('checkWallCollision', () => {
    it('should detect collision with walls', () => {
      expect(checkWallCollision({ x: -1, y: 10 })).toBe(true);
      expect(checkWallCollision({ x: GRID_SIZE, y: 10 })).toBe(true);
      expect(checkWallCollision({ x: 10, y: -1 })).toBe(true);
      expect(checkWallCollision({ x: 10, y: GRID_SIZE })).toBe(true);
    });

    it('should not detect collision within bounds', () => {
      expect(checkWallCollision({ x: 0, y: 0 })).toBe(false);
      expect(checkWallCollision({ x: 10, y: 10 })).toBe(false);
      expect(checkWallCollision({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })).toBe(false);
    });
  });

  describe('checkSelfCollision', () => {
    it('should detect collision with snake body', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
      ];
      expect(checkSelfCollision({ x: 4, y: 5 }, snake)).toBe(true);
    });

    it('should not detect collision with empty space', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ];
      expect(checkSelfCollision({ x: 6, y: 5 }, snake)).toBe(false);
    });
  });

  describe('checkFoodCollision', () => {
    it('should detect when head is on food', () => {
      expect(checkFoodCollision({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(true);
    });

    it('should not detect when head is not on food', () => {
      expect(checkFoodCollision({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(false);
    });
  });

  describe('moveSnake', () => {
    it('should move snake forward', () => {
      const state = getInitialGameState('walls');
      const newState = moveSnake(state);
      expect(newState.snake[0]).not.toEqual(state.snake[0]);
      expect(newState.snake.length).toBe(state.snake.length);
    });

    it('should grow snake when eating food', () => {
      const state = getInitialGameState('walls');
      // Position food right in front of snake
      state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
      const newState = moveSnake(state);
      expect(newState.snake.length).toBe(state.snake.length + 1);
      expect(newState.score).toBe(state.score + 10);
    });

    it('should end game on wall collision in walls mode', () => {
      const state = getInitialGameState('walls');
      state.snake = [{ x: 0, y: 10 }];
      state.direction = 'LEFT';
      const newState = moveSnake(state);
      expect(newState.isGameOver).toBe(true);
    });

    it('should wrap around in passthrough mode', () => {
      const state = getInitialGameState('passthrough');
      state.snake = [{ x: 0, y: 10 }];
      state.direction = 'LEFT';
      const newState = moveSnake(state);
      expect(newState.isGameOver).toBe(false);
      expect(newState.snake[0].x).toBe(GRID_SIZE - 1);
    });

    it('should not move when paused', () => {
      const state = getInitialGameState('walls');
      state.isPaused = true;
      const newState = moveSnake(state);
      expect(newState.snake).toEqual(state.snake);
    });

    it('should not move when game over', () => {
      const state = getInitialGameState('walls');
      state.isGameOver = true;
      const newState = moveSnake(state);
      expect(newState.snake).toEqual(state.snake);
    });

    it('should end game on self collision', () => {
      const state = getInitialGameState('walls');
      state.snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
      ];
      state.direction = 'DOWN';
      const newState = moveSnake(state);
      expect(newState.isGameOver).toBe(true);
    });
  });
});
