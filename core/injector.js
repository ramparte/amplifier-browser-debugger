/**
 * BrowserDebugger - Main orchestrator for all inspectors
 * Provides unified interface for capturing state across multiple inspectors
 */
class BrowserDebugger {
    constructor(inspectorNames = []) {
        this.inspectors = new Map();
        this.version = '1.0.0';
        
        console.log(`[BrowserDebugger] Initializing v${this.version}`);
        
        // Register available inspectors (will be populated as they're loaded)
        this.availableInspectors = new Set();
        
        // Enable requested inspectors
        if (inspectorNames.length > 0) {
            inspectorNames.forEach(name => this.enable(name));
        }
    }
    
    /**
     * Register an inspector class
     * @param {string} name - Inspector name
     * @param {Class} InspectorClass - Inspector class constructor
     */
    registerInspector(name, InspectorClass) {
        if (!this.inspectors.has(name)) {
            const inspector = new InspectorClass();
            this.inspectors.set(name, inspector);
            this.availableInspectors.add(name);
            console.log(`[BrowserDebugger] Registered: ${name}`);
        }
    }
    
    /**
     * Enable an inspector
     * @param {string} name - Inspector name
     */
    enable(name) {
        const inspector = this.inspectors.get(name);
        if (inspector) {
            inspector.enable();
            return true;
        } else {
            console.warn(`[BrowserDebugger] Inspector not found: ${name}`);
            return false;
        }
    }
    
    /**
     * Disable an inspector
     * @param {string} name - Inspector name
     */
    disable(name) {
        const inspector = this.inspectors.get(name);
        if (inspector) {
            inspector.disable();
            return true;
        }
        return false;
    }
    
    /**
     * Capture state from all enabled inspectors
     * @param {Array<string>} inspectorNames - Specific inspectors to capture (null = all enabled)
     * @returns {Object} Captured state
     */
    capture(inspectorNames = null) {
        const result = {
            timestamp: Date.now(),
            datetime: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            inspectors: {}
        };
        
        // Determine which inspectors to capture from
        const toCaptureFrom = inspectorNames || Array.from(this.inspectors.keys());
        
        toCaptureFrom.forEach(name => {
            const inspector = this.inspectors.get(name);
            if (inspector && inspector.isEnabled()) {
                try {
                    result.inspectors[name] = inspector.capture();
                } catch (error) {
                    console.error(`[BrowserDebugger] Error capturing ${name}:`, error);
                    result.inspectors[name] = {
                        error: error.message,
                        stack: error.stack
                    };
                }
            }
        });
        
        return result;
    }
    
    /**
     * Get list of available inspectors
     * @returns {Array<Object>} Inspector info
     */
    listInspectors() {
        const list = [];
        this.inspectors.forEach((inspector, name) => {
            list.push({
                name: name,
                enabled: inspector.isEnabled()
            });
        });
        return list;
    }
    
    /**
     * Clear all inspector data
     */
    clearAll() {
        this.inspectors.forEach(inspector => inspector.clear());
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BrowserDebugger = BrowserDebugger;
}
