# 3P Tracker

A local-first mobile app for tracking poop, piss, and period data with encrypted storage, social leaderboards, and privacy-by-design architecture.

## Features

- **One-tap logging** — Log poop and piss entries instantly with auto-captured datetime and location
- **Encrypted storage** — All data encrypted locally using SQLCipher
- **Period tracking** — Cycle predictions, symptoms, mood, and flow tracking (never leaves device)
- **Social leaderboards** — Compare scores with friends, streak tracking, podium UI
- **Activity feed** — See friend milestones and achievements
- **Privacy-first** — Period data never syncs; poop/piss data syncs monthly to Supabase
- **Multi-platform** — Android APK, iOS PWA, works fully offline

## Tech Stack

- **Framework**: React Native + Expo SDK 57
- **Database**: SQLite with SQLCipher encryption (via Drizzle ORM)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State**: React Context + MMKV persistence
- **Navigation**: Expo Router (file-based)
- **Animations**: React Native Reanimated
- **Styling**: Custom theme system (Playful/Clinical modes)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/Not1Sam/3P-tracker.git
cd 3P-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the development server
npx expo start
```

### Environment Variables

Create a `.env` file with the following:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Building APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/       # Generic components (Skeleton, Toast, etc.)
│   ├── history/      # Entry cards and list components
│   ├── logging/      # Logging form components
│   ├── leaderboard/  # Leaderboard UI components
│   └── social/       # Social features (friends, QR codes)
├── contexts/         # React Context providers
├── db/               # Database layer
│   ├── repositories/ # Data access objects
│   └── schema/       # Drizzle ORM schemas
├── screens/          # Screen components
├── services/         # Business logic services
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Privacy Architecture

| Data Tier | Sync | Examples |
|-----------|------|----------|
| Tier 1 (Never) | Never leaves device | Period data, symptoms, mood |
| Tier 2 (Monthly) | Monthly aggregation | Poop/piss counts, locations |
| Tier 3 (On-demand) | When user triggers | Profile, friends |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Expo and React Native
- Backend powered by Supabase
- Icons from @expo/vector-icons
