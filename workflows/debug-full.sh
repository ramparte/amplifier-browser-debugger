#!/bin/bash
# Full debugging workflow
# Captures all inspector data for comprehensive analysis

set -e

echo "=== Full State Debugging Workflow ==="
echo ""

# Inject all debuggers
echo "Step 1: Injecting all inspectors..."
browser-debug inject

# Capture initial state
echo "Step 2: Capturing initial state..."
browser-debug capture --label initial > initial.json
echo "✓ Saved to initial.json"

echo ""
echo "Step 3: Perform your action now"
read -p "Press Enter when ready to capture final state..."

# Capture final state
echo "Step 4: Capturing final state..."
browser-debug capture --label final > final.json
echo "✓ Saved to final.json"

# Take screenshot
echo "Step 5: Taking screenshot..."
agent-browser screenshot final-state.png
echo "✓ Saved to final-state.png"

# Show summary
echo ""
echo "=== Summary ==="
echo ""
echo "DOM changes:"
echo "  Elements: $(jq '.inspectors.dom.stats.totalElements' initial.json) → $(jq '.inspectors.dom.stats.totalElements' final.json)"
echo "  Mutations: $(jq '.inspectors.dom.mutations | length' final.json)"
echo ""
echo "Events captured: $(jq '.inspectors.events.stats.total' final.json)"
echo ""
echo "Network requests: $(jq '.inspectors.network.stats.total' final.json)"
echo ""
echo "Detected frameworks: $(jq -r '.inspectors.framework.detected | join(", ")' final.json)"

echo ""
echo "Files created:"
echo "  - initial.json (full initial state)"
echo "  - final.json (full final state)"
echo "  - final-state.png (screenshot)"
