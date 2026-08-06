# Technology Stack

**Project:** 3P Tracker
**Researched:** 2026-08-06
**Overall confidence:** HIGH (official docs + verified community sources)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Expo SDK | 53+ | App shell, build pipeline, managed workflow | EAS Build free tier for APK, PWA support via `expo export -p web`, large ecosystem, official React Native tooling | HIGH (Expo docs) |
| React Native | 0.79+ | Cross-platform UI | Ships with Expo SDK 53, New Architecture support, largest mobile cross-platform community | HIGH |
| TypeScript | 5.x | Type safety | Catch bugs early, better DX with typed routes via Expo Router, industry standard | HIGH |
| Expo Router | 5.x | File-based routing | Automatic deep linking, typed routes, web + native from same code, replaces React Navigation for file-based apps | HIGH (Expo docs) |

**What NOT to use and why:**
- **React Navigation standalone** — Expo Router v5 wraps it and adds file-based routing. Going standalone means more config for less.
- **Bare React Native CLI** — Expo's managed workflow + prebuild handles all native module linking. Bare workflow adds friction with zero benefit for this project.
- **Expo Go** — MMKV and expo-notifications push require dev clients. Expo Go is for prototyping only.

### Local Storage (The Critical Decision)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-sqlite | 56.x | Primary relational DB for logs | Built into Expo SDK, SQLCipher encryption support via `useSQLCipher: true` config, live queries, WAL mode, full SQL power | HIGH (Expo docs) |
| react-native-mmkv | 4.3.x | Fast key-value store for settings/preferences | ~30x faster than AsyncStorage, synchronous reads (no startup flicker), built-in AES-256 encryption, Nitro Module | HIGH (official repo) |
| react-native-nitro-modules | latest | Required peer dep for MMKV v4 | MMKV v4 architecture requirement | HIGH |

**Architecture: Two-tier storage**

```
MMKV (synchronous, fast)          expo-sqlite + SQLCipher (encrypted, relational)
├── Auth tokens                   ├── Poop logs (type, datetime, location, comment)
├── User preferences              ├── Piss logs (color, datetime, location, smell)
├── Theme settings                ├── Period data (NEVER leaves device)
├── Last sync timestamp           ├── Custom type/color definitions
└── Feature flags                 └── Streak data (local cache)
```

**What NOT to use and why:**
- **AsyncStorage** — ~30x slower than MMKV, no encryption, async-only API causes startup flicker. Dead for production apps in 2026.
- **Realm** — Deprecated by MongoDB (Atlas Device Sync sunset). Object model adds complexity. Paid cloud sync not needed.
- **WatermelonDB** — Overkill. Built for large datasets (100k+ records) with complex sync protocols. 3P Tracker logs are small-volume. The sync protocol overhead isn't worth it when Supabase handles the leaderboard backend directly.
- **expo-sqlite without SQLCipher** — Leaves data unencrypted on disk. Project requirement is encrypted-at-rest.

**Encryption strategy for expo-sqlite:**
```json
{
  "expo": {
    "plugins": [
      ["expo-sqlite", { "useSQLCipher": true }]
    ]
  }
}
```
Then on DB open:
```ts
const db = await SQLite.openDatabaseAsync('3ptracker.db');
await db.execAsync(`PRAGMA key = 'derived-from-secure-store'`);
```

The encryption key should be generated on first launch, stored in `expo-secure-store` (iOS Keychain / Android Keystore), and derived via a KDF. Never hardcode.

### Backend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase (self-hosted) | latest | Auth, DB, Realtime, RLS | Open source, PostgreSQL, built-in auth + real-time, runs on homelab, no vendor lock-in | HIGH (Supabase docs) |
| @supabase/supabase-js | 2.112.x | Client SDK | Official JS client, React Native support with expo-sqlite localStorage polyfill | HIGH (npm + Supabase docs) |
| PostgreSQL | 16+ | Leaderboard data | Supabase dependency, materialized views for leaderboard aggregation | HIGH |

**Supabase client initialization pattern:**
```ts
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import 'expo-sqlite/localStorage/install'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage, // expo-sqlite polyfill
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

**What NOT to use and why:**
- **Firebase** — Vendor lock-in, pricing scales fast, no self-hosted option for homelab.
- **Custom Express/Fastify backend** — Reimplements what Supabase gives for free (auth, RLS, realtime, Postgres). More code to maintain.
- **MongoDB** — Relational data (leaderboards, streaks, user relationships) is a natural fit for Postgres. NoSQL adds mapping complexity.

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Auth | built-in | Email/password auth | Already part of Supabase, handles sessions, JWT, RLS integration | HIGH |
| expo-apple-authentication | latest | Apple Sign-In (iOS) | Required for App Store compliance, native Face ID/Touch ID UX | HIGH (Expo docs) |
| expo-auth-session | latest | Google OAuth flow | Browser-based OAuth, handles redirects, works cross-platform | HIGH (Expo docs) |
| expo-crypto | latest | PKCE for OAuth | Peer dependency for expo-auth-session, prevents code injection | HIGH |
| expo-secure-store | latest | Secure credential storage | iOS Keychain / Android Keystore for auth tokens and encryption keys | HIGH |

**Auth flow:**
1. Email/password → Supabase Auth `signUp` / `signInWithPassword`
2. Google → `expo-auth-session` with Google provider → Supabase `signInWithOAuth`
3. Apple → `expo-apple-authentication` native → Supabase `signInWithIdToken`

**What NOT to use and why:**
- **@react-native-google-signin/google-signin** — Expo's `expo-auth-session` handles Google OAuth without native module complexity. The dedicated library is fine but adds a dependency when expo-auth-session already works.
- **Clerk / Auth0** — Overkill for this project. Supabase Auth is free and self-hosted.

### Geolocation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-location | latest | GPS capture for logs | Official Expo library, foreground + background location, auto-captures on log creation | HIGH (Expo docs) |

**Usage pattern:**
- Request `When In Use` permission (not `Always` — v1 doesn't need background tracking)
- Capture location once per log entry via `Location.getCurrentPositionAsync()`
- Store lat/lng in SQLite log entry
- Period data: optionally capture location, but it's metadata only

**What NOT to use and why:**
- **react-native-geolocation-service** — Expo's managed workflow handles this. Adding a bare RN library breaks the workflow.
- **Background location** — Not needed for v1. Users tap to log; we capture location at tap time. Background tracking drains battery and raises privacy concerns.

### Push Notifications

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-notifications | latest | Push notification delivery | Official Expo library, Expo Push Service handles FCM/APNs complexity, works with self-hosted backend | HIGH (Expo docs) |
| expo-device | latest | Device detection | Required for push token registration | HIGH |
| expo-constants | latest | Project ID access | Required for `getExpoPushTokenAsync` | HIGH |

**Push use cases:**
- Streak reminders ("Don't break your 7-day poop streak!")
- Period predictions ("Your period is estimated to start in 2 days")
- Friend activity (optional, leaderboard updates)

**What NOT to use and why:**
- **react-native-firebase / @react-native-firebase/messaging** — Expo Push Service handles FCM/APNs delivery. Going direct to FCM adds native config complexity for no benefit.
- **OneSignal / Airship** — Third-party services that add cost and vendor lock-in. Expo's service is free and sufficient.

### UI & Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-native-reanimated | 3.x | Animations | Smooth 60fps animations for fun/playful UI, tab transitions, emoji animations | HIGH |
| react-native-gesture-handler | 2.x | Touch interactions | Swipe gestures, pull-to-refresh, required by Expo Router | HIGH |
| react-native-svg | latest | SVG rendering | Required for QR codes, custom icons, Bristol stool chart illustrations | HIGH |
| react-native-qrcode-svg | 6.3.x | QR code generation | 890k weekly downloads, mature, wraps node-qrcode + react-native-svg | HIGH (npm) |
| react-native-maps | 1.29.x | Map + Heatmap (future) | Built-in HeatOverlay component for Google Maps, 1.1M weekly downloads | HIGH (npm) |

**Color scheme implementation:**
```ts
const COLORS = {
  poop: '#8B4513',      // Brown
  piss: '#FFD700',      // Yellow  
  period: '#FF69B4',    // Pink
  background: '#FFF8F0', // Warm off-white
  accent: '#FF4500',    // Fun orange for CTAs
}
```

**What NOT to use and why:**
- **NativeBase / React Native Paper** — Heavy component libraries that fight custom theming. For a playful branded app, build custom components with Reanimated.
- **Victory Native / react-native-chart-kit** — Overkill for v1. Period charts can be simple custom SVG. Heatmaps use react-native-maps HeatOverlay.

### PWA Support (iOS Distribution)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Expo web export | `expo export -p web` | Static site generation | Generates PWA-ready static files | HIGH (Expo docs) |
| Workbox CLI | latest | Service worker generation | Offline caching, precaching, Google's standard | HIGH |
| Web App Manifest | standard | Install prompt metadata | `display: standalone`, icons, theme color | HIGH |

**iOS PWA limitations to plan for:**
- No installation prompt/banner (user must manually "Add to Home Screen")
- No push notifications via PWA (iOS restriction)
- No background sync
- `display: standalone` works since iOS 11.3

**Strategy:** The PWA is a fallback for iOS users who can't/don't want to sideload. The native Android APK is the primary distribution. For iOS power users, EAS Build sideloading via `expo-dev-client` is an option.

**What NOT to use and why:**
- **Capacitor / Cordova** — Adds a webview layer. Expo's web export produces a real PWA without wrapper overhead.
- **TWA (Trusted Web Activity)** — Android-only, requires Play Store. APK distribution is the goal.

### Heatmap Visualization (Future Feature)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-native-maps HeatOverlay | 1.29.x | Density visualization | Built-in heatmap component for Google Maps, `WeightedLatLng[]` input, configurable radius/gradient | HIGH (official docs) |

**Not needed in v1.** Research flagged this as future. The stack already includes react-native-maps, so heatmap is a config toggle, not a new dependency.

### QR Code Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-native-qrcode-svg | 6.3.x | Friend invite QR codes | Mature (890k weekly downloads), SVG-based (crisp at any size), customizable colors for branding | HIGH (npm) |
| react-native-svg | latest | SVG rendering | Peer dependency, also used for custom icons and illustrations | HIGH |

**Usage:** Generate QR code from invite link (e.g., `https://3ptracker.app/invite/ABC123`). Friend scans → opens app or PWA → creates account → auto-added to friends list.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Local DB | expo-sqlite + SQLCipher | WatermelonDB | Overkill sync protocol for small datasets, adds complexity |
| Local DB | expo-sqlite + SQLCipher | Realm | Deprecated by MongoDB, paid cloud sync, object model overhead |
| Key-Value | MMKV v4 | AsyncStorage | 30x slower, no encryption, async-only |
| Backend | Supabase self-hosted | Firebase | No self-hosted option, vendor lock-in, pricing |
| Routing | Expo Router v5 | React Navigation | Expo Router wraps it + adds file-based routing |
| Auth | Supabase Auth | Clerk/Auth0 | Overkill, Supabase Auth is free and self-hosted |
| Notifications | expo-notifications | react-native-firebase | Expo Push Service handles FCM/APNs complexity |
| Maps | react-native-maps | react-native-maptastic | react-native-maps has HeatOverlay, 1.1M weekly downloads |
| QR | react-native-qrcode-svg | react-native-qr-svg | qrcode-svg has 890k downloads vs 40; more battle-tested |

## Installation

```bash
# Core framework
npx create-expo-app@latest 3P-Tracker --template tabs
cd 3P-Tracker

# Navigation & UI
npx expo install expo-router react-native-reanimated react-native-gesture-handler react-native-safe-area-context

# Storage
npx expo install expo-sqlite react-native-mmkv react-native-nitro-modules expo-secure-store

# Backend
npm install @supabase/supabase-js react-native-url-polyfill

# Auth
npx expo install expo-apple-authentication expo-auth-session expo-crypto expo-web-browser

# Location & Notifications
npx expo install expo-location expo-notifications expo-device expo-constants expo-task-manager

# Maps & QR
npm install react-native-maps react-native-qrcode-svg
npx expo install react-native-svg

# Dev tools
npm install -D @types/react
```

## Config Plugin Setup (app.json)

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      ["expo-notifications", { "color": "#FF4500" }],
      ["expo-sqlite", { "useSQLCipher": true, "enableFTS": true }],
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Allow 3P Tracker to capture your location for logging."
      }],
      "expo-apple-authentication"
    ],
    "ios": {
      "usesAppleSignIn": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "3P Tracker uses your location to automatically record where you log."
      }
    },
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION"]
    }
  }
}
```

## Sources

- Expo SDK 53 documentation (docs.expo.dev) — HIGH confidence, official
- expo-sqlite v56 docs with SQLCipher config (docs.expo.dev) — HIGH confidence, official
- react-native-mmkv v4 GitHub repo (mrousavy/react-native-mmkv) — HIGH confidence, official
- @supabase/supabase-js v2.112 npm + GitHub releases — HIGH confidence, official
- Supabase Expo React Native quickstart (supabase.com/docs) — HIGH confidence, official
- Expo push notifications setup guide (docs.expo.dev) — HIGH confidence, official
- react-native-maps HeatOverlay docs (GitHub) — HIGH confidence, official
- react-native-qrcode-svg npm (890k weekly) — HIGH confidence, verified downloads
- Expo PWA guide (docs.expo.dev/guides/progressive-web-apps) — HIGH confidence, official
- iOS PWA compatibility notes (firt.dev/notes/pwa-ios) — MEDIUM confidence, community but well-sourced
- MMKV vs AsyncStorage benchmarks (multiple 2025-2026 articles) — MEDIUM confidence, community verified
- WatermelonDB vs SQLite comparison articles (pkgpulse.com, reactnative.live) — MEDIUM confidence, community
