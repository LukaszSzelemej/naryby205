#!/bin/sh
set -eu
cd /workspace
# Snapshot poison — fat catalog blobs wipe the workspace on update.
rm -f src/data/waters.json src/data/waters.json.gz public/data/waters.bin
if [ -d screenshots ]; then
  find screenshots -type f \( -name '*.png' -o -name '*.jpg' \) -size +80k -delete 2>/dev/null || true
fi
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
