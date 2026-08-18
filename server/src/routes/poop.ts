import { Router } from 'express';
import { db } from '../db/index.js';
import { poopLogs } from '../db/schema.js';
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheInvalidate } from '../cache/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/poop — list poop logs
router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const cacheKey = `poop:${userId}:${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const rows = await db
    .select()
    .from(poopLogs)
    .where(eq(poopLogs.userId, userId))
    .orderBy(desc(poopLogs.timestamp))
    .limit(limit);

  await cacheSet(cacheKey, rows);
  res.json(rows);
});

// GET /api/poop/range — date range query
router.get('/range', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });

  const rows = await db
    .select()
    .from(poopLogs)
    .where(
      and(
        eq(poopLogs.userId, userId),
        gte(poopLogs.timestamp, new Date(start as string)),
        lte(poopLogs.timestamp, new Date(end as string)),
      ),
    )
    .orderBy(poopLogs.timestamp);

  res.json(rows);
});

// GET /api/poop/count — count in date range
router.get('/count', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });

  const [{ result }] = await db
    .select({ result: count() })
    .from(poopLogs)
    .where(
      and(
        eq(poopLogs.userId, userId),
        gte(poopLogs.timestamp, new Date(start as string)),
        lte(poopLogs.timestamp, new Date(end as string)),
      ),
    );

  res.json({ count: result });
});

// GET /api/poop/since — timestamps since cutoff (for streak)
router.get('/since', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { cutoff } = req.query;
  if (!cutoff) return res.status(400).json({ error: 'cutoff required' });

  const rows = await db
    .select({ timestamp: poopLogs.timestamp })
    .from(poopLogs)
    .where(
      and(
        eq(poopLogs.userId, userId),
        gte(poopLogs.timestamp, new Date(cutoff as string)),
      ),
    )
    .orderBy(poopLogs.timestamp);

  res.json(rows.map((r) => r.timestamp));
});

// GET /api/poop/:id — single entry
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const [row] = await db
    .select()
    .from(poopLogs)
    .where(and(eq(poopLogs.id, req.params.id), eq(poopLogs.userId, userId)))
    .limit(1);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/poop — create
router.post('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { id, timestamp, typeId, comment, locationLat, locationLng, locationCity } = req.body;

  if (!id || !timestamp) return res.status(400).json({ error: 'id and timestamp required' });

  const now = new Date();
  await db.insert(poopLogs).values({
    id,
    userId,
    timestamp: new Date(timestamp),
    typeId: typeId ?? null,
    comment: comment ?? null,
    locationLat: locationLat ?? null,
    locationLng: locationLng ?? null,
    locationCity: locationCity ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await cacheInvalidate(`poop:${userId}:*`);
  res.status(201).json({ ok: true });
});

// PUT /api/poop/:id — update
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { typeId, comment } = req.body;

  await db
    .update(poopLogs)
    .set({
      ...(typeId !== undefined && { typeId }),
      ...(comment !== undefined && { comment }),
      updatedAt: new Date(),
    })
    .where(and(eq(poopLogs.id, req.params.id), eq(poopLogs.userId, userId)));

  await cacheInvalidate(`poop:${userId}:*`);
  res.json({ ok: true });
});

// DELETE /api/poop/:id — delete
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  await db
    .delete(poopLogs)
    .where(and(eq(poopLogs.id, req.params.id), eq(poopLogs.userId, userId)));

  await cacheInvalidate(`poop:${userId}:*`);
  res.json({ ok: true });
});

export default router;
