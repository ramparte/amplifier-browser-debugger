#!/bin/bash
# Debug event sequence workflow
# Records and analyzes user interactions

set -e

echo "=== Event Debugging Workflow ==="
echo ""

# Inject debugger
echo "Step 1: Injecting Event inspector..."
browser-debug inject --inspectors events

echo ""
echo "Step 2: Interact with the page (type, click, etc.)"
echo "Events are being recorded..."
read -p "Press Enter when done to capture event trace..."

# Capture events
echo ""
echo "Step 3: Capturing event trace..."
browser-debug capture --inspectors events --label event_trace > events.json
echo "✓ Saved to events.json"

# Show summary
echo ""
echo "=== Event Summary ==="
echo ""
echo "Total events: $(jq '.inspectors.events.stats.total' events.json)"
echo ""
echo "Events by type:"
jq -r '.inspectors.events.stats.byType | to_entries[] | "  \(.key): \(.value)"' events.json
echo ""
echo "Last 10 events:"
jq -r '.inspectors.events.events[-10:] | .[] | "\(.relativeTime)ms - \(.type) on \(.target.tag)"' events.json

echo ""
echo "Full event trace saved in events.json"
