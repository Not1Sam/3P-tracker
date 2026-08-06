# Domain Pitfalls

**Domain:** Health/body tracking mobile app (poop, piss, period)
**Researched:** 2026-08-06

---

## Critical Pitfalls

Mistakes that cause rewrites, legal liability, or user trust collapse.

### Pitfall 1: Period Data Leakage — The Existential Threat

**What goes wrong:** Period data (cycle dates, symptoms, predictions) gets transmitted off-device through analytics SDKs, crash reporters, sync mechanisms, or third-party libraries that phone home. Even "anonymized" data can be re-identified. Post-Roe v. Wade, this is not theoretical — Flo Health was found liable in 2025 for allowing Meta to collect reproductive health data through embedded tracking pixels.

**Why it happens:** Developers forget that every npm package is a potential data exfiltration vector. Firebase Analytics, Sentry crash reporting, Google Fonts, ad SDKs — all can leak metadata. The app's own sync mechanism could accidentally include period fields.

**Consequences:** Legal liability under state health data laws (Washington's My Health My Data Act, CCPA). Loss of user trust. Potential use of data for legal action against users in restrictive jurisdictions. The app becomes a tool of surveillance rather than health empowerment.

**Prevention:**
- Period data tables must be architecturally isolated — separate encryption key, separate storage namespace, zero network surface area
- Audit EVERY dependency for network calls — use `react-native-network-logger` during development
- Period data must never touch any API endpoint, including crash reporting (redact before sending)
- Implement a "period data firewall" pattern: the sync module explicitly excludes period tables by name
- No analytics SDK on period screens — period module must be network-airgapped
- Use `expo-crypto` or `react-native-keychain` for period-specific encryption key, derived from user's biometric/PIN

**Detection:** Network traffic analysis showing any outbound requests when period module is active. Dependency audit revealing analytics in period-related code paths.

**Phase:** Foundation (Phase 1-2) — must be designed in from day one. Cannot be bolted on later.

---

### Pitfall 2: Encryption Key Management — Losing the Key Means Losing Everything

**What goes wrong:** Encryption keys are stored alongside encrypted data (useless), hardcoded in source (catastrophic), or derived from predictable values (trivially breakable). If the key is tied to the device fingerprint and the user clears app data or switches devices, all data is permanently lost.

**Why it happens:** Developers treat encryption as "add a library" rather than a key management problem. The temptation to store the key in AsyncStorage or a plain file is strong during prototyping.

**Consequences:** Data is either not actually encrypted (false sense of security) or is encrypted and then permanently lost when the key is lost. Both are catastrophic for a health app.

**Prevention:**
- Use iOS Keychain / Android Keystore for key storage — never in app-accessible storage
- Derive encryption key from user's PIN/biometric using `expo-crypto` PBKDF2
- Implement key rotation strategy from day one (even if v1 doesn't use it)
- For period data specifically: key must be derived from user's authentication factor, not device state
- Backup key derivation: allow user to set a recovery passphrase (NOT stored on device)
- Test key recovery flow as aggressively as the encryption itself

**Detection:** Penetration test showing key extractable from device. User reports of data loss after app reinstall.

**Phase:** Foundation (Phase 1-2) — key management is a architectural decision, not a feature.

---

### Pitfall 3: The Sync Conflict Catastrophe — Losing User Data on Merge

**What goes wrong:** When sync eventually happens (even in "local-first" with optional cloud), conflicting edits produce duplicate records, lost data, or corrupted state. Two devices editing the same log entry produces a merged mess. Worse: silent data corruption where the user doesn't realize data was lost until they need it.

**Why it happens:** "We'll just use last-write-wins" without considering clock skew. No unique IDs across devices. No version tracking. No conflict detection. Treating sync as a future problem instead of an architectural decision.

**Consequences:** Users lose health data silently. Trust destroyed. Leaderboard scores become unreliable. Period predictions break from missing cycle data.

**Prevention:**
- Use UUID v4 for all record IDs — generated client-side, never from server
- Every record needs `version` (integer) and `updatedAt` (hybrid logical clock, not wall time)
- Implement the Outbox Pattern: local writes go to an outbox table, sync processes the queue
- Conflict resolution strategy chosen per data type BEFORE implementation:
  - Log entries (poop/piss): server wins for timestamps, client wins for comments/types
  - Period data: NEVER syncs (architectural rule, not a policy)
  - Leaderboard: server-only writes, client can only submit
- Show sync status in UI: "Saved locally" → "Syncing" → "Synced"
- Test the unhappy path: airplane mode mid-write, two devices editing same record, sync failure halfway through

**Detection:** User reports of missing entries. Duplicate records appearing in logs. Leaderboard showing impossible scores.

**Phase:** Foundation (Phase 2-3) — sync architecture must be decided before any data model is finalized.

---

### Pitfall 4: Leaderboard Trust Collapse — Letting Clients Write Scores

**What goes wrong:** The app lets the client compute and submit scores (e.g., "I pooped 5 times today"). Users submit fake data. Bots spam entries. Leaderboard becomes worthless. The social feature that drives engagement becomes the feature that drives users away.

**Why it happens:** "It's just a fun leaderboard, who would cheat?" — everyone. The temptation to let the client compute streak counts or log totals is strong because it's simpler. But any client-computed value is trivially forgeable.

**Consequences:** Leaderboard becomes a joke. Competitive users leave. The social proof that drives adoption collapses. Moderation burden increases.

**Prevention:**
- Server-side scoring ONLY — client submits raw log events, server computes streaks/totals
- Implement rate limiting: max N log submissions per hour per user
- Validate log timestamps: reject entries with future timestamps, entries more than 24h in the past
- Cross-validate location: if user logs "home" poop but GPS shows they're at work, flag for review
- Streak calculation must happen server-side with validation windows
- Anomaly detection: sudden jump from 1 poop/day to 20 = flag for review
- Leaderboard updates must be delayed (e.g., 1-hour delay) to allow validation before display

**Detection:** Sudden leaderboard position changes. Users with statistically impossible log patterns. Reports of "fake" top entries.

**Phase:** Social Features (Phase 4-5) — anti-cheat must be designed into the API from the start.

---

### Pitfall 5: Self-Hosted Supabase — The Maintenance Trap

**What goes wrong:** Self-hosted Supabase becomes an unmaintained liability. Default credentials left unchanged. Backups never tested. Updates skipped because "it's working." Docker volumes not persisted. The homelab goes down and the app stops working for all users.

**Why it happens:** Self-hosting feels like "set it and forget it." In reality, it's a production database that needs ongoing maintenance. The user's homelab may not have monitoring, automated backups, or redundancy.

**Consequences:** Data loss from untested backups. Security breach from default credentials. Service outage when homelab goes down. Supabase version drift breaking the app.

**Prevention:**
- Document the full self-hosting runbook before launch (not after)
- Automate backups with `pg_dump` cron + off-site storage (e.g., S3-compatible)
- Set up monitoring: uptime check, disk usage alert, database connection pool alert
- Never use default JWT secrets or API keys — generate fresh ones before first deploy
- Put Supabase behind a reverse proxy (Caddy/Nginx) with HTTPS
- Test backup restoration monthly — if you haven't tested it, it doesn't exist
- Plan for Supabase updates: read changelogs before upgrading, test in dev first
- Document the "homelab down" scenario: what happens to users when the server is unreachable?

**Detection:** No backup restoration test in the last 30 days. Default credentials in `.env`. No monitoring alerts configured.

**Phase:** Infrastructure (Phase 2-3) — must be set up properly before any user data exists.

---

## Moderate Pitfalls

Issues that cause significant friction, user churn, or technical debt.

### Pitfall 6: Geolocation Battery Drain — The Silent Uninstaller

**What goes wrong:** Background geolocation tracking drains battery so aggressively that users uninstall the app within days. Continuous GPS at 1 Hz consumes 5-10% battery per hour. Android OEM battery managers (Samsung, Xiaomi, OnePlus) aggressively kill background services.

**Why it happens:** Developers use continuous GPS tracking for "auto-capture location" without considering power budget. One-size-fits-all accuracy settings. No motion-state awareness.

**Consequences:** 1-star reviews citing battery drain. Users uninstalling within the first week. App store rating collapse.

**Prevention:**
- Use motion-based location: only capture location when user is actively logging (foreground), not continuous background tracking
- Implement adaptive accuracy: high accuracy when moving, low when stationary
- Batch API calls — don't send each location point individually
- On Android: use foreground service with user-visible notification (required for background location)
- Test on Samsung/Xiaomi devices specifically — they have aggressive battery optimization
- Offer a "manual location" option for users who don't want GPS
- Profile battery usage in development using Android Battery Historian and iOS Energy Log

**Detection:** App store reviews mentioning battery drain. High uninstall rate within first 7 days. Battery usage stats showing location as top consumer.

**Phase:** Core Features (Phase 2-3) — location capture is part of the core logging flow.

---

### Pitfall 7: iOS PWA Limitations — The Half-Baked Experience

**What goes wrong:** The PWA path for iOS delivers a degraded experience: no background sync, limited push notifications, no access to some hardware features, inconsistent behavior across iOS versions. Users on iOS get a worse product than Android users.

**Why it happens:** iOS PWA support has improved (iOS 16.4+ added push notifications) but still has hard limits: no background processing, limited offline storage, no NFC/Bluetooth, and the install flow is non-obvious.

**Consequences:** iOS users feel like second-class citizens. Feature parity impossible. The "cross-platform" promise breaks down.

**Prevention:**
- Design the iOS PWA experience as a separate product, not a degraded native experience
- Accept PWA limitations upfront: no background location, no continuous sync
- Use "just-in-time" permission requests — explain WHY before asking
- Test on multiple iOS versions — PWA behavior varies significantly
- Consider Expo EAS Build for iOS sideloading as an alternative to PWA
- Document iOS-specific limitations in the app's help/FAQ section
- Never promise "native-like experience" for the PWA path

**Detection:** iOS users reporting features that work on Android but not iOS. PWA install rate significantly lower on iOS. Feature requests that are impossible under PWA constraints.

**Phase:** Platform Strategy (Phase 1) — must decide PWA vs native limitations before building.

---

### Pitfall 8: AsyncStorage is NOT Encrypted — The False Security Trap

**What goes wrong:** Developers use React Native's `AsyncStorage` for "encrypted" storage, thinking it's secure because it's "local." AsyncStorage is plaintext SQLite — anyone with device access can read it. Rooted/jailbroken devices expose all data.

**Why it happens:** AsyncStorage is the default recommendation in React Native tutorials. It's easy and works. Developers don't realize it stores data in plaintext on the device filesystem.

**Consequences:** All user health data is trivially extractable from the device. "Encrypted storage" claim is false. Legal liability if user data is breached.

**Prevention:**
- NEVER use AsyncStorage for any health data
- Use `expo-secure-store` for small sensitive values (tokens, keys)
- Use `expo-sqlite` with SQLCipher or field-level encryption for database storage
- For period data: use `react-native-keychain` for the encryption key, derive from biometric
- Audit all storage mechanisms: grep for `AsyncStorage` in codebase and eliminate
- Document the encryption architecture clearly — what's encrypted, with what, where keys live

**Detection:** Code review finding AsyncStorage usage for health data. Penetration test showing readable data files on device.

**Phase:** Foundation (Phase 1) — storage architecture is a day-one decision.

---

### Pitfall 9: Location Permission UX Disaster — Burning the One Chance

**What goes wrong:** The app requests location permission on first launch (or in a `useEffect` with no user gesture). iOS/Android shows the native permission dialog. User denies. Permission denial is sticky — the app can never ask again without navigating to Settings. The "auto-capture location" feature is permanently broken for that user.

**Why it happens:** Developers call `getCurrentPosition()` or `requestForegroundPermissionsAsync()` in component mount. No pre-prompt explaining WHY. No graceful fallback.

**Consequences:** Location feature permanently broken for deny-users. Significant portion of users will deny on first prompt. Feature becomes useless for a large chunk of the userbase.

**Prevention:**
- NEVER request location permission on app launch
- Show a custom pre-prompt screen: "Enable location to auto-tag your logs? [Enable] [Skip]"
- Explain the benefit: "Location helps you see patterns (home, work, travel)"
- Only request native permission after user taps "Enable" on the pre-prompt
- Always provide manual location fallback (ZIP/city entry)
- Treat denial as a valid choice, not an error — the app must work fully without location
- Test the "denied" path as thoroughly as the "granted" path

**Detection:** Analytics showing high location permission denial rate. Users reporting "location doesn't work" after initial setup.

**Phase:** Core Features (Phase 2-3) — permission flow must be designed before the feature.

---

### Pitfall 10: Schema Migration Hell — Breaking Existing Users' Data

**What goes wrong:** App update changes the database schema. Existing users' local databases become incompatible. Data is lost or app crashes on upgrade. The "offline-first" advantage becomes a liability because every user has a local database that must migrate.

**Why it happens:** Developers don't plan for schema evolution. No migration system. Manual `ALTER TABLE` statements that fail on certain data states. Testing only on fresh installs.

**Consequences:** Users lose data on app update. App crashes after update. Forced re-install loses all local data. Trust collapse.

**Prevention:**
- Design migration system from day one — every schema change gets a numbered migration
- Migrations must be idempotent and reversible
- Test migrations with realistic data volumes (not empty databases)
- Use `expo-sqlite` migration API or a library like `typeorm` with migration support
- Never drop columns in-place — add new column, migrate data, then drop old in next migration
- Version the schema alongside the app version
- Test: install v1, add data, upgrade to v2, verify data intact

**Detection:** Crash reports on app update. User reports of "lost data after update." Migration test suite failures.

**Phase:** Foundation (Phase 1-2) — migration system must exist before first schema change.

---

## Minor Pitfalls

Issues that cause friction, workarounds, or suboptimal UX.

### Pitfall 11: The "Fun" UI Backfires — Trivializing Health Data

**What goes wrong:** The brown/yellow/pink color scheme and playful emoji feel disrespectful when users are logging genuinely concerning symptoms. A user logging blood in their stool sees a 🎉 animation. The tone mismatch makes the app feel inappropriate for serious health tracking.

**Why it happens:** The brand identity ("fun poop tracker") conflicts with the reality (people use it to track health concerns). Design decisions made for marketing, not for all use cases.

**Consequences:** Users with health concerns feel alienated. App feels inappropriate for serious use. Medical professional recommendations become impossible.

**Prevention:**
- Allow theme/tone toggle: "Playful" vs "Clinical" mode
- Bristol stool chart should use medical illustrations, not cartoon emoji
- Symptom logging should have a neutral, clinical UI path
- The "fun" layer should be opt-in (leaderboards, streaks), not forced on health logging
- Test with users who have IBD, IBS, or other GI conditions — their experience matters

**Detection:** User feedback mentioning "inappropriate" or "disrespectful." Low engagement from users with serious health concerns.

**Phase:** UI/UX (Phase 3-4) — tone must be decided early, not retrofitted.

---

### Pitfall 12: Supabase RLS Policy Mistakes — Exposing User Data

**What goes wrong:** Row-Level Security (RLS) policies are misconfigured or missing, allowing User A to read User B's leaderboard data, or worse, their health logs. Supabase makes it easy to create tables without RLS enabled by default.

**Why it happens:** Developers prototype with RLS disabled for convenience. Forget to enable it before launch. Or enable RLS but write policies that are too permissive (e.g., `SELECT` policy allows all authenticated users).

**Consequences:** Privacy breach. User data exposure. Trust destruction. Potential legal liability.

**Prevention:**
- Enable RLS on EVERY table at creation time — no exceptions
- Write RLS policies before writing application code
- Test RLS by querying as different users in Supabase Studio
- Period data tables: NO SELECT policy for any server-side role (zero network access)
- Use the Supabase CLI for migrations — never modify schema through the Studio UI in production
- Audit RLS policies quarterly as the schema evolves

**Detection:** Penetration test showing cross-user data access. RLS disabled on any table in production.

**Phase:** Foundation (Phase 2) — RLS must be part of the initial schema design.

---

### Pitfall 13: Offline-First Architecture — The "Just Add Sync Later" Trap

**What goes wrong:** Developers build a normal client-server app and plan to "add offline support later." This is architecturally impossible without a rewrite. Local-first is a fundamental architecture decision, not a feature.

**Why it happens:** Offline-first adds complexity. The temptation to defer it is strong. "We'll handle it when we need it" — but by then the data model, API design, and UI are all built around the assumption of connectivity.

**Consequences:** Complete rewrite when offline-first is actually needed. Or the feature is abandoned, leaving users without data access in low-connectivity situations.

**Prevention:**
- Design the data layer as local-first from day one: UI reads from local DB, not API
- Every write goes to local DB first, then sync queue
- API is a sync protocol, not a CRUD interface
- Use the Outbox Pattern: local mutations queue, background sync processes them
- Test with airplane mode from the first sprint — if it doesn't work offline, it's not done
- Document the architecture decision: "The local database is the source of truth"

**Detection:** API calls in UI component render functions. No local database in the architecture. "Sync" is a function that calls the API directly.

**Phase:** Foundation (Phase 1) — this is the FIRST architectural decision.

---

### Pitfall 14: Expo SDK Migration Debt — The Annual Rewrite

**What goes wrong:** Expo SDK updates every year with breaking changes. The app falls behind on SDK versions. Eventually, dependencies stop supporting the old SDK. The "upgrade" requires rewriting significant portions of the app.

**Why it happens:** Expo's rapid release cycle means staying current is ongoing work. Each SDK update can change native module APIs, deprecate packages, and require configuration changes.

**Consequences:** App becomes unmaintainable. Security vulnerabilities from unpatched dependencies. Cannot use new features. Eventually forced to rewrite.

**Prevention:**
- Budget 1-2 days per Expo SDK upgrade for testing and fixing breaking changes
- Upgrade Expo SDK within 3 months of release — don't let it pile up
- Use Expo's upgrade tool (`npx expo install --fix`) to handle most dependency updates
- Test all native features (location, secure store, crypto) after each upgrade
- Keep a "SDK upgrade" checklist in the project docs
- Consider Expo's Long-Term Support channels if available

**Detection:** More than 2 Expo SDK versions behind. Dependencies with deprecation warnings. Build failures on new OS versions.

**Phase:** Ongoing maintenance — not a specific phase, but must be budgeted.

---

### Pitfall 15: Friend System Abuse — Spam Invites and Harassment

**What goes wrong:** The invite/link/QR code system is abused for spam. Users create multiple accounts to manipulate leaderboards. Friend requests become harassment vectors. The social layer becomes toxic.

**Why it happens:** Social features are hard to moderate. The "fun" vibe discourages thinking about abuse. Invite links are inherently viral and hard to control.

**Consequences:** Toxic community. Users leaving. Moderation burden. The social feature drives users away instead of retaining them.

**Prevention:**
- Rate limit friend requests (e.g., 10 per day max)
- Require email verification before social features unlock
- Blocklist system for reported users
- Invite links expire after 7 days or N uses
- Account age requirement before leaderboard participation (e.g., 7 days)
- Report/block functionality from day one
- Consider: should the leaderboard be opt-in? (Users choose to participate)

**Detection:** Reports of spam invites. Multiple accounts from same device. Sudden leaderboard manipulation patterns.

**Phase:** Social Features (Phase 4-5) — abuse prevention must be designed into the system.

---

### Pitfall 16: Data Backup and Recovery — The "My Phone Broke" Scenario

**What goes wrong:** User's phone breaks, is lost, or is stolen. All local data is gone. There's no backup mechanism. The user loses months of health tracking data. They're furious.

**Why it happens:** Local-first architecture means data lives on the device. If there's no cloud backup (and period data specifically can't be backed up to cloud), data loss is a real risk.

**Consequences:** Permanent data loss. User churn. Negative reviews. The "privacy-first" architecture becomes a liability.

**Prevention:**
- Offer encrypted local backup to user's cloud storage (iCloud/Google Drive) — encrypted with user's key, not readable by the cloud provider
- For non-period data: optional encrypted export to user-controlled storage
- For period data: encrypted export to user's device only (USB, local file)
- Document the backup/restore process in the app's help section
- Test the restore flow as part of QA
- Consider: should the app warn users about backup status? (e.g., "No backup configured — data may be lost if device is damaged")

**Detection:** User reports of data loss after device change. No backup mechanism in the codebase.

**Phase:** Core Features (Phase 3) — backup/restore must exist before public launch.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation / Architecture | AsyncStorage used as "encrypted storage" | Use SQLCipher or field-level encryption from day one |
| Foundation / Architecture | Sync designed as afterthought | Local-first architecture must be the FIRST decision |
| Foundation / Architecture | Encryption key management overlooked | Key management architecture before any data model |
| Data Layer | Schema migrations not planned | Migration system before first table creation |
| Data Layer | RLS policies missing or too permissive | Enable RLS on every table at creation |
| Core Features | Geolocation draining battery | Motion-based tracking, not continuous GPS |
| Core Features | Location permission burned on first launch | Custom pre-prompt, graceful fallback |
| Core Features | No backup/restore mechanism | Encrypted backup to user's cloud storage |
| Social Features | Client-computed leaderboard scores | Server-side scoring only |
| Social Features | Friend system abuse / spam | Rate limiting, verification, block/report |
| Social Features | Period data accidentally synced | Architectural firewall — period tables never touch network |
| Infrastructure | Supabase default credentials | Generate fresh secrets before first deploy |
| Infrastructure | Backups never tested | Monthly backup restoration test |
| Infrastructure | Supabase version drift | Read changelogs, test upgrades in dev first |
| UI/UX | Fun tone trivializing health concerns | Theme toggle: Playful vs Clinical mode |
| Platform | iOS PWA limitations surprise users | Document limitations, design separate iOS experience |
| Maintenance | Expo SDK debt accumulates | Budget upgrade time, stay within 3 months of release |

---

## Sources

- ProPublica: "Federal Patient Privacy Law Does Not Cover Most Period-Tracking Apps" (2022)
- FTC: "Mobile Health App Developers: FTC Best Practices" (2022)
- Flo Health FTC settlement and 2025 Meta liability verdict
- Washington State My Health My Data Act (2024)
- Supabase GitHub Discussions #323, #39820 (self-hosting experiences)
- Hrekov: "Supabase Pitfalls: Avoid These Common Mistakes" (2026)
- Evil Martians: "Cool frontend arts of local-first: storage, sync, conflicts" (2023)
- TechInterview: "Design an Offline-First Mobile App" (2026)
- Android Developer Docs: "Background location and battery life" (2026)
- WellAlly: "Location Tracking Battery Drain Fix (React Native)" (2026)
- Wolf-Tech: "React Native vs PWA vs Expo" (2026)
- MagicBell: "PWA iOS Limitations and Safari Support" (2026)
- EarthGuessr: "Anti-Cheat: How We Keep the Leaderboard Fair" (2026)
- AllAboutCookies: "Best Period Tracking Apps for Data Privacy" (2026)
- HHS.gov: "Resources for Mobile Health Apps Developers" (2026)
