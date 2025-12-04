export type CellStatus = 'hidden' | 'revealed' | 'flagged' | 'exploded';

export interface Cell {
    x: number;
    y: number;
    isMine: boolean;
    neighborMines: number;
    status: CellStatus;
}

export interface MinesweeperState {
    grid: Cell[][];
    rows: number;
    cols: number;
    mineCount: number;
    isGameOver: boolean;
    isWon: boolean;
    minesLeft: number; // For display (total mines - flags)
}

export const createBoard = (rows: number, cols: number, mineCount: number): Cell[][] => {
    // Initialize empty grid
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < cols; x++) {
            row.push({
                x,
                y,
                isMine: false,
                neighborMines: 0,
                status: 'hidden',
            });
        }
        grid.push(row);
    }

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);

        if (!grid[y][x].isMine) {
            grid[y][x].isMine = true;
            minesPlaced++;
        }
    }

    // Calculate neighbor mines
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!grid[y][x].isMine) {
                let neighbors = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (
                            ny >= 0 &&
                            ny < rows &&
                            nx >= 0 &&
                            nx < cols &&
                            grid[ny][nx].isMine
                        ) {
                            neighbors++;
                        }
                    }
                }
                grid[y][x].neighborMines = neighbors;
            }
        }
    }

    return grid;
};

export const revealCell = (
    grid: Cell[][],
    x: number,
    y: number
): { grid: Cell[][]; isGameOver: boolean; isWon: boolean } => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newGrid[y][x];

    if (cell.status !== 'hidden') {
        return { grid: newGrid, isGameOver: false, isWon: false };
    }

    if (cell.isMine) {
        cell.status = 'exploded';
        // Reveal all mines
        newGrid.forEach((row) =>
            row.forEach((c) => {
                if (c.isMine) c.status = 'exploded';
            })
        );
        return { grid: newGrid, isGameOver: true, isWon: false };
    }

    // Flood fill
    const stack = [{ x, y }];
    while (stack.length > 0) {
        const { x: cx, y: cy } = stack.pop()!;
        const currentCell = newGrid[cy][cx];

        if (currentCell.status !== 'hidden') continue;

        currentCell.status = 'revealed';

        if (currentCell.neighborMines === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = cy + dy;
                    const nx = cx + dx;
                    if (
                        ny >= 0 &&
                        ny < newGrid.length &&
                        nx >= 0 &&
                        nx < newGrid[0].length &&
                        newGrid[ny][nx].status === 'hidden'
                    ) {
                        stack.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }

    // Check win condition
    const isWon = checkWin(newGrid);
    if (isWon) {
        // Flag all mines on win
        newGrid.forEach(row => row.forEach(c => {
            if (c.isMine) c.status = 'flagged';
        }));
    }

    return { grid: newGrid, isGameOver: false, isWon };
};

export const toggleFlag = (
    grid: Cell[][],
    x: number,
    y: number
): { grid: Cell[][]; minesLeftChange: number } => {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newGrid[y][x];

    let minesLeftChange = 0;
    if (cell.status === 'hidden') {
        cell.status = 'flagged';
        minesLeftChange = -1;
    } else if (cell.status === 'flagged') {
        cell.status = 'hidden';
        minesLeftChange = 1;
    }

    return { grid: newGrid, minesLeftChange };
};

const checkWin = (grid: Cell[][]): boolean => {
    for (const row of grid) {
        for (const cell of row) {
            if (!cell.isMine && cell.status !== 'revealed') {
                return false;
            }
        }
    }
    return true;
};
