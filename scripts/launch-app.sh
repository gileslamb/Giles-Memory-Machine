#!/bin/bash
cd "$(dirname "$0")/.."
PROJECT_DIR=$(pwd)

# Kill any existing Next.js processes
for port in 3000 3001 3002 3003; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null
    sleep 1
  fi
done

# Build and start production server (more stable than dev)
echo "Building..."
npm run build
echo "Starting server on http://127.0.0.1:3000"
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR' && npm run start\""
sleep 4
open "http://127.0.0.1:3000"
