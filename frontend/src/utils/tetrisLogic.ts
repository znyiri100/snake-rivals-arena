// Tetris game logic

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Cell = {
    filled: boolean;
    color: string;
};

export type Tetromino = {
    type: TetrominoType;
    shape: number[][];
    color: string;
};

export type Position = {
    x: number;
    y: number;
};

export type TetrisState = {
    grid: Cell[][];
    currentPiece: Tetromino | null;
    currentPosition: Position;
    nextPiece: Tetromino;
    score: number;
    level: number;
    lines: number;
    isGameOver: boolean;
    isPaused: boolean;
};

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;
export const INITIAL_SPEED = 1000; // ms per drop

// Tetromino definitions
const TETROMINOES: Record<TetrominoType, { shape: number[][], color: string }> = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: '#00f0f0', // Cyan
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: '#f0f000', // Yellow
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: '#a000f0', // Purple
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        color: '#00f000', // Green
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        color: '#f00000', // Red
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: '#0000f0', // Blue
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: '#f0a000', // Orange
    },
};

const createEmptyGrid = (): Cell[][] => {
    return Array(GRID_HEIGHT).fill(null).map(() =>
        Array(GRID_WIDTH).fill(null).map(() => ({ filled: false, color: '' }))
    );
};

const getRandomTetromino = (): Tetromino => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const type = types[Math.floor(Math.random() * types.length)];
    const { shape, color } = TETROMINOES[type];
    return { type, shape, color };
};

export const createInitialState = (): TetrisState => {
    return {
        grid: createEmptyGrid(),
        currentPiece: getRandomTetromino(),
        currentPosition: { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 },
        nextPiece: getRandomTetromino(),
        score: 0,
        level: 1,
        lines: 0,
        isGameOver: false,
        isPaused: false,
    };
};

const rotatePiece = (piece: Tetromino): Tetromino => {
    const size = piece.shape.length;
    const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            rotated[x][size - 1 - y] = piece.shape[y][x];
        }
    }

    return { ...piece, shape: rotated };
};

const checkCollision = (
    grid: Cell[][],
    piece: Tetromino,
    position: Position
): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = position.x + x;
                const newY = position.y + y;

                // Check boundaries
                if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
                    return true;
                }

                // Check collision with existing blocks (but not if we're above the grid)
                if (newY >= 0 && grid[newY][newX].filled) {
                    return true;
                }
            }
        }
    }
    return false;
};

export const movePiece = (
    state: TetrisState,
    direction: 'left' | 'right' | 'down'
): TetrisState => {
    if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

    const offset = direction === 'left' ? { x: -1, y: 0 } :
        direction === 'right' ? { x: 1, y: 0 } :
            { x: 0, y: 1 };

    const newPosition = {
        x: state.currentPosition.x + offset.x,
        y: state.currentPosition.y + offset.y,
    };

    if (!checkCollision(state.grid, state.currentPiece, newPosition)) {
        return { ...state, currentPosition: newPosition };
    }

    return state;
};

export const rotatePieceInState = (state: TetrisState): TetrisState => {
    if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

    const rotated = rotatePiece(state.currentPiece);

    // Try to rotate, with wall kicks
    const kicks = [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
    ];

    for (const kick of kicks) {
        const newPosition = {
            x: state.currentPosition.x + kick.x,
            y: state.currentPosition.y + kick.y,
        };

        if (!checkCollision(state.grid, rotated, newPosition)) {
            return {
                ...state,
                currentPiece: rotated,
                currentPosition: newPosition,
            };
        }
    }

    return state;
};

export const hardDrop = (state: TetrisState): TetrisState => {
    if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

    let newState = { ...state };
    let dropDistance = 0;

    while (true) {
        const testPosition = {
            x: newState.currentPosition.x,
            y: newState.currentPosition.y + 1,
        };

        if (checkCollision(newState.grid, newState.currentPiece, testPosition)) {
            break;
        }

        newState.currentPosition = testPosition;
        dropDistance++;
    }

    // Add bonus points for hard drop
    newState.score += dropDistance * 2;

    return lockPiece(newState);
};

const lockPiece = (state: TetrisState): TetrisState => {
    if (!state.currentPiece) return state;

    const newGrid = state.grid.map(row => [...row]);

    // Lock the piece into the grid
    for (let y = 0; y < state.currentPiece.shape.length; y++) {
        for (let x = 0; x < state.currentPiece.shape[y].length; x++) {
            if (state.currentPiece.shape[y][x]) {
                const gridY = state.currentPosition.y + y;
                const gridX = state.currentPosition.x + x;

                if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                    newGrid[gridY][gridX] = {
                        filled: true,
                        color: state.currentPiece.color,
                    };
                }
            }
        }
    }

    // Clear completed lines
    const { grid: clearedGrid, linesCleared } = clearLines(newGrid);

    // Calculate score
    const lineScores = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
    const scoreGain = lineScores[linesCleared] * state.level;
    const newLines = state.lines + linesCleared;
    const newLevel = Math.floor(newLines / 10) + 1;

    // Spawn next piece
    const newPiece = state.nextPiece;
    const newPosition = { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 };

    // Check if game over (new piece collides immediately)
    const isGameOver = checkCollision(clearedGrid, newPiece, newPosition);

    return {
        ...state,
        grid: clearedGrid,
        currentPiece: newPiece,
        currentPosition: newPosition,
        nextPiece: getRandomTetromino(),
        score: state.score + scoreGain,
        level: newLevel,
        lines: newLines,
        isGameOver,
    };
};

const clearLines = (grid: Cell[][]): { grid: Cell[][], linesCleared: number } => {
    const newGrid: Cell[][] = [];
    let linesCleared = 0;

    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
        const isComplete = grid[y].every(cell => cell.filled);

        if (!isComplete) {
            newGrid.unshift(grid[y]);
        } else {
            linesCleared++;
        }
    }

    // Add empty rows at the top
    while (newGrid.length < GRID_HEIGHT) {
        newGrid.unshift(Array(GRID_WIDTH).fill(null).map(() => ({ filled: false, color: '' })));
    }

    return { grid: newGrid, linesCleared };
};

export const dropPiece = (state: TetrisState): TetrisState => {
    if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

    const newPosition = {
        x: state.currentPosition.x,
        y: state.currentPosition.y + 1,
    };

    if (!checkCollision(state.grid, state.currentPiece, newPosition)) {
        return { ...state, currentPosition: newPosition };
    }

    // Piece has landed, lock it
    return lockPiece(state);
};

export const togglePause = (state: TetrisState): TetrisState => {
    if (state.isGameOver) return state;
    return { ...state, isPaused: !state.isPaused };
};

export const getDropSpeed = (level: number): number => {
    return Math.max(100, INITIAL_SPEED - (level - 1) * 100);
};

// Get ghost piece position (where piece will land)
export const getGhostPosition = (state: TetrisState): Position => {
    if (!state.currentPiece) return state.currentPosition;

    let ghostY = state.currentPosition.y;

    while (true) {
        const testPosition = {
            x: state.currentPosition.x,
            y: ghostY + 1,
        };

        if (checkCollision(state.grid, state.currentPiece, testPosition)) {
            break;
        }

        ghostY++;
    }

    return { x: state.currentPosition.x, y: ghostY };
};
