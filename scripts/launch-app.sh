#!/bin/bash
# Memory Machine launcher — runs on port 3000 for Dock/Automator app
# Load nvm if present (Automator/Dock may not inherit shell profile)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Resolve project dir (works when run from Automator/Dock)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# If already running on 3000, just open browser
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  open "http://localhost:3000"
  exit 0
fi

# Kill any existing Next.js on 3000
pid=$(lsof -ti :3000 2>/dev/null)
[ -n "$pid" ] && kill $pid 2>/dev/null && sleep 2

# Build and start production server on port 3000
echo "Building Memory Machine..."
if ! npm run build; then
  echo "Build failed. Check the output above."
  exit 1
fi

echo "Starting server on http://localhost:3000"
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR' && npm run start\""

# Wait for server to be ready (poll up to 60 seconds)
for i in $(seq 1 30); do
  sleep 2
  if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    open "http://localhost:3000"
    exit 0
  fi
done

echo "Server did not start in time. Check the Terminal window for errors."
open "http://localhost:3000"
