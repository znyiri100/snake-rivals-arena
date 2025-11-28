// API service interacting with the FastAPI backend

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

const API_URL = 'http://localhost:8000';

class ApiService {
    private token: string | null = localStorage.getItem('token');

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Authentication
    async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.detail || 'Login failed' };
            }

            const data = await response.json();
            this.token = data.token;
            localStorage.setItem('token', data.token);
            this.cachedUser = data.user;
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    async signup(username: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.detail || 'Signup failed' };
            }

            const data = await response.json();
            this.token = data.token;
            localStorage.setItem('token', data.token);
            this.cachedUser = data.user;
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    async logout(): Promise<void> {
        this.token = null;
        this.cachedUser = null;
        localStorage.removeItem('token');
        // Optional: Call backend logout if needed, but JWT is stateless usually
        try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
        } catch (e) {
            // Ignore logout errors
        }
    }

    getCurrentUser(): User | null {
        // In a real app, we might decode the token or fetch /auth/me
        // For now, we'll rely on the app state or fetch it if needed.
        // But the mockBackend was synchronous for this. 
        // To match the interface, we might need to store the user in memory or change the interface to async.
        // The existing components expect this to be synchronous (based on mockBackend).
        // Let's see how it's used.
        // Index.tsx: const [user, setUser] = useState(mockBackend.getCurrentUser());
        // It seems it expects a synchronous return.
        // We can't do that easily with a real API unless we cache the user object on login/init.

        // For this step, I'll return null and expect the app to fetch 'me' async, 
        // OR I will implement a simple cache.
        // Let's try to fetch 'me' on app load and cache it.
        // But for the synchronous method, I'll return a cached user if available.
        return this.cachedUser;
    }

    private cachedUser: User | null = null;

    async fetchCurrentUser(): Promise<User | null> {
        if (!this.token) return null;
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: this.getHeaders()
            });
            if (response.ok) {
                this.cachedUser = await response.json();
                return this.cachedUser;
            }
        } catch (e) {
            console.error("Failed to fetch user", e);
        }
        return null;
    }

    // Leaderboard
    async getLeaderboard(gameMode?: 'passthrough' | 'walls'): Promise<LeaderboardEntry[]> {
        const url = new URL(`${API_URL}/leaderboard`);
        if (gameMode) {
            url.searchParams.append('gameMode', gameMode);
        }
        const response = await fetch(url.toString());
        if (!response.ok) return [];
        return await response.json();
    }

    async submitScore(score: number, gameMode: 'passthrough' | 'walls'): Promise<void> {
        await fetch(`${API_URL}/leaderboard`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ score, gameMode }),
        });
    }

    // Active game sessions
    async getActiveSessions(): Promise<GameSession[]> {
        const response = await fetch(`${API_URL}/sessions`);
        if (!response.ok) return [];
        return await response.json();
    }

    async getSessionById(id: string): Promise<GameSession | null> {
        const response = await fetch(`${API_URL}/sessions/${id}`);
        if (!response.ok) return null;
        return await response.json();
    }

    // Simulate active session updates (Not supported by backend yet, so no-op or socket)
    updateSessionScore(sessionId: string, score: number): void {
        // This was for local mock updates. Real backend would need WebSockets or polling.
        // For now, do nothing.
    }

    // For testing/reset
    reset(): void {
        this.logout();
    }
}

export const api = new ApiService();
