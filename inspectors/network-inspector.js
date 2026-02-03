/**
 * Network Inspector
 * Intercepts and logs fetch/XHR requests
 * Token-efficient: Stores only essential request/response data
 */
class NetworkInspector extends Inspector {
    constructor() {
        super('network');
        this.requests = [];
        this.maxRequests = 50;
        this.originalFetch = null;
        this.originalXHROpen = null;
        this.originalXHRSend = null;
    }
    
    enable() {
        super.enable();
        this._interceptFetch();
        this._interceptXHR();
    }
    
    disable() {
        super.disable();
        this._restoreFetch();
        this._restoreXHR();
    }
    
    _interceptFetch() {
        this.originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const startTime = Date.now();
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            const options = args[1] || {};
            const method = options.method || 'GET';
            
            try {
                const response = await self.originalFetch(...args);
                
                self._recordRequest({
                    url: url,
                    method: method,
                    status: response.status,
                    statusText: response.statusText,
                    duration: Date.now() - startTime,
                    type: 'fetch',
                    timestamp: startTime,
                    headers: self._extractHeaders(response.headers),
                    success: response.ok
                });
                
                return response;
            } catch (error) {
                self._recordRequest({
                    url: url,
                    method: method,
                    error: error.message,
                    duration: Date.now() - startTime,
                    type: 'fetch',
                    timestamp: startTime,
                    success: false
                });
                throw error;
            }
        };
    }
    
    _interceptXHR() {
        const self = this;
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._debugInfo = {
                method: method,
                url: url,
                startTime: Date.now()
            };
            return self.originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function() {
            const xhr = this;
            
            xhr.addEventListener('load', function() {
                if (xhr._debugInfo) {
                    self._recordRequest({
                        url: xhr._debugInfo.url,
                        method: xhr._debugInfo.method,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        duration: Date.now() - xhr._debugInfo.startTime,
                        type: 'xhr',
                        timestamp: xhr._debugInfo.startTime,
                        success: xhr.status >= 200 && xhr.status < 300
                    });
                }
            });
            
            xhr.addEventListener('error', function() {
                if (xhr._debugInfo) {
                    self._recordRequest({
                        url: xhr._debugInfo.url,
                        method: xhr._debugInfo.method,
                        error: 'Network error',
                        duration: Date.now() - xhr._debugInfo.startTime,
                        type: 'xhr',
                        timestamp: xhr._debugInfo.startTime,
                        success: false
                    });
                }
            });
            
            return self.originalXHRSend.apply(this, arguments);
        };
    }
    
    _restoreFetch() {
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
        }
    }
    
    _restoreXHR() {
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen;
        }
        if (this.originalXHRSend) {
            XMLHttpRequest.prototype.send = this.originalXHRSend;
        }
    }
    
    _recordRequest(req) {
        this.requests.push(req);
        
        // Keep only recent requests
        if (this.requests.length > this.maxRequests) {
            this.requests.shift();
        }
    }
    
    _extractHeaders(headers) {
        const extracted = {};
        if (headers && typeof headers.forEach === 'function') {
            headers.forEach((value, key) => {
                // Only include interesting headers to save tokens
                if (['content-type', 'content-length', 'cache-control'].includes(key.toLowerCase())) {
                    extracted[key] = value;
                }
            });
        }
        return extracted;
    }
    
    capture() {
        return {
            timestamp: Date.now(),
            requests: this.requests.slice(),
            stats: {
                total: this.requests.length,
                successful: this.requests.filter(r => r.success).length,
                failed: this.requests.filter(r => !r.success).length,
                byMethod: this._groupByMethod(),
                avgDuration: this._calculateAvgDuration()
            }
        };
    }
    
    _groupByMethod() {
        const counts = {};
        this.requests.forEach(r => {
            const method = r.method || 'UNKNOWN';
            counts[method] = (counts[method] || 0) + 1;
        });
        return counts;
    }
    
    _calculateAvgDuration() {
        if (this.requests.length === 0) return 0;
        const total = this.requests.reduce((sum, r) => sum + (r.duration || 0), 0);
        return Math.round(total / this.requests.length);
    }
    
    clear() {
        super.clear();
        this.requests = [];
    }
}

// Expose globally
if (typeof window !== 'undefined') {
    window.NetworkInspector = NetworkInspector;
}
