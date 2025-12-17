/**
 * Client-side HMR runtime for Elit
 * Import this in your app to enable hot module replacement
 */

export interface HMRClient {
  /** Check if HMR is enabled */
  enabled: boolean;
  /** Manually reload the page */
  reload: () => void;
  /** Accept HMR updates for current module */
  accept: (callback?: () => void) => void;
  /** Decline HMR updates (forces full reload) */
  decline: () => void;
  /** Dispose callback before module is replaced */
  dispose: (callback: () => void) => void;
}

declare global {
  interface Window {
    __ELIT_HMR__: HMRClient;
  }
}

class ElitHMR implements HMRClient {
  enabled = false;
  private ws: WebSocket | null = null;
  private acceptCallbacks: (() => void)[] = [];
  private disposeCallbacks: (() => void)[] = [];
  private declined = false;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || '3000';

    this.ws = new WebSocket(`${protocol}//${host}:${port}`);

    this.ws.onopen = () => {
      this.enabled = true;
      console.log('[Elit HMR] Connected ✓');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('[Elit HMR] Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      this.enabled = false;
      console.log('[Elit HMR] Disconnected - Attempting reconnect...');
      setTimeout(() => this.reload(), 1000);
    };

    this.ws.onerror = (error) => {
      console.error('[Elit HMR] WebSocket error:', error);
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'connected':
        console.log('[Elit HMR] Ready');
        break;

      case 'update':
        console.log(`[Elit HMR] Update detected: ${data.path}`);

        if (this.declined) {
          this.reload();
          return;
        }

        // Run dispose callbacks
        this.disposeCallbacks.forEach(cb => cb());
        this.disposeCallbacks = [];

        // Run accept callbacks or reload
        if (this.acceptCallbacks.length > 0) {
          this.acceptCallbacks.forEach(cb => cb());
        } else {
          this.reload();
        }
        break;

      case 'reload':
        console.log('[Elit HMR] Full reload requested');
        this.reload();
        break;

      case 'error':
        console.error('[Elit HMR] Server error:', data.error);
        break;
    }
  }

  reload() {
    window.location.reload();
  }

  accept(callback?: () => void) {
    if (callback) {
      this.acceptCallbacks.push(callback);
    }
    this.declined = false;
  }

  decline() {
    this.declined = true;
  }

  dispose(callback: () => void) {
    this.disposeCallbacks.push(callback);
  }
}

// Create singleton instance
const hmr = new ElitHMR();

// Expose globally
if (typeof window !== 'undefined') {
  window.__ELIT_HMR__ = hmr;
}

export default hmr;
