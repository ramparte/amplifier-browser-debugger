/**
 * Base Inspector Class
 * All inspectors extend this to provide consistent interface
 */
class Inspector {
    constructor(name) {
        this.name = name;
        this.enabled = false;
        this.data = {};
    }
    
    /**
     * Enable this inspector (start monitoring)
     */
    enable() {
        this.enabled = true;
        console.log(`[Inspector] Enabled: ${this.name}`);
    }
    
    /**
     * Disable this inspector (stop monitoring)
     */
    disable() {
        this.enabled = false;
        console.log(`[Inspector] Disabled: ${this.name}`);
    }
    
    /**
     * Capture current state (must be implemented by subclass)
     * @returns {Object} Current state snapshot
     */
    capture() {
        throw new Error(`Inspector ${this.name} must implement capture()`);
    }
    
    /**
     * Export collected data
     * @returns {Object} All collected data
     */
    export() {
        return this.data;
    }
    
    /**
     * Clear collected data
     */
    clear() {
        this.data = {};
    }
    
    /**
     * Check if inspector is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Inspector = Inspector;
}
