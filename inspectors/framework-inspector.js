/**
 * Framework Inspector
 * Detects and captures state from popular frameworks (React, Vue, Angular)
 * Also supports custom app state (e.g., Word3)
 * Extensible: Add custom adapters easily
 */
class FrameworkInspector extends Inspector {
    constructor() {
        super('framework');
        this.adapters = [];
        this.detectedFrameworks = [];
    }
    
    enable() {
        super.enable();
        this._autoDetect();
    }
    
    /**
     * Auto-detect frameworks and create adapters
     */
    _autoDetect() {
        this.adapters = [];
        this.detectedFrameworks = [];
        
        // Detect React
        if (this._hasReact()) {
            this.detectedFrameworks.push('React');
            this.adapters.push(new ReactAdapter());
        }
        
        // Detect Vue
        if (this._hasVue()) {
            this.detectedFrameworks.push('Vue');
            this.adapters.push(new VueAdapter());
        }
        
        // Detect Angular
        if (this._hasAngular()) {
            this.detectedFrameworks.push('Angular');
            this.adapters.push(new AngularAdapter());
        }
        
        // Detect custom apps
        // Word3
        if (window.Word3) {
            this.detectedFrameworks.push('Word3');
            this.adapters.push(new Word3Adapter());
        }
        
        // Add more custom adapters here
        
        console.log(`[FrameworkInspector] Detected: ${this.detectedFrameworks.join(', ') || 'none'}`);
    }
    
    _hasReact() {
        return !!(window.React || 
                 document.querySelector('[data-reactroot]') ||
                 document.querySelector('[data-reactid]'));
    }
    
    _hasVue() {
        return !!(window.Vue || 
                 document.querySelector('[data-v-]') ||
                 document.querySelector('[data-vue-]'));
    }
    
    _hasAngular() {
        return !!(window.angular || 
                 window.ng ||
                 document.querySelector('[ng-app]') ||
                 document.querySelector('[ng-controller]'));
    }
    
    /**
     * Add a custom adapter for a specific app
     */
    addCustomAdapter(name, captureFunction) {
        this.adapters.push(new CustomAdapter(name, captureFunction));
        this.detectedFrameworks.push(name);
    }
    
    capture() {
        return {
            timestamp: Date.now(),
            detected: this.detectedFrameworks,
            states: this.adapters.map(adapter => ({
                name: adapter.name,
                state: adapter.capture()
            }))
        };
    }
}

/**
 * React Adapter
 */
class ReactAdapter {
    constructor() {
        this.name = 'React';
    }
    
    capture() {
        const state = {
            version: window.React?.version || 'unknown',
            components: []
        };
        
        // Try to access React DevTools global hook
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            state.devToolsInstalled = true;
            // Add more React-specific state capture here
        }
        
        return state;
    }
}

/**
 * Vue Adapter
 */
class VueAdapter {
    constructor() {
        this.name = 'Vue';
    }
    
    capture() {
        const state = {
            version: window.Vue?.version || 'unknown',
            instances: []
        };
        
        // Try to access Vue DevTools
        if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
            state.devToolsInstalled = true;
        }
        
        return state;
    }
}

/**
 * Angular Adapter
 */
class AngularAdapter {
    constructor() {
        this.name = 'Angular';
    }
    
    capture() {
        const state = {
            version: window.ng?.version?.full || 'unknown'
        };
        
        return state;
    }
}

/**
 * Word3 Adapter (Custom App Example)
 */
class Word3Adapter {
    constructor() {
        this.name = 'Word3';
    }
    
    capture() {
        if (!window.Word3) return null;
        
        try {
            return {
                document: window.Word3.editor.getDocument(),
                selection: window.Word3.bridge.getSelection(),
                state: window.Word3.bridge.getState()
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }
}

/**
 * Custom Adapter (for any app-specific state)
 */
class CustomAdapter {
    constructor(name, captureFunction) {
        this.name = name;
        this.captureFunction = captureFunction;
    }
    
    capture() {
        try {
            return this.captureFunction();
        } catch (error) {
            return {
                error: error.message
            };
        }
    }
}

// Expose globally
if (typeof window !== 'undefined') {
    window.FrameworkInspector = FrameworkInspector;
}
