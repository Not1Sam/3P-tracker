import { Router } from 'express';
import { db } from '../db/index.js';
import { customTypes, customColors } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheInvalidate } from '../cache/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// ── Custom Types ──

router.get('/types', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const cacheKey = `customTypes:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const rows = await db
    .select()
    .from(customTypes)
    .where(eq(customTypes.userId, userId))
    .orderBy(desc(customTypes.createdAt));

  await cacheSet(cacheKey, rows, 600);
  res.json(rows);
});

router.post('/types', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { id, name } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });

  await db.insert(customTypes).values({
    id,
    userId,
    name,
    createdAt: new Date(),
  });

  await cacheInvalidate(`customTypes:${userId}`);
  res.status(201).json({ ok: true });
});

router.delete('/types/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  await db
    .delete(customTypes)
    .where(and(eq(customTypes.id, req.params.id), eq(customTypes.userId, userId)));

  await cacheInvalidate(`customTypes:${userId}`);
  res.json({ ok: true });
});

// ── Custom Colors ──

router.get('/colors', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const cacheKey = `customColors:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const rows = await db
    .select()
    .from(customColors)
    .where(eq(customColors.userId, userId))
    .orderBy(desc(customColors.createdAt));

  await cacheSet(cacheKey, rows, 600);
  res.json(rows);
});

router.post('/colors', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { id, name, hexValue } = req.body;
  if (!id || !name || !hexValue) return res.status(400).json({ error: 'id, name, and hexValue required' });

  await db.insert(customColors).values({
    id,
    userId,
    name,
    hexValue,
    createdAt: new Date(),
  });

  await cacheInvalidate(`customColors:${userId}`);
  res.status(201).json({ ok: true });
});

router.delete('/colors/:id', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  await db
    .delete(customColors)
    .where(and(eq(customColors.id, req.params.id), eq(customColors.userId, userId)));

  await cacheInvalidate(`customColors:${userId}`);
  res.json({ ok: true });
});

export default router;
