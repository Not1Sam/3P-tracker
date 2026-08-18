import { Router } from 'express';
import { db } from '../db/index.js';
import { userSettings } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheInvalidate } from '../cache/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const ALLOWED_KEYS = [
  'theme', 'syncDayOfMonth', 'userName', 'userEmail',
  'periodRemindersEnabled', 'periodReminderHour', 'periodReminderMinute',
  'userGender', 'splashScreenEnabled',
];

// GET /api/settings — get all user settings
router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const cacheKey = `settings:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  await cacheSet(cacheKey, settings, 600);
  res.json(settings);
});

// PUT /api/settings — bulk update settings
router.put('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const entries = Object.entries(req.body) as [string, string][];

  const now = new Date();
  for (const [key, value] of entries) {
    if (!ALLOWED_KEYS.includes(key)) continue;
    await db
      .insert(userSettings)
      .values({ key, userId, value: String(value), updatedAt: now })
      .onConflictDoUpdate({
        target: userSettings.key,
        set: { value: String(value), updatedAt: now },
      });
  }

  await cacheInvalidate(`settings:${userId}`);
  res.json({ ok: true });
});

// PUT /api/settings/:key — set single setting
router.put('/:key', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const key = req.params.key;
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(400).json({ error: 'Invalid setting key' });
  }

  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });

  const now = new Date();
  await db
    .insert(userSettings)
    .values({ key, userId, value: String(value), updatedAt: now })
    .onConflictDoUpdate({
      target: userSettings.key,
      set: { value: String(value), updatedAt: now },
    });

  await cacheInvalidate(`settings:${userId}`);
  res.json({ ok: true });
});

export default router;
