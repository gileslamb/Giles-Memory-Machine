#!/bin/bash
# Launches the Memory Machine frontend: starts dev server if needed, opens browser
cd "$(dirname "$0")/.."
PROJECT_DIR=$(pwd)

# Check if something is already listening on port 3000
if ! lsof -i :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  # Start dev server in background (opens new Terminal window)
  osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR' && npm run dev\""
  echo "Starting dev server... waiting for it to be ready"
  sleep 5
fi

open "http://localhost:3000"
