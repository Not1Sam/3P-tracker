import { Router } from 'express';
import { db } from '../db/index.js';
import { poopLogs, pissLogs } from '../db/schema.js';
import { and, gte, eq } from 'drizzle-orm';
import { cacheGet, cacheSet } from '../cache/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/sync/monthly — get monthly summary for current user
router.get('/monthly', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const cacheKey = `sync:${userId}:${year}-${month}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const [poopCount, pissCount] = await Promise.all([
    db
      .select()
      .from(poopLogs)
      .where(and(eq(poopLogs.userId, userId), gte(poopLogs.timestamp, start)))
      .then((rows) => rows.filter((r) => r.timestamp <= end).length),
    db
      .select()
      .from(pissLogs)
      .where(and(eq(pissLogs.userId, userId), gte(pissLogs.timestamp, start)))
      .then((rows) => rows.filter((r) => r.timestamp <= end).length),
  ]);

  const summary = { userId, month, year, poopCount, pissCount };
  await cacheSet(cacheKey, summary, 600);
  res.json(summary);
});

export default router;
