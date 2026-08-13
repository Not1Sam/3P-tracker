#!/bin/bash
set -e

echo "Building PWA..."

# Step 1: Expo web export
echo "Running expo export..."
npx expo export -p web

# Step 2: Generate service worker with Workbox
echo "Generating service worker..."
npx workbox-cli generateSW workbox-config.js

echo "PWA build complete!"
