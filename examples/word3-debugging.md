# Debugging Word3 with Browser Debugger

This example shows how to use browser-debugger to debug the Word3 editing issues.

## Current Issues

1. Return key doesn't make newlines
2. Caret position issues
3. Selection state inconsistencies
4. Backend/DOM sync problems

## Debugging Workflow

### Setup

```bash
# Open Word3 in agent-browser
agent-browser open file:///home/samschillace/dev/ANext/word3/UI/word-clone-v2.html

# Inject all debuggers
browser-debug inject
```

### Debug Return Key Issue

```bash
# Capture before state
browser-debug capture --label before_return > before_return.json

# Simulate pressing Return key
agent-browser click "#content-area"
agent-browser press Enter

# Capture after state
browser-debug capture --label after_return > after_return.json

# Compare DOM changes
jq '.inspectors.dom.stats' before_return.json after_return.json

# Check for paragraph creation
jq '.inspectors.dom.structure.children | length' before_return.json
jq '.inspectors.dom.structure.children | length' after_return.json

# Check backend state
jq '.inspectors.framework.states[] | select(.name == "Word3")' after_return.json

# View mutations
jq '.inspectors.dom.mutations[-5:]' after_return.json
```

### Debug Caret Position

```bash
# Type some text
agent-browser type "#content-area" "Hello World"

# Capture state
browser-debug capture --label after_typing > after_typing.json

# Check selection state
jq '.inspectors.events.events[] | select(.type == "selectionchange")' after_typing.json

# Check DOM selection vs Backend selection
jq '{
  dom: .inspectors.events.events[-1].selection,
  backend: .inspectors.framework.states[0].state.selection
}' after_typing.json
```

### Debug Event Sequence

```bash
# Clear event buffer
browser-debug disable events
browser-debug enable events

# Perform action
agent-browser click "#content-area"
agent-browser type "#content-area" "Test"
agent-browser press ArrowLeft
agent-browser press ArrowLeft

# Capture event trace
browser-debug capture --inspectors events > event_trace.json

# View sequence
jq -r '.inspectors.events.events[] | "\(.relativeTime)ms - \(.type) - \(.key.key // .input.data // "")"' event_trace.json
```

### Full State Capture

```bash
# Use the full workflow
cd /home/samschillace/dev/ANext/amplifier-browser-debugger
./workflows/debug-full.sh
```

## Analysis Patterns

### Find Selection Mismatches

```bash
jq '{
  dom_collapsed: .inspectors.events.events[-1].selection.collapsed,
  dom_offset: .inspectors.events.events[-1].selection.anchorOffset,
  backend_offset: .inspectors.framework.states[0].state.selection.anchor.offset
}' state.json
```

### Track DOM Mutations

```bash
# Show all mutations
jq '.inspectors.dom.mutations[] | {type, target: .target.tag, timestamp}' state.json

# Count mutation types
jq '.inspectors.dom.mutations | group_by(.type) | map({type: .[0].type, count: length})' state.json
```

### Event Timing Analysis

```bash
# Show event timing
jq '.inspectors.events.events[] | {time: .relativeTime, type, key: .key.key}' state.json

# Find slow events (>100ms between events)
jq '.inspectors.events.events | [.[] | .relativeTime] | [range(length-1)] | map(.[.] as $idx | .[$idx+1] - .[$idx]) | map(select(. > 100))' state.json
```

## Expected Results

### Working Return Key

Before:
```json
{
  "dom": {
    "stats": {
      "totalElements": 5
    },
    "structure": {
      "children": [
        {"type": "element", "tag": "p"}
      ]
    }
  }
}
```

After (should have):
```json
{
  "dom": {
    "stats": {
      "totalElements": 6  // Increased
    },
    "structure": {
      "children": [
        {"type": "element", "tag": "p"},
        {"type": "element", "tag": "p"}  // New paragraph
      ]
    }
  }
}
```

### Correct Caret Position

```json
{
  "dom": {
    "selection": {
      "anchorOffset": 5
    }
  },
  "backend": {
    "selection": {
      "anchor": {
        "offset": 5  // Should match DOM
      }
    }
  }
}
```

## Debugging Tips

1. **Always capture before AND after** - State diffs reveal what's broken
2. **Check backend state** - Word3 adapter shows if backend is synced
3. **Watch mutations** - DOM changes show what's actually happening
4. **Trace events** - Event sequence reveals handler issues
5. **Compare with working app** - Capture state from a known-good editor

## Integration with Existing Tests

```bash
# Run diagnostic tests and capture state
cd /home/samschillace/dev/ANext/word3/UI
browser-debug inject

# Run test
./diagnostic-tests.sh

# Capture final state
browser-debug capture > test-results.json

# Analyze
jq '.inspectors.framework.states[0].state' test-results.json
```
