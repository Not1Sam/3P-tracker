# Project Research Summary

**Project:** 3P Tracker
**Domain:** Health/body tracking mobile app (poop, piss, period) with social gamification
**Researched:** 2026-08-06
**Confidence:** HIGH

## Executive Summary

3P Tracker occupies a unique market intersection: period tracking (mature market, Flo/Clue dominate with 420M+ combined downloads), bathroom tracking (niche but growing), and social health gamification (emerging pattern). No existing app combines all three. The recommended approach is a **local-first, privacy-by-design architecture** built on Expo SDK 53+ with encrypted SQLite (SQLCipher) on-device and self-hosted Supabase for social/leaderboard features only. Period data must **never leave the device** — this is a hard architectural constraint, not a preference.

The tech stack is straightforward: Expo managed workflow, React Native with Expo Router v5, expo-sqlite + SQLCipher for encrypted relational storage, MMKV for fast key-value settings, and Supabase (self-hosted on homelab) for auth, leaderboards, and realtime updates. The critical architectural decision is a **three-tier data partitioning system** where period data is network-airgapped, poop/piss raw entries stay on-device with monthly summary aggregates sent to cloud, and social/leaderboard data syncs in real-time.

The biggest risks are **period data leakage** (every npm package is a potential exfiltration vector — Flo Health was found liable in 2025 for Meta tracking pixel data collection), **encryption key management** (losing the key means losing everything), and **leaderboard trust collapse** (client-computed scores are trivially forgeable). All three must be designed into the architecture from day one, not bolted on later. The self-hosted Supabase deployment adds ongoing maintenance burden that needs a documented runbook before launch.

## Key Findings

### Recommended Stack

The stack is built around Expo's managed workflow with maximum use of official Expo libraries. All core technologies have HIGH confidence from official documentation.

**Core technologies:**
- **Expo SDK 53+** — App shell, build pipeline, managed workflow. EAS Build for APK, web export for PWA.
- **React Native 0.79+** — Cross-platform UI. Ships with Expo SDK 53, New Architecture support.
- **TypeScript 5.x** — Type safety, typed routes via Expo Router.
- **Expo Router v5** — File-based routing, automatic deep linking, web + native from same codebase.
- **expo-sqlite + SQLCipher** — Primary encrypted relational DB. SQLCipher via `useSQLCipher: true` config, WAL mode, live queries.
- **react-native-mmkv v4** — Fast key-value store for settings/preferences. ~30x faster than AsyncStorage, AES-256 encryption, synchronous reads.
- **Supabase (self-hosted)** — Auth, PostgreSQL DB, Realtime WebSocket, Row-Level Security. Runs on homelab, no vendor lock-in.
- **expo-location** — GPS capture per log entry. "When In Use" permission only, no background tracking.
- **expo-notifications** — Push notifications via Expo Push Service (handles FCM/APNs complexity).
- **react-native-maps** — Map display and future HeatOverlay for bathroom patterns.
- **react-native-qrcode-svg** — Friend invite QR codes (890k weekly downloads, battle-tested).

**Two-tier storage architecture:**
- MMKV (synchronous, fast): auth tokens, user preferences, theme settings, sync timestamps, feature flags.
- expo-sqlite + SQLCipher (encrypted, relational): all health logs (poop, piss, period), custom types, streak data.

### Expected Features

**Must have (table stakes):**
- One-tap quick logging for all three tracks (under 10 seconds, every bathroom app markets this)
- Bristol stool chart selection (1-7) — international clinical standard used by gastroenterologists
- Medical urine color palette — clear-to-brown spectrum with clinical names
- Custom type/color definitions — power users want their own categories
- Optional comments/notes per entry
- Auto-capture datetime + geolocation on every log
- History/calendar view (month view + list toggle)
- Edit/delete past entries
- Period cycle prediction, flow level tracking, symptom/mood logging
- Period reminders/notifications
- Cycle statistics/insights
- Data export (PDF/CSV) for doctor sharing
- Email/password + Google/Apple sign-in
- User profiles with usernames
- Friend system with username search
- Basic leaderboard (ranked friend list)
- Streak tracking

**Should have (differentiators):**
- All-in-one bathroom + period tracking (unique market position — users currently need 2-3 apps)
- Separate pee & poop leaderboards with individual streaks
- QR code / invite link friend adding (friction-free onboarding)
- Friends vs global leaderboard toggle
- Podium leaderboard UI with medals (Bronze/Silver/Gold tiers)
- Period data NEVER leaves device (privacy-first, Cyla/Euki model)
- Thematic brown/yellow/pink UI with playful brand identity
- Streak forgiveness/grace days (0.9% return rate after streak break without recovery)
- Activity feed for friend milestones

**Defer (v2+):**
- Heatmap visualization (requires sufficient user data volume)
- Wearable integration (Apple Health/Google Fit — out of scope v1)
- Food/medication correlation (medical complexity, different product)
- Pregnancy/fertility modes (completely different user journey)
- AI features (photo analysis, health assistant — liability and complexity)

### Architecture Approach

The architecture follows a **local-first, privacy-by-design** model with three data tiers based on sensitivity. The local database is the source of truth; cloud sync is optional and batch-oriented.

**Major components:**
1. **UI Layer** — Tab navigation (Poop / Piss / Period / Profile), log entry screens, history/calendar views. Presentation only, no data logic.
2. **Service Layer** — Business logic, encryption orchestration, sync decisions. Enforces data tier boundaries.
3. **Local Data Layer** — Drizzle ORM + expo-sqlite (SQLCipher). All user data lives here, encrypted at rest. Source of truth.
4. **Sync Layer** — Monthly batch sync of poop/piss SUMMARY data only. Raw entries never leave device. Period tables excluded entirely.
5. **Supabase Backend** — Auth (GoTrue), PostgreSQL (leaderboard_scores, friendships, monthly_summaries), Realtime (WebSocket for live leaderboard updates). All tables have RLS enabled.

**Data tier system:**
- Tier 1 (Period): Encrypted on device, NEVER transmitted. Architectural hard block.
- Tier 2 (Poop/Piss): Encrypted on device, monthly SUMMARY aggregates sent to cloud. Raw entries stay local.
- Tier 3 (Social/Leaderboard): Cloud-synced. Usernames, streaks, aggregate scores. Real-time via WebSocket.

### Critical Pitfalls

1. **Period Data Leakage** — The existential threat. Every npm package is a potential data exfiltration vector. Flo Health was found liable in 2025 for Meta tracking pixel collecting reproductive health data. Prevention: architectural isolation, separate encryption key, zero network surface area for period module, audit every dependency for network calls.

2. **Encryption Key Management** — Losing the key means losing everything. Keys stored alongside data are useless; hardcoded keys are catastrophic. Prevention: iOS Keychain / Android Keystore for key storage, derive from user's PIN/biometric via PBKDF2, implement key rotation strategy from day one, test key recovery flow aggressively.

3. **Sync Conflict Catastrophe** — "Last-write-wins" without clock skew handling produces duplicates, lost data, or silent corruption. Prevention: UUID v4 for all record IDs, version tracking with hybrid logical clocks, Outbox Pattern for local writes, conflict resolution strategy per data type chosen BEFORE implementation.

4. **Leaderboard Trust Collapse** — Client-computed scores are trivially forgeable. "It's just fun, who would cheat?" — everyone. Prevention: server-side scoring ONLY, rate limiting, timestamp validation, anomaly detection, delayed leaderboard updates (1-hour validation window).

5. **Self-Hosted Supabase Maintenance Trap** — Default credentials left unchanged, backups never tested, updates skipped. Prevention: documented runbook before launch, automated backups with tested restoration, monitoring alerts, fresh secrets before first deploy.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Local Data Layer
**Rationale:** Everything depends on the local database. The local-first architecture is the FIRST architectural decision — it cannot be bolted on later. Encryption key management and privacy tiering must be designed in from day one.
**Delivers:** Encrypted SQLite database with Drizzle ORM, poop/piss/period table schemas, CRUD operations, encryption key management (SecureStore + biometric), geolocation capture, schema migration system.
**Addresses:** Local data foundation for all three tracks, encrypted-at-rest storage, privacy-by-design data partitioning.
**Avoids:** AsyncStorage trap (Pitfall 8), offline-first as afterthought (Pitfall 13), schema migration hell (Pitfall 10), encryption key management failure (Pitfall 2).

### Phase 2: UI, Navigation & Core Logging
**Rationale:** With the data layer in place, build the user-facing experience. Tab navigation, one-tap logging flows, and history views give users immediate value. This phase can run parallel to Phase 3 (Supabase setup is independent infrastructure).
**Delivers:** Tab navigation (Poop/Piss/Period/Profile), log entry screens with Bristol chart/color palette, one-tap quick logging, history/calendar view, edit/delete entries, location permission UX with pre-prompt.
**Addresses:** Core logging features (table stakes), Bristol stool chart, urine color palette, geolocation auto-capture, history view.
**Avoids:** Geolocation battery drain (Pitfall 6), location permission UX disaster (Pitfall 9).

### Phase 3: Auth, Supabase Backend & Monthly Sync
**Rationale:** Auth and backend can start in parallel with UI development. Supabase setup is independent infrastructure. Monthly sync service connects the local-first architecture to the cloud for leaderboard data.
**Delivers:** Self-hosted Supabase deployment with documented runbook, email + Google/Apple auth, Supabase RLS policies on all tables, leaderboard/friendship tables, monthly batch sync service, encrypted data export (PDF/CSV).
**Addresses:** Auth system, leaderboard foundation, data export, monthly sync architecture.
**Avoids:** Supabase maintenance trap (Pitfall 5), RLS policy mistakes (Pitfall 12), sync conflict catastrophe (Pitfall 3 — outbox pattern, UUID v4, version tracking).

### Phase 4: Social Features & Leaderboards
**Rationale:** Social features depend on auth + backend (Phase 3). This is where the app differentiates — friend system, leaderboards, streaks, activity feed. Anti-cheat must be designed into the API from the start.
**Delivers:** Friend system with username search, QR code/invite link adding, separate pee/poop leaderboards, streak tracking with grace days, podium leaderboard UI, friends vs global toggle, activity feed, server-side scoring with rate limiting and anomaly detection.
**Addresses:** Social foundation (table stakes), all differentiators, gamification mechanics.
**Avoids:** Leaderboard trust collapse (Pitfall 4), friend system abuse (Pitfall 15).

### Phase 5: Period Tracking & Education
**Rationale:** Period tracking is architecturally independent — data never syncs to cloud, so it doesn't depend on Supabase. However, it's placed after social features because the core tracking loop (poop/piss) and social layer deliver more immediate unique value. Period tracking is the most sensitive feature and benefits from the foundation being solid first.
**Delivers:** Full period tracking (flow, symptoms, mood), cycle prediction algorithm (on-device), period reminders (local notifications), cycle statistics/insights, educational content, theme toggle (Playful vs Clinical mode).
**Addresses:** Period tracking (table stakes), cycle prediction, symptom logging, education.
**Avoids:** Period data leakage (Pitfall 1), fun UI trivializing health concerns (Pitfall 11).

### Phase 6: Polish, Distribution & Platform
**Rationale:** Final phase for UI polish, animations, platform-specific experiences, and distribution setup. Depends on all features being in place.
**Delivers:** Thematic brown/yellow/pink UI, Reanimated animations, PWA support for iOS, APK distribution setup, configurable notification preferences, data backup/restore mechanism, streak milestones and achievements.
**Addresses:** PWA iOS experience, app distribution, notification configuration, backup/recovery.
**Avoids:** iOS PWA limitations surprise (Pitfall 7), data backup and recovery failure (Pitfall 16).

### Phase Ordering Rationale

- **Phase 1 first** — local database is the foundation; everything depends on it. Privacy tiers and encryption must be designed before any data model is finalized.
- **Phases 2-3 parallelizable** — UI development and Supabase setup are independent workstreams.
- **Phase 4 after Phase 3** — social features require auth + backend infrastructure.
- **Phase 5 independent of Phase 3/4** — period data never syncs, so it doesn't depend on Supabase.
- **Phase 6 last** — polish and distribution after all features exist.
- **This order avoids critical pitfalls** — period data isolation designed in Phase 1, not bolted on; sync architecture decided before data model finalized; anti-cheat designed into API from Phase 4 start.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Encryption key management implementation details — needs validation of expo-sqlite SQLCipher integration with Drizzle ORM, key derivation flow with expo-crypto.
- **Phase 3:** Self-hosted Supabase deployment — needs runbook research for homelab setup, backup automation, monitoring.
- **Phase 4:** Leaderboard anti-cheat implementation — needs research on server-side scoring patterns, anomaly detection approaches, rate limiting strategies.
- **Phase 5:** Cycle prediction algorithm — needs research on evidence-based prediction methods (rhythm method, calendar-based, ML options).

Phases with standard patterns (skip research-phase):
- **Phase 2:** Tab navigation, form screens, history views — well-documented Expo patterns.
- **Phase 6:** Animations, PWA setup, APK distribution — Expo documentation covers these thoroughly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified against official Expo/Supabase docs. MMKV v4 and SQLCipher integration confirmed in official documentation. |
| Features | HIGH | Comprehensive competitive analysis across 15+ apps. Table stakes well-established in mature period/bathroom tracker markets. |
| Architecture | MEDIUM-HIGH | Privacy-by-design patterns and local-first architecture well-documented. Some community sources for WatermelonDB comparisons. Supabase RLS patterns are official. |
| Pitfalls | HIGH | Period data leakage supported by legal precedent (Flo FTC settlement 2025, My Health My Data Act). Encryption and sync pitfalls well-documented in security literature. |

**Overall confidence:** HIGH

### Gaps to Address

- **SQLCipher + Drizzle ORM integration:** Need to validate that Drizzle ORM works cleanly with expo-sqlite's SQLCipher mode. May need field-level encryption as fallback if ORM doesn't support PRAGMA key.
- **Key recovery flow:** The research recommends a recovery passphrase, but the UX for this needs design — how does a user recover if they forget their PIN? Balance between security and usability.
- **Supabase self-hosting specifics:** Homelab deployment details (Docker Compose config, networking, TLS termination) need research specific to the target infrastructure.
- **Cycle prediction algorithm:** Evidence-based methods for period prediction with limited data (first 3 months). Rhythm method vs ML approaches — needs domain research.
- **iOS PWA push notifications:** iOS 16.4+ supports push, but implementation details for Expo web export need validation. May need to design around this limitation.

## Sources

### Primary (HIGH confidence)
- Expo SDK 53 documentation (docs.expo.dev) — Core framework, Router, SQLite, Location, Notifications, SecureStore
- expo-sqlite v56 docs with SQLCipher config (docs.expo.dev) — Encryption at rest for SQLite
- react-native-mmkv v4 GitHub repo (mrousavy/react-native-mmkv) — Fast key-value storage
- @supabase/supabase-js v2.112 npm + GitHub releases — Backend SDK
- Supabase Expo React Native quickstart (supabase.com/docs) — Integration patterns
- Supabase Row Level Security docs (supabase.com/docs) — RLS patterns
- Supabase Realtime docs (supabase.com/docs) — WebSocket subscriptions
- Expo push notifications setup guide (docs.expo.dev) — Push delivery
- react-native-maps HeatOverlay docs (GitHub) — Future heatmap feature
- react-native-qrcode-svg npm (890k weekly downloads) — QR code generation
- Expo PWA guide (docs.expo.dev/guides/progressive-web-apps) — iOS distribution strategy

### Secondary (MEDIUM confidence)
- iOS PWA compatibility notes (firt.dev/notes/pwa-ios) — PWA limitations on iOS
- MMKV vs AsyncStorage benchmarks (multiple 2025-2026 articles) — Performance comparison
- SpiderLab: Local-First Mobile Architecture with WatermelonDB (2026) — Architecture patterns
- PkgPulse: Expo SQLite vs WatermelonDB vs Realm 2026 — Storage comparison
- Evil Martians: "Cool frontend arts of local-first" (2023) — Sync conflict patterns
- EarthGuessr: "Anti-Cheat: How We Keep the Leaderboard Fair" (2026) — Anti-cheat patterns
- Flo Health FTC settlement and 2025 Meta liability verdict — Period data legal precedent
- Washington State My Health My Data Act (2024) — Health data privacy law

### Tertiary (LOW confidence — needs validation)
- Trophy.so gamification analytics (0.9% return after streak break) — Gamification metrics, needs validation for health context
- Sahha.ai gamification research (340% engagement increase) — Engagement benchmarks, may not apply to health tracking
- HHS.gov mobile health app developer resources (2026) — Regulatory guidance, needs domain-specific interpretation

---
*Research completed: 2026-08-06*
*Ready for roadmap: yes*
