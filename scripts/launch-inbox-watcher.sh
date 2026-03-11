#!/bin/bash
# Launcher for standalone inbox watcher. Used by launchd.
# Load nvm if present (launchd does not inherit shell profile)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")/.."
exec npm run inbox-watcher
