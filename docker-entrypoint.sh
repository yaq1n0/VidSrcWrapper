#!/bin/sh
set -e

# Require TMDB_API_KEY at runtime
if [ -z "$TMDB_API_KEY" ]; then
  echo "Error: TMDB_API_KEY environment variable is required" >&2
  exit 1
fi

# Start the Node API (Hono) on 127.0.0.1:$PORT
node /app/packages/server/dist/index.js &

# Start Nginx in the foreground (PID 1)
exec nginx -g 'daemon off;'


