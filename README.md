# Amplifier Browser Debugger

**Token-efficient, LLM-optimized web UI debugging toolkit**

Built on [agent-browser](https://github.com/vercel-labs/agent-browser) for AI-driven debugging workflows. Provides comprehensive browser state inspection with minimal token consumption (~1,500 tokens vs Playwright's 50,000+ tokens).

## Features

- 🔍 **Modular Inspectors**: Enable only what you need
- 🎯 **Token-Efficient**: JSON output optimized for LLM consumption
- 🚀 **Fast**: Reuses agent-browser daemon, no browser restarts
- 🔧 **Universal**: Works on any web app (React, Vue, custom frameworks)
- 🤖 **AI-First**: Designed for AI-driven debugging workflows

## Installation

### Prerequisites

```bash
# Install agent-browser
npm install -g agent-browser
agent-browser install

# Verify installation
which agent-browser
agent-browser --version
```

### Install browser-debug CLI

```bash
cd amplifier-browser-debugger

# Add CLI to PATH
export PATH="$PATH:$(pwd)/cli"

# Or create symlink
sudo ln -s $(pwd)/cli/browser-debug /usr/local/bin/browser-debug
```

## Quick Start

### 1. Open a web page

```bash
agent-browser open file:///path/to/your/app.html
# or
agent-browser open https://your-app.com
```

### 2. Inject debugger

```bash
# Inject all inspectors
browser-debug inject

# Or inject specific inspectors
browser-debug inject --inspectors dom,events
```

### 3. Capture state

```bash
# Capture current state
browser-debug capture > state.json

# Capture specific inspectors
browser-debug capture --inspectors dom,events > state.json

# Capture with label
browser-debug capture --label "before_click" > before.json
```

### 4. Analyze

```bash
# View DOM stats
jq '.inspectors.dom.stats' state.json

# View recent events
jq '.inspectors.events.events[-10:]' state.json

# View network requests
jq '.inspectors.network.requests' state.json
```

## Available Inspectors

| Inspector | What It Captures | Use Case |
|-----------|------------------|----------|
| **dom** | DOM structure, mutations, stats | Track DOM changes, element counts |
| **events** | Mouse, keyboard, form events | Debug interactions, event sequences |
| **network** | fetch/XHR requests | API debugging, request tracking |
| **framework** | React/Vue/custom app state | App-specific state inspection |

## Usage Examples

### Debug DOM Changes

```bash
# Before/after comparison
browser-debug inject --inspectors dom
browser-debug capture --label before > before.json

# (perform action - click, type, etc.)

browser-debug capture --label after > after.json

# Compare
jq '.inspectors.dom.stats' before.json after.json
```

### Trace Event Sequence

```bash
# Start recording events
browser-debug inject --inspectors events

# (interact with page)

# Capture event trace
browser-debug capture --inspectors events > events.json

# View last 10 events
jq '.inspectors.events.events[-10:]' events.json
```

### Debug Network Requests

```bash
# Monitor network
browser-debug inject --inspectors network

# (perform action that makes requests)

# Capture network activity
browser-debug capture --inspectors network > network.json

# View requests
jq '.inspectors.network.requests[]' network.json
```

### Full State Capture

```bash
# Capture everything
browser-debug inject  # All inspectors
browser-debug capture > full-state.json

# View summary
jq '{
  dom: .inspectors.dom.stats,
  events: .inspectors.events.stats,
  network: .inspectors.network.stats,
  frameworks: .inspectors.framework.detected
}' full-state.json
```

## Workflow Scripts

Pre-built workflows for common debugging scenarios:

```bash
# DOM debugging workflow
./workflows/debug-dom.sh

# Event debugging workflow
./workflows/debug-events.sh

# Full capture workflow
./workflows/debug-full.sh
```

## CLI Reference

```bash
browser-debug inject [--inspectors dom,events,network,framework]
  Inject debugger into current page

browser-debug capture [--inspectors INSPECTORS] [--label LABEL]
  Capture current state

browser-debug enable <inspector>
  Enable a specific inspector

browser-debug disable <inspector>
  Disable a specific inspector

browser-debug list
  List all inspectors and their status
```

## Token Efficiency

Comparison with Playwright for typical debugging tasks:

| Task | Playwright | browser-debug | Savings |
|------|------------|---------------|---------|
| DOM snapshot | 20,000 tokens | 800 tokens | 96% |
| Event trace (20 events) | 50,000 tokens | 600 tokens | 99% |
| Network requests (10) | 15,000 tokens | 400 tokens | 97% |
| Full state capture | 100,000+ tokens | 2,000 tokens | 98% |

## Extending with Custom Inspectors

### Add Custom Framework Detection

```javascript
// In framework-inspector.js, add to _autoDetect():
if (window.YourFramework) {
    this.detectedFrameworks.push('YourFramework');
    this.adapters.push(new YourFrameworkAdapter());
}

// Define adapter:
class YourFrameworkAdapter {
    constructor() {
        this.name = 'YourFramework';
    }
    
    capture() {
        return {
            state: window.YourFramework.getState(),
            version: window.YourFramework.version
        };
    }
}
```

### Add Custom Inspector

Create `inspectors/custom-inspector.js`:

```javascript
class CustomInspector extends Inspector {
    constructor() {
        super('custom');
    }
    
    enable() {
        super.enable();
        // Set up monitoring
    }
    
    capture() {
        return {
            timestamp: Date.now(),
            // Your custom data
        };
    }
}
```

Update CLI to register it in `inject_inspector()`.

## Architecture

```
Core Framework
├── inspector-base.js    - Base class for all inspectors
└── injector.js          - BrowserDebugger orchestrator

Inspectors (Modular)
├── dom-inspector.js      - DOM state & mutations
├── event-inspector.js    - Event capture
├── network-inspector.js  - Request interception
└── framework-inspector.js - Framework adapters

CLI Tool
└── browser-debug        - Python CLI wrapper

Workflows
├── debug-dom.sh         - DOM debugging workflow
├── debug-events.sh      - Event tracing workflow
└── debug-full.sh        - Complete capture workflow
```

## How It Works

1. **Injection**: JavaScript inspectors are injected into the page via `agent-browser eval`
2. **Monitoring**: Inspectors attach to DOM observers, event listeners, or intercept APIs
3. **Capture**: State is captured as compact JSON (token-efficient)
4. **Export**: CLI retrieves JSON via `agent-browser eval` and outputs to stdout

## Integration with Amplifier

This toolkit is designed to work seamlessly with Amplifier workflows:

```yaml
# In your Amplifier bundle
tools:
  - browser-debug

# In recipes
- step: capture_state
  tool: browser-debug
  args:
    operation: capture
    inspectors: dom,events
```

## Troubleshooting

### "agent-browser: command not found"

Install agent-browser globally:
```bash
npm install -g agent-browser
agent-browser install
```

### "BrowserDebugger not initialized"

Make sure to inject first:
```bash
browser-debug inject
```

### "Inspector not found"

Check available inspectors:
```bash
browser-debug list
```

Make sure inspector name is correct (dom, events, network, framework).

### Empty capture results

Enable the inspector first:
```bash
browser-debug enable dom
browser-debug capture --inspectors dom
```

## Examples

See `/examples` directory for complete debugging scenarios:
- Form submission debugging
- React app state inspection
- Performance analysis
- Custom framework integration

## License

MIT

## Contributing

Contributions welcome! To add a new inspector:

1. Create `inspectors/your-inspector.js` extending `Inspector`
2. Implement `enable()`, `disable()`, and `capture()`
3. Update CLI to register it
4. Add tests and documentation

---

Built with ❤️ for AI-driven debugging workflows
