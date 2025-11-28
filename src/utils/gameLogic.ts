// Game logic utilities

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameMode = 'passthrough' | 'walls';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  gameMode: GameMode;
}

export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const INITIAL_SPEED = 150;
export const SPEED_INCREMENT = 5;

export const getInitialGameState = (gameMode: GameMode): GameState => ({
  snake: [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ],
  food: generateFood([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]),
  direction: 'RIGHT',
  score: 0,
  isGameOver: false,
  isPaused: false,
  gameMode,
});

export const generateFood = (snake: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  return food;
};

export const isOppositeDirection = (current: Direction, next: Direction): boolean => {
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };
  return opposites[current] === next;
};

export const getNextPosition = (head: Position, direction: Direction): Position => {
  const movements: Record<Direction, Position> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
  };
  
  const movement = movements[direction];
  return {
    x: head.x + movement.x,
    y: head.y + movement.y,
  };
};

export const handlePassthrough = (position: Position): Position => {
  return {
    x: (position.x + GRID_SIZE) % GRID_SIZE,
    y: (position.y + GRID_SIZE) % GRID_SIZE,
  };
};

export const checkWallCollision = (position: Position): boolean => {
  return (
    position.x < 0 ||
    position.x >= GRID_SIZE ||
    position.y < 0 ||
    position.y >= GRID_SIZE
  );
};

export const checkSelfCollision = (head: Position, snake: Position[]): boolean => {
  return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
};

export const checkFoodCollision = (head: Position, food: Position): boolean => {
  return head.x === food.x && head.y === food.y;
};

export const moveSnake = (state: GameState): GameState => {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  const head = state.snake[0];
  let newHead = getNextPosition(head, state.direction);

  // Handle game mode specific behavior
  if (state.gameMode === 'passthrough') {
    newHead = handlePassthrough(newHead);
  } else if (checkWallCollision(newHead)) {
    return { ...state, isGameOver: true };
  }

  // Check self collision
  if (checkSelfCollision(newHead, state.snake)) {
    return { ...state, isGameOver: true };
  }

  const newSnake = [newHead, ...state.snake];
  
  // Check food collision
  if (checkFoodCollision(newHead, state.food)) {
    return {
      ...state,
      snake: newSnake,
      food: generateFood(newSnake),
      score: state.score + 10,
    };
  }

  // Remove tail if no food eaten
  newSnake.pop();

  return {
    ...state,
    snake: newSnake,
  };
};

export const calculateGameSpeed = (score: number): number => {
  return Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * SPEED_INCREMENT);
};
