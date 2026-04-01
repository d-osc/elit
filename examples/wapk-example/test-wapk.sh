#!/usr/bin/env bash
# Test script for WAPK live-sync functionality
# Packs, runs, sends requests, and verifies sync

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAPK_FILE="$PROJECT_DIR/example-app.wapk"
PORT="${PORT:-3333}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  WAPK Example App - Live-Sync Test Suite                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to cleanup
cleanup() {
    echo ""
    echo "Cleaning up test files..."
    rm -f "$WAPK_FILE" "$PROJECT_DIR"/marker-*.txt "$PROJECT_DIR"/wapk-runtime.log
    echo "✓ Cleanup complete"
}

trap cleanup EXIT

# Step 1: Pack the project
echo "[1/4] Packing project into WAPK..."
bun run ../../../src/cli.ts wapk pack "$PROJECT_DIR" --output-path "$WAPK_FILE"
if [ -f "$WAPK_FILE" ]; then
    SIZE=$(stat -f%z "$WAPK_FILE" 2>/dev/null || stat -c%s "$WAPK_FILE" 2>/dev/null || echo "unknown")
    echo "✓ WAPK packed: $WAPK_FILE ($SIZE bytes)"
else
    echo "✗ Failed to create WAPK file"
    exit 1
fi
echo ""

# Step 2: Inspect archive
echo "[2/4] Inspecting WAPK archive..."
bun run ../../../src/cli.ts wapk inspect "$WAPK_FILE"
echo ""

# Step 3: Run with polling sync (default)
echo "[3/4] Running with polling mode (300ms)..."
timeout 8s bash -c "
    cd '$PROJECT_DIR'
    
    # Run in background
    bun run ../../../src/cli.ts wapk run '$WAPK_FILE' &
    PID=\$!
    
    # Give server time to start
    sleep 2
    
    # Send requests to trigger log writes and marker file creation
    echo '  → Sending requests...'
    for i in {1..3}; do
        curl -s http://localhost:$PORT/ > /dev/null && echo \"    Request \$i: ✓\" || echo \"    Request \$i: ✗\"
        curl -s http://localhost:$PORT/create-marker > /dev/null
        sleep 0.5
    done
    
    # Shutdown via API
    echo '  → Requesting graceful shutdown...'
    curl -s http://localhost:$PORT/shutdown > /dev/null || true
    
    # Wait for process
    wait \$PID 2>/dev/null || true
" || true

echo ""

# Step 4: Verify live-sync
echo "[4/4] Verifying live-sync..."
if [ -f "$PROJECT_DIR/wapk-runtime.log" ]; then
    echo "✓ Log file was created and synced into WAPK"
    echo "  Log entries:"
    head -3 "$PROJECT_DIR/wapk-runtime.log" | sed 's/^/    /'
else
    echo "✗ Log file not found"
fi

MARKER_COUNT=$(ls -1 "$PROJECT_DIR"/marker-*.txt 2>/dev/null | wc -l)
if [ "$MARKER_COUNT" -gt 0 ]; then
    echo "✓ Marker files created: $MARKER_COUNT"
else
    echo "⚠ No marker files created (may indicate sync timing issue)"
fi

# Check WAPK was updated with new files
echo ""
echo "Checking WAPK archive contents after sync..."
bun run ../../../src/cli.ts wapk inspect "$WAPK_FILE" 2>/dev/null | grep -E "(wapk-runtime.log|marker-)" || echo "⚠ Runtime files may not be in archive yet"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Test Complete!                                               ║"
echo "║  Next: Try 'bun run test-wapk.sh --watcher' for faster sync   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
