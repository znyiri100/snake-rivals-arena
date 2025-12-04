export type Position = {
    x: number;
    y: number;
};

export type Bullet = {
    x: number;
    y: number;
    isPlayerBullet: boolean;
};

export type Alien = {
    x: number;
    y: number;
    isAlive: boolean;
};

export type SpaceInvadersState = {
    player: Position;
    aliens: Alien[];
    playerBullets: Bullet[];
    alienBullets: Bullet[];
    score: number;
    isGameOver: boolean;
    isWon: boolean;
    alienDirection: number; // 1 for right, -1 for left
    alienSpeed: number;
    lastAlienMoveTime: number;
    lastAlienShootTime: number;
};

export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 30;
export const PLAYER_Y = GRID_HEIGHT - 2;
export const ALIEN_ROWS = 4;
export const ALIEN_COLS = 8;
export const ALIEN_SPACING_X = 4;
export const ALIEN_SPACING_Y = 3;
export const ALIEN_START_Y = 3;
export const INITIAL_ALIEN_SPEED = 500; // ms between moves
export const ALIEN_SHOOT_INTERVAL = 2000; // ms between alien shots
export const BULLET_SPEED = 200; // ms between bullet moves

export const createInitialState = (): SpaceInvadersState => {
    const aliens: Alien[] = [];

    // Create grid of aliens
    for (let row = 0; row < ALIEN_ROWS; row++) {
        for (let col = 0; col < ALIEN_COLS; col++) {
            aliens.push({
                x: 5 + col * ALIEN_SPACING_X,
                y: ALIEN_START_Y + row * ALIEN_SPACING_Y,
                isAlive: true,
            });
        }
    }

    return {
        player: { x: Math.floor(GRID_WIDTH / 2), y: PLAYER_Y },
        aliens,
        playerBullets: [],
        alienBullets: [],
        score: 0,
        isGameOver: false,
        isWon: false,
        alienDirection: 1,
        alienSpeed: INITIAL_ALIEN_SPEED,
        lastAlienMoveTime: Date.now(),
        lastAlienShootTime: Date.now(),
    };
};

export const movePlayer = (
    state: SpaceInvadersState,
    direction: 'left' | 'right'
): SpaceInvadersState => {
    if (state.isGameOver || state.isWon) return state;

    const newX = direction === 'left'
        ? Math.max(0, state.player.x - 1)
        : Math.min(GRID_WIDTH - 1, state.player.x + 1);

    return {
        ...state,
        player: { ...state.player, x: newX },
    };
};

export const shootPlayerBullet = (state: SpaceInvadersState): SpaceInvadersState => {
    if (state.isGameOver || state.isWon) return state;

    // Limit to 3 bullets on screen at once
    if (state.playerBullets.length >= 3) return state;

    return {
        ...state,
        playerBullets: [
            ...state.playerBullets,
            { x: state.player.x, y: state.player.y - 1, isPlayerBullet: true },
        ],
    };
};

export const updateBullets = (state: SpaceInvadersState): SpaceInvadersState => {
    if (state.isGameOver || state.isWon) return state;

    // Move player bullets up
    const playerBullets = state.playerBullets
        .map(bullet => ({ ...bullet, y: bullet.y - 1 }))
        .filter(bullet => bullet.y >= 0);

    // Move alien bullets down
    const alienBullets = state.alienBullets
        .map(bullet => ({ ...bullet, y: bullet.y + 1 }))
        .filter(bullet => bullet.y < GRID_HEIGHT);

    return {
        ...state,
        playerBullets,
        alienBullets,
    };
};

export const checkCollisions = (state: SpaceInvadersState): {
    state: SpaceInvadersState;
    aliensHit: number;
    playerHit: boolean;
} => {
    if (state.isGameOver || state.isWon) {
        return { state, aliensHit: 0, playerHit: false };
    }

    let aliens = [...state.aliens];
    let playerBullets = [...state.playerBullets];
    let alienBullets = [...state.alienBullets];
    let aliensHit = 0;
    let playerHit = false;

    // Check player bullets hitting aliens
    playerBullets = playerBullets.filter(bullet => {
        const hitAlienIndex = aliens.findIndex(
            alien => alien.isAlive &&
                Math.abs(alien.x - bullet.x) <= 1 &&
                Math.abs(alien.y - bullet.y) <= 1
        );

        if (hitAlienIndex !== -1) {
            aliens[hitAlienIndex] = { ...aliens[hitAlienIndex], isAlive: false };
            aliensHit++;
            return false; // Remove bullet
        }
        return true;
    });

    // Check alien bullets hitting player
    alienBullets = alienBullets.filter(bullet => {
        if (Math.abs(bullet.x - state.player.x) <= 1 &&
            Math.abs(bullet.y - state.player.y) <= 1) {
            playerHit = true;
            return false; // Remove bullet
        }
        return true;
    });

    const aliveAliens = aliens.filter(a => a.isAlive).length;
    const isWon = aliveAliens === 0;
    const isGameOver = playerHit;

    // Increase speed as aliens are destroyed
    const alienSpeed = Math.max(100, INITIAL_ALIEN_SPEED - (ALIEN_ROWS * ALIEN_COLS - aliveAliens) * 15);

    return {
        state: {
            ...state,
            aliens,
            playerBullets,
            alienBullets,
            isGameOver,
            isWon,
            alienSpeed,
            score: state.score + aliensHit * 10,
        },
        aliensHit,
        playerHit,
    };
};

export const moveAliens = (state: SpaceInvadersState): SpaceInvadersState => {
    if (state.isGameOver || state.isWon) return state;

    const now = Date.now();
    if (now - state.lastAlienMoveTime < state.alienSpeed) {
        return state;
    }

    let aliens = [...state.aliens];
    let alienDirection = state.alienDirection;
    let shouldMoveDown = false;

    // Check if any alien hit the edge
    const aliveAliens = aliens.filter(a => a.isAlive);
    const rightmost = Math.max(...aliveAliens.map(a => a.x));
    const leftmost = Math.min(...aliveAliens.map(a => a.x));

    if ((alienDirection === 1 && rightmost >= GRID_WIDTH - 2) ||
        (alienDirection === -1 && leftmost <= 1)) {
        alienDirection *= -1;
        shouldMoveDown = true;
    }

    // Move aliens
    aliens = aliens.map(alien => {
        if (!alien.isAlive) return alien;

        return {
            ...alien,
            x: shouldMoveDown ? alien.x : alien.x + alienDirection,
            y: shouldMoveDown ? alien.y + 1 : alien.y,
        };
    });

    // Check if aliens reached the bottom
    const lowestAlien = Math.max(...aliveAliens.map(a => a.y));
    const isGameOver = lowestAlien >= PLAYER_Y - 1;

    return {
        ...state,
        aliens,
        alienDirection,
        lastAlienMoveTime: now,
        isGameOver,
    };
};

export const alienShoot = (state: SpaceInvadersState): SpaceInvadersState => {
    if (state.isGameOver || state.isWon) return state;

    const now = Date.now();
    if (now - state.lastAlienShootTime < ALIEN_SHOOT_INTERVAL) {
        return state;
    }

    const aliveAliens = state.aliens.filter(a => a.isAlive);
    if (aliveAliens.length === 0) return state;

    // Pick a random alien to shoot
    const shootingAlien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];

    return {
        ...state,
        alienBullets: [
            ...state.alienBullets,
            { x: shootingAlien.x, y: shootingAlien.y + 1, isPlayerBullet: false },
        ],
        lastAlienShootTime: now,
    };
};

export const updateGame = (state: SpaceInvadersState): {
    state: SpaceInvadersState;
    aliensHit: number;
    playerHit: boolean;
} => {
    if (state.isGameOver || state.isWon) {
        return { state, aliensHit: 0, playerHit: false };
    }

    // Update all game elements
    let newState = moveAliens(state);
    newState = alienShoot(newState);
    newState = updateBullets(newState);

    // Check collisions
    return checkCollisions(newState);
};
