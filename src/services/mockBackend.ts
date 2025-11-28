// Centralized mock backend service for all API calls

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  gameMode: 'passthrough' | 'walls';
  timestamp: Date;
}

export interface GameSession {
  id: string;
  userId: string;
  username: string;
  score: number;
  gameMode: 'passthrough' | 'walls';
  isActive: boolean;
}

// Mock data storage
let currentUser: User | null = null;
const users: Map<string, User & { password: string }> = new Map();
const leaderboard: LeaderboardEntry[] = [
  { id: '1', username: 'SnakeMaster', score: 2850, gameMode: 'walls', timestamp: new Date() },
  { id: '2', username: 'NeonKing', score: 2340, gameMode: 'passthrough', timestamp: new Date() },
  { id: '3', username: 'GridRunner', score: 2120, gameMode: 'walls', timestamp: new Date() },
  { id: '4', username: 'CyberSnake', score: 1890, gameMode: 'passthrough', timestamp: new Date() },
  { id: '5', username: 'ArcadeHero', score: 1650, gameMode: 'walls', timestamp: new Date() },
  { id: '6', username: 'PixelPro', score: 1420, gameMode: 'passthrough', timestamp: new Date() },
  { id: '7', username: 'RetroGamer', score: 1180, gameMode: 'walls', timestamp: new Date() },
  { id: '8', username: 'NeonViper', score: 950, gameMode: 'passthrough', timestamp: new Date() },
];

const activeSessions: GameSession[] = [
  { id: '1', userId: '1', username: 'SnakeMaster', score: 850, gameMode: 'walls', isActive: true },
  { id: '2', userId: '2', username: 'NeonKing', score: 620, gameMode: 'passthrough', isActive: true },
  { id: '3', userId: '3', username: 'GridRunner', score: 410, gameMode: 'walls', isActive: true },
];

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockBackend = {
  // Authentication
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await delay(500);
    
    const user = users.get(email);
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    currentUser = { id: user.id, username: user.username, email: user.email };
    return { success: true, user: currentUser };
  },

  async signup(username: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await delay(500);
    
    if (users.has(email)) {
      return { success: false, error: 'Email already exists' };
    }
    
    const newUser: User & { password: string } = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      password,
    };
    
    users.set(email, newUser);
    currentUser = { id: newUser.id, username: newUser.username, email: newUser.email };
    return { success: true, user: currentUser };
  },

  async logout(): Promise<void> {
    await delay(300);
    currentUser = null;
  },

  getCurrentUser(): User | null {
    return currentUser;
  },

  // Leaderboard
  async getLeaderboard(gameMode?: 'passthrough' | 'walls'): Promise<LeaderboardEntry[]> {
    await delay(300);
    
    let filtered = [...leaderboard];
    if (gameMode) {
      filtered = filtered.filter(entry => entry.gameMode === gameMode);
    }
    
    return filtered.sort((a, b) => b.score - a.score);
  },

  async submitScore(score: number, gameMode: 'passthrough' | 'walls'): Promise<void> {
    await delay(400);
    
    if (!currentUser) {
      throw new Error('Must be logged in to submit score');
    }
    
    const entry: LeaderboardEntry = {
      id: Math.random().toString(36).substr(2, 9),
      username: currentUser.username,
      score,
      gameMode,
      timestamp: new Date(),
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
  },

  // Active game sessions (for watching)
  async getActiveSessions(): Promise<GameSession[]> {
    await delay(200);
    return [...activeSessions];
  },

  async getSessionById(id: string): Promise<GameSession | null> {
    await delay(200);
    return activeSessions.find(session => session.id === id) || null;
  },

  // Simulate active session updates
  updateSessionScore(sessionId: string, score: number): void {
    const session = activeSessions.find(s => s.id === sessionId);
    if (session) {
      session.score = score;
    }
  },
};
