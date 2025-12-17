/**
 * Client-side Shared State Handler
 * For use in the browser to sync state with server
 */

type StateChangeCallback<T = any> = (value: T, oldValue: T) => void;

interface StateMessage {
  type: 'state:init' | 'state:update' | 'state:subscribe' | 'state:unsubscribe' | 'state:change';
  key: string;
  value?: any;
  timestamp?: number;
}

/**
 * Client-side shared state
 */
export class ClientState<T = any> {
  private _value: T | undefined;
  private callbacks = new Set<StateChangeCallback<T>>();
  private ws: WebSocket | null = null;
  private connected = false;

  constructor(
    public readonly key: string,
    private defaultValue?: T
  ) {
    this._value = defaultValue;
  }

  /**
   * Get current value
   */
  get value(): T | undefined {
    return this._value;
  }

  /**
   * Set new value and sync to server
   */
  set value(newValue: T | undefined) {
    const oldValue = this._value;
    this._value = newValue;

    // Notify local callbacks
    this.callbacks.forEach(callback => {
      callback(newValue!, oldValue!);
    });

    // Send to server
    this.sendToServer(newValue);
  }

  /**
   * Update value using a function
   */
  update(updater: (current: T | undefined) => T): void {
    this.value = updater(this._value);
  }

  /**
   * Subscribe to state changes
   */
  onChange(callback: StateChangeCallback<T>): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Connect to WebSocket
   */
  connect(ws: WebSocket): void {
    this.ws = ws;

    // Subscribe to state updates from server
    if (ws.readyState === WebSocket.OPEN) {
      this.subscribe();
    } else {
      ws.addEventListener('open', () => this.subscribe());
    }
  }

  /**
   * Subscribe to server state
   */
  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'state:subscribe',
      key: this.key
    }));

    this.connected = true;
  }

  /**
   * Unsubscribe from server state
   */
  unsubscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'state:unsubscribe',
      key: this.key
    }));

    this.connected = false;
  }

  /**
   * Handle message from server
   */
  handleMessage(msg: StateMessage): void {
    if (msg.key !== this.key) return;

    if (msg.type === 'state:init' || msg.type === 'state:update') {
      const oldValue = this._value;
      this._value = msg.value;

      // Notify callbacks
      this.callbacks.forEach(callback => {
        callback(this._value!, oldValue!);
      });
    }
  }

  /**
   * Send value to server
   */
  private sendToServer(value: T | undefined): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.connected) return;

    this.ws.send(JSON.stringify({
      type: 'state:change',
      key: this.key,
      value
    }));
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.unsubscribe();
    this.ws = null;
    this.callbacks.clear();
  }
}

/**
 * Client State Manager
 */
class ClientStateManager {
  private states = new Map<string, ClientState<any>>();
  private ws: WebSocket | null = null;

  /**
   * Initialize with WebSocket connection
   */
  init(wsUrl?: string): void {
    const url = wsUrl || `ws://${location.host}`;
    this.ws = new WebSocket(url);

    this.ws.addEventListener('open', () => {
      console.log('[State] Connected to server');
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data) as StateMessage;

        // Route message to appropriate state
        if (msg.type.startsWith('state:')) {
          const state = this.states.get(msg.key);
          if (state) {
            state.handleMessage(msg);
          }
        }
      } catch (error) {
        // Ignore parse errors
      }
    });

    this.ws.addEventListener('close', () => {
      console.log('[State] Disconnected from server');
    });

    this.ws.addEventListener('error', (error) => {
      console.error('[State] WebSocket error:', error);
    });

    // Connect existing states
    this.states.forEach(state => {
      state.connect(this.ws!);
    });
  }

  /**
   * Create a shared state
   */
  create<T>(key: string, defaultValue?: T): ClientState<T> {
    if (this.states.has(key)) {
      return this.states.get(key) as ClientState<T>;
    }

    const state = new ClientState<T>(key, defaultValue);
    this.states.set(key, state);

    // Connect to WebSocket if available
    if (this.ws) {
      state.connect(this.ws);
    }

    return state;
  }

  /**
   * Get existing state
   */
  get<T>(key: string): ClientState<T> | undefined {
    return this.states.get(key) as ClientState<T>;
  }

  /**
   * Delete a state
   */
  delete(key: string): boolean {
    const state = this.states.get(key);
    if (state) {
      state.disconnect();
      return this.states.delete(key);
    }
    return false;
  }

  /**
   * Get WebSocket connection
   */
  getWebSocket(): WebSocket | null {
    return this.ws;
  }

  /**
   * Disconnect all
   */
  disconnect(): void {
    this.states.forEach(state => state.disconnect());
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const stateManager = new ClientStateManager();

// Auto-initialize when in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      stateManager.init();
    });
  } else {
    stateManager.init();
  }
}
