/**
 * Event Inspector
 * Captures all browser events (mouse, keyboard, form, etc.)
 * Token-efficient: Stores only essential event data
 */
class EventInspector extends Inspector {
    constructor() {
        super('events');
        this.events = [];
        this.maxEvents = 100;
        this.startTime = null;
        this.eventTypes = [
            // Mouse events
            'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave',
            // Keyboard events
            'keydown', 'keyup', 'keypress',
            // Input events
            'input', 'beforeinput', 'change',
            // Form events
            'submit', 'reset',
            // Focus events
            'focus', 'blur', 'focusin', 'focusout',
            // Selection events
            'selectionchange',
            // Drag events
            'drag', 'dragstart', 'dragend', 'drop',
            // Clipboard events
            'copy', 'cut', 'paste',
            // Scroll events
            'scroll'
        ];
        this.listeners = new Map();
    }
    
    enable() {
        super.enable();
        this.startTime = Date.now();
        
        // Add event listeners for all tracked event types
        this.eventTypes.forEach(type => {
            const listener = (e) => this._recordEvent(e);
            this.listeners.set(type, listener);
            document.addEventListener(type, listener, true); // Use capture phase
        });
    }
    
    disable() {
        super.disable();
        
        // Remove all event listeners
        this.listeners.forEach((listener, type) => {
            document.removeEventListener(type, listener, true);
        });
        this.listeners.clear();
    }
    
    _recordEvent(e) {
        if (!this.enabled) return;
        
        // Build token-efficient event record
        const event = {
            type: e.type,
            timestamp: Date.now(),
            relativeTime: this.startTime ? Date.now() - this.startTime : 0,
            target: {
                tag: e.target.tagName,
                id: e.target.id || null,
                classes: Array.from(e.target.classList).slice(0, 3)
            }
        };
        
        // Add event-specific data
        if (e.type.startsWith('key')) {
            event.key = {
                key: e.key,
                code: e.code,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey
            };
        } else if (e.type.startsWith('mouse') || e.type === 'click' || e.type === 'dblclick') {
            event.mouse = {
                x: e.clientX,
                y: e.clientY,
                button: e.button,
                buttons: e.buttons
            };
        } else if (e.type === 'input' || e.type === 'beforeinput') {
            event.input = {
                data: e.data,
                inputType: e.inputType,
                isComposing: e.isComposing
            };
        } else if (e.type === 'change') {
            event.change = {
                value: e.target.value ? e.target.value.substring(0, 100) : null
            };
        } else if (e.type === 'selectionchange') {
            const sel = window.getSelection();
            event.selection = {
                collapsed: sel.isCollapsed,
                anchorOffset: sel.anchorOffset,
                focusOffset: sel.focusOffset,
                text: sel.toString().substring(0, 50)
            };
        } else if (e.type === 'scroll') {
            event.scroll = {
                scrollX: window.scrollX,
                scrollY: window.scrollY
            };
        }
        
        this.events.push(event);
        
        // Keep only recent events
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
    }
    
    capture() {
        return {
            timestamp: Date.now(),
            events: this.events.slice(), // Copy of events array
            stats: {
                total: this.events.length,
                byType: this._groupByType(),
                timeRange: {
                    start: this.startTime,
                    duration: this.startTime ? Date.now() - this.startTime : 0
                }
            }
        };
    }
    
    _groupByType() {
        const counts = {};
        this.events.forEach(e => {
            counts[e.type] = (counts[e.type] || 0) + 1;
        });
        return counts;
    }
    
    /**
     * Get events of a specific type
     */
    getEventsByType(type) {
        return this.events.filter(e => e.type === type);
    }
    
    /**
     * Get events in a time range
     */
    getEventsByTimeRange(start, end) {
        return this.events.filter(e => e.timestamp >= start && e.timestamp <= end);
    }
    
    clear() {
        super.clear();
        this.events = [];
        this.startTime = Date.now();
    }
}

// Expose globally
if (typeof window !== 'undefined') {
    window.EventInspector = EventInspector;
}
