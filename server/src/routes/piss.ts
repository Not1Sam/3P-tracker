import { Router } from 'express';
import { db } from '../db/index.js';
import { pissLogs } from '../db/schema.js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheInvalidate } from '../cache/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const cacheKey = `piss:${userId}:${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const rows = await db
    .select()
    .from(pissLogs)
    .where(eq(pissLogs.userId, userId))
    .orderBy(desc(pissLogs.timestamp))
    .limit(limit);

  await cacheSet(cacheKey, rows);
  res.json(rows);
});

router.get('/range', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });

  const rows = await db
    .select()
    .from(pissLogs)
    .where(
      and(
        eq(pissLogs.userId, userId),
        gte(pissLogs.timestamp, new Date(start as string)),
        lte(pissLogs.timestamp, new Date(end as string)),
      ),
    )
    .orderBy(pissLogs.timestamp);

  res.json(rows);
});

router.get('/count', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });

  const [{ result }] = await db
    .select({ result: count() })
    .from(pissLogs)
    .where(
      and(
        eq(pissLogs.userId, userId),
        gte(pissLogs.timestamp, new Date(start as string)),
        lte(pissLogs.timestamp, new Date(end as string)),
      ),
    );

  res.json({ count: result });
});

router.get('/since', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { cutoff } = req.query;
  if (!cutoff) return res.status(400).json({ error: 'cutoff required' });

  const rows = await db
    .select({ timestamp: pissLogs.timestamp })
    .from(pissLogs)
    .where(
      and(
        eq(pissLogs.userId, userId),
        gte(pissLogs.timestamp, new Date(cutoff as string)),
      ),
    )
    .orderBy(pissLogs.timestamp);

  res.json(rows.map((r) => r.timestamp));
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const [row] = await db
    .select()
    .from(pissLogs)
    .where(and(eq(pissLogs.id, req.params.id), eq(pissLogs.userId, userId)))
    .limit(1);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { id, timestamp, colorId, smell, comment, locationLat, locationLng, locationCity } = req.body;

  if (!id || !timestamp) return res.status(400).json({ error: 'id and timestamp required' });

  const now = new Date();
  await db.insert(pissLogs).values({
    id,
    userId,
    timestamp: new Date(timestamp),
    colorId: colorId ?? null,
    smell: smell ?? null,
    comment: comment ?? null,
    locationLat: locationLat ?? null,
    locationLng: locationLng ?? null,
    locationCity: locationCity ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await cacheInvalidate(`piss:${userId}:*`);
  res.status(201).json({ ok: true });
});

router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { colorId, smell, comment } = req.body;

  await db
    .update(pissLogs)
    .set({
      ...(colorId !== undefined && { colorId }),
      ...(smell !== undefined && { smell }),
      ...(comment !== undefined && { comment }),
      updatedAt: new Date(),
    })
    .where(and(eq(pissLogs.id, req.params.id), eq(pissLogs.userId, userId)));

  await cacheInvalidate(`piss:${userId}:*`);
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  await db
    .delete(pissLogs)
    .where(and(eq(pissLogs.id, req.params.id), eq(pissLogs.userId, userId)));

  await cacheInvalidate(`piss:${userId}:*`);
  res.json({ ok: true });
});

export default router;
