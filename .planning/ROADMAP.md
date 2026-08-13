# Roadmap: 3P Tracker

## Overview

3P Tracker ships as a local-first mobile app with encrypted storage, one-tap logging for poop/piss/period data, social leaderboards, and privacy-by-design architecture. The roadmap follows a foundation-first build order: encrypted local DB → UI & core logging → auth & backend → social features → leaderboards → period tracking → polish & distribution. Period data is architecturally isolated (never leaves device). Two workstreams run in parallel: UI development and Supabase backend setup.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Encrypted Local Data** - Project setup, encrypted SQLite database, encryption key management, core data schemas
- [x] **Phase 2: Core Poop & Piss Logging** - One-tap logging with Bristol chart, color palette, auto-capture datetime + location
- [x] **Phase 3: History & Entry Management** - Calendar/list views, edit/delete entries, entry detail screens (completed 2026-08-08)
- [x] **Phase 4: Navigation & Thematic UI** - Tab navigation, brown/yellow/pink theme, core UI components, playful vibe (completed 2026-08-08)
- [x] **Phase 5: Auth & Supabase Backend** - Self-hosted Supabase, email/Google/Apple sign-in, biometric lock, monthly sync (completed 2026-08-08)
- [ ] **Phase 6: Social Foundation** - User profiles, username search, friend requests, QR code/invite links
- [x] **Phase 7: Leaderboards & Streaks** - Separate pee/poop leaderboards, streak tracking, podium UI, friends vs global toggle (completed 2026-08-13)
- [x] **Phase 8: Period Tracking** - Cycle prediction, symptoms, mood, flow level, reminders, education, local-only enforcement (completed 2026-08-13)
- [ ] **Phase 9: Platform & Distribution** - Android APK builds, PWA for iOS, offline logging, leaderboard sync
- [ ] **Phase 10: Polish & Animations** - Reanimated animations, activity feed, data backup/restore, edge cases

## Phase Details

### Phase 1: Foundation & Encrypted Local Data

**Goal**: Establish encrypted local database as the single source of truth with privacy-by-design data partitioning
**Depends on**: Nothing (first phase)
**Requirements**: LOG-12, PLAT-04
**Research flags**: Encryption key management implementation — needs validation of expo-sqlite SQLCipher integration with Drizzle ORM, key derivation flow with expo-crypto
**Success Criteria** (what must be TRUE):

  1. App creates encrypted SQLite database on first launch using SQLCipher
  2. Encryption key is derived from user biometric/PIN and stored in SecureStore (iOS Keychain / Android Keystore)
  3. All data writes are encrypted at rest — database file is unreadable without key
  4. App works fully offline for local logging (no network dependency)
  5. Database schemas exist for poop, piss, and period tables with proper data tier separation

**Plans**: TBD

Plans:

- [x] 01-01: Project scaffolding — Expo app setup, dependencies, TypeScript config, folder structure
- [x] 01-02: Encrypted database — expo-sqlite + SQLCipher, Drizzle ORM schemas, migration system
- [x] 01-03: Encryption key management — SecureStore integration, biometric/PIN key derivation, key recovery flow
- [x] 01-04: Privacy tier architecture — data classification system, sync exclusion rules for period data

### Phase 2: Core Poop & Piss Logging

**Goal**: Users can log poop and piss entries with one tap, capturing all metadata automatically
**Depends on**: Phase 1
**Requirements**: LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06, LOG-07, LOG-08, LOG-09
**Success Criteria** (what must be TRUE):

  1. User can log a poop entry with one tap — datetime and location auto-captured
  2. User can select poop type from Bristol stool chart (Types 1-7) with medical illustrations
  3. User can define custom poop types beyond Bristol chart
  4. User can log a piss entry with one tap — datetime and location auto-captured
  5. User can select piss color from medical palette (clear to brown spectrum)

**Plans**: 4 plans

Plans:

- [x] 02-01: Navigation & Data Layer — Expo Router tab layout, database repositories for poop/piss/custom types, TypeScript types
- [x] 02-02: UI Components — FAB, bottom sheet, Bristol type selector, color swatch selector, smell selector, comment field, custom type dialog
- [x] 02-03: Logging Flow — Logging service, logging screen, FAB + bottom sheet integration, end-to-end flow with human verification
- [x] 02-04: Polish & Tests — Toast with undo, location status display, comprehensive test suites for repositories, services, and components

### Phase 3: History & Entry Management

**Goal**: Users can view, search, edit, and delete their logged entries across calendar and list views
**Depends on**: Phase 2
**Requirements**: LOG-10, LOG-11
**Success Criteria** (what must be TRUE):

  1. User can view history of all entries in calendar view (month view with entry indicators)
  2. User can toggle to list view showing entries chronologically
  3. User can tap an entry to see full details (type/color, location, comment, timestamp)
  4. User can edit or delete past entries

**Plans**: 3/3 plans complete

Plans:

- [x] 03-01-PLAN.md
- [x] 03-02-PLAN.md
- [x] 03-03-PLAN.md
- [x] 03-01: Data Layer — install deps, extend repos, create history service + date helpers
- [x] 03-02: Calendar & List Views — calendar tab, list tab, entry cards, day detail, swipe-to-delete
- [x] 03-03: Entry Detail & Editing — detail screen, edit modal, delete with undo

### Phase 4: Navigation & Thematic UI

**Goal**: App has tab-based navigation with thematic brown/yellow/pink color scheme and playful brand identity
**Depends on**: Phase 2
**Requirements**: (UI/UX foundation — supports all logging and profile features)
**Success Criteria** (what must be TRUE):

  1. Tab navigation works: Poop / Piss / Period / Profile tabs with icons
  2. Thematic brown/yellow/pink color scheme is applied consistently across all screens
  3. UI feels fun and playful with emoji and personality — not clinical or sterile
  4. Theme toggle between "Playful" and "Clinical" mode works

**Plans**: 3/3 plans complete

Plans:

- [x] 04-01: Theme system — Theme object, ThemeContext, MMKV persistence, apply to all screens
- [x] 04-02: App boot — Animated splash screen, init error screen with retry/reset
- [x] 04-03: Empty states & skeleton loading — Playful empty states, skeleton components, polish

### Phase 5: Auth & Supabase Backend

**Goal**: Users can create accounts, sign in securely, and app connects to self-hosted Supabase for social features
**Depends on**: Phase 1 (can run parallel to Phases 2-4)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Research flags**: Self-hosted Supabase deployment — needs runbook research for homelab setup, backup automation, monitoring
**Success Criteria** (what must be TRUE):

  1. User can register with email and password
  2. User can sign in with Google account
  3. User can sign in with Apple account (iOS)
  4. User can enable biometric app lock (FaceID/TouchID)
  5. User session persists across app restarts

**Plans**: 3/3 plans complete

Plans:

- [x] 05-01: Supabase + Auth — Supabase client, auth service, auth context, email/password auth
- [x] 05-02: Auth screens — Login, register, profile integration
- [x] 05-03: Monthly sync — Implement sync engine with Supabase upload

### Phase 6: Social Foundation

**Goal**: Users can create profiles, find friends, and build their social network for leaderboards
**Depends on**: Phase 5
**Requirements**: SOCL-01, SOCL-02, SOCL-03, SOCL-04, SOCL-05, SOCL-06, SOCL-07, SOCL-08
**Success Criteria** (what must be TRUE):

  1. User can create profile with username and avatar
  2. User can search for other users by username
  3. User can send friend request and see pending requests
  4. User can accept or reject friend requests
  5. User can generate QR code and share invite link for friend adds

**Plans**: 3 plans

Plans:

- [x] 06-01-PLAN.md — Database schema + profile system (avatar, username, profile screen)
- [x] 06-02-PLAN.md — Friend system (search, requests, accept/reject, remove)
- [x] 06-03-PLAN.md — Invite system (QR codes, share links, deep link handling)

### Phase 7: Leaderboards & Streaks

**Goal**: Users can compete with friends and global community on separate pee/poop leaderboards with streak tracking
**Depends on**: Phase 6
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06, LEAD-07, LEAD-08, LEAD-09, LEAD-10
**Deferred**: LEAD-11 (activity feed) → Phase 10 (Polish)
**Research flags**: Leaderboard anti-cheat — needs research on server-side scoring patterns, anomaly detection, rate limiting
**Success Criteria** (what must be TRUE):

  1. User can view separate pee and poop leaderboards with ranked users
  2. Streak tracking shows consecutive days for both pee and poop logging
  3. Streak forgiveness allows 1-2 grace days per month
  4. User can toggle between friends and global leaderboard views
  5. Podium UI shows top 3 with medals (bronze/silver/gold), scrollable list for ranks 4+

**Plans**: 2/2 plans complete

Plans:

- [x] 07-01-PLAN.md — Leaderboard & streak services (TDD): score calculation, streak algorithm, Supabase data fetching
- [x] 07-02-PLAN.md — Leaderboard UI & tab integration: podium, scrollable list, friends/global toggle, tab navigation

### Phase 8: Period Tracking

**Goal**: Users can track their menstrual cycle with predictions, symptoms, and education — all data stays on-device
**Depends on**: Phase 1 (architecturally independent — period data never syncs)
**Requirements**: PRD-01, PRD-02, PRD-03, PRD-04, PRD-05, PRD-06, PRD-07
**Research flags**: Cycle prediction algorithm — needs research on evidence-based prediction methods (rhythm method, calendar-based, ML options)
**Success Criteria** (what must be TRUE):

  1. User can log period entries with flow level, symptoms, and mood
  2. Cycle prediction algorithm runs locally on-device (improves with 3+ months data)
  3. Period reminders fire locally via notifications
  4. Cycle statistics and insights display on-device
  5. Period data NEVER leaves the device — verified with network traffic analysis

**Plans**: 3/3 plans complete

Plans:

- [x] 08-01-PLAN.md — Data layer: period types, constants, repository, MMKV settings
- [x] 08-02-PLAN.md — Services: cycle prediction, period orchestrator, notification scheduling, theme + tab
- [x] 08-03-PLAN.md — UI: period components, education cards, period tab screen

### Phase 9: Platform & Distribution

**Goal**: App is distributable on Android via APK and on iOS via PWA, with offline capability
**Depends on**: Phase 7
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-05
**Success Criteria** (what must be TRUE):

  1. Android APK builds successfully via EAS Build
  2. APK can be downloaded and installed from custom website
  3. iOS PWA works via Safari "Add to Home Screen" with standalone display
  4. App syncs leaderboard data when online, works fully offline for local logging

**Plans**: 3 plans

Plans:

- [ ] 09-01-PLAN.md — EAS Build config for Android APK + in-app update checking
- [ ] 09-02-PLAN.md — PWA manifest, Workbox service worker, iOS install hint
- [ ] 09-03-PLAN.md — Network state detection, offline banner, leaderboard caching

### Phase 10: Polish & Animations

**Goal**: App feels polished with smooth animations, edge case handling, and data safety net
**Depends on**: Phase 9
**Requirements**: (Cross-cutting polish — supports all features)
**Success Criteria** (what must be TRUE):

  1. Tab transitions and entry animations are smooth (60fps via Reanimated)
  2. Data backup/restore mechanism works for non-period data
  3. Edge cases handled: empty states, error states, loading states, network errors
  4. App feels complete and ready for daily use

**Plans**: TBD

Plans:

- [ ] 10-01: Animations — Reanimated transitions, tab animations, entry micro-interactions
- [ ] 10-02: Data backup — encrypted export to user's cloud storage, restore mechanism
- [ ] 10-03: Edge cases — empty states, error handling, loading indicators, offline messaging

## Parallel Workstreams

Phases that can execute simultaneously (independent dependencies):

```
Phase 1 (Foundation)
    ├──→ Phase 2 (Core Logging) ──→ Phase 3 (History) ──→ Phase 4 (Navigation & UI)
    │                                                         │
    ├──→ Phase 5 (Auth & Backend) ──→ Phase 6 (Social) ──→ Phase 7 (Leaderboards)
    │                                                         │
    └──→ Phase 8 (Period Tracking)                            │
                                                              ↓
                                            Phase 9 (Platform) ──→ Phase 10 (Polish)
```

**Parallel opportunities:**

- **Phase 2 + Phase 5**: UI logging development runs parallel to Supabase setup (independent workstreams)
- **Phase 4 + Phase 6**: Navigation/UI polish runs parallel to social features (different concerns)
- **Phase 8**: Period tracking is independent (never syncs) — can run after Phase 1

**Sequential dependencies:**

- Phase 1 must complete first (everything depends on encrypted DB)
- Phase 7 depends on Phase 6 (leaderboards need social connections)
- Phase 9 depends on Phase 7 (distribution needs features complete)
- Phase 10 is last (polish after all features exist)

## Progress

**Execution Order:**
Phases execute in numeric order with parallel workstreams where noted.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Encrypted Local Data | 4/4 | Complete | 2026-08-07 |
| 2. Core Poop & Piss Logging | 4/4 | Complete | 2026-08-07 |
| 3. History & Entry Management | 3/3 | Complete   | 2026-08-08 |
| 4. Navigation & Thematic UI | 0/3 | Not started | - |
| 5. Auth & Supabase Backend | 0/5 | Not started | - |
| 6. Social Foundation | 0/3 | Not started | - |
| 7. Leaderboards & Streaks | 2/2 | Complete   | 2026-08-13 |
| 8. Period Tracking | 3/3 | Complete   | 2026-08-13 |
| 9. Platform & Distribution | 0/3 | Not started | - |
| 10. Polish & Animations | 0/3 | Not started | - |

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOG-01 | Phase 2 | Complete |
| LOG-02 | Phase 2 | Complete |
| LOG-03 | Phase 2 | Complete |
| LOG-04 | Phase 2 | Complete |
| LOG-05 | Phase 2 | Complete |
| LOG-06 | Phase 2 | Complete |
| LOG-07 | Phase 2 | Complete |
| LOG-08 | Phase 2 | Complete |
| LOG-09 | Phase 2 | Complete |
| LOG-10 | Phase 3 | Complete |
| LOG-11 | Phase 3 | Complete |
| LOG-12 | Phase 1 | Complete |
| AUTH-01 | Phase 5 | Pending |
| AUTH-02 | Phase 5 | Pending |
| AUTH-03 | Phase 5 | Pending |
| AUTH-04 | Phase 5 | Pending |
| AUTH-05 | Phase 5 | Pending |
| SOCL-01 | Phase 6 | Pending |
| SOCL-02 | Phase 6 | Pending |
| SOCL-03 | Phase 6 | Pending |
| SOCL-04 | Phase 6 | Pending |
| SOCL-05 | Phase 6 | Pending |
| SOCL-06 | Phase 6 | Pending |
| SOCL-07 | Phase 6 | Pending |
| SOCL-08 | Phase 6 | Pending |
| LEAD-01 | Phase 7 | Pending |
| LEAD-02 | Phase 7 | Pending |
| LEAD-03 | Phase 7 | Pending |
| LEAD-04 | Phase 7 | Pending |
| LEAD-05 | Phase 7 | Pending |
| LEAD-06 | Phase 7 | Pending |
| LEAD-07 | Phase 7 | Pending |
| LEAD-08 | Phase 7 | Pending |
| LEAD-09 | Phase 7 | Pending |
| LEAD-10 | Phase 7 | Pending |
| LEAD-11 | Phase 10 | Deferred |
| PRD-01 | Phase 8 | Pending |
| PRD-02 | Phase 8 | Pending |
| PRD-03 | Phase 8 | Pending |
| PRD-04 | Phase 8 | Pending |
| PRD-05 | Phase 8 | Pending |
| PRD-06 | Phase 8 | Pending |
| PRD-07 | Phase 8 | Pending |
| PLAT-01 | Phase 9 | Pending |
| PLAT-02 | Phase 9 | Pending |
| PLAT-03 | Phase 9 | Pending |
| PLAT-04 | Phase 1 | Complete |
| PLAT-05 | Phase 9 | Pending |

**Coverage:**

- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓
