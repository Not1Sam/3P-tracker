#!/bin/bash
# upload-ota.sh — Upload OTA bundle to server
# Usage: ./scripts/upload-ota.sh [android|ios]
#
# This script:
# 1. Exports the Expo web bundle to dist/
# 2. Uploads it to the server's OTA volume via SSH + docker cp
#
# Prerequisites:
# - SSH access to the server (pfa)
# - Docker running on the server with 3p-tracker-api container

set -e

PLATFORM="${1:-android}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OTA_DIR="/tmp/ota-${PLATFORM}-$$"
SERVER="pfa"
CONTAINER="3p-tracker-api"
REMOTE_OTA="/data/ota/${PLATFORM}"

echo "[OTA] Building for platform: ${PLATFORM}"

# Step 1: Export the Expo bundle
cd "$PROJECT_DIR"
echo "[OTA] Running expo export..."
npx expo export --platform web 2>&1 | tail -5

# Step 2: Copy dist/ to temp directory
echo "[OTA] Preparing bundle..."
rm -rf "$OTA_DIR"
mkdir -p "$OTA_DIR"
cp -r dist/* "$OTA_DIR/"

# Step 3: Write metadata
cat > "$OTA_DIR/meta.json" <<EOF
{
  "id": "$(openssl rand -hex 8)",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "runtimeVersion": "1.0.0",
  "platform": "${PLATFORM}"
}
EOF

echo "[OTA] Bundle ready: $(du -sh "$OTA_DIR" | cut -f1) ($(find "$OTA_DIR" -type f | wc -l) files)"

# Step 4: Upload to server
echo "[OTA] Uploading to ${SERVER}..."
ssh "$SERVER" "sudo docker exec $CONTAINER mkdir -p $REMOTE_OTA"
ssh "$SERVER" "sudo docker exec $CONTAINER rm -rf $REMOTE_OTA/*"

# Upload files in batches
cd "$OTA_DIR"
find . -type f | while read -r file; do
  dir=$(dirname "$file")
  ssh "$SERVER" "sudo docker exec $CONTAINER mkdir -p $REMOTE_OTA/$dir"
  cat "$file" | ssh "$SERVER" "sudo docker exec -i $CONTAINER tee $REMOTE_OTA/$file > /dev/null"
done

# Step 5: Verify
echo "[OTA] Verifying upload..."
ssh "$SERVER" "sudo docker exec $CONTAINER cat $REMOTE_OTA/meta.json" 2>/dev/null && echo "[OTA] Upload successful!" || echo "[OTA] WARNING: Upload may have failed"

# Cleanup
rm -rf "$OTA_DIR"
echo "[OTA] Done. Update will be available at: https://pwa-3ptracker.bungus.fyi/ota/manifest?platform=${PLATFORM}"
