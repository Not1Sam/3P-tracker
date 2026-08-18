import { Router } from 'express';
import { db } from '../db/index.js';
import { poopLogs } from '../db/schema.js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheInvalidate } from '../cache/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const s = (v: unknown): string => String(v ?? '');

router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(s(req.query.limit)) || 50, 200);
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

router.get('/range', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const startStr = s(req.query.start);
  const endStr = s(req.query.end);
  if (!startStr || !endStr) return res.status(400).json({ error: 'start and end required' });

  const rows = await db
    .select()
    .from(poopLogs)
    .where(and(eq(poopLogs.userId, userId), gte(poopLogs.timestamp, new Date(startStr)), lte(poopLogs.timestamp, new Date(endStr))))
    .orderBy(poopLogs.timestamp);

  res.json(rows);
});

router.get('/count', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const startStr = s(req.query.start);
  const endStr = s(req.query.end);
  if (!startStr || !endStr) return res.status(400).json({ error: 'start and end required' });

  const [{ result }] = await db
    .select({ result: count() })
    .from(poopLogs)
    .where(and(eq(poopLogs.userId, userId), gte(poopLogs.timestamp, new Date(startStr)), lte(poopLogs.timestamp, new Date(endStr))));

  res.json({ count: result });
});

router.get('/since', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const cutoffStr = s(req.query.cutoff);
  if (!cutoffStr) return res.status(400).json({ error: 'cutoff required' });

  const rows = await db
    .select({ timestamp: poopLogs.timestamp })
    .from(poopLogs)
    .where(and(eq(poopLogs.userId, userId), gte(poopLogs.timestamp, new Date(cutoffStr))))
    .orderBy(poopLogs.timestamp);

  res.json(rows.map((r) => r.timestamp));
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const id = s(req.params.id);
  const [row] = await db
    .select()
    .from(poopLogs)
    .where(and(eq(poopLogs.id, id), eq(poopLogs.userId, userId)))
    .limit(1);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { id, timestamp, typeId, comment, locationLat, locationLng, locationCity } = req.body;
  if (!id || !timestamp) return res.status(400).json({ error: 'id and timestamp required' });

  const now = new Date();
  await db.insert(poopLogs).values({
    id: s(id), userId, timestamp: new Date(timestamp),
    typeId: typeId ?? null, comment: comment ?? null,
    locationLat: locationLat ?? null, locationLng: locationLng ?? null,
    locationCity: locationCity ?? null, createdAt: now, updatedAt: now,
  });

  await cacheInvalidate(`poop:${userId}:*`);
  res.status(201).json({ ok: true });
});

router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const id = s(req.params.id);
  const { typeId, comment } = req.body;

  await db.update(poopLogs).set({
    ...(typeId !== undefined && { typeId }),
    ...(comment !== undefined && { comment }),
    updatedAt: new Date(),
  }).where(and(eq(poopLogs.id, id), eq(poopLogs.userId, userId)));

  await cacheInvalidate(`poop:${userId}:*`);
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const id = s(req.params.id);
  await db.delete(poopLogs).where(and(eq(poopLogs.id, id), eq(poopLogs.userId, userId)));

  await cacheInvalidate(`poop:${userId}:*`);
  res.json({ ok: true });
});

export default router;
