#!/bin/bash
set -e

# Wait for DB (simple retry loop if needed, but depend_on in compose helps)
# Ideally we use a wait-for-it script, but python check script is also fine.
# For simplicity, we assume compose restart policy handles transient db downtime, 
# but running alembic needs db to be up.

echo "Waiting for postgres..."
# Simple wait loop
until python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('db', 5432))" 2>/dev/null; do
  echo "Postgres not available, sleeping..."
  sleep 2
done

echo "Running migrations..."
alembic upgrade head

echo "Starting server..."
exec gunicorn -w 4 -b 0.0.0.0:8000 "app.main:app"
