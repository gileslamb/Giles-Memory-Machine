#!/bin/bash
# Install the inbox watcher as a launchd service (runs at Mac login).
# Run from project root: ./scripts/install-inbox-watcher-launchd.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST_SRC="$SCRIPT_DIR/com.gileslamb.memory-machine-inbox-watcher.plist.example"
PLIST_DEST="$HOME/Library/LaunchAgents/com.gileslamb.memory-machine-inbox-watcher.plist"

mkdir -p "$PROJECT_ROOT/logs"
chmod +x "$SCRIPT_DIR/launch-inbox-watcher.sh"

sed "s|PROJECT_ROOT|$PROJECT_ROOT|g" "$PLIST_SRC" > "$PLIST_DEST"
echo "Installed plist to $PLIST_DEST"
echo "Loading launchd job..."
launchctl load "$PLIST_DEST"
echo "Done. Inbox watcher will run at login. To start now: launchctl start com.gileslamb.memory-machine-inbox-watcher"
echo "To stop: launchctl stop com.gileslamb.memory-machine-inbox-watcher"
echo "To uninstall: launchctl unload $PLIST_DEST && rm $PLIST_DEST"
