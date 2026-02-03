#!/bin/bash
# Test browser-debugger on Word3 app
set -e

# Setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$PATH:$SCRIPT_DIR/cli"

echo "=== Browser Debugger - Word3 Test ==="
echo ""

# Close any existing browser sessions
echo "Cleaning up existing sessions..."
agent-browser close 2>/dev/null || true
sleep 1

# Open Word3 with a fresh session
echo "Step 1: Opening Word3..."
agent-browser open file:///home/samschillace/dev/ANext/word3/UI/word-clone-v2.html
sleep 2

# Inject debugger
echo ""
echo "Step 2: Injecting debugger..."
browser-debug inject
echo ""

# Capture initial state
echo "Step 3: Capturing initial state..."
browser-debug capture --inspectors dom,events,framework --label initial > /tmp/word3-initial.json
echo "✓ Saved to /tmp/word3-initial.json"
echo ""

# Show initial state summary
echo "=== Initial State ==="
jq '{
  url: .url,
  timestamp: .datetime,
  dom: {
    totalElements: .inspectors.dom.stats.totalElements,
    focusedElement: .inspectors.dom.focus.activeElement.tag
  },
  events: {
    total: .inspectors.events.stats.total
  },
  framework: .inspectors.framework.detected
}' /tmp/word3-initial.json

echo ""
echo "Step 4: Interacting with page..."

# Click content area
echo "  - Clicking content area..."
agent-browser click "#content-area"
sleep 1

# Type text
echo "  - Typing 'Hello World'..."
agent-browser type "#content-area" "Hello World"
sleep 1

# Press Enter (the problematic key)
echo "  - Pressing Enter key..."
agent-browser press Enter
sleep 1

# Capture after state
echo ""
echo "Step 5: Capturing after state..."
browser-debug capture --inspectors dom,events --label after_enter > /tmp/word3-after-enter.json
echo "✓ Saved to /tmp/word3-after-enter.json"
echo ""

# Take screenshot
echo "Step 6: Taking screenshot..."
agent-browser screenshot /tmp/word3-after-enter.png
echo "✓ Saved to /tmp/word3-after-enter.png"
echo ""

# Show comparison
echo "=== Results ==="
echo ""
echo "DOM Changes:"
echo "  Elements before: $(jq '.inspectors.dom.stats.totalElements' /tmp/word3-initial.json)"
echo "  Elements after:  $(jq '.inspectors.dom.stats.totalElements' /tmp/word3-after-enter.json)"
echo "  Mutations:       $(jq '.inspectors.dom.mutations | length' /tmp/word3-after-enter.json)"
echo ""

echo "Event Trace (last 10 events):"
jq -r '.inspectors.events.events[-10:] | .[] | "  \(.relativeTime)ms - \(.type) - \(.key.key // .input.data // "")"' /tmp/word3-after-enter.json

echo ""
echo "Recent Mutations:"
jq -r '.inspectors.dom.mutations[-5:] | .[] | "  \(.type) on \(.target.tag)#\(.target.id // "no-id")"' /tmp/word3-after-enter.json

echo ""
echo "=== Analysis Files Created ==="
echo "  - /tmp/word3-initial.json        (initial state)"
echo "  - /tmp/word3-after-enter.json    (after pressing Enter)"
echo "  - /tmp/word3-after-enter.png     (screenshot)"
echo ""
echo "Next steps:"
echo "  - Examine mutations to see if new <p> was created"
echo "  - Check event sequence for keydown/keyup/input events"
echo "  - Compare DOM structure before/after"
echo ""
echo "Example analysis commands:"
echo "  jq '.inspectors.dom.mutations' /tmp/word3-after-enter.json"
echo "  jq '.inspectors.events.events[] | select(.type==\"keydown\")' /tmp/word3-after-enter.json"

# Close browser
echo ""
echo "Cleaning up..."
agent-browser close
