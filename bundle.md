---
bundle:
  name: browser-debugger
  version: 1.0.0
  description: Token-efficient web UI debugging toolkit
---

# Browser Debugger Bundle

This bundle provides awareness of the browser-debugger toolkit for debugging web UIs.

## What This Provides

The browser-debugger toolkit is available at:
- Repository: https://github.com/ramparte/amplifier-browser-debugger
- Local installation: /home/samschillace/dev/ANext/amplifier-browser-debugger
- CLI tool: `browser-debug` (requires PATH setup)

## Capabilities

The toolkit provides token-efficient debugging via agent-browser:

1. **DOM Inspector** - Structure, mutations, element tracking
2. **Event Inspector** - Mouse, keyboard, form events with timing
3. **Network Inspector** - fetch/XHR request monitoring
4. **Framework Inspector** - React/Vue/Word3 app state

## Usage Pattern

When you need to debug web UI issues:

```bash
# 1. Open app in agent-browser
agent-browser open file:///path/to/app.html

# 2. Inject debugger
browser-debug inject

# 3. Capture state
browser-debug capture --inspectors dom,events > state.json

# 4. Analyze
jq '.inspectors.dom.mutations' state.json
```

## Token Efficiency

- Full capture: ~2,000 tokens (vs Playwright's 100,000+)
- Selective captures: ~500-800 tokens per inspector
- 98% reduction in token usage for browser debugging

## Prerequisites

Requires:
- `agent-browser` installed (`npm install -g agent-browser`)
- `browser-debug` CLI in PATH
- Python 3.x for CLI tool

## Documentation

Full documentation at: /home/samschillace/dev/ANext/amplifier-browser-debugger/README.md
