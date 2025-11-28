// AI player logic for simulating other players

import type { Direction, Position, GameState } from './gameLogic';
import { 
  getNextPosition, 
  handlePassthrough, 
  checkWallCollision, 
  checkSelfCollision,
  GRID_SIZE 
} from './gameLogic';

export class AIPlayer {
  private state: GameState;
  private nextDirection: Direction | null = null;

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): GameState {
    return this.state;
  }

  setState(state: GameState): void {
    this.state = state;
  }

  // Simple AI that tries to move towards food while avoiding collisions
  calculateNextMove(): Direction {
    if (this.nextDirection) {
      const temp = this.nextDirection;
      this.nextDirection = null;
      return temp;
    }

    const head = this.state.snake[0];
    const food = this.state.food;
    const currentDirection = this.state.direction;

    // Calculate directions to food
    const dx = food.x - head.x;
    const dy = food.y - head.y;

    // Prioritize horizontal or vertical movement based on distance
    const possibleDirections: Direction[] = [];
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Prioritize horizontal movement
      if (dx > 0) possibleDirections.push('RIGHT');
      if (dx < 0) possibleDirections.push('LEFT');
      if (dy > 0) possibleDirections.push('DOWN');
      if (dy < 0) possibleDirections.push('UP');
    } else {
      // Prioritize vertical movement
      if (dy > 0) possibleDirections.push('DOWN');
      if (dy < 0) possibleDirections.push('UP');
      if (dx > 0) possibleDirections.push('RIGHT');
      if (dx < 0) possibleDirections.push('LEFT');
    }

    // Add current direction as fallback
    possibleDirections.push(currentDirection);

    // Try each direction and pick the first safe one
    for (const direction of possibleDirections) {
      if (this.isOppositeDirection(currentDirection, direction)) {
        continue;
      }

      if (this.isSafeMove(head, direction)) {
        return direction;
      }
    }

    // If no safe move towards food, try any safe direction
    const allDirections: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    for (const direction of allDirections) {
      if (this.isOppositeDirection(currentDirection, direction)) {
        continue;
      }

      if (this.isSafeMove(head, direction)) {
        return direction;
      }
    }

    // Last resort: continue current direction
    return currentDirection;
  }

  private isOppositeDirection(current: Direction, next: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    return opposites[current] === next;
  }

  private isSafeMove(head: Position, direction: Direction): boolean {
    let nextPos = getNextPosition(head, direction);

    // Handle passthrough mode
    if (this.state.gameMode === 'passthrough') {
      nextPos = handlePassthrough(nextPos);
    } else if (checkWallCollision(nextPos)) {
      return false;
    }

    // Check if would collide with self
    return !checkSelfCollision(nextPos, this.state.snake);
  }

  // Add some randomness to make AI more interesting
  maybeChangeDirection(): void {
    // 10% chance to make a random valid move
    if (Math.random() < 0.1) {
      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const validDirections = directions.filter(dir => 
        !this.isOppositeDirection(this.state.direction, dir) &&
        this.isSafeMove(this.state.snake[0], dir)
      );

      if (validDirections.length > 0) {
        this.nextDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
      }
    }
  }
}
