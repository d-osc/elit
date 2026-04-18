// src/shares/runtime.ts
var runtime = (() => {
  if (typeof Deno !== "undefined") return "deno";
  if (typeof Bun !== "undefined") return "bun";
  return "node";
})();

// src/server/server/state.ts
var SharedState = class {
  constructor(key, options) {
    this.key = key;
    this.listeners = /* @__PURE__ */ new Set();
    this.changeHandlers = /* @__PURE__ */ new Set();
    this.options = options;
    this._value = options.initial;
  }
  get value() {
    return this._value;
  }
  set value(newValue) {
    if (this.options.validate && !this.options.validate(newValue)) {
      throw new Error(`Invalid state value for "${this.key}"`);
    }
    const oldValue = this._value;
    this._value = newValue;
    this.changeHandlers.forEach((handler) => {
      handler(newValue, oldValue);
    });
    this.broadcast();
  }
  update(updater) {
    this.value = updater(this._value);
  }
  subscribe(ws) {
    this.listeners.add(ws);
    this.sendTo(ws);
  }
  unsubscribe(ws) {
    this.listeners.delete(ws);
  }
  onChange(handler) {
    this.changeHandlers.add(handler);
    return () => this.changeHandlers.delete(handler);
  }
  broadcast() {
    const message = JSON.stringify({ type: "state:update", key: this.key, value: this._value, timestamp: Date.now() });
    this.listeners.forEach((ws) => ws.readyState === 1 /* OPEN */ && ws.send(message));
  }
  sendTo(ws) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify({ type: "state:init", key: this.key, value: this._value, timestamp: Date.now() }));
    }
  }
  get subscriberCount() {
    return this.listeners.size;
  }
  clear() {
    this.listeners.clear();
    this.changeHandlers.clear();
  }
};
var StateManager = class {
  constructor() {
    this.states = /* @__PURE__ */ new Map();
  }
  create(key, options) {
    if (this.states.has(key)) {
      return this.states.get(key);
    }
    const state = new SharedState(key, options);
    this.states.set(key, state);
    return state;
  }
  get(key) {
    return this.states.get(key);
  }
  has(key) {
    return this.states.has(key);
  }
  delete(key) {
    const state = this.states.get(key);
    if (state) {
      state.clear();
      return this.states.delete(key);
    }
    return false;
  }
  subscribe(key, ws) {
    this.states.get(key)?.subscribe(ws);
  }
  unsubscribe(key, ws) {
    this.states.get(key)?.unsubscribe(ws);
  }
  unsubscribeAll(ws) {
    this.states.forEach((state) => state.unsubscribe(ws));
  }
  handleStateChange(key, value) {
    const state = this.states.get(key);
    if (state) {
      state.value = value;
    }
  }
  keys() {
    return Array.from(this.states.keys());
  }
  clear() {
    this.states.forEach((state) => state.clear());
    this.states.clear();
  }
};
export {
  SharedState,
  StateManager
};
