import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const JWKS_URI = SUPABASE_URL
  ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  : '';

let cachedKeys: jose.JWTVerifyGetKey | null = null;
let keysLastFetched = 0;
const KEYS_TTL = 3600_000; // 1 hour

async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  if (cachedKeys && now - keysLastFetched < KEYS_TTL) {
    return cachedKeys;
  }
  if (!JWKS_URI) throw new Error('Supabase URL not configured');
  const remoteJWKSet = jose.createRemoteJWKSet(new URL(JWKS_URI));
  cachedKeys = remoteJWKSet;
  keysLastFetched = now;
  return remoteJWKSet;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!SUPABASE_URL) {
    res.status(503).json({ error: 'Auth not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const jwks = await getJWKS();
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: `${SUPABASE_URL}/auth/v1`,
    });

    const userId = payload.sub;
    if (!userId) {
      res.status(401).json({ error: 'Invalid token: no subject' });
      return;
    }

    req.userId = userId;
    next();
  } catch (err: any) {
    console.error('[AUTH] JWT verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
