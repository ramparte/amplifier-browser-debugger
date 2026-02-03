/**
 * DOM Inspector
 * Captures DOM structure, mutations, and state
 * Token-efficient: Uses depth limits and smart truncation
 */
class DOMInspector extends Inspector {
    constructor() {
        super('dom');
        this.observer = null;
        this.mutations = [];
        this.maxMutations = 50;
        this.maxDepth = 5;
        this.maxChildrenPerLevel = 10;
    }
    
    enable() {
        super.enable();
        
        // Start observing DOM mutations
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                this.mutations.push({
                    type: mutation.type,
                    target: this._nodeRef(mutation.target),
                    addedNodes: Array.from(mutation.addedNodes).map(n => this._nodeRef(n)),
                    removedNodes: Array.from(mutation.removedNodes).map(n => this._nodeRef(n)),
                    attributeName: mutation.attributeName,
                    oldValue: mutation.oldValue,
                    timestamp: Date.now()
                });
            });
            
            // Keep only recent mutations to save memory
            if (this.mutations.length > this.maxMutations) {
                this.mutations = this.mutations.slice(-this.maxMutations);
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeOldValue: true,
            characterDataOldValue: true
        });
    }
    
    disable() {
        super.disable();
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    
    capture() {
        return {
            timestamp: Date.now(),
            structure: this._captureStructure(document.body, 0, this.maxDepth),
            mutations: this.mutations.slice(), // Copy of mutations
            stats: {
                totalElements: document.querySelectorAll('*').length,
                textNodes: this._countTextNodes(),
                formElements: document.querySelectorAll('input, textarea, select, button').length,
                images: document.querySelectorAll('img').length,
                links: document.querySelectorAll('a').length
            },
            focus: {
                activeElement: this._nodeRef(document.activeElement),
                hasFocus: document.hasFocus()
            }
        };
    }
    
    /**
     * Capture DOM structure recursively (token-efficient)
     */
    _captureStructure(node, depth, maxDepth) {
        if (depth >= maxDepth) {
            return { truncated: true, reason: 'max_depth' };
        }
        
        if (!node) {
            return null;
        }
        
        // Text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text.length === 0) return null;
            return {
                type: 'text',
                content: text.substring(0, 100) // Max 100 chars for tokens
            };
        }
        
        // Element nodes
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = {
                type: 'element',
                tag: node.tagName.toLowerCase(),
                id: node.id || null,
                classes: Array.from(node.classList),
                attributes: this._getRelevantAttrs(node),
                children: []
            };
            
            // Capture children (limited)
            const children = Array.from(node.childNodes)
                .filter(child => child.nodeType === Node.ELEMENT_NODE || 
                               (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0))
                .slice(0, this.maxChildrenPerLevel);
            
            element.children = children
                .map(child => this._captureStructure(child, depth + 1, maxDepth))
                .filter(child => child !== null);
            
            if (node.childNodes.length > this.maxChildrenPerLevel) {
                element.childrenTruncated = node.childNodes.length - this.maxChildrenPerLevel;
            }
            
            return element;
        }
        
        return null;
    }
    
    /**
     * Get only relevant attributes (saves tokens)
     */
    _getRelevantAttrs(node) {
        const relevant = ['contenteditable', 'data-', 'role', 'aria-', 'placeholder', 'value', 'type', 'name'];
        const attrs = {};
        
        for (const attr of node.attributes) {
            const include = relevant.some(r => 
                r.endsWith('-') ? attr.name.startsWith(r.slice(0, -1)) : attr.name === r
            );
            
            if (include) {
                attrs[attr.name] = attr.value.substring(0, 200); // Truncate long values
            }
        }
        
        return attrs;
    }
    
    /**
     * Create lightweight node reference
     */
    _nodeRef(node) {
        if (!node) return null;
        
        const ref = {
            tag: node.nodeName,
            id: node.id || null
        };
        
        // Add text content for text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            ref.text = node.textContent.substring(0, 30);
        } else if (node.textContent) {
            ref.text = node.textContent.substring(0, 30);
        }
        
        return ref;
    }
    
    /**
     * Count text nodes in document
     */
    _countTextNodes() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );
        let count = 0;
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.trim().length > 0) {
                count++;
            }
        }
        return count;
    }
    
    clear() {
        super.clear();
        this.mutations = [];
    }
}

// Auto-register if BrowserDebugger exists
if (typeof window !== 'undefined' && window.BrowserDebugger) {
    if (!window.__browserDebugger) {
        console.warn('[DOMInspector] BrowserDebugger not initialized yet');
    }
}

// Expose globally
if (typeof window !== 'undefined') {
    window.DOMInspector = DOMInspector;
}
