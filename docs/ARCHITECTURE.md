# Architecture

How the 3P Tracker codebase is structured and how data flows.

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  UI Layer                        │
│  app/ (routes) + screens/ + components/         │
│  ──────────────────────────────────────────────  │
│  What the user sees and interacts with          │
└──────────────────────┬──────────────────────────┘
                       │ imports from
┌──────────────────────▼──────────────────────────┐
│               Service Layer                     │
│  services/                                      │
│  ──────────────────────────────────────────────  │
│  Business logic: auth, logging, sync,           │
│  leaderboards, social, period tracking          │
└───────────┬──────────────────┬──────────────────┘
            │                  │
┌───────────▼──────┐  ┌───────▼──────────────────┐
│  Database Layer  │  │   External APIs           │
│  db/             │  │   ──────────────────────  │
│  ──────────────  │  │   Supabase (cloud)        │
│  Drizzle ORM     │  │   - Auth                  │
│  SQLite (local)  │  │   - Profiles              │
│  Encrypted       │  │   - Friends               │
│  Per-user DB     │  │   - Leaderboards          │
└──────────────────┘  │   - Monthly summaries     │
                      └───────────────────────────┘
```

## Data Flow

### Logging a Poop Entry

```
1. User taps "Tap to log poop" button
   ↓
2. app/(tabs)/index.tsx checks isAuthenticated
   ↓ (not logged in → Alert, logged in → open LoggingScreen)
   ↓
3. src/screens/LoggingScreen.tsx
   - User selects Bristol type, enters comment
   - Taps "Save Entry"
   ↓
4. src/services/logging-service.ts → createPoopLog()
   - Rate limit check (canLogEntry?)
   - Capture location (GPS + reverse geocode)
   - Call repository
   ↓
5. src/db/repositories/poop-repository.ts → createPoopLog()
   - Insert into SQLite via Drizzle ORM
   ↓
6. Entry saved to local encrypted database
   ↓
7. Monthly sync (background) → sync-engine.ts
   - Aggregates local data into monthly summaries
   - Uploads to Supabase (Tier 2 data only)
```

### Monthly Cloud Sync

```
App opens
  ↓
app/_layout.tsx runs runMonthlySync()
  ↓
services/sync-engine.ts
  - Checks if sync is due (day of month match)
  - Reads all poop_logs and piss_logs since last sync
  - Aggregates by month: { poop_count, avg_bristol, piss_count, avg_color }
  - Uploads to Supabase monthly_summaries table
  - Updates lastSyncTimestamp
```

**Period data is NEVER included in sync (Tier 1).**

## Privacy Tiers

This is the core security architecture:

```
┌─────────────────────────────────────────────────┐
│ Tier 1: PERIOD DATA                             │
│ Table: period_logs                               │
│ Rule: NEVER leaves the device                    │
│ No cloud sync, no backup, no export              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Tier 2: BODILY LOGS                             │
│ Tables: poop_logs, piss_logs                     │
│ Rule: Synced monthly as AGGREGATED summaries     │
│ Individual entries stay local                    │
│ Summary = counts + averages per month            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Tier 3: SOCIAL DATA                             │
│ Tables: profiles, friends, friend_requests       │
│ Rule: Real-time Supabase queries                 │
│ Required for leaderboards and social features    │
└─────────────────────────────────────────────────┘
```

### Backup also respects tiers:

```typescript
// backup-service.ts exports ONLY Tier 2 + settings
const backup = {
  poopLogs: [...],     // Tier 2 — included
  pissLogs: [...],     // Tier 2 — included
  customTypes: [...],  // Settings — included
  settings: {...},     // Settings — included
  // periodLogs: NOT included
}
```

## Database Architecture

### Per-User Encrypted SQLite

```typescript
// db/index.ts
// Each user gets their own encrypted database file
// File: 3ptracker-{userId}.db (or 3ptracker.db for anonymous)

const db = await getDatabase();
// → Opens encrypted SQLite with SQLCipher
// → Runs pending migrations
// → Returns Drizzle ORM instance
```

### When user logs in:

```
AuthContext.tsx
  → onAuthStateChange fires
  → setCurrentUserId(userId)
  → db/index.ts switches to 3ptracker-{userId}.db
  → New DB created if doesn't exist
  → Migrations run automatically
```

### When user logs out:

```
AuthContext.tsx
  → signOut()
  → setCurrentUserId(null)
  → db/index.ts switches back to 3ptracker.db
```

## Supabase Schema

Cloud tables (not local):

```sql
-- Aggregated monthly stats (Tier 2 sync target)
monthly_summaries (
  user_id, month, year,
  poop_count, avg_bristol, piss_count, avg_color
)

-- User profiles (Tier 3)
profiles (
  id, username, avatar_url, role, visibility
)

-- Friend relationships (Tier 3)
friends (user_id_1, user_id_2, created_at)
friend_requests (sender_id, receiver_id, status)

-- Invite codes (Tier 3)
invite_codes (user_id, code, created_at)

-- Activity feed (Tier 3)
activity_feed (user_id, type, message, metadata)
```

## Settings Store

Uses platform-aware sync storage:

| Platform | Storage |
|----------|---------|
| Web | `localStorage` |
| Android/iOS | `expo-secure-store` (Keychain/Keystore) |

Settings keys:
- `theme` — 'light' | 'dark'
- `userGender` — 'male' | 'female' | 'other' | 'prefer_not_to_say'
- `splashScreenEnabled` — 'true' | 'false'
- `periodRemindersEnabled` — 'true' | 'false'
- `periodReminderHour`, `periodReminderMinute` — numbers
- `syncDayOfMonth` — number (1-28)
- `lastSyncTimestamp` — epoch ms
- `lastAutoBackup` — epoch ms
- `inviteCode` — string

## File Relationship Map

```
app/_layout.tsx
  ├── ThemeProvider ──── src/contexts/ThemeContext.tsx ──── src/services/settings.ts
  ├── AuthProvider ───── src/contexts/AuthContext.tsx ──── src/services/auth-service.ts ──── src/services/supabase-client.ts
  ├── ProfileProvider ── src/contexts/ProfileContext.tsx ── src/services/profile-service.ts
  ├── NetworkProvider ── src/contexts/NetworkContext.tsx ── src/services/network-state.ts
  ├── SplashScreen ───── src/components/common/SplashScreen.tsx
  └── initializeApp() ── src/services/app-init.ts ──── src/db/index.ts ──── src/db/schema/index.ts ──── src/db/migrate.ts

app/(tabs)/_layout.tsx
  └── AppHeader ──────── src/components/common/AppHeader.tsx ──── src/contexts/AuthContext.tsx

app/(tabs)/index.tsx (Poop)
  ├── useAuth() ──────── src/contexts/AuthContext.tsx
  └── LoggingScreen ──── src/screens/LoggingScreen.tsx
       ├── BristolTypeSelector ── src/components/logging/BristolTypeSelector.tsx ── src/constants/bristol-chart.ts
       ├── ColorSwatchSelector ── src/components/logging/ColorSwatchSelector.tsx ── src/constants/color-palette.ts
       ├── SmellSelector ──────── src/components/logging/SmellSelector.tsx ──── src/constants/smell-options.ts
       ├── CommentField ───────── src/components/logging/CommentField.tsx
       ├── LocationStatus ─────── src/components/logging/LocationStatus.tsx
       ├── CustomTypeDialog ───── src/components/logging/CustomTypeDialog.tsx
       └── createPoopLog() ────── src/services/logging-service.ts ── src/db/repositories/poop-repository.ts

app/(tabs)/leaderboard.tsx
  ├── getFriendsLeaderboard() ── src/services/leaderboard-service.ts
  ├── getGlobalLeaderboard() ─── src/services/leaderboard-service.ts
  ├── Podium ──────────────────── src/components/leaderboard/Podium.tsx
  └── LeaderboardList ─────────── src/components/leaderboard/LeaderboardList.tsx

app/(tabs)/period.tsx
  ├── logPeriodEntry() ── src/services/period-service.ts ── src/db/repositories/period-repository.ts
  ├── getCycleOverview() ── src/services/period-service.ts ── src/services/cycle-service.ts
  ├── FlowLevelSelector ── src/components/period/FlowLevelSelector.tsx
  ├── SymptomChecklist ─── src/components/period/SymptomChecklist.tsx
  ├── MoodSelector ─────── src/components/period/MoodSelector.tsx
  ├── CycleOverview ────── src/components/period/CycleOverview.tsx
  └── EducationCards ───── src/components/period/EducationCards.tsx
```

## Adding a New Feature

1. **Types** → `src/types/` — define your data shapes
2. **Constants** → `src/constants/` — static config options
3. **Schema** → `src/db/schema/index.ts` — add table if needed
4. **Repository** → `src/db/repositories/` — CRUD operations
5. **Service** → `src/services/` — business logic
6. **Components** → `src/components/` — reusable UI pieces
7. **Screen** → `src/screens/` — full page
8. **Route** → `app/` — file-based routing entry point

### ESLint rule:

```
screens/ and components/ CANNOT import from @/db/**
They MUST go through services/
```

This keeps the architecture clean — UI never touches the database directly.
