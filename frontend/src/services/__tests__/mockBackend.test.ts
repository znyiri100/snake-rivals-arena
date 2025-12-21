import { describe, it, expect, beforeEach } from 'vitest';
import { mockBackend } from '../mockBackend';

describe('mockBackend', () => {
  beforeEach(async () => {
    mockBackend.reset();
  });

  describe('Authentication', () => {
    it('should sign up a new user', async () => {
      const result = await mockBackend.signup('testuser', 'test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should not allow duplicate email signup', async () => {
      await mockBackend.signup('user1', 'test@example.com', 'pass1');
      const result = await mockBackend.signup('user2', 'test@example.com', 'pass2');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should login with correct credentials', async () => {
      await mockBackend.signup('testuser', 'test@example.com', 'password123');
      await mockBackend.logout();

      const result = await mockBackend.login('test@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('testuser');
    });

    it('should not login with incorrect password', async () => {
      await mockBackend.signup('testuser', 'test@example.com', 'password123');
      await mockBackend.logout();

      const result = await mockBackend.login('test@example.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not login with non-existent email', async () => {
      const result = await mockBackend.login('nonexistent@example.com', 'password');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should logout user', async () => {
      await mockBackend.signup('testuser', 'test@example.com', 'password123');
      expect(mockBackend.getCurrentUser()).not.toBeNull();

      await mockBackend.logout();
      expect(mockBackend.getCurrentUser()).toBeNull();
    });

    it('should maintain current user after login', async () => {
      await mockBackend.signup('testuser', 'test@example.com', 'password123');
      const user = mockBackend.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.username).toBe('testuser');
    });
  });

  describe('Leaderboard', () => {
    it('should return leaderboard entries', async () => {
      const entries = await mockBackend.getLeaderboard();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should filter leaderboard by game mode', async () => {
      const wallsEntries = await mockBackend.getLeaderboard('walls');
      expect(wallsEntries.every(e => e.gameMode === 'walls')).toBe(true);

      const passthroughEntries = await mockBackend.getLeaderboard('passthrough');
      expect(passthroughEntries.every(e => e.gameMode === 'passthrough')).toBe(true);
    });

    it('should sort leaderboard by score descending', async () => {
      const entries = await mockBackend.getLeaderboard();
      for (let i = 0; i < entries.length - 1; i++) {
        expect(entries[i].score).toBeGreaterThanOrEqual(entries[i + 1].score);
      }
    });

    it('should submit score when logged in', async () => {
      await mockBackend.signup('testuser', 'test@example.com', 'password123');
      await mockBackend.submitScore(1000, 'walls');

      const entries = await mockBackend.getLeaderboard();
      const userEntry = entries.find(e => e.username === 'testuser');
      expect(userEntry).toBeDefined();
      expect(userEntry?.score).toBe(1000);
    });

    it('should throw error when submitting score without login', async () => {
      await expect(mockBackend.submitScore(1000, 'walls')).rejects.toThrow();
    });
  });
});
