# File Structure

## Root Config Files

| File | What it does |
|------|-------------|
| `package.json` | Lists all dependencies (expo, react-native, supabase, drizzle, etc.) and npm scripts |
| `app.json` | Expo config: app name, icons, splash screen, scheme (`tracker3p`), plugins (SQLCipher, secure-store) |
| `tsconfig.json` | TypeScript config: strict mode, `@/*` maps to `src/*` |
| `drizzle.config.ts` | Tells Drizzle Kit where the schema is and where to output migrations |
| `babel.config.js` | Babel presets + reanimated plugin (required for animations) |
| `metro.config.js` | Metro bundler config: `.wasm` support, `.css` stub for web |
| `eslint.config.js` | Linting rules: screens/components can't import from `@/db/**` directly |
| `eas.json` | EAS Build profiles: preview (APK) and production |
| `workbox-config.js` | PWA service worker caching rules |
| `.env` | Supabase credentials (never committed to git) |

## `app/` — Routes (Expo Router)

Expo Router uses **file-based routing**. The file path = the URL path.

```
app/
├── _layout.tsx              # Root layout — wraps everything in providers
├── (tabs)/                  # Tab group
│   ├── _layout.tsx          # Tab bar config (4 tabs + AppHeader)
│   ├── index.tsx            # / → Poop tab
│   ├── explore.tsx          # /explore → Piss tab
│   ├── leaderboard.tsx      # /leaderboard → Leaderboard tab
│   └── period.tsx           # /period → Period tab (female only)
├── calendar.tsx             # /calendar → Calendar screen (Stack)
├── activity.tsx             # /activity → Activity feed (Stack)
├── settings.tsx             # /settings → Settings screen (Stack)
├── profile.tsx              # /profile → Profile screen (Stack)
├── entry/
│   ├── [id].tsx             # /entry/:id → Single entry detail
│   └── day/
│       └── [date].tsx       # /entry/day/:date → All entries for a day
└── invite/
    └── [code].tsx           # /invite/:code → Friend invite handler
```

**Key concept**: `[id]` and `[date]` are dynamic segments. `router.push('/entry/abc123')` renders `entry/[id].tsx` with `id = 'abc123'`.

## `src/` — Application Code

### `src/types/` — TypeScript Types

| File | What it defines |
|------|----------------|
| `logging.ts` | `LogType`, `PoopLogEntry`, `PissLogEntry`, `CapturedLocation`, `CustomType`, `CustomColor` |
| `period.ts` | `FlowLevel`, `Symptom`, `Mood`, `CycleData`, `CyclePhase`, `PeriodStats` |

### `src/constants/` — Static Data

| File | What it defines |
|------|----------------|
| `theme.ts` | Light/dark colors, spacing, border radius, font sizes, shadows |
| `bristol-chart.ts` | Bristol Stool Scale (7 types with emojis + descriptions) |
| `color-palette.ts` | Urine color palette (7 medical colors) |
| `smell-options.ts` | Smell level options (None/Mild/Strong/Unusual) |
| `period.ts` | Flow levels, symptoms, moods, cycle phases |
| `privacy-tiers.ts` | Data classification: Tier 1 (period=never sync), Tier 2 (poop/piss=monthly sync), Tier 3 (social=realtime) |

### `src/utils/` — Helper Functions

| File | What it does |
|------|-------------|
| `logger.ts` | Structured debug logger — writes to `app-debug.log`, 5MB rotation |
| `haptics.ts` | Vibration feedback wrappers (`hapticLight`, `hapticSuccess`, etc.) |
| `date-helpers.ts` | Date formatting: `formatDateHeader`, `toLocalDateString`, `groupEntriesByDate` |
| `storage.ts` | Cross-platform secure storage (localStorage on web, SecureStore on native) |
| `accessibility.ts` | Reduced motion detection + animation config |
| `rate-limiter.ts` | Client-side rate limiting: 5-min dedup, daily caps (poop:10, piss:20) |

### `src/db/` — Database Layer

```
db/
├── index.ts                 # Opens encrypted SQLite, runs migrations, returns Drizzle instance
├── schema/
│   └── index.ts             # Table definitions (poop_logs, piss_logs, period_logs, etc.)
├── migrate.ts               # Migration runner — checks _journal table, runs pending SQL
├── migrations/
│   └── 0001_initial.sql     # CREATE TABLE statements
├── repositories/
│   ├── poop-repository.ts   # All poop CRUD operations
│   ├── piss-repository.ts   # All piss CRUD operations
│   ├── period-repository.ts # All period CRUD operations
│   └── custom-type-repository.ts # Custom types/colors CRUD
└── supabase-schema.ts       # TypeScript types for Supabase cloud tables
```

**Architecture rule**: UI code (`screens/`, `components/`) must NEVER import from `@/db/**`. Always go through `services/`.

### `src/services/` — Business Logic

| File | What it does |
|------|-------------|
| `app-init.ts` | Opens DB + runs migrations on startup |
| `supabase-client.ts` | Lazy-initialized Supabase client (Proxy pattern to avoid crash) |
| `auth-service.ts` | Sign up/in/out, password reset, auth state listener |
| `profile-service.ts` | Create/update/search user profiles |
| `logging-service.ts` | Create poop/piss entries (rate limit + location + DB) |
| `history-service.ts` | Query entries by date, paginated history, calendar dots |
| `period-service.ts` | Log period entries, get cycle overview/stats |
| `cycle-service.ts` | Pure math: cycle length calculation, phase detection, predictions |
| `leaderboard-service.ts` | Local scores, friend/global leaderboards, streak calculation |
| `social-service.ts` | Friend requests, accept/reject, invite codes |
| `activity-service.ts` | Friend activity feed, milestone recording |
| `sync-engine.ts` | Monthly aggregation + upload of Tier 2 data to Supabase |
| `notification-service.ts` | Period reminder scheduling (local notifications) |
| `settings.ts` | Key-value store: theme, gender, sync day, splash toggle |
| `backup-service.ts` | Export/import JSON backup (excludes period data) |
| `update-checker.ts` | Check self-hosted endpoint for new app versions |
| `key-manager.ts` | DB encryption key (256-bit, stored in Keychain/Keystore) |
| `custom-type-service.ts` | Re-exports from custom-type-repository |
| `avatar-service.ts` | Generates DiceBear avatar URLs from username |
| `privacy-tiers.ts` | Re-exports privacy tier constants |
| `network-state.ts` | `useNetworkState()` hook — wraps NetInfo |

### `src/contexts/` — Global State (React Context)

| File | What it provides |
|------|-----------------|
| `AuthContext.tsx` | `user`, `isAuthenticated`, `signIn()`, `signOut()`, `signUp()` |
| `ThemeContext.tsx` | `theme`, `mode`, `setMode()`, `toggleMode()` |
| `ProfileContext.tsx` | `profile`, `friendCount`, `inviteCode`, `refreshProfile()` |
| `NetworkContext.tsx` | `isConnected`, `isInternetReachable` |

### `src/screens/` — Full-Page Screens

| File | What it renders |
|------|----------------|
| `LoggingScreen.tsx` | Main form: Bristol type, color, smell, comment, save button |
| `CalendarScreen.tsx` | Monthly calendar with colored dots per entry type |
| `HistoryScreen.tsx` | SectionList of all entries grouped by date |
| `EntryDetailScreen.tsx` | Single entry detail with edit/delete |
| `EditEntryModal.tsx` | Modal form to edit an existing entry |
| `ProfileScreen.tsx` | Avatar, username, friends, QR invite, backup |
| `LoginScreen.tsx` | Email + password login form |
| `RegisterScreen.tsx` | Email + password + confirm registration |
| `FriendListScreen.tsx` | Friends list, pending requests, user search |

### `src/components/` — Reusable UI Pieces

```
components/
├── common/                  # Generic components
│   ├── AppHeader.tsx        # Top bar: calendar/activity | title | settings/profile
│   ├── SplashScreen.tsx     # Animated splash (can be disabled)
│   ├── EmptyState.tsx       # "No data" placeholder
│   ├── Toast.tsx            # Slide-up notification
│   ├── BottomSheet.tsx      # Slide-up modal
│   ├── Skeleton.tsx         # Loading placeholder
│   ├── FloatingActionButton.tsx # Circular action button
│   ├── AnimatedCard.tsx     # Pressable card with spring animation
│   ├── AnimatedList.tsx     # Staggered fade-in list
│   └── InitErrorScreen.tsx  # App init failure screen
├── logging/                 # Logging form parts
│   ├── BristolTypeSelector.tsx  # 7-type grid
│   ├── ColorSwatchSelector.tsx  # 7-color grid
│   ├── SmellSelector.tsx        # 4-option pills
│   ├── CommentField.tsx         # Collapsible text input
│   ├── CustomTypeDialog.tsx     # Add custom type modal
│   └── LocationStatus.tsx       # GPS status indicator
├── history/                 # History list parts
│   ├── EntryCard.tsx        # Entry row with icon + details
│   ├── SwipeableEntryCard.tsx # Swipe-to-delete wrapper
│   └── DateSectionHeader.tsx  # Date group header
├── leaderboard/             # Leaderboard parts
│   ├── Podium.tsx           # Top-3 medal display
│   ├── LeaderboardEntry.tsx # Single rank row
│   ├── LeaderboardList.tsx  # Scrollable rank list
│   ├── LeaderboardToggle.tsx # Friends/Global switch
│   └── StreakBadge.tsx      # Fire + streak count
├── social/                  # Social/friends parts
│   ├── Avatar.tsx           # DiceBear circular avatar
│   ├── SearchModal.tsx      # Find users modal
│   ├── ProfileSetup.tsx     # New user onboarding
│   ├── FriendCard.tsx       # Friend row with remove
│   ├── FriendRequestCard.tsx # Request row with accept/reject
│   └── QRCodeDisplay.tsx    # Invite QR code
├── period/                  # Period tracking parts
│   ├── FlowLevelSelector.tsx   # 5 flow options
│   ├── SymptomChecklist.tsx    # 9 symptom toggles
│   ├── MoodSelector.tsx        # 8 mood options
│   ├── CycleOverview.tsx       # Cycle day + phase card
│   └── EducationCards.tsx      # Phase education scroll
├── OfflineBanner.tsx        # "No internet" banner
├── UpdatePrompt.tsx         # App update modal
└── PWAInstallHint.tsx       # "Add to Home Screen" hint
```

## `supabase/` — Cloud Database Migrations

| File | What it creates |
|------|----------------|
| `20260808_social_tables.sql` | profiles, friends, friend_requests, invite_codes |
| `20260813_activity_feed.sql` | activity_feed table |
| `20260814_activity_feed.sql` | activity_feed updates |
| `20260814_profiles_rls_fix.sql` | Row-level security on profiles |
| `20260814_rbac_rate_limits.sql` | Role-based access + rate limits |

## `scripts/` — Build Scripts

| File | What it does |
|------|-------------|
| `build-pwa.sh` | Builds web + generates service worker |
| `patch-pwa.js` | Injects manifest + SW registration into index.html |

## `__tests__/` — Tests

11 test files covering services, repositories, components, and date helpers. Run with `npx jest`.
