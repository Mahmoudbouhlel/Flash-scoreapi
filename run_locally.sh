#!/usr/bin/env bash
# ==============================================================================
# Flashscore AI Football Intelligence v2.4 / v3.2 — Bash Local Launcher
# Direct execution script for Linux / macOS / WSL
# ==============================================================================

set -e

echo ""
echo "========================================================================"
echo "   FLASHSCORE DEEP LIVE TRACKER & AI FOOTBALL INTELLIGENCE v2.4 / v3.2  "
echo "   Real-Time Clock • Live Radar • Daily Top 5 • Global Match Analyzer   "
echo "========================================================================"
echo ""

# 1. Node.js check
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    exit 1
fi
echo "[1/4] Node.js detected: $(node -v)"

# 2. Python check
if command -v python3 &> /dev/null; then
    echo "[2/4] Python detected: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "[2/4] Python detected: $(python --version)"
else
    echo "[2/4] Python not found in PATH."
fi

# 3. Dependencies check
if [ ! -d "node_modules" ]; then
    echo "[3/4] Installing npm dependencies..."
    npm install
else
    echo "[3/4] node_modules verified."
fi

# 4. Start Server
export PORT=3000
export NODE_ENV=development

echo ""
echo "------------------------------------------------------------------------"
echo " Server running on http://localhost:3000"
echo " Press Ctrl+C to stop."
echo "------------------------------------------------------------------------"
echo ""

npm run dev
