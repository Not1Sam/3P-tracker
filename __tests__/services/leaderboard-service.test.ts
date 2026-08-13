/**
 * Tests for leaderboard-service.ts
 * RED-phase tests with mocked database and Supabase layers.
 *
 * Covers: getPersonalScore, calculateStreak, getFriendsLeaderboard, getGlobalLeaderboard
 * Requirements: LEAD-01 through LEAD-07
 */

// ─── Mock: @/db (local SQLite via Drizzle) ────────────────────────
const mockDb: any = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn(),
  limit: jest.fn(),
};

jest.mock('@/db', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

// ─── Mock: @/services/supabase-client ─────────────────────────────
const mockSupabase: any = {
  from: jest.fn(),
};

jest.mock('@/services/supabase-client', () => ({
  supabase: mockSupabase,
}));

// ─── Mock: @/services/auth-service ─────────────────────────────────
const mockAuthUser = { id: 'user-1', email: 'test@example.com' };

jest.mock('@/services/auth-service', () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from '@/services/auth-service';

// ─── Helper: build a Supabase eq() chain that resolves at depth N ──
function buildEqChain(depth: number, resolveData: any, error: any = null): any {
  if (depth <= 0) {
    return { data: resolveData, error };
  }
  const eqFn = jest.fn().mockReturnValue(buildEqChain(depth - 1, resolveData, error));
  return { eq: eqFn };
}

// ─── Helper: set up Supabase mock for friends query ────────────────
function mockFriendsQuery(data: any, error: any = null) {
  mockSupabase.from.mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data, error }),
    }),
  });
}

// ─── Helper: set up Supabase mock for monthly_summaries with .in() ─
function mockSummariesQuery(data: any, error: any = null) {
  // Chain: select().in().eq().eq() — depth 3 after .in()
  mockSupabase.from.mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue(buildEqChain(3, data, error)),
    }),
  });
}

// ─── Helper: set up Supabase mock for global query ─────────────────
function mockGlobalQuery(data: any, error: any = null) {
  mockSupabase.from.mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  });
}

// ─── Imports (after mocks) ────────────────────────────────────────
import {
  getPersonalScore,
  calculateStreak,
  getFriendsLeaderboard,
  getGlobalLeaderboard,
} from '@/services/leaderboard-service';

// ─── Test setup ────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  // Reset Drizzle chain mocks
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.orderBy.mockResolvedValue([]);
  mockDb.limit.mockResolvedValue([]);

  // Default: user is authenticated
  (getCurrentUser as jest.Mock).mockResolvedValue(mockAuthUser);
});

describe('leaderboard-service', () => {
  // ═══════════════════════════════════════════════════════════════════
  // getPersonalScore
  // ═══════════════════════════════════════════════════════════════════
  describe('getPersonalScore', () => {
    it('returns count of poop_logs for current month', async () => {
      mockDb.where.mockResolvedValueOnce([{ result: 5 }]);

      const score = await getPersonalScore('poop');
      expect(score).toBe(5);
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('returns count of piss_logs for current month', async () => {
      mockDb.where.mockResolvedValueOnce([{ result: 3 }]);

      const score = await getPersonalScore('piss');
      expect(score).toBe(3);
    });

    it('returns 0 when no entries exist for current month', async () => {
      mockDb.where.mockResolvedValueOnce([{ result: 0 }]);

      const score = await getPersonalScore('poop');
      expect(score).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // calculateStreak
  // ═══════════════════════════════════════════════════════════════════
  describe('calculateStreak', () => {
    it('returns 0 when no entries exist', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const streak = await calculateStreak('poop');
      expect(streak).toBe(0);
    });

    it('returns 1 when only today has entries', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      mockDb.orderBy.mockResolvedValueOnce([
        { timestamp: today },
      ]);

      const streak = await calculateStreak('poop');
      expect(streak).toBe(1);
    });

    it('counts consecutive days backwards from today', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 0, 0, 0);

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(8, 0, 0, 0);

      mockDb.orderBy.mockResolvedValueOnce([
        { timestamp: twoDaysAgo },
        { timestamp: yesterday },
        { timestamp: today },
      ]);

      const streak = await calculateStreak('poop');
      expect(streak).toBe(3);
    });

    it('uses 1 grace day — streak continues over 1 missing day', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      // Today: log present
      // Yesterday: no log (grace day used)
      // 2 days ago: log present
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(12, 0, 0, 0);

      mockDb.orderBy.mockResolvedValueOnce([
        { timestamp: twoDaysAgo },
        { timestamp: today },
      ]);

      const streak = await calculateStreak('poop');
      // Should count: today (1) + grace over yesterday (2) + 2-days-ago (3)
      expect(streak).toBe(3);
    });

    it('breaks streak after 2 consecutive missing days', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      // Today: log present
      // Yesterday: no log (grace day used)
      // 2 days ago: no log (grace exhausted -> streak breaks)
      // 3 days ago: log present (unreachable)
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(12, 0, 0, 0);

      mockDb.orderBy.mockResolvedValueOnce([
        { timestamp: threeDaysAgo },
        { timestamp: today },
      ]);

      const streak = await calculateStreak('poop');
      // Should count: today (1) + grace over yesterday (2), then break at 2-days-ago
      expect(streak).toBe(2);
    });

    it('works identically for piss_logs', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      mockDb.orderBy.mockResolvedValueOnce([
        { timestamp: today },
      ]);

      const streak = await calculateStreak('piss');
      expect(streak).toBe(1);
      expect(mockDb.from).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getFriendsLeaderboard
  // ═══════════════════════════════════════════════════════════════════
  describe('getFriendsLeaderboard', () => {
    const mockUser = { id: 'user-1', email: 'me@example.com' };

    beforeEach(() => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    });

    it('fetches friends monthly_summaries and includes current user', async () => {
      // Friends query
      mockFriendsQuery([
        { friend_id: 'friend-1' },
        { friend_id: 'friend-2' },
      ]);

      // Monthly summaries query
      mockSummariesQuery([
        { user_id: 'friend-1', poop_count: 10, profiles: { username: 'alice' } },
        { user_id: 'friend-2', poop_count: 5, profiles: { username: 'bob' } },
      ]);

      // getPersonalScore mock
      mockDb.where.mockResolvedValueOnce([{ result: 7 }]);
      // calculateStreak mock
      mockDb.orderBy.mockResolvedValueOnce([{ timestamp: new Date() }]);

      const entries = await getFriendsLeaderboard('poop');

      expect(entries.length).toBe(3); // 2 friends + self
      expect(entries.some((e: any) => e.isCurrentUser)).toBe(true);
      // Sorted by score descending
      expect(entries[0].score).toBeGreaterThanOrEqual(entries[1].score);
    });

    it('returns entries sorted by score descending', async () => {
      mockFriendsQuery([{ friend_id: 'f1' }]);

      mockSummariesQuery([
        { user_id: 'f1', poop_count: 2, profiles: { username: 'low' } },
      ]);

      // personal score = 10 (higher than friend)
      mockDb.where.mockResolvedValueOnce([{ result: 10 }]);
      mockDb.orderBy.mockResolvedValueOnce([{ timestamp: new Date() }]);

      const entries = await getFriendsLeaderboard('poop');
      // Self (10) should be first, friend (2) second
      expect(entries[0].score).toBe(10);
      expect(entries[1].score).toBe(2);
    });

    it('marks current user with isCurrentUser: true', async () => {
      mockFriendsQuery([]);

      mockDb.where.mockResolvedValueOnce([{ result: 5 }]);
      mockDb.orderBy.mockResolvedValueOnce([{ timestamp: new Date() }]);

      const entries = await getFriendsLeaderboard('poop');
      expect(entries.some((e: any) => e.isCurrentUser === true)).toBe(true);
    });

    it('returns just self when user has no friends', async () => {
      mockFriendsQuery([]);

      mockDb.where.mockResolvedValueOnce([{ result: 3 }]);
      mockDb.orderBy.mockResolvedValueOnce([{ timestamp: new Date() }]);

      const entries = await getFriendsLeaderboard('poop');
      expect(entries.length).toBe(1);
      expect(entries[0].isCurrentUser).toBe(true);
      expect(entries[0].score).toBe(3);
    });

    it('handles Supabase errors gracefully (returns empty array)', async () => {
      mockFriendsQuery(null, new Error('Supabase error'));

      const entries = await getFriendsLeaderboard('poop');
      expect(entries).toEqual([]);
    });

    it('returns empty array when user is not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const entries = await getFriendsLeaderboard('poop');
      expect(entries).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // getGlobalLeaderboard
  // ═══════════════════════════════════════════════════════════════════
  describe('getGlobalLeaderboard', () => {
    const mockUser = { id: 'user-1', email: 'me@example.com' };

    beforeEach(() => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    });

    it('fetches top 100 summaries from monthly_summaries', async () => {
      mockGlobalQuery([
        { user_id: 'u1', poop_count: 20, profiles: { username: 'top' } },
        { user_id: 'u2', poop_count: 15, profiles: { username: 'second' } },
      ]);

      // personal score + streak mocks
      mockDb.where.mockResolvedValueOnce([{ result: 5 }]);
      mockDb.orderBy.mockResolvedValueOnce([{ timestamp: new Date() }]);

      const entries = await getGlobalLeaderboard('poop');
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it('includes current user if not in top 100', async () => {
      // Top 100 has other users, not the current user
      const topEntries = Array.from({ length: 100 }, (_, i: number) => ({
        user_id: `other-${i}`,
        poop_count: 100 - i,
        profiles: { username: `user${i}` },
      }));

      mockGlobalQuery(topEntries);

      // personal score = 50
      mockDb.where.mockResolvedValueOnce([{ result: 50 }]);
      mockDb.orderBy.mockResolvedValueOnce([{ timestamp: new Date() }]);

      const entries = await getGlobalLeaderboard('poop');
      // Should have 101 entries: 100 from Supabase + self appended
      expect(entries.length).toBe(101);
      expect(entries.some((e: any) => e.userId === 'user-1' && e.isCurrentUser)).toBe(true);
    });

    it('handles Supabase errors gracefully (returns empty array)', async () => {
      mockGlobalQuery(null, new Error('Supabase error'));

      const entries = await getGlobalLeaderboard('poop');
      expect(entries).toEqual([]);
    });

    it('returns empty array when user is not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const entries = await getGlobalLeaderboard('poop');
      expect(entries).toEqual([]);
    });
  });
});
