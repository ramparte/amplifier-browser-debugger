#!/bin/bash
# Debug DOM changes workflow
# Captures before/after DOM state and shows diff

set -e

echo "=== DOM Debugging Workflow ==="
echo ""

# Inject debugger if needed
echo "Step 1: Injecting DOM inspector..."
browser-debug inject --inspectors dom

# Capture before state
echo "Step 2: Capturing before state..."
browser-debug capture --inspectors dom --label before > before.json
echo "✓ Saved to before.json"

echo ""
echo "Step 3: Perform your action now (click, type, etc.)"
read -p "Press Enter when ready to capture after state..."

# Capture after state
echo "Step 4: Capturing after state..."
browser-debug capture --inspectors dom --label after > after.json
echo "✓ Saved to after.json"

# Show diff summary
echo ""
echo "=== Changes Detected ==="
echo ""
echo "Before mutations: $(jq '.inspectors.dom.mutations | length' before.json)"
echo "After mutations: $(jq '.inspectors.dom.mutations | length' after.json)"
echo ""
echo "Element count before: $(jq '.inspectors.dom.stats.totalElements' before.json)"
echo "Element count after: $(jq '.inspectors.dom.stats.totalElements' after.json)"
echo ""
echo "Recent mutations:"
jq -r '.inspectors.dom.mutations[-5:] | .[] | "\(.type) on \(.target.tag) at \(.timestamp)"' after.json

echo ""
echo "Full state saved in before.json and after.json"
