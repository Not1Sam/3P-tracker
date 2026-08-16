# 3P Tracker — Codebase Index

Quick navigation to everything in the project.

## Docs

- [File Structure](./FILE-STRUCTURE.md) — every file and what it does
- [React Native Basics](./REACT-NATIVE-BASICS.md) — concepts you need to edit this codebase
- [Architecture](./ARCHITECTURE.md) — how files connect, data flow, privacy tiers

## Quick Reference

### App Entry Points
| What | File |
|------|------|
| Root layout (providers, init, splash) | `app/_layout.tsx` |
| Tab bar (4 tabs + header) | `app/(tabs)/_layout.tsx` |
| Poop tab | `app/(tabs)/index.tsx` |
| Piss tab | `app/(tabs)/explore.tsx` |
| Leaderboard tab | `app/(tabs)/leaderboard.tsx` |
| Period tab | `app/(tabs)/period.tsx` |

### Stack Screens (accessed from header)
| What | File |
|------|------|
| Calendar | `app/calendar.tsx` |
| Activity feed | `app/activity.tsx` |
| Settings | `app/settings.tsx` |
| Profile | `app/profile.tsx` |
| Entry detail | `app/entry/[id].tsx` |
| Day detail | `app/entry/day/[date].tsx` |
| Invite handler | `app/invite/[code].tsx` |

### Core Services (business logic)
| What | File |
|------|------|
| App init | `src/services/app-init.ts` |
| Supabase client | `src/services/supabase-client.ts` |
| Auth | `src/services/auth-service.ts` |
| Logging (create poop/piss) | `src/services/logging-service.ts` |
| History queries | `src/services/history-service.ts` |
| Period tracking | `src/services/period-service.ts` |
| Cycle prediction | `src/services/cycle-service.ts` |
| Leaderboard | `src/services/leaderboard-service.ts` |
| Social (friends) | `src/services/social-service.ts` |
| Cloud sync | `src/services/sync-engine.ts` |
| Settings store | `src/services/settings.ts` |
| Backup/restore | `src/services/backup-service.ts` |
| Notifications | `src/services/notification-service.ts` |
| Update checker | `src/services/update-checker.ts` |

### Database
| What | File |
|------|------|
| DB connection + init | `src/db/index.ts` |
| Schema (Drizzle) | `src/db/schema/index.ts` |
| Migrations | `src/db/migrate.ts` |
| Poop CRUD | `src/db/repositories/poop-repository.ts` |
| Piss CRUD | `src/db/repositories/piss-repository.ts` |
| Period CRUD | `src/db/repositories/period-repository.ts` |
| Custom types CRUD | `src/db/repositories/custom-type-repository.ts` |

### Contexts (global state)
| What | File |
|------|------|
| Auth context | `src/contexts/AuthContext.tsx` |
| Theme context | `src/contexts/ThemeContext.tsx` |
| Profile context | `src/contexts/ProfileContext.tsx` |
| Network context | `src/contexts/NetworkContext.tsx` |

### Screens (full page UI)
| What | File |
|------|------|
| Logging form | `src/screens/LoggingScreen.tsx` |
| Calendar | `src/screens/CalendarScreen.tsx` |
| Profile | `src/screens/ProfileScreen.tsx` |
| Login | `src/screens/LoginScreen.tsx` |
| Register | `src/screens/RegisterScreen.tsx` |
| Entry detail | `src/screens/EntryDetailScreen.tsx` |
| Edit entry | `src/screens/EditEntryModal.tsx` |
| History list | `src/screens/HistoryScreen.tsx` |
| Friends | `src/screens/FriendListScreen.tsx` |

### Key Config Files
| What | File |
|------|------|
| Expo config | `app.json` |
| Package deps | `package.json` |
| TypeScript | `tsconfig.json` |
| Drizzle ORM | `drizzle.config.ts` |
| EAS Build | `eas.json` |
| Babel | `babel.config.js` |
| ESLint | `eslint.config.js` |
| PWA service worker | `workbox-config.js` |

## Commands

```bash
# Start dev server
npx expo start

# Run on Android (USB)
npx expo run:android

# Type check
npx tsc --noEmit

# Lint
npx eslint app/ src/

# Build web PWA
npm run build:web

# Run tests
npx jest

# Build APK (EAS)
eas build --platform android --profile preview
```
