// src/client/hmr/utils.ts
function isBrowserRuntime() {
  return typeof window !== "undefined";
}
function getHmrSkipReason(targetWindow) {
  if (targetWindow.location.protocol === "file:") {
    return "file";
  }
  if (targetWindow.__ELIT_MODE__ === "preview") {
    return "preview";
  }
  return null;
}
function createHmrWebSocketUrl(targetWindow) {
  const protocol = targetWindow.location.protocol === "https:" ? "wss:" : "ws:";
  const host = targetWindow.location.hostname;
  const port = targetWindow.location.port || "3000";
  return `${protocol}//${host}:${port}`;
}

// src/client/hmr/client.ts
var ElitHMR = class {
  constructor(targetWindow = isBrowserRuntime() ? window : void 0) {
    this.enabled = false;
    this.ws = null;
    this.acceptCallbacks = [];
    this.disposeCallbacks = [];
    this.declined = false;
    this.targetWindow = targetWindow;
    if (!this.targetWindow) {
      return;
    }
    const skipReason = getHmrSkipReason(this.targetWindow);
    if (skipReason === "file") {
      console.log("[Elit HMR] Disabled for file:// protocol");
      return;
    }
    if (skipReason === "preview") {
      return;
    }
    this.connect();
  }
  connect() {
    if (!this.targetWindow) {
      return;
    }
    this.ws = new WebSocket(createHmrWebSocketUrl(this.targetWindow));
    this.ws.onopen = () => {
      this.enabled = true;
      console.log("[Elit HMR] Connected \u2713");
    };
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        this.handleMessage(data);
      } catch (error) {
        console.error("[Elit HMR] Error parsing message:", error);
      }
    };
    this.ws.onclose = () => {
      this.enabled = false;
      console.log("[Elit HMR] Disconnected - HMR disabled until manual refresh");
    };
    this.ws.onerror = (error) => {
      console.error("[Elit HMR] WebSocket error:", error);
    };
  }
  handleMessage(data) {
    switch (data.type) {
      case "connected":
        console.log("[Elit HMR] Ready");
        break;
      case "update":
        console.log(`[Elit HMR] Update detected: ${data.path}`);
        if (this.declined) {
          this.reload();
          return;
        }
        this.disposeCallbacks.forEach((callback) => callback());
        this.disposeCallbacks = [];
        if (this.acceptCallbacks.length > 0) {
          this.acceptCallbacks.forEach((callback) => callback());
          console.log("[Elit HMR] Update accepted via callback");
        } else {
          console.log("[Elit HMR] Update detected - manually refresh to see changes");
        }
        break;
      case "reload":
        console.log("[Elit HMR] Full reload requested - manually refresh to see changes");
        break;
      case "error":
        console.error("[Elit HMR] Server error:", data.error);
        break;
    }
  }
  reload() {
    this.targetWindow?.location.reload();
  }
  accept(callback) {
    if (callback) {
      this.acceptCallbacks.push(callback);
    }
    this.declined = false;
  }
  decline() {
    this.declined = true;
  }
  dispose(callback) {
    this.disposeCallbacks.push(callback);
  }
};

// src/client/hmr/index.ts
var hmr = new ElitHMR();
if (isBrowserRuntime()) {
  window.__ELIT_HMR__ = hmr;
}
var index_default = hmr;
export {
  index_default as default
};
