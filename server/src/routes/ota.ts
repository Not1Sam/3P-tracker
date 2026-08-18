import { Router } from 'express';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { cacheGet, cacheSet } from '../cache/index.js';

const router = Router();

const OTA_DIR = process.env.OTA_BUNDLE_DIR ?? '/data/ota';
const HOST = process.env.OTA_HOST ?? 'https://pwa-3ptracker.bungus.fyi';

interface AssetInfo {
  path: string;
  hash: string;
  url: string;
  key: string;
  contentType: string;
}

interface UpdateManifest {
  id: string;
  createdAt: string;
  runtimeVersion: string;
  platform: 'android' | 'ios';
  launchAsset: AssetInfo;
  assets: AssetInfo[];
}

function contentTypeFor(ext: string): string {
  const map: Record<string, string> = {
    js: 'application/javascript',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    wasm: 'application/wasm',
  };
  return map[ext] ?? 'application/octet-stream';
}

async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

async function scanBundleDir(platform: string): Promise<{ manifest: UpdateManifest | null; files: Map<string, string> }> {
  const bundleDir = join(OTA_DIR, platform);
  const files = new Map<string, string>();

  try {
    await stat(bundleDir);
  } catch {
    return { manifest: null, files };
  }

  // Recursively collect all files
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const relativePath = fullPath.slice(bundleDir.length + 1);
        files.set(relativePath, fullPath);
      }
    }
  }
  await walk(bundleDir);

  // Read manifest metadata
  const metaPath = join(bundleDir, 'meta.json');
  let meta: any;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf-8'));
  } catch {
    meta = {};
  }

  // Find the entry JS bundle
  const entryFile = Array.from(files.keys()).find(f => f.startsWith('_expo/static/js/web/entry') && f.endsWith('.js'));
  if (!entryFile) return { manifest: null, files };

  const entryHash = await hashFile(files.get(entryFile)!);
  const launchAsset: AssetInfo = {
    path: `/ota/${platform}/${entryFile}`,
    hash: entryHash,
    url: `${HOST}/ota/${platform}/${entryFile}`,
    key: entryHash.slice(0, 12),
    contentType: 'application/javascript',
  };

  // Scan all other assets
  const assets: AssetInfo[] = [];
  for (const [relPath, fullPath] of files) {
    if (relPath === entryFile) continue;
    // Skip meta.json
    if (relPath === 'meta.json') continue;

    const ext = relPath.split('.').pop() ?? '';
    const hash = await hashFile(fullPath);
    assets.push({
      path: `/ota/${platform}/${relPath}`,
      hash,
      url: `${HOST}/ota/${platform}/${relPath}`,
      key: hash.slice(0, 12),
      contentType: contentTypeFor(ext),
    });
  }

  const manifest: UpdateManifest = {
    id: meta.id ?? createHash('sha256').update(entryHash + Date.now().toString()).digest('hex').slice(0, 16),
    createdAt: meta.createdAt ?? new Date().toISOString(),
    runtimeVersion: meta.runtimeVersion ?? '1.0.0',
    platform: platform as 'android' | 'ios',
    launchAsset,
    assets,
  };

  return { manifest, files };
}

// GET /ota/manifest?platform=android — return update manifest
router.get('/manifest', async (req, res) => {
  const platform = String(req.query.platform ?? 'android');
  if (platform !== 'android' && platform !== 'ios') {
    return res.status(400).json({ error: 'platform must be android or ios' });
  }

  const cacheKey = `ota:manifest:${platform}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.json(cached);
  }

  const { manifest } = await scanBundleDir(platform);
  if (!manifest) {
    return res.status(404).json({ error: 'No update bundle found for this platform' });
  }

  await cacheSet(cacheKey, manifest, 30);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.json(manifest);
});

// Serve static OTA bundle files
router.get('/:platform/*', async (req, res) => {
  const platform = String(req.params[0]);
  const filePath = req.params[0]; // everything after /:platform/

  if (platform !== 'android' && platform !== 'ios') {
    return res.status(404).json({ error: 'Not found' });
  }

  const fullPath = join(OTA_DIR, platform, filePath);
  try {
    const content = await readFile(fullPath);
    const ext = filePath.split('.').pop() ?? '';
    res.setHeader('Content-Type', contentTypeFor(ext));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(content);
  } catch {
    res.status(404).json({ error: 'Asset not found' });
  }
});

export default router;
