#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="http://127.0.0.1:3000/?build=20260414d"
HEALTH_URL="http://127.0.0.1:3000/health"
SAVE_URL="http://127.0.0.1:3000/api/save"
LOG_DIR="$SCRIPT_DIR/data"
LOG_FILE="$LOG_DIR/wordblaster-server.log"

mkdir -p "$LOG_DIR"

server_ready() {
  curl -fsS "$HEALTH_URL" >/dev/null 2>&1 || curl -fsS "$SAVE_URL" >/dev/null 2>&1
}

if ! server_ready; then
  cd "$SCRIPT_DIR"
  nohup node server.js >>"$LOG_FILE" 2>&1 &

  for _ in $(seq 1 40); do
    if server_ready; then
      break
    fi
    sleep 0.25
  done
fi

if ! server_ready; then
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="WordBlaster" --text="WordBlaster could not start.\nCheck:\n$LOG_FILE"
  else
    printf 'WordBlaster could not start. Check %s\n' "$LOG_FILE" >&2
  fi
  exit 1
fi

xdg-open "$URL" >/dev/null 2>&1 &
