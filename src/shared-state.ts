/**
 * Shared State for Elit
 * Integrates with @elit/server for real-time state synchronization
 */

import type { State } from './types';
import { createState } from './state';

type StateChangeCallback<T = any> = (value: T, oldValue: T) => void;

interface StateMessage {
  type: 'state:init' | 'state:update' | 'state:subscribe' | 'state:unsubscribe' | 'state:change';
  key: string;
  value?: any;
  timestamp?: number;
}

/**
 * Shared State - syncs with @elit/server
 */
export class SharedState<T = any> {
  private localState: State<T>;
  private ws: WebSocket | null = null;
  private pendingUpdates: T[] = [];
  private previousValue: T;

  constructor(
    public readonly key: string,
    defaultValue: T,
    private wsUrl?: string
  ) {
    this.localState = createState(defaultValue);
    this.previousValue = defaultValue;
    this.connect();
  }

  /**
   * Get current value
   */
  get value(): T {
    return this.localState.value;
  }

  /**
   * Set new value and sync to server
   */
  set value(newValue: T) {
    this.previousValue = this.localState.value;
    this.localState.value = newValue;
    this.sendToServer(newValue);
  }

  /**
   * Get the underlying Elit State (for reactive binding)
   */
  get state(): State<T> {
    return this.localState;
  }

  /**
   * Subscribe to changes (returns Elit State for reactive)
   */
  onChange(callback: StateChangeCallback<T>): () => void {
    return this.localState.subscribe((newValue) => {
      const oldValue = this.previousValue;
      this.previousValue = newValue;
      callback(newValue, oldValue);
    });
  }

  /**
   * Update value using a function
   */
  update(updater: (current: T) => T): void {
    this.value = updater(this.value);
  }

  /**
   * Connect to WebSocket
   */
  private connect(): void {
    if (typeof window === 'undefined') return;

    const url = this.wsUrl || `ws://${location.host}`;
    this.ws = new WebSocket(url);

    this.ws.addEventListener('open', () => {
      this.subscribe();

      // Send pending updates
      while (this.pendingUpdates.length > 0) {
        const value = this.pendingUpdates.shift();
        this.sendToServer(value!);
      }
    });

    this.ws.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    this.ws.addEventListener('close', () => {
      // Reconnect after delay
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.addEventListener('error', (error) => {
      console.error('[SharedState] WebSocket error:', error);
    });
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
  }

  /**
   * Handle message from server
   */
  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data) as StateMessage;

      if (msg.key !== this.key) return;

      if (msg.type === 'state:init' || msg.type === 'state:update') {
        // Update local state without sending back to server
        this.localState.value = msg.value;
      }
    } catch (error) {
      // Ignore parse errors (could be HMR messages)
    }
  }

  /**
   * Send value to server
   */
  private sendToServer(value: T): void {
    if (!this.ws) return;

    if (this.ws.readyState !== WebSocket.OPEN) {
      // Queue update for when connection is ready
      this.pendingUpdates.push(value);
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'state:change',
      key: this.key,
      value
    }));
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Destroy state and cleanup
   */
  destroy(): void {
    this.disconnect();
    this.localState.destroy();
  }
}

/**
 * Create a shared state that syncs with @elit/server
 */
export function createSharedState<T>(
  key: string,
  defaultValue: T,
  wsUrl?: string
): SharedState<T> {
  return new SharedState(key, defaultValue, wsUrl);
}

/**
 * Shared State Manager for managing multiple shared states
 */
class SharedStateManager {
  private states = new Map<string, SharedState<any>>();

  /**
   * Create or get a shared state
   */
  create<T>(key: string, defaultValue: T, wsUrl?: string): SharedState<T> {
    if (this.states.has(key)) {
      return this.states.get(key) as SharedState<T>;
    }

    const state = new SharedState<T>(key, defaultValue, wsUrl);
    this.states.set(key, state);
    return state;
  }

  /**
   * Get existing state
   */
  get<T>(key: string): SharedState<T> | undefined {
    return this.states.get(key) as SharedState<T>;
  }

  /**
   * Delete a state
   */
  delete(key: string): boolean {
    const state = this.states.get(key);
    if (state) {
      state.destroy();
      return this.states.delete(key);
    }
    return false;
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.forEach(state => state.destroy());
    this.states.clear();
  }
}

// Export singleton instance
export const sharedStateManager = new SharedStateManager();
