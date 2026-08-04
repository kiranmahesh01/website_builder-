#!/usr/bin/env bash
# Quick local OmniRoute gateway for Magic AI fallback.
# Docs: https://github.com/diegosouzapw/OmniRoute
set -euo pipefail

PORT="${OMNIROUTE_PORT:-20128}"
NAME="${OMNIROUTE_CONTAINER_NAME:-magic-ai-omnroute}"

if docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "OmniRoute already running as container '$NAME'"
  echo "API: http://127.0.0.1:${PORT}/v1"
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
  docker start "$NAME" >/dev/null
  echo "Started existing container '$NAME'"
else
  docker run -d --name "$NAME" --restart unless-stopped --stop-timeout 40 \
    -p "127.0.0.1:${PORT}:20128" \
    -v omniroute-data:/app/data \
    diegosouzapw/omniroute:latest
  echo "Started OmniRoute container '$NAME'"
fi

echo "Dashboard: http://127.0.0.1:${PORT}"
echo "API base:  http://127.0.0.1:${PORT}/v1"
echo ""
echo "Then in Magic AI .env:"
echo "  OMNIROUTE_BASE_URL=http://127.0.0.1:${PORT}/v1"
echo "  OMNIROUTE_MODEL=auto"
echo "  # OMNIROUTE_API_KEY=...  # Dashboard → Endpoints (if REQUIRE_API_KEY=true)"
echo ""
echo "Connect a free backend in the dashboard (e.g. OpenCode Free), then restart Magic AI."
