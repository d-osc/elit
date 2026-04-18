var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/server/ws/constants.ts
var ReadyState = /* @__PURE__ */ ((ReadyState2) => {
  ReadyState2[ReadyState2["CONNECTING"] = 0] = "CONNECTING";
  ReadyState2[ReadyState2["OPEN"] = 1] = "OPEN";
  ReadyState2[ReadyState2["CLOSING"] = 2] = "CLOSING";
  ReadyState2[ReadyState2["CLOSED"] = 3] = "CLOSED";
  return ReadyState2;
})(ReadyState || {});
var CLOSE_CODES = {
  NORMAL: 1e3,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  EXTENSION_REQUIRED: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE_FAIL: 1015
};

// src/server/ws/server.ts
import { EventEmitter as EventEmitter2 } from "events";

// src/shares/runtime.ts
var runtime = (() => {
  if (typeof Deno !== "undefined") return "deno";
  if (typeof Bun !== "undefined") return "bun";
  return "node";
})();

// src/server/ws/utils.ts
function queueCallback(callback, error) {
  if (callback) {
    queueMicrotask(() => callback(error));
  }
}
function createNativeWebSocket(url, protocols) {
  if (runtime === "node" && typeof globalThis.WebSocket === "undefined") {
    throw new Error("WebSocket is not available. Please use Node.js 18+ or install ws package.");
  }
  return new globalThis.WebSocket(url, protocols);
}
function getRequestPath(url) {
  const [pathname = "/"] = (url || "/").split("?");
  return pathname || "/";
}
function isIgnorableConnectionError(error) {
  const errorCode = error?.code;
  return errorCode === "ECONNABORTED" || errorCode === "ECONNRESET" || errorCode === "EPIPE";
}
function coerceBunMessage(message) {
  const isBinary = typeof message !== "string";
  const payload = typeof message === "string" ? message : message instanceof ArrayBuffer ? Buffer.from(message) : ArrayBuffer.isView(message) ? Buffer.from(message.buffer, message.byteOffset, message.byteLength) : Buffer.from(String(message));
  return { payload, isBinary };
}
function parseFrame(data) {
  if (data.length < 2) {
    return null;
  }
  const firstByte = data[0];
  const secondByte = data[1];
  const opcode = firstByte & 15;
  const isMasked = (secondByte & 128) === 128;
  let payloadLength = secondByte & 127;
  let offset = 2;
  if (payloadLength === 126) {
    payloadLength = data.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    payloadLength = Number(data.readBigUInt64BE(2));
    offset = 10;
  }
  let payload = data.subarray(offset);
  if (isMasked) {
    const maskKey = data.subarray(offset, offset + 4);
    payload = data.subarray(offset + 4, offset + 4 + payloadLength);
    for (let index = 0; index < payload.length; index += 1) {
      payload[index] ^= maskKey[index % 4];
    }
  }
  if (opcode === 1) {
    return payload.toString("utf8");
  }
  return null;
}
function createFrame(data) {
  const payload = typeof data === "string" ? Buffer.from(data) : data;
  const payloadLength = Buffer.isBuffer(payload) ? payload.length : 0;
  let frame;
  let offset = 2;
  if (payloadLength < 126) {
    frame = Buffer.allocUnsafe(2 + payloadLength);
    frame[1] = payloadLength;
  } else if (payloadLength < 65536) {
    frame = Buffer.allocUnsafe(4 + payloadLength);
    frame[1] = 126;
    frame.writeUInt16BE(payloadLength, 2);
    offset = 4;
  } else {
    frame = Buffer.allocUnsafe(10 + payloadLength);
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(payloadLength), 2);
    offset = 10;
  }
  frame[0] = 129;
  if (Buffer.isBuffer(payload)) {
    payload.copy(frame, offset);
  }
  return frame;
}

// src/server/ws/websocket.ts
import { EventEmitter } from "events";
var WebSocket = class extends EventEmitter {
  constructor(address, protocols, _options) {
    super();
    this.readyState = 0 /* CONNECTING */;
    this.protocol = "";
    this.extensions = "";
    this.binaryType = "nodebuffer";
    this.url = typeof address === "string" ? address : address.toString();
    const protocolsArray = Array.isArray(protocols) ? protocols : protocols ? [protocols] : void 0;
    this._socket = createNativeWebSocket(this.url, protocolsArray);
    this._setupNativeSocket();
  }
  _setupNativeSocket() {
    this._socket.onopen = () => {
      this.readyState = 1 /* OPEN */;
      this.emit("open");
    };
    this._socket.onmessage = (event) => {
      const isBinary = event.data instanceof ArrayBuffer || event.data instanceof Blob;
      this.emit("message", event.data, isBinary);
    };
    this._socket.onclose = (event) => {
      this.readyState = 3 /* CLOSED */;
      this.emit("close", event.code, event.reason);
    };
    this._socket.onerror = () => {
      this.emit("error", new Error("WebSocket error"));
    };
  }
  /**
   * Send data through WebSocket.
   */
  send(data, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    if (this.readyState !== 1 /* OPEN */) {
      queueCallback(cb, new Error("WebSocket is not open"));
      return;
    }
    try {
      this._socket.send(data);
      queueCallback(cb);
    } catch (error) {
      queueCallback(cb, error);
    }
  }
  /**
   * Close the WebSocket connection.
   */
  close(code, reason) {
    if (this.readyState === 3 /* CLOSED */ || this.readyState === 2 /* CLOSING */) {
      return;
    }
    this.readyState = 2 /* CLOSING */;
    this._socket.close(code, typeof reason === "string" ? reason : reason?.toString());
  }
  /**
   * Pause the socket (no-op for native WebSocket).
   */
  pause() {
  }
  /**
   * Resume the socket (no-op for native WebSocket).
   */
  resume() {
  }
  /**
   * Send a ping frame (no-op for native WebSocket).
   */
  ping(_data, _mask, callback) {
    queueCallback(callback);
  }
  /**
   * Send a pong frame (no-op for native WebSocket).
   */
  pong(_data, _mask, callback) {
    queueCallback(callback);
  }
  /**
   * Terminate the connection.
   */
  terminate() {
    this._socket.close();
    this.readyState = 3 /* CLOSED */;
  }
  /**
   * Get buffered amount.
   */
  get bufferedAmount() {
    return this._socket.bufferedAmount || 0;
  }
};

// src/server/ws/server.ts
var WebSocketServer = class extends EventEmitter2 {
  constructor(options, callback) {
    super();
    this.clients = /* @__PURE__ */ new Set();
    this._ownsHttpServer = false;
    this.options = options || {};
    this.path = options?.path;
    if (runtime === "node") {
      if (options?.server) {
        this._httpServer = options.server;
        this._setupUpgradeHandler();
      } else if (!options?.noServer) {
        const http = __require("http");
        this._httpServer = http.createServer();
        this._ownsHttpServer = true;
        this._setupUpgradeHandler();
        if (options?.port) {
          this._httpServer.listen(options.port, options.host, callback);
        }
      }
    } else if (runtime === "bun") {
      if (options?.server?.registerWebSocketServer) {
        this._httpServer = options.server;
        options.server.registerWebSocketServer(this);
      }
      queueCallback(callback);
    } else {
      queueCallback(callback);
    }
  }
  _setupUpgradeHandler() {
    this._httpServer.on("upgrade", (request, socket, head) => {
      const requestPath = getRequestPath(request.url);
      console.log("[WebSocket] Upgrade request:", requestPath, "Expected:", this.path || "(any)");
      if (this.path && requestPath !== this.path) {
        console.log("[WebSocket] Path mismatch, ignoring");
        return;
      }
      this.handleUpgrade(request, socket, head, (client) => {
        console.log("[WebSocket] Client connected");
        this.emit("connection", client, request);
      });
    });
  }
  /**
   * Handle HTTP upgrade for WebSocket.
   */
  handleUpgrade(request, socket, _head, callback) {
    const key = request.headers["sec-websocket-key"];
    if (!key) {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }
    const crypto = __require("crypto");
    const acceptKey = crypto.createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    const headers = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "",
      ""
    ];
    socket.write(headers.join("\r\n"));
    const client = this._createClientFromSocket(socket);
    if (this.options.clientTracking !== false) {
      this.clients.add(client);
      client.on("close", () => {
        this.clients.delete(client);
      });
    }
    callback(client);
  }
  _createClientFromSocket(socket) {
    const client = Object.create(WebSocket.prototype);
    EventEmitter2.call(client);
    client.readyState = 1 /* OPEN */;
    client.url = "ws://localhost";
    client.protocol = "";
    client.extensions = "";
    client.binaryType = "nodebuffer";
    client._socket = socket;
    socket.on("data", (data) => {
      try {
        const message = parseFrame(data);
        if (message) {
          client.emit("message", message, false);
        }
      } catch (error) {
        client.emit("error", error);
      }
    });
    socket.on("end", () => {
      client.readyState = 3 /* CLOSED */;
      client.emit("close", CLOSE_CODES.NORMAL, "");
    });
    socket.on("error", (error) => {
      if (isIgnorableConnectionError(error)) {
        return;
      }
      client.emit("error", error);
    });
    client.send = (data, _options, callback) => {
      if (!socket.writable || client.readyState !== 1 /* OPEN */) {
        const error = new Error("WebSocket is not open");
        error.code = "WS_NOT_OPEN";
        queueCallback(callback, error);
        return;
      }
      try {
        const frame = createFrame(data);
        socket.write(frame, (error) => {
          if (!error) {
            queueCallback(callback);
            return;
          }
          if (isIgnorableConnectionError(error)) {
            client.readyState = 3 /* CLOSED */;
            queueCallback(callback);
            return;
          }
          queueCallback(callback, error);
        });
      } catch (error) {
        queueCallback(callback, error);
      }
    };
    client.close = (_code, _reason) => {
      socket.end();
      client.readyState = 3 /* CLOSED */;
    };
    return client;
  }
  _createClientFromBunSocket(socket) {
    const client = Object.create(WebSocket.prototype);
    EventEmitter2.call(client);
    client.readyState = 1 /* OPEN */;
    client.url = "ws://localhost";
    client.protocol = "";
    client.extensions = "";
    client.binaryType = "nodebuffer";
    client._socket = socket;
    client.send = (data, _options, callback) => {
      if (client.readyState !== 1 /* OPEN */) {
        queueCallback(callback, new Error("WebSocket is not open"));
        return;
      }
      try {
        socket.send(data);
        queueCallback(callback);
      } catch (error) {
        queueCallback(callback, error);
      }
    };
    client.close = (code, reason) => {
      if (client.readyState === 3 /* CLOSED */) {
        return;
      }
      client.readyState = 2 /* CLOSING */;
      socket.close(code ?? CLOSE_CODES.NORMAL, typeof reason === "string" ? reason : reason?.toString());
    };
    client.terminate = () => {
      socket.close();
      client.readyState = 3 /* CLOSED */;
    };
    return client;
  }
  _handleBunOpen(socket, request = {}) {
    const client = this._createClientFromBunSocket(socket);
    if (socket.data) {
      socket.data.client = client;
    }
    if (this.options.clientTracking !== false) {
      this.clients.add(client);
      client.on("close", () => {
        this.clients.delete(client);
      });
    }
    const incomingRequest = {
      url: request.url || this.path,
      headers: request.headers || {},
      socket: request.socket || { remoteAddress: void 0 }
    };
    this.emit("connection", client, incomingRequest);
  }
  _handleBunMessage(socket, message) {
    const client = socket.data?.client;
    if (!client) {
      return;
    }
    const { payload, isBinary } = coerceBunMessage(message);
    client.emit("message", payload, isBinary);
  }
  _handleBunClose(socket, code, reason) {
    const client = socket.data?.client;
    if (!client) {
      return;
    }
    client.readyState = 3 /* CLOSED */;
    client.emit("close", code, typeof reason === "string" ? reason : reason?.toString() || "");
    this.clients.delete(client);
  }
  /**
   * Close the server.
   */
  close(callback) {
    this.clients.forEach((client) => client.close());
    this.clients.clear();
    if (this._httpServer && this._ownsHttpServer) {
      this._httpServer.close(callback);
      return;
    }
    if (runtime === "bun" && this._httpServer?.unregisterWebSocketServer) {
      this._httpServer.unregisterWebSocketServer(this);
    }
    this.emit("close");
    queueCallback(callback);
  }
  /**
   * Check if server should handle request.
   */
  shouldHandle(request) {
    if (this.path && getRequestPath(request.url) !== this.path) {
      return false;
    }
    return true;
  }
  /**
   * Get server address.
   */
  address() {
    if (this._httpServer?.address) {
      return this._httpServer.address();
    }
    return null;
  }
};
function createWebSocketServer(options, callback) {
  return new WebSocketServer(options, callback);
}

// src/server/ws/runtime.ts
function getRuntime() {
  return runtime;
}

// src/server/ws/ws.ts
var ws_default = {
  WebSocket,
  WebSocketServer,
  createWebSocketServer,
  ReadyState,
  CLOSE_CODES,
  getRuntime
};
export {
  CLOSE_CODES,
  ReadyState,
  WebSocket,
  WebSocketServer,
  createWebSocketServer,
  ws_default as default,
  getRuntime
};
