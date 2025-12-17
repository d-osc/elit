/**
 * Shared State Management for Backend-Frontend Communication
 */

import { WebSocket } from 'ws';

export type StateChangeHandler<T = any> = (value: T, oldValue: T) => void;

export interface SharedStateOptions<T = any> {
  /** Initial state value */
  initial: T;
  /** Persist state to storage */
  persist?: boolean;
  /** Validate state changes */
  validate?: (value: T) => boolean;
}

/**
 * Server-side shared state
 */
export class SharedState<T = any> {
  private _value: T;
  private listeners = new Set<WebSocket>();
  private changeHandlers = new Set<StateChangeHandler<T>>();
  private options: SharedStateOptions<T>;

  constructor(
    public readonly key: string,
    options: SharedStateOptions<T>
  ) {
    this.options = options;
    this._value = options.initial;
  }

  /**
   * Get current value
   */
  get value(): T {
    return this._value;
  }

  /**
   * Set new value and broadcast to clients
   */
  set value(newValue: T) {
    // Validate if validator is provided
    if (this.options.validate && !this.options.validate(newValue)) {
      throw new Error(`Invalid state value for "${this.key}"`);
    }

    const oldValue = this._value;
    this._value = newValue;

    // Notify change handlers
    this.changeHandlers.forEach(handler => {
      handler(newValue, oldValue);
    });

    // Broadcast to all connected clients
    this.broadcast();
  }

  /**
   * Update state using a function
   */
  update(updater: (current: T) => T): void {
    this.value = updater(this._value);
  }

  /**
   * Subscribe a WebSocket client
   */
  subscribe(ws: WebSocket): void {
    this.listeners.add(ws);

    // Send initial value
    this.sendTo(ws);
  }

  /**
   * Unsubscribe a WebSocket client
   */
  unsubscribe(ws: WebSocket): void {
    this.listeners.delete(ws);
  }

  /**
   * Add change handler
   */
  onChange(handler: StateChangeHandler<T>): () => void {
    this.changeHandlers.add(handler);
    return () => this.changeHandlers.delete(handler);
  }

  /**
   * Broadcast current value to all clients
   */
  private broadcast(): void {
    const message = JSON.stringify({
      type: 'state:update',
      key: this.key,
      value: this._value,
      timestamp: Date.now()
    });

    this.listeners.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Send current value to specific client
   */
  private sendTo(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'state:init',
        key: this.key,
        value: this._value,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Get number of subscribed clients
   */
  get subscriberCount(): number {
    return this.listeners.size;
  }

  /**
   * Clear all subscribers
   */
  clear(): void {
    this.listeners.clear();
    this.changeHandlers.clear();
  }
}

/**
 * State Manager - manages multiple shared states
 */
export class StateManager {
  private states = new Map<string, SharedState<any>>();

  /**
   * Create or get a shared state
   */
  create<T>(key: string, options: SharedStateOptions<T>): SharedState<T> {
    if (this.states.has(key)) {
      return this.states.get(key) as SharedState<T>;
    }

    const state = new SharedState<T>(key, options);
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
   * Check if state exists
   */
  has(key: string): boolean {
    return this.states.has(key);
  }

  /**
   * Delete a state
   */
  delete(key: string): boolean {
    const state = this.states.get(key);
    if (state) {
      state.clear();
      return this.states.delete(key);
    }
    return false;
  }

  /**
   * Subscribe WebSocket to a state
   */
  subscribe(key: string, ws: WebSocket): void {
    const state = this.states.get(key);
    if (state) {
      state.subscribe(ws);
    }
  }

  /**
   * Unsubscribe WebSocket from a state
   */
  unsubscribe(key: string, ws: WebSocket): void {
    const state = this.states.get(key);
    if (state) {
      state.unsubscribe(ws);
    }
  }

  /**
   * Unsubscribe WebSocket from all states
   */
  unsubscribeAll(ws: WebSocket): void {
    this.states.forEach(state => {
      state.unsubscribe(ws);
    });
  }

  /**
   * Handle state change request from client
   */
  handleStateChange(key: string, value: any): void {
    const state = this.states.get(key);
    if (state) {
      state.value = value;
    }
  }

  /**
   * Get all state keys
   */
  keys(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.forEach(state => state.clear());
    this.states.clear();
  }
}
