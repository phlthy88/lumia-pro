#!/bin/bash
# Fresh preview without cache

echo "Killing any running preview servers..."
pkill -f "vite preview" 2>/dev/null
sleep 1

echo "Starting fresh preview server..."
cd "$(dirname "$0")"
npm run preview -- --port 4175 --strictPort

# Use different port (4175) to avoid browser cache from 4173
