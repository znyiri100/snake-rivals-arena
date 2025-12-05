// API service interacting with the FastAPI backend

export interface Group {
    id: string;
    name: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    groups: Group[];
}

export interface LeaderboardEntry {
    id: string;
    username: string;
    score: number;
    gameMode: 'snake' | 'minesweeper' | 'space_invaders' | 'tetris';
    timestamp: Date;
    groups?: Group[];
}

export interface RankedScore {
    id: string;
    username: string;
    score: number;
    game_mode: string;
    rank: number;
    timestamp: Date;
    groups?: Group[];
}

export interface UserGameModeRank {
    username: string;
    game_mode: string;
    best_score: number;
    games_played: number;
    rank: number;
    groups?: Group[];
}

export interface OverallRanking {
    username: string;
    modes_played: number;
    total_best_scores: number;
    avg_rank: number;
    overall_rank: number;
    groups?: Group[];
}



const API_URL = '/api';

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

    async signup(username: string, email: string, password: string, newGroupName?: string, groupIds?: string[]): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    new_group_name: newGroupName,
                    group_ids: groupIds
                }),
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
    async getLeaderboard(gameMode?: 'snake' | 'minesweeper' | 'space_invaders' | 'tetris', groupId?: string): Promise<LeaderboardEntry[]> {
        let url = `${API_URL}/leaderboard?`;
        if (gameMode) {
            url += `gameMode=${gameMode}&`;
        }
        if (groupId) {
            url += `group_id=${groupId}&`;
        }
        const response = await fetch(url, { headers: this.getHeaders() });
        if (!response.ok) return [];
        return await response.json();
    }

    async submitScore(score: number, gameMode: 'snake' | 'minesweeper' | 'space_invaders' | 'tetris'): Promise<void> {
        const response = await fetch(`${API_URL}/leaderboard`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ score, gameMode }),
        });
        if (!response.ok) {
            throw new Error('Failed to submit score');
        }
    }

    // Active game sessions


    // Simulate active session updates (Not supported by backend yet, so no-op or socket)


    // Groups
    async getGroups(): Promise<Group[]> {
        try {
            const response = await fetch(`${API_URL}/auth/groups`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch groups", e);
            return [];
        }
    }

    // Ranking endpoints
    async getAllScoresRanked(gameMode?: 'snake' | 'minesweeper' | 'space_invaders' | 'tetris', groupId?: string): Promise<RankedScore[]> {
        let url = `${API_URL}/leaderboard/rankings/all-scores?`;
        if (gameMode) {
            url += `gameMode=${gameMode}&`;
        }
        if (groupId) {
            url += `group_id=${groupId}&`;
        }
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch all scores ranked", e);
            return [];
        }
    }

    async getBestPerUserPerMode(gameMode?: 'snake' | 'minesweeper' | 'space_invaders' | 'tetris', groupId?: string): Promise<UserGameModeRank[]> {
        let url = `${API_URL}/leaderboard/rankings/best-per-user?`;
        if (gameMode) {
            url += `gameMode=${gameMode}&`;
        }
        if (groupId) {
            url += `group_id=${groupId}&`;
        }
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch best per user", e);
            return [];
        }
    }

    async getTopNPerMode(limit: number = 10, groupId?: string): Promise<Record<string, UserGameModeRank[]>> {
        let url = `${API_URL}/leaderboard/rankings/top-n?limit=${limit}`;
        if (groupId) {
            url += `&group_id=${groupId}`;
        }
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) return {};
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch top N per mode", e);
            return {};
        }
    }

    async getOverallRankings(groupId?: string): Promise<OverallRanking[]> {
        let url = `${API_URL}/leaderboard/rankings/overall?`;
        if (groupId) {
            url += `group_id=${groupId}`;
        }
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch overall rankings", e);
            return [];
        }
    }

    // For testing/reset
    reset(): void {
        this.logout();
    }
}

export const api = new ApiService();
