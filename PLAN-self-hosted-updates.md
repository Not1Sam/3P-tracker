# Self-Hosted Build Pipeline & Update System

## Goal
Build APKs locally (not on Expo servers), push updates from homelab, and distribute APKs via GitHub Releases with an in-app update button.

---

## Two-Tier Update Strategy

### Tier 1 — OTA JS Updates (Instant, No Reinstall)
- **Self-host Xavia OTA** on homelab (Docker, MIT license, free)
  - GitHub: https://github.com/xavia-io/xavia-ota (461 stars)
  - Implements `expo-updates` protocol v1 — drop-in for Expo SDK 57
  - Built-in admin dashboard, rollback support, release history
- **Requires:** PostgreSQL (Docker)
- **What it does:** Pushes JS/code changes instantly without full APK rebuild
- **Best for:** UI tweaks, bug fixes, feature flag changes

### Tier 2 — Full APK Updates (Native Code Changes)
- Build APK locally with `eas build --local`
- Push APK to **GitHub Releases** (free, 2,000 min/month on Actions)
- In-app button checks GitHub Releases API for latest version
- **Best for:** Native module changes, dependency updates

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Pipeline                            │
│                                                              │
│  Developer Machine ──► eas build --local ──► APK output     │
│        OR                (no Expo servers)                   │
│  GitHub Actions ───► eas build --local ──► GitHub Release   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Distribution                              │
│                                                              │
│  GitHub Releases ──► APK download link (in-app button)      │
│                                                              │
│  Xavia OTA ──────► JS bundle updates (automatic)           │
│  (your homelab)    (expo-updates protocol)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Requirements

| Component | Where | Cost |
|-----------|-------|------|
| Xavia OTA server | Homelab Docker | Free (MIT) |
| PostgreSQL | Homelab Docker | Free |
| APK builds | `eas build --local` or GitHub Actions | Free |
| APK hosting | GitHub Releases | Free |

---

## Prerequisites Checklist
- [ ] Homelab with Docker running
- [ ] Reverse proxy (nginx/traefik) for HTTPS
- [ ] Domain pointed at homelab (or IP with self-signed certs)
- [ ] Android signing keystore (create if needed)
- [ ] `EXPO_TOKEN` for local builds
- [ ] GitHub repo with Actions enabled

---

## Implementation Plan

### Phase 1: Local APK Build
1. Install Android SDK + JDK 17 on dev machine / homelab
2. Run `eas build --platform android --profile preview --local`
3. Create Android signing keystore
4. Configure `credentialsSource: "local"` in eas.json
5. Test: install APK on device via ADB

### Phase 2: GitHub Releases Distribution
1. Create GitHub Actions workflow (`.github/workflows/build-release.yml`)
2. Trigger on version tags (`v*`)
3. Build APK with `eas build --local` or Gradle
4. Upload APK to GitHub Releases via `softprops/action-gh-release`
5. Add version-check + update button in Settings screen
6. Uses GitHub Releases API: `https://api.github.com/repos/{owner}/{repo}/releases/latest`

### Phase 3: Xavia OTA (JS-Only Updates)
1. Deploy Xavia OTA via Docker Compose on homelab
2. Configure PostgreSQL database
3. Set up reverse proxy for HTTPS
4. Configure app in `app.json`:
   ```json
   {
     "expo": {
       "updates": {
         "url": "https://your-domain/api/manifest",
         "runtimeVersion": "1.0.0"
       }
     }
   }
   ```
5. Test: push JS update without rebuilding APK

---

## GitHub Actions Workflow (Draft)

```yaml
name: Build and Release APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Expo/EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build APK
        run: eas build --platform android --profile preview --local --output ./app-release.apk

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: Release ${{ github.ref_name }}
          files: ./app-release.apk
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## In-App Update Button (Draft)

```typescript
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

const GITHUB_REPO = 'Not1Sam/3P-tracker';

export const checkForUpdates = async () => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );
    const release = await response.json();
    const latestVersion = release.tag_name.replace('v', '');
    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

    if (latestVersion !== currentVersion) {
      Alert.alert(
        'Update Available',
        `Version ${latestVersion} is available. Current: ${currentVersion}`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update', onPress: () => Linking.openURL(release.html_url) },
        ]
      );
    } else {
      Alert.alert('Up to date', 'You are running the latest version.');
    }
  } catch (error) {
    Alert.alert('Error', 'Could not check for updates.');
  }
};
```

---

## Effort Estimates

| Task | Effort | Time |
|------|--------|------|
| Local EAS build setup | Low | 1-2 hours |
| GitHub Actions CI/CD | Low | 2-3 hours |
| Xavia OTA deployment | Medium | 4-6 hours |
| In-app update checker | Low | 1-2 hours |
| **Total** | **Medium** | **1-2 days** |

---

## Notes
- EAS CLI 22.0.0 supports `--local` flag (stable, slightly experimental label)
- `--local` only communicates with Expo servers for auth + credential verification
- Can bypass with `credentialsSource: "local"` in eas.json
- Xavia OTA implements standard expo-updates protocol — no vendor lock-in
- CodePush was discontinued March 31, 2025 — Xavia is the modern alternative
