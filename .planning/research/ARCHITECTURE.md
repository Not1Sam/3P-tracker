# Architecture Patterns

**Domain:** Local-first health tracking mobile app (poop/piss/period)
**Researched:** 2026-08-06
**Overall confidence:** MEDIUM-HIGH (Expo official docs + Supabase docs verified; some community sources)

## Recommended Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    REACT NATIVE + EXPO                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Poop    │  │  Piss    │  │  Period  │  │Profile │  │
│  │  Tab     │  │  Tab     │  │  Tab     │  │Tab     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │             │       │
│  ┌────▼──────────────▼──────────────▼─────────────▼────┐ │
│  │              APPLICATION SERVICE LAYER              │ │
│  │  SyncService │ AuthService │ LeaderboardService     │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼──────────────────────────────┐ │
│  │          LOCAL DATA LAYER (Encrypted SQLite)        │ │
│  │         Drizzle ORM + expo-sqlite (SQLCipher)       │ │
│  │                                                     │ │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐           │ │
│  │  │ poop    │ │ piss     │ │ period     │           │ │
│  │  │ entries │ │ entries  │ │ data       │  ← NEVER  │ │
│  │  │ (synced)│ │ (synced) │ │ (LOCAL     │   LEAVES  │ │
│  │  └─────────┘ └──────────┘ │  ONLY)     │   DEVICE  │ │
│  │                           └────────────┘           │ │
│  └────────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼──────────────────────────────┐ │
│  │              SYNC LAYER (Monthly Batch)             │ │
│  │   Only poop/piss SUMMARY data → Supabase           │ │
│  └─────────────────────┬──────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│            SUPABASE SELF-HOSTED (Homelab)               │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │  Auth    │  │Database  │  │ Realtime  │             │
│  │ (GoTrue) │  │(Postgres)│  │(WebSocket)│             │
│  └──────────┘  └──────────┘  └───────────┘             │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Tables: users, leaderboard_scores,              │   │
│  │          monthly_summaries, friendships           │   │
│  │  RLS: Row-level security per user                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Data Ownership |
|-----------|---------------|-------------------|----------------|
| **UI Layer** | Render screens, handle user input, display data | Service Layer | None (presentation only) |
| **Service Layer** | Business logic, encryption, sync orchestration | UI Layer, Data Layer, Sync Layer | Orchestration only |
| **Local Data Layer** | Encrypted SQLite database, CRUD operations, queries | Service Layer, Sync Layer | ALL user data (source of truth) |
| **Sync Layer** | Monthly batch sync of poop/piss summaries to cloud | Local Data Layer, Supabase | Sync state, conflict resolution |
| **Supabase Auth** | User authentication (email, Google, Apple) | Mobile Client | Auth tokens, user identities |
| **Supabase Database** | Leaderboard scores, friendships, aggregated summaries | Realtime, Mobile Client (read-only) | Cloud-side aggregated data |
| **Supabase Realtime** | Push leaderboard updates to connected clients | Mobile Client (WebSocket) | Real-time event stream |

### Data Flow

#### 1. User Logs a Poop/Piss Entry (One-Tap)

```
User taps "Log Poop" →
  UI captures tap + auto-captures datetime + geolocation →
  Service Layer encrypts entry fields →
  Local Data Layer writes encrypted blob to SQLite →
  Entry appears in local UI immediately (no network needed)
```

#### 2. Monthly Sync (Poop/Piss Summaries Only)

```
SyncService triggers monthly batch →
  Query local DB for poop/piss entries since last sync →
  Compute aggregates: count, avg duration, streak data, location clusters →
  Encrypt aggregates →
  POST to Supabase API →
  Supabase stores monthly_summaries row →
  Update local sync pointer
```

#### 3. Leaderboard Real-Time Update

```
Supabase Realtime detects new leaderboard_scores INSERT →
  WebSocket broadcasts to all connected clients →
  Client receives payload →
  UI updates leaderboard (podium + scrollable list) →
  Streak tracking updates if applicable
```

#### 4. Period Data (NEVER Leaves Device)

```
User logs period entry →
  UI captures flow level, symptoms, mood →
  Service Layer encrypts with device-only key →
  Local Data Layer writes to SQLite →
  Cycle prediction runs locally (algorithm on device) →
  Reminders fire locally →
  Data stays on device forever (encrypted at rest)
```

#### 5. Social Connection Flow

```
User sends invite link/QR code →
  Friend opens link →
  Supabase Auth creates account →
  Friendship record created in Supabase →
  Both users appear in each other's friends leaderboard →
  Real-time updates flow for leaderboard changes
```

## Patterns to Follow

### Pattern 1: Privacy-by-Design Data Partitioning

**What:** Split data into three tiers based on sensitivity, with hard architectural boundaries between tiers.

**When:** Always. This is the core architectural principle.

**Tiers:**
- **Tier 1 (Period Data):** Encrypted on device, NEVER transmitted. Period data is the most sensitive — it can reveal reproductive health, pregnancy, etc.
- **Tier 2 (Poop/Piss Logs):** Encrypted on device, monthly SUMMARY only sent to cloud. Raw entries never leave the device.
- **Tier 3 (Leaderboard/Profile):** Cloud-synced. Usernames, streaks, aggregate scores.

**Example:**
```typescript
// Data classification at the service layer
enum DataTier {
  PERIOD = 'period',           // Tier 1: NEVER sync
  BODILY_LOG = 'bodily_log',  // Tier 2: Monthly summary only
  SOCIAL = 'social',          // Tier 3: Real-time sync
}

// Sync decision logic
function shouldSync(entry: LogEntry): boolean {
  if (entry.type === DataTier.PERIOD) return false; // HARD BLOCK
  if (entry.type === DataTier.BODILY_LOG) return isMonthlySyncWindow();
  return true; // Social data syncs immediately
}
```

### Pattern 2: Encrypted-at-Rest Local Database

**What:** Use SQLCipher (encrypted SQLite) for all local storage. Every field containing user data is encrypted before write.

**When:** Always. Non-negotiable for health data.

**Why:** Even if the device is compromised, extracted database files contain encrypted blobs, not readable health data.

**Implementation:**
```typescript
// Using expo-sqlite with SQLCipher encryption
// The encryption key is derived from user's PIN/biometric
import * as SQLite from 'expo-sqlite';

// Database opens with encryption key
const db = await SQLite.openDatabaseAsync('3p_tracker.db', {
  encryptionKey: derivedEncryptionKey, // From SecureStore + biometric
});
```

### Pattern 3: Monthly Batch Sync (Not Real-Time)

**What:** Sync poop/piss summary data to Supabase once per month, not on every log. Raw entries never leave the device.

**When:** For Tier 2 data (bodily logs).

**Why:** Minimizes data exposure. Monthly aggregation provides leaderboard data without revealing individual log patterns. Reduces network dependency.

**Implementation:**
```typescript
// SyncService orchestrates monthly batch
class SyncService {
  async runMonthlySync() {
    // 1. Get last sync timestamp
    const lastSync = await this.getLocalSyncPointer();

    // 2. Query local entries since last sync
    const entries = await this.db.query.entriesSince(lastSync);

    // 3. Compute aggregates (never send raw data)
    const summary = this.computeMonthlySummary(entries);
    // summary = { poopCount, avgBristolType, pissCount, avgColor, streaks, locationClusters }

    // 4. Encrypt summary before transmission
    const encrypted = await this.encrypt(summary);

    // 5. POST to Supabase
    await this.supabase.from('monthly_summaries').insert(encrypted);

    // 6. Update local sync pointer
    await this.updateSyncPointer(new Date());
  }
}
```

### Pattern 4: Supabase RLS for Leaderboard Security

**What:** Row Level Security ensures users can only read/write their own leaderboard scores. No user can see another user's raw data.

**When:** On all Supabase tables.

**Implementation:**
```sql
-- Enable RLS on leaderboard_scores
ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Users can only read scores (for leaderboard display)
CREATE POLICY "Anyone can read leaderboard scores"
ON leaderboard_scores FOR SELECT
USING (true); -- Public read for leaderboard

-- Users can only insert/update their own scores
CREATE POLICY "Users can manage own scores"
ON leaderboard_scores FOR ALL
USING (user_id = auth.uid());

-- Monthly summaries are private to the user
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own summaries"
ON monthly_summaries FOR SELECT
USING (user_id = auth.uid());
```

### Pattern 5: Background Geolocation with Local-Only Storage

**What:** Capture location on every log entry, store locally. Location data is Tier 2 — monthly cluster summaries may be synced (e.g., "5 logs near home"), but exact coordinates never leave the device.

**When:** On every log entry creation.

**Implementation:**
```typescript
import * as Location from 'expo-location';

// Capture location (fast, cached)
async function captureLocation(): Promise<GeoPoint> {
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low, // City-level is fine
  });
  return { lat: coords.latitude, lng: coords.longitude };
}

// Store locally — encrypted
// Location clusters computed locally for future heatmap
// Only "city-level" summary may be synced (never exact coordinates)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Syncing Raw Entries

**What:** Sending individual poop/piss log entries to the cloud in real-time.

**Why bad:** Exposes granular health data to the server. Violates the privacy-by-design principle. Creates unnecessary network dependency.

**Instead:** Monthly batch of aggregates only. Raw entries stay on device encrypted.

### Anti-Pattern 2: Storing Period Data Remotely

**What:** Uploading period data to any server, even encrypted.

**Why bad:** Period data can reveal pregnancy, reproductive health conditions, etc. Even encrypted data on a server is a risk — keys can be compromised, servers can be breached. "Never leaves the device" means NEVER.

**Instead:** Hard architectural block in the sync layer. Period tables are excluded from sync logic entirely.

### Anti-Pattern 3: Using AsyncStorage for Health Data

**What:** Storing health entries in React Native AsyncStorage.

**Why bad:** AsyncStorage is unencrypted, has no relational query support, no indexing, and poor performance with large datasets. It's a key-value store, not a database.

**Instead:** Use expo-sqlite (encrypted SQLite) with Drizzle ORM for structured, queryable, encrypted storage.

### Anti-Pattern 4: Tight Coupling Between UI and Network

**What:** UI components that directly call Supabase APIs.

**Why bad:** Creates network dependency. App breaks when offline. Makes it impossible to enforce privacy boundaries at the service layer.

**Instead:** UI → Service Layer → Local DB → (optional) Sync Layer → Cloud. Every write goes to local first.

## Component Deep-Dive

### Local Database Schema (Drizzle ORM + expo-sqlite)

```typescript
// Core tables — all encrypted at rest via SQLCipher
const poopEntries = sqliteTable('poop_entries', {
  id: text('id').primaryKey(),           // UUID
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  bristolType: integer('bristol_type'),   // 1-7 Bristol stool chart
  customType: text('custom_type'),        // User-defined type
  comment: text('comment'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  // Sync metadata
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

const pissEntries = sqliteTable('piss_entries', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  color: text('color'),                   // Medical color palette
  customColor: text('custom_color'),
  smell: text('smell'),                   // Optional
  comment: text('comment'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

// Period data — NEVER synced
const periodEntries = sqliteTable('period_entries', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  flowLevel: text('flow_level'),          // spotting/light/medium/heavy
  symptoms: text('symptoms'),             // JSON array
  mood: text('mood'),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  // NO isSynced column — this data never syncs
});

// Sync state tracking
const syncPointers = sqliteTable('sync_pointers', {
  id: text('id').primaryKey(),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  syncType: text('sync_type'),            // 'monthly_summary'
});
```

### Supabase Cloud Schema (PostgreSQL)

```typescript
// Cloud-side tables — leaderboard and social data only
const leaderboardScores = sqliteTable('leaderboard_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  scoreType: text('score_type'),          // 'poop' | 'piss'
  score: integer('score'),
  streakDays: integer('streak_days'),
  period: text('period'),                 // '2026-08' (monthly)
  updatedAt: timestamp('updated_at').defaultNow(),
});

const monthlySummaries = sqliteTable('monthly_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  month: text('month'),                   // '2026-08'
  poopCount: integer('poop_count'),
  avgBristolType: real('avg_bristol_type'),
  pissCount: integer('piss_count'),
  avgColor: text('avg_color'),
  // NO location coordinates — only city-level clusters
  locationClusters: jsonb('location_clusters'),
  encryptedPayload: text('encrypted_payload'), // Encrypted summary blob
});

const friendships = sqliteTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  friendId: uuid('friend_id').references(() => users.id),
  status: text('status'),                 // 'pending' | 'accepted'
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Encryption Strategy

| Data | Encryption Key | Storage | Transmission |
|------|---------------|---------|-------------|
| Period data | Device-derived key (biometric/PIN + SecureStore) | SQLCipher on device | NEVER |
| Poop/piss entries | Device-derived key (same) | SQLCipher on device | Monthly summary only (re-encrypted for transit) |
| Leaderboard scores | Supabase RLS (user_id scoped) | PostgreSQL (Supabase) | Real-time via WebSocket |
| Auth tokens | Expo SecureStore (hardware-backed) | Device SecureStore | HTTPS only |

**Key derivation flow:**
```
User PIN/Biometric →
  Expo SecureStore (hardware-backed keystore) →
  Derived encryption key →
  SQLCipher database key
```

## Build Order Implications

Based on component dependencies:

```
Phase 1: Local Data Foundation
  └── expo-sqlite + Drizzle ORM + encryption
  └── Schema: poop, piss, period tables
  └── CRUD operations
  └── Geolocation capture (expo-location)

Phase 2: UI + Navigation
  └── Tab navigation (Poop / Piss / Period / Profile)
  └── Log entry screens
  └── History/calendar view
  └── One-tap logging flow

Phase 3: Auth + Supabase Backend
  └── Self-hosted Supabase setup
  └── Auth (email + Google/Apple)
  └── Leaderboard tables + RLS
  └── Monthly sync service

Phase 4: Leaderboards + Real-Time
  └── Leaderboard UI (podium + scrollable list)
  └── Supabase Realtime subscriptions
  └── Streak tracking
  └── Friends system (invite links/QR)

Phase 5: Period Tracking
  └── Full period tracking (cycle prediction, symptoms, mood)
  └── Reminders (local notifications)
  └── Education content
  └── Local-only enforcement verification

Phase 6: Polish + Distribution
  └── Thematic UI (brown/yellow/pink)
  └── Animations
  └── PWA support for iOS
  └── APK distribution setup
```

**Why this order:**
- Phase 1 must come first — everything depends on the local database
- Phase 2 builds on Phase 1 (needs data layer to render)
- Phase 3 can start parallel to Phase 2 (Supabase setup is independent)
- Phase 4 depends on Phase 3 (needs auth + backend)
- Phase 5 is independent of Phase 3/4 (period data never syncs)
- Phase 6 is polish and distribution (last)

## Scalability Considerations

| Concern | At 100 Users | At 10K Users | At 1M Users |
|---------|--------------|--------------|-------------|
| Local DB performance | Instant (SQLite handles millions of rows) | Instant | Instant |
| Supabase Realtime | Trivial (WebSocket connections) | Scale Realtime servers | Multiple Realtime instances |
| Monthly sync batch | Sequential POST per user | Queue-based batch processing | Job queue (BullMQ) + worker pool |
| Leaderboard queries | Simple SELECT + ORDER BY | Index on score_type + period | Materialized views + caching |
| Homelab hosting | Single server (4GB RAM) | Upgrade to 8GB+ | Migrate to cloud (or keep homelab) |

## Sources

- Expo Official Docs: Local-first architecture with Expo (docs.expo.dev/guides/local-first/) — **HIGH confidence**
- Supabase Official Docs: Realtime (supabase.com/docs/guides/realtime) — **HIGH confidence**
- Supabase Official Docs: Row Level Security (supabase.com/docs/guides/database/postgres/row-level-security) — **HIGH confidence**
- SpiderLab: Local-First Mobile Architecture with WatermelonDB (2026-06-19) — **MEDIUM confidence** (community blog)
- PkgPulse: Expo SQLite vs WatermelonDB vs Realm 2026 (2026-03-09) — **MEDIUM confidence** (community comparison)
- WellAlly: Building Offline-First Sleep Tracker with WatermelonDB (2026-04-06) — **MEDIUM confidence** (health app reference)
- Procedure Tech: React Native Offline-First in 2026 (2026-06-22) — **MEDIUM confidence** (community comparison)
- Countly: GDPR-Compliant Patient Journey Tracking — **MEDIUM confidence** (privacy architecture reference)
- Momentum: GDPR for HealthTech Architecture Requirements 2026 — **MEDIUM confidence** (compliance reference)
- Floriva: Period Tracker Privacy Architecture Guide (2026-04-01) — **MEDIUM confidence** (privacy tier reference)
- Livemy: How to Self-Host Supabase in 2026 (2026-08-02) — **MEDIUM confidence** (self-hosting reference)
