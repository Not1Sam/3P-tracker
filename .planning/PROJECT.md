# 3P Tracker

## What This Is

3P Tracker is a local-first mobile app for tracking poop, piss, and period data with encrypted storage. Users log bodily functions with one tap — auto-capturing datetime and location — then compete with friends and the global community on leaderboards. Period data stays strictly on-device for privacy. Built for people who want to understand their body's patterns while having fun with friends.

## Core Value

One-tap logging that respects privacy — all data encrypted locally, period data never leaves the device, and users control what gets shared for leaderboards.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Poop logging with Bristol stool chart types + custom type definitions
- [ ] Piss logging with medical color palette + custom color definitions
- [ ] Auto-capture datetime and geolocation for each log entry
- [ ] Optional comment field for both poop and piss entries
- [ ] Piss smell tracking (optional)
- [ ] Full period tracking: cycle prediction, symptoms, mood, flow level, reminders, education
- [ ] Local-first encrypted storage for all user data
- [ ] Separate pee and poop leaderboards with streak tracking
- [ ] Friends leaderboard and global leaderboard
- [ ] Social connections via username search and invite links/QR codes
- [ ] Auth: email/password + Google/Apple sign-in
- [ ] Android APK distribution from custom website
- [ ] iOS distribution via PWA or EAS Build sideloading
- [ ] Thematic UI: brown/yellow/pink color scheme, fun & playful vibe with emoji and animations
- [ ] Tab-based navigation: Poop / Piss / Period / Profile
- [ ] Leaderboard UI: podium for top 3 with medals, scrollable list below

### Out of Scope

- Poop/piss heatmaps — future feature, requires sufficient user data volume
- In-app purchases or monetization — v1 is free
- Apple App Store distribution — requires $99/yr developer program
- Real-time syncing between devices — single-device local-first for v1
- Wearable/health app integrations (Apple Health, Google Fit) — future

## Context

- Cross-platform mobile app built with React Native + Expo
- Backend: Supabase self-hosted on user's homelab for leaderboard and auth
- Period data is the most privacy-sensitive — never transmitted off-device
- Heatmap feature planned for future (Snapchat density-map style for poop/piss locations)
- User has more features ideas but wants robust, functional basics first

## Constraints

- **Platform**: Must work on both iOS and Android without paid developer programs
- **Privacy**: Period data must never leave the device under any circumstances
- **Storage**: All local data must be encrypted at rest
- **Hosting**: Backend runs on user's homelab infrastructure
- **Distribution**: Android via APK from custom website; iOS via PWA or sideloading

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native + Expo | Cross-platform, large ecosystem, EAS Build free tier for APK, PWA support for iOS | — Pending |
| Supabase self-hosted | Open source, PostgreSQL, built-in auth + real-time, homelab-friendly | — Pending |
| Local-first architecture | User privacy requirement — all data encrypted on device, only summary sent monthly | — Pending |
| Thematic color scheme | Brown/yellow/pink matches the 3P brand with humor and playfulness | — Pending |
| Separate leaderboards | Pee and poop are different activities — separate rankings with individual streaks | — Pending |
| Dual color/type systems | Medical standards (Bristol chart, clinical colors) plus custom user definitions for flexibility | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-06 after initialization*
