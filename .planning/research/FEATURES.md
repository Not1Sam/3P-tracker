# Feature Landscape

**Domain:** Health/body tracking (poop, piss, period) with social gamification
**Researched:** 2026-08-06
**Overall confidence:** HIGH

## Executive Summary

3P Tracker occupies a unique intersection: period tracking (mature market dominated by Flo/Clue with 420M+ combined downloads), bathroom tracking (niche but growing with apps like Plop/Poop Tracker), and social health gamification (emerging pattern from FitBind/Vitalis). No existing app combines all three.

**Period trackers** have converged on the same feature set (calendar + symptoms + predictions + insights) and compete on privacy posture, prediction accuracy, and free-tier stability. **Bathroom trackers** focus on quick logging (<10 seconds), Bristol stool classification, and doctor-ready exports. **Social health apps** use streaks, friend leaderboards, and challenges — but research shows competitive mechanics can backfire in health contexts if poorly designed.

3P Tracker's differentiation is the combination: one-tap bathroom logging with medical classification systems, fun social competition, and uncompromising privacy (period data never leaves the device). The app doesn't need to match Flo's feature depth — it needs to nail the core tracking loop and make it social.

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

### Core Logging (All Three Tracks)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-tap quick logging | Every bathroom app markets "under 10 seconds" — Plop, Poop Tracker, Poo Keeper all emphasize this | Low | Auto-capture datetime + location on tap |
| Bristol stool chart selection (1-7) | International clinical standard used by gastroenterologists — Plop, Poop Tracker, Ease all center on this | Low | Illustrated guide for first-time users |
| Medical urine color palette | Bladder Journal uses 7-level hydration chart; medical apps standardize on clinical color references | Low | Clear-to-brown spectrum with medical names |
| Custom type/color definitions | Power users want to add their own categories beyond medical standards | Medium | User-created Bristol subtypes and custom colors |
| Optional comments/notes | Every health tracker includes freeform notes — Plop, Poop Tracker, Ease all offer this | Low | Text field, optional per entry |
| Timestamp auto-capture | Standard in all bathroom trackers — Poop Tracker, Plop auto-log datetime | Low | Server-side or device clock, not user-editable |
| Geolocation auto-capture | Plop mentions location context; medical apps use location for UTI pattern detection | Low | Optional, with clear privacy disclosure |
| Piss smell tracking | Unique to 3P — no existing app tracks this; fills gap in urine health monitoring | Low | Optional dropdown (none/mild/strong/unusual) |
| History/calendar view | Universal in all health trackers — Poop Tracker offers calendar + list + graph views | Medium | Month view + list view toggle |
| Edit/delete past entries | Every tracker allows correcting mistakes — Poop Tracker, Plop support editing | Low | Tap to edit, swipe to delete |

### Period Tracking (Clue/Flo Standard)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cycle prediction | Core feature of every period tracker — Clue, Flo, Flow all predict next period | Medium | Algorithm improves with 3+ months of data |
| Flow level tracking | Universal — Flo tracks 70+ symptoms including flow; Clue has 30+ categories | Low | Light/medium/heavy selection per day |
| Symptom logging | Flo offers 70+ symptoms; Clue has 30+ categories — users expect comprehensive tracking | Medium | Mood, cramps, bloating, energy, etc. |
| Mood tracking | Clue, Flo, Go Go Gaia all track mood — often the most-logged symptom | Low | Simple scale or emoji selection |
| Period reminders/notifications | Every period tracker sends reminders — Flo has daily prompts, Clue has predictions | Low | Push notifications for period start, ovulation |
| Cycle statistics/insights | Flo offers "cycle reports"; Clue shows cycle averages — users expect to see patterns | Medium | Average cycle length, period duration, regularity score |
| Educational content | Flo has thousands of articles reviewed by 120+ medical professionals; Clue has evidence-based content | Medium | Basic cycle phase education, what symptoms mean |
| Data export (PDF/CSV) | Plop, Poop Tracker, Ease all offer doctor-ready PDF/CSV exports — essential for medical use | Medium | Formatted for healthcare provider sharing |

### Account & Auth

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password registration | Standard auth — every app requires this | Low | Supabase handles this |
| Google/Apple sign-in | Flo and Clue both offer social login — users expect it for convenience | Medium | OAuth2 integration |
| Biometric app lock | Poopaya offers FaceID/TouchID lock — important for sensitive health data | Low | expo-local-authentication |

### Social Foundation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User profiles | Every social app has profiles — Vitalis, FitBind, MoveTogether all offer profiles | Low | Username, avatar, bio |
| Username search | Standard social feature — Vitalis added usernames & @mentions | Low | Search by unique username |
| Friend system | FitBind, Vitalis, MoveTogether all have friend lists | Medium | Add/remove, pending requests |
| Basic leaderboard | Every gamified health app has leaderboards — FitBind shows 90-day consistency scores | Medium | Ranked list of friends |
| Streak tracking | Research shows streaks increase engagement 3x (Duolingo data) — FitBind, QuickStreak core feature | Medium | Consecutive days of logging |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **All-in-one bathroom + period tracking** | No existing app combines poop/piss/period tracking — users currently need 2-3 apps | Medium | Unique market position |
| **Separate pee & poop leaderboards** | Bathroom tracking is social novelty — leaderboards make it fun and competitive | Medium | Per-activity rankings with individual streaks |
| **QR code / invite link friend adding** | Friction-free friend onboarding — scan a code at dinner, instantly connected | Medium | Generate QR, share link, accept invite |
| **Friends + global leaderboard separation** | Friends leaderboard drives engagement (FitBind model); global provides aspiration | Medium | Toggle between friend/global views |
| **Podium leaderboard UI** | Top-3 display with medals — MoveTogether uses Bronze/Silver/Gold/Platinum tiers | Medium | Visual celebration of top performers |
| **Period data never leaves device** | Privacy-first architecture — Cyla/Euki model of on-device-only period data | High | Encrypted local storage, no cloud sync for period |
| **Thematic brown/yellow/pink UI** | Fun, playful brand identity — emoji, animations, personality in a typically clinical space | Medium | Brand differentiator, not just functional |
| **Medical classification systems** | Bristol chart + clinical urine colors = medical credibility while remaining approachable | Low | Educational value, doctor-friendly |
| **Location-based bathroom patterns** | "Where do you poop?" is inherently funny and shareable — heatmap future feature | Medium | Privacy-controlled, opt-in location |
| **Streak forgiveness/grace days** | Research shows 0.9% return rate after streak break without recovery — critical for retention | Low | 1-2 grace days per month, earned through consistency |
| **Activity feed / friend updates** | "Sarah just hit a 30-day poop streak!" — social proof drives engagement | Medium | Opt-in sharing of milestones only |

## Anti-Features

Features to explicitly NOT build. These violate privacy principles, add complexity without value, or contradict the local-first architecture.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **AI photo analysis of stool/urine** | Privacy nightmare — photo of bodily functions is extremely sensitive; medical liability; most users don't want to photograph poop | Use manual selection from illustrated Bristol chart and color palette |
| **Cloud sync of any health data** | Contradicts local-first architecture; creates breach surface; period data must never leave device | Local encrypted storage; manual export for sharing |
| **Third-party analytics SDKs** | Firebase Analytics, Mixpanel, Amplitude all send data to third parties — violates privacy-first principle | Minimal first-party telemetry only (app open, feature usage) — opt-in |
| **Community forums / chat** | Flo's "Secret Chats" are anonymous but still server-moderated; creates moderation burden and data risk | Keep social to leaderboards and friend activity only |
| **Wearable integration** | Out of scope for v1; Apple Health/Google Fit requires additional auth flows and data pipelines | Future feature — adds complexity without core value |
| **Pregnancy / fertility modes** | Medical complexity, liability, and completely different user journey — Flo and Clue separate these into modes | Period tracking only for v1; pregnancy is a different product |
| **Food / medication correlation** | Plop and Poopaya do this for medical users — but 3P Tracker is not a medical tool; adds enormous complexity | Future feature if users request it |
| **In-app purchases / monetization** | v1 is free per PROJECT.md; paywalls destroy adoption (Flo's #1 complaint is premium creep) | Free core experience; consider donations or premium features later |
| **Mandatory account creation** | Privacy-first apps like Cyla and Euki require no accounts — forced auth is a friction barrier | Allow anonymous local use; account optional for social features |
| **Partner / cycle sharing mode** | Clue Connect and Flo's partner mode require cloud sync — contradicts local-first period privacy | Friend leaderboards only; period data stays private |
| **AI health assistant / chatbot** | Flo's AI assistant is premium-only and raises medical liability; adds complexity without clear value | Educational content instead; let users consult their own doctors |
| **Push notification spam** | Flo's #2 complaint is notification volume — users can't disable categories independently | Minimal, user-configurable notifications only |

## Feature Dependencies

```
Auth system → Friend system → Leaderboards → Streaks
                                    ↓
                              Activity feed

Poop logging → Bristol chart selection → History view → Insights
Piss logging → Color palette selection → History view → Insights  
Period logging → Cycle prediction → Symptoms → Insights

All logging → Leaderboards → Social competition
All logging → Data export → Doctor sharing
```

## MVP Recommendation

**Phase 1 — Core Tracking Loop (Table Stakes)**
1. Poop logging with Bristol chart + quick-tap
2. Piss logging with color palette + quick-tap
3. Period logging with flow + symptoms + mood
4. Auto-capture datetime and location
5. History/calendar view for all three tracks

**Phase 2 — Social Foundation (Differentiator)**
1. Auth system (email + Google/Apple)
2. User profiles with usernames
3. Friend system with username search
4. Separate pee/poop leaderboards
5. Streak tracking with grace days

**Phase 3 — Polish & Engagement (Differentiator)**
1. Period cycle prediction algorithm
2. QR code / invite link friend adding
3. Podium leaderboard UI with medals
4. Friends vs global leaderboard toggle
5. Activity feed for friend milestones
6. Data export (PDF/CSV)

**Phase 4 — Education & Insights (Table Stakes)**
1. Cycle phase education content
2. Basic pattern insights (averages, trends)
3. Streak milestones and achievements
4. Configurable notification preferences

**Defer:**
- Heatmap feature — requires sufficient user data volume (per PROJECT.md)
- Wearable integration — future per PROJECT.md
- Food/medication correlation — medical complexity
- Pregnancy/fertility modes — different product
- AI features — liability and complexity

## Sources

- Clue (helloclue.com) — 30+ tracking categories, GDPR privacy, science-first approach
- Flo (flo.health) — 420M+ downloads, 70+ symptoms, AI assistant, Anonymous Mode
- Plop (plopdiary.com) — Bristol Stool Scale, pattern detection, doctor-ready PDF export
- Poop Tracker (poop-tracker.com) — Quick logging, calendar/list/graph views, CSV export
- Poopaya (poopaya.com) — Under 10-second logging, FaceID lock, on-device data
- FitBind (fitbind.com) — Habit tracking groups, friend leaderboards, streak tracking
- Vitalis — Health tracking with friend competition, wearable integration
- MoveTogether — Fitness competition with medal tiers (Bronze/Silver/Gold/Platinum)
- Trophy.so — Gamification analytics: 0.9% return after streak break, 64% retention boost from day-1 achievements
- Sahha.ai — Gamification research: 340% engagement increase, streak mechanics best practices
- EngageFabric — Gamification anti-patterns: leaderboards need social context, XP must map to outcomes
- Cyla — On-device-only period tracking, no account required, one-time purchase
- Euki — Privacy-first period tracker, 10/10 Mozilla score, local-only data
- Bladder Journal — Urine color tracking, 7-level hydration chart, Apple Watch support
- Medipee — Medical urine analysis, micturition diary, drinking quantity tracking
