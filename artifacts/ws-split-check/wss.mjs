var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/http/utils.ts
function queueCallback(callback) {
  if (callback) queueMicrotask(callback);
}
function getRequestPath(url) {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}
function headersToRecord(headers) {
  const result = /* @__PURE__ */ Object.create(null);
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
function headersToRawHeaders(headers) {
  const rawHeaders = [];
  headers.forEach((value, key) => {
    rawHeaders.push(key, value);
  });
  return rawHeaders;
}
function normalizeRequestBodyChunk(chunk, encoding = "utf8") {
  if (typeof chunk === "string") {
    if (encoding !== "utf8" && typeof Buffer !== "undefined") {
      return Buffer.from(chunk, encoding);
    }
    return chunk;
  }
  if (chunk instanceof Uint8Array) {
    return chunk;
  }
  if (chunk instanceof ArrayBuffer) {
    return new Uint8Array(chunk);
  }
  if (ArrayBuffer.isView(chunk)) {
    return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }
  return new TextEncoder().encode(String(chunk));
}
function buildRequestBody(chunks) {
  if (chunks.length === 0) {
    return void 0;
  }
  if (chunks.length === 1) {
    return chunks[0];
  }
  if (chunks.every((chunk) => typeof chunk === "string")) {
    return chunks.join("");
  }
  const encoder = new TextEncoder();
  const bodyParts = chunks.map((chunk) => typeof chunk === "string" ? encoder.encode(chunk) : chunk);
  const totalLength = bodyParts.reduce((sum, part) => sum + part.byteLength, 0);
  const body = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of bodyParts) {
    body.set(part, offset);
    offset += part.byteLength;
  }
  return body;
}
function isFetchResponse(value) {
  return typeof value?.status === "number" && typeof value?.statusText === "string" && typeof value?.headers?.forEach === "function";
}
function isNodeIncomingMessage(value) {
  return typeof value?.on === "function" && typeof value?.headers === "object" && (typeof value?.httpVersion === "string" || value?.socket !== void 0);
}
function headersToInit(headers) {
  const result = {};
  for (const key in headers) {
    const value = headers[key];
    result[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  return result;
}
function createAddress(port, address, family = "IPv4") {
  return { port, family, address };
}
function createErrorResponse() {
  return new Response("Internal Server Error", { status: 500 });
}
function emitListeningWithCallback(server, callback) {
  server._listening = true;
  server.emit("listening");
  queueCallback(callback);
}
function closeAndEmit(server, callback) {
  server._listening = false;
  server.emit("close");
  if (callback) queueMicrotask(() => callback());
}
var init_utils = __esm({
  "src/server/http/utils.ts"() {
    "use strict";
  }
});

// src/shares/runtime.ts
var runtime, isNode, isBun, isDeno;
var init_runtime = __esm({
  "src/shares/runtime.ts"() {
    "use strict";
    runtime = (() => {
      if (typeof Deno !== "undefined") return "deno";
      if (typeof Bun !== "undefined") return "bun";
      return "node";
    })();
    isNode = runtime === "node";
    isBun = runtime === "bun";
    isDeno = runtime === "deno";
  }
});

// src/server/http/agent.ts
var Agent;
var init_agent = __esm({
  "src/server/http/agent.ts"() {
    "use strict";
    Agent = class {
      constructor(options) {
        this.options = options;
      }
    };
  }
});

// src/server/http/client-request.ts
import { EventEmitter as EventEmitter2 } from "events";
var ClientRequest;
var init_client_request = __esm({
  "src/server/http/client-request.ts"() {
    "use strict";
    init_utils();
    ClientRequest = class extends EventEmitter2 {
      constructor(_url, _options = {}) {
        super();
        this._bodyChunks = [];
        this._ended = false;
      }
      _setNativeRequest(nativeRequest) {
        this._nativeRequest = nativeRequest;
      }
      _setExecutor(executor) {
        this._executor = executor;
      }
      write(chunk, encoding, callback) {
        if (this._ended) {
          throw new Error("Cannot write after end");
        }
        if (typeof encoding === "function") {
          callback = encoding;
          encoding = void 0;
        }
        if (this._nativeRequest) {
          const actualEncoding2 = typeof encoding === "string" ? encoding : void 0;
          return this._nativeRequest.write(chunk, actualEncoding2, callback);
        }
        const actualEncoding = typeof encoding === "string" ? encoding : "utf8";
        this._bodyChunks.push(normalizeRequestBodyChunk(chunk, actualEncoding));
        queueCallback(callback);
        return true;
      }
      end(chunk, encoding, callback) {
        if (typeof chunk === "function") {
          callback = chunk;
          chunk = void 0;
          encoding = void 0;
        } else if (typeof encoding === "function") {
          callback = encoding;
          encoding = void 0;
        }
        if (this._ended) {
          queueCallback(callback);
          return;
        }
        this._ended = true;
        if (this._nativeRequest) {
          const actualEncoding = typeof encoding === "string" ? encoding : void 0;
          if (chunk !== void 0) {
            this._nativeRequest.end(chunk, actualEncoding, callback);
          } else {
            this._nativeRequest.end(callback);
          }
          return;
        }
        if (chunk !== void 0) {
          this._bodyChunks.push(normalizeRequestBodyChunk(chunk, typeof encoding === "string" ? encoding : "utf8"));
        }
        const executor = this._executor;
        const body = buildRequestBody(this._bodyChunks);
        if (executor) {
          Promise.resolve().then(() => executor(body)).catch((error) => this.emit("error", error));
        }
        queueCallback(callback);
      }
    };
  }
});

// src/server/http/constants.ts
var METHODS, STATUS_CODES;
var init_constants = __esm({
  "src/server/http/constants.ts"() {
    "use strict";
    METHODS = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
      "CONNECT",
      "TRACE"
    ];
    STATUS_CODES = {
      100: "Continue",
      101: "Switching Protocols",
      102: "Processing",
      200: "OK",
      201: "Created",
      202: "Accepted",
      203: "Non-Authoritative Information",
      204: "No Content",
      205: "Reset Content",
      206: "Partial Content",
      300: "Multiple Choices",
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      304: "Not Modified",
      307: "Temporary Redirect",
      308: "Permanent Redirect",
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      406: "Not Acceptable",
      407: "Proxy Authentication Required",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      411: "Length Required",
      412: "Precondition Failed",
      413: "Payload Too Large",
      414: "URI Too Long",
      415: "Unsupported Media Type",
      416: "Range Not Satisfiable",
      417: "Expectation Failed",
      418: "I'm a teapot",
      422: "Unprocessable Entity",
      425: "Too Early",
      426: "Upgrade Required",
      428: "Precondition Required",
      429: "Too Many Requests",
      431: "Request Header Fields Too Large",
      451: "Unavailable For Legal Reasons",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported",
      506: "Variant Also Negotiates",
      507: "Insufficient Storage",
      508: "Loop Detected",
      510: "Not Extended",
      511: "Network Authentication Required"
    };
  }
});

// src/server/http/incoming-message.ts
import { EventEmitter as EventEmitter3 } from "events";
var IncomingMessage;
var init_incoming_message = __esm({
  "src/server/http/incoming-message.ts"() {
    "use strict";
    init_utils();
    IncomingMessage = class extends EventEmitter3 {
      constructor(req, requestMethod) {
        super();
        this.httpVersion = "1.1";
        this.rawHeaders = [];
        this._req = req;
        if (isFetchResponse(req)) {
          this.method = requestMethod || "GET";
          this.url = getRequestPath(req.url);
          this.headers = headersToRecord(req.headers);
          this.statusCode = req.status;
          this.statusMessage = req.statusText;
          this.rawHeaders = headersToRawHeaders(req.headers);
        } else if (isNodeIncomingMessage(req)) {
          this.method = req.method;
          this.url = req.url;
          this.headers = req.headers;
          this.statusCode = req.statusCode;
          this.statusMessage = req.statusMessage;
          this.httpVersion = req.httpVersion;
          this.rawHeaders = req.rawHeaders;
          this.socket = req.socket;
        } else {
          this.method = req.method;
          this.url = getRequestPath(req.url);
          this.headers = headersToRecord(req.headers);
          this.rawHeaders = headersToRawHeaders(req.headers);
        }
      }
      async text() {
        if (isNodeIncomingMessage(this._req)) {
          return new Promise((resolve, reject) => {
            const chunks = [];
            this._req.on("data", (chunk) => chunks.push(chunk));
            this._req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            this._req.on("error", reject);
          });
        }
        return this._req.text();
      }
      async json() {
        if (isNodeIncomingMessage(this._req)) {
          const text = await this.text();
          return JSON.parse(text);
        }
        return this._req.json();
      }
    };
  }
});

// src/server/http/node-modules.ts
var http, https;
var init_node_modules = __esm({
  "src/server/http/node-modules.ts"() {
    "use strict";
    init_runtime();
    if (isNode && typeof process !== "undefined") {
      try {
        http = __require("http");
        https = __require("https");
      } catch {
        http = __require("http");
        https = __require("https");
      }
    }
  }
});

// src/server/http/request-api.ts
function request(url, options, callback) {
  const urlString = typeof url === "string" ? url : url.toString();
  const req = new ClientRequest(urlString, options);
  if (isNode) {
    const urlObj = new URL(urlString);
    const client = urlObj.protocol === "https:" ? https : http;
    const nodeReq = client.request(urlString, {
      method: options?.method || "GET",
      headers: options?.headers,
      timeout: options?.timeout,
      signal: options?.signal
    }, (res) => {
      const incomingMessage = new IncomingMessage(res);
      if (callback) callback(incomingMessage);
      req.emit("response", incomingMessage);
    });
    req._setNativeRequest(nodeReq);
    nodeReq.on("error", (error) => req.emit("error", error));
  } else {
    req._setExecutor(async (body) => {
      const response = await fetch(urlString, {
        method: options?.method || "GET",
        headers: options?.headers,
        body,
        signal: options?.signal
      });
      const incomingMessage = new IncomingMessage(response, options?.method || "GET");
      if (callback) callback(incomingMessage);
      req.emit("response", incomingMessage);
    });
  }
  return req;
}
function get(url, options, callback) {
  const req = request(url, { ...options, method: "GET" }, callback);
  req.end();
  return req;
}
var init_request_api = __esm({
  "src/server/http/request-api.ts"() {
    "use strict";
    init_runtime();
    init_client_request();
    init_incoming_message();
    init_node_modules();
  }
});

// src/server/http/response.ts
import { EventEmitter as EventEmitter4 } from "events";
var ServerResponse;
var init_response = __esm({
  "src/server/http/response.ts"() {
    "use strict";
    init_runtime();
    init_utils();
    ServerResponse = class extends EventEmitter4 {
      constructor(_req, nodeRes) {
        super();
        this.statusCode = 200;
        this.statusMessage = "OK";
        this.headersSent = false;
        this._body = "";
        this._finished = false;
        this._nodeRes = nodeRes;
        this._headers = /* @__PURE__ */ Object.create(null);
      }
      setHeader(name, value) {
        if (this.headersSent) {
          throw new Error("Cannot set headers after they are sent");
        }
        if (isNode && this._nodeRes) {
          this._nodeRes.setHeader(name, value);
        }
        this._headers[name.toLowerCase()] = value;
        return this;
      }
      getHeader(name) {
        if (isNode && this._nodeRes) {
          return this._nodeRes.getHeader(name);
        }
        return this._headers[name.toLowerCase()];
      }
      getHeaders() {
        if (isNode && this._nodeRes) {
          return this._nodeRes.getHeaders();
        }
        return { ...this._headers };
      }
      getHeaderNames() {
        if (isNode && this._nodeRes) {
          return this._nodeRes.getHeaderNames();
        }
        return Object.keys(this._headers);
      }
      hasHeader(name) {
        if (isNode && this._nodeRes) {
          return this._nodeRes.hasHeader(name);
        }
        return name.toLowerCase() in this._headers;
      }
      removeHeader(name) {
        if (this.headersSent) {
          throw new Error("Cannot remove headers after they are sent");
        }
        if (isNode && this._nodeRes) {
          this._nodeRes.removeHeader(name);
        }
        delete this._headers[name.toLowerCase()];
      }
      writeHead(statusCode, statusMessage, headers) {
        if (this.headersSent) {
          throw new Error("Cannot write headers after they are sent");
        }
        this.statusCode = statusCode;
        if (typeof statusMessage === "string") {
          this.statusMessage = statusMessage;
          if (headers) {
            for (const key in headers) {
              this.setHeader(key, headers[key]);
            }
          }
        } else if (statusMessage) {
          for (const key in statusMessage) {
            this.setHeader(key, statusMessage[key]);
          }
        }
        if (isNode && this._nodeRes) {
          if (typeof statusMessage === "string") {
            this._nodeRes.writeHead(statusCode, statusMessage, headers);
          } else {
            this._nodeRes.writeHead(statusCode, statusMessage);
          }
        }
        this.headersSent = true;
        return this;
      }
      write(chunk, encoding, callback) {
        if (typeof encoding === "function") {
          callback = encoding;
          encoding = "utf8";
        }
        if (!this.headersSent) {
          this.writeHead(this.statusCode);
        }
        if (isNode && this._nodeRes) {
          return this._nodeRes.write(chunk, encoding, callback);
        }
        this._body += chunk;
        queueCallback(callback);
        return true;
      }
      end(chunk, encoding, callback) {
        if (this._finished) {
          return this;
        }
        if (typeof chunk === "function") {
          callback = chunk;
          chunk = void 0;
        } else if (typeof encoding === "function") {
          callback = encoding;
          encoding = "utf8";
        }
        if (chunk !== void 0) {
          this.write(chunk, encoding);
        }
        if (!this.headersSent) {
          this.writeHead(this.statusCode);
        }
        this._finished = true;
        if (isNode && this._nodeRes) {
          this._nodeRes.end(callback);
          this.emit("finish");
        } else {
          const response = new Response(this._body, {
            status: this.statusCode,
            statusText: this.statusMessage,
            headers: headersToInit(this._headers)
          });
          if (this._resolve) {
            this._resolve(response);
          }
          queueCallback(callback);
        }
        return this;
      }
      _setResolver(resolve) {
        this._resolve = resolve;
      }
      json(data, statusCode = 200) {
        if (!this.headersSent) {
          this.setHeader("Content-Type", "application/json");
        }
        this.statusCode = statusCode;
        this.end(JSON.stringify(data));
        return this;
      }
      send(data) {
        if (typeof data === "object") {
          return this.json(data);
        }
        if (!this.headersSent) {
          this.setHeader("Content-Type", "text/plain");
        }
        this.end(String(data));
        return this;
      }
      status(code) {
        this.statusCode = code;
        return this;
      }
    };
  }
});

// src/server/http/runtime.ts
function getRuntime() {
  return runtime;
}
var init_runtime2 = __esm({
  "src/server/http/runtime.ts"() {
    "use strict";
    init_runtime();
  }
});

// src/server/http/server-runtime.ts
import { EventEmitter as EventEmitter5 } from "events";
function createServer(optionsOrListener, requestListener) {
  return new Server(typeof optionsOrListener === "function" ? optionsOrListener : requestListener);
}
var Server;
var init_server_runtime = __esm({
  "src/server/http/server-runtime.ts"() {
    "use strict";
    init_runtime();
    init_node_modules();
    init_incoming_message();
    init_response();
    init_utils();
    Server = class extends EventEmitter5 {
      constructor(requestListener) {
        super();
        this._bunWebSocketServers = /* @__PURE__ */ new Set();
        this._listening = false;
        this.requestListener = requestListener;
      }
      registerWebSocketServer(wsServer) {
        this._bunWebSocketServers.add(wsServer);
      }
      unregisterWebSocketServer(wsServer) {
        this._bunWebSocketServers.delete(wsServer);
      }
      listen(...args) {
        let port = 3e3;
        let hostname = "0.0.0.0";
        let callback;
        const firstArg = args[0];
        if (typeof firstArg === "number") {
          port = firstArg;
          const secondArg = args[1];
          if (typeof secondArg === "string") {
            hostname = secondArg;
            callback = args[2] || args[3];
          } else if (typeof secondArg === "function") {
            callback = secondArg;
          }
        } else if (firstArg && typeof firstArg === "object") {
          port = firstArg.port || 3e3;
          hostname = firstArg.hostname || "0.0.0.0";
          callback = args[1];
        }
        const self = this;
        if (isNode) {
          this.nativeServer = http.createServer((req, res) => {
            const incomingMessage = new IncomingMessage(req);
            const serverResponse = new ServerResponse(incomingMessage, res);
            if (self.requestListener) {
              self.requestListener(incomingMessage, serverResponse);
            } else {
              self.emit("request", incomingMessage, serverResponse);
            }
          });
          this.nativeServer.on("upgrade", (req, socket, head) => {
            self.emit("upgrade", req, socket, head);
          });
          this.nativeServer.listen(port, hostname, () => {
            this._listening = true;
            this.emit("listening");
            if (callback) callback();
          });
          this.nativeServer.on("error", (err) => this.emit("error", err));
          this.nativeServer.on("close", () => {
            this._listening = false;
            this.emit("close");
          });
        } else if (isBun) {
          this.nativeServer = Bun.serve({
            port,
            hostname,
            websocket: {
              open: (ws) => {
                ws.data?.wsServer?._handleBunOpen(ws, ws.data?.request);
              },
              message: (ws, message) => {
                ws.data?.wsServer?._handleBunMessage(ws, message);
              },
              close: (ws, code, reason) => {
                ws.data?.wsServer?._handleBunClose(ws, code, reason);
              }
            },
            fetch: (req) => {
              const urlObj = new URL(req.url);
              const pathname = urlObj.pathname;
              const requestUrl = urlObj.pathname + urlObj.search;
              const incomingHeaders = headersToRecord(req.headers);
              const rawHeaders = headersToRawHeaders(req.headers);
              const upgradeHeader = req.headers.get("upgrade");
              if (upgradeHeader && upgradeHeader.toLowerCase() === "websocket") {
                const matchingWebSocketServer = Array.from(this._bunWebSocketServers).find((wsServer) => {
                  return !wsServer.path || wsServer.path === pathname;
                });
                if (!matchingWebSocketServer) {
                  return new Response("WebSocket path not found", { status: 404 });
                }
                const requestHeaders = {};
                req.headers.forEach((value, key) => {
                  requestHeaders[key] = value;
                });
                const upgraded = this.nativeServer.upgrade(req, {
                  data: {
                    wsServer: matchingWebSocketServer,
                    request: {
                      method: req.method,
                      url: requestUrl,
                      headers: requestHeaders,
                      socket: { remoteAddress: void 0 }
                    }
                  }
                });
                if (upgraded) {
                  return void 0;
                }
                return new Response("WebSocket upgrade failed", { status: 400 });
              }
              let statusCode = 200;
              let statusMessage = "OK";
              let body = "";
              const headers = /* @__PURE__ */ Object.create(null);
              let responseReady = false;
              const incomingMessage = {
                method: req.method,
                url: requestUrl,
                headers: incomingHeaders,
                httpVersion: "1.1",
                rawHeaders,
                _req: req,
                text: () => req.text(),
                json: () => req.json()
              };
              const serverResponse = {
                statusCode: 200,
                statusMessage: "OK",
                headersSent: false,
                _headers: headers,
                setHeader(name, value) {
                  headers[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
                  return this;
                },
                getHeader(name) {
                  return headers[name.toLowerCase()];
                },
                getHeaders() {
                  return { ...headers };
                },
                writeHead(status, arg2, arg3) {
                  statusCode = status;
                  this.statusCode = status;
                  this.headersSent = true;
                  if (typeof arg2 === "string") {
                    statusMessage = arg2;
                    this.statusMessage = arg2;
                    if (arg3) {
                      for (const key in arg3) {
                        headers[key.toLowerCase()] = arg3[key];
                      }
                    }
                  } else if (arg2) {
                    for (const key in arg2) {
                      headers[key.toLowerCase()] = arg2[key];
                    }
                  }
                  return this;
                },
                write(chunk) {
                  if (!this.headersSent) {
                    this.writeHead(statusCode);
                  }
                  body += chunk;
                  return true;
                },
                end(chunk) {
                  if (chunk !== void 0) {
                    this.write(chunk);
                  }
                  if (!this.headersSent) {
                    this.writeHead(statusCode);
                  }
                  responseReady = true;
                  return this;
                }
              };
              if (self.requestListener) {
                self.requestListener(incomingMessage, serverResponse);
              } else {
                self.emit("request", incomingMessage, serverResponse);
              }
              if (responseReady) {
                return new Response(body, {
                  status: statusCode,
                  statusText: statusMessage,
                  headers
                });
              }
              return new Promise((resolve) => {
                serverResponse.end = (chunk) => {
                  if (chunk !== void 0) {
                    body += chunk;
                  }
                  resolve(new Response(body, {
                    status: statusCode,
                    statusText: statusMessage,
                    headers
                  }));
                };
              });
            },
            error: createErrorResponse
          });
          emitListeningWithCallback(this, callback);
        } else if (isDeno) {
          this.nativeServer = Deno.serve({
            port,
            hostname,
            handler: (req) => {
              return new Promise((resolve) => {
                const incomingMessage = new IncomingMessage(req);
                const serverResponse = new ServerResponse();
                serverResponse._setResolver(resolve);
                if (self.requestListener) {
                  self.requestListener(incomingMessage, serverResponse);
                } else {
                  self.emit("request", incomingMessage, serverResponse);
                }
              });
            },
            onError: (error) => {
              this.emit("error", error);
              return createErrorResponse();
            }
          });
          emitListeningWithCallback(this, callback);
        }
        return this;
      }
      close(callback) {
        if (!this.nativeServer) {
          if (callback) queueMicrotask(() => callback());
          return this;
        }
        if (isNode) {
          this.nativeServer.close(callback);
        } else if (isBun) {
          this.nativeServer.stop();
          closeAndEmit(this, callback);
        } else if (isDeno) {
          this.nativeServer.shutdown();
          closeAndEmit(this, callback);
        }
        return this;
      }
      address() {
        if (!this.nativeServer) return null;
        if (isNode) {
          const addr = this.nativeServer.address();
          if (!addr) return null;
          if (typeof addr === "string") {
            return createAddress(0, addr, "unix");
          }
          return addr;
        }
        if (isBun) {
          return createAddress(this.nativeServer.port, this.nativeServer.hostname);
        }
        if (isDeno) {
          const addr = this.nativeServer.addr;
          return createAddress(addr.port, addr.hostname);
        }
        return null;
      }
      get listening() {
        return this._listening;
      }
    };
  }
});

// src/server/http/index.ts
var http_exports = {};
__export(http_exports, {
  Agent: () => Agent,
  ClientRequest: () => ClientRequest,
  IncomingMessage: () => IncomingMessage,
  METHODS: () => METHODS,
  STATUS_CODES: () => STATUS_CODES,
  Server: () => Server,
  ServerResponse: () => ServerResponse,
  createServer: () => createServer,
  default: () => http_default,
  get: () => get,
  getRuntime: () => getRuntime,
  request: () => request
});
var http_default;
var init_http = __esm({
  "src/server/http/index.ts"() {
    "use strict";
    init_agent();
    init_client_request();
    init_constants();
    init_incoming_message();
    init_request_api();
    init_response();
    init_runtime2();
    init_server_runtime();
    init_agent();
    init_client_request();
    init_constants();
    init_incoming_message();
    init_request_api();
    init_response();
    init_runtime2();
    init_server_runtime();
    http_default = {
      createServer,
      request,
      get,
      Server,
      IncomingMessage,
      ServerResponse,
      Agent,
      ClientRequest,
      METHODS,
      STATUS_CODES,
      getRuntime
    };
  }
});

// src/server/wss.ts
import { EventEmitter as EventEmitter9 } from "events";

// src/server/https/client-request.ts
init_utils();
import { EventEmitter } from "events";

// src/server/https/request-api.ts
init_runtime();

// src/server/https/http-classes.ts
function loadHttpClasses() {
  const httpModule = (init_http(), __toCommonJS(http_exports));
  return {
    IncomingMessage: httpModule.IncomingMessage,
    ServerResponse: httpModule.ServerResponse
  };
}

// src/server/https/node-modules.ts
init_runtime();
var https2;
if (isNode && typeof process !== "undefined") {
  try {
    https2 = __require("https");
  } catch {
    https2 = __require("https");
  }
}

// src/server/https/runtime.ts
init_runtime();

// src/server/https/server-runtime.ts
init_runtime();
init_utils();
import { EventEmitter as EventEmitter6 } from "events";
var Server2 = class extends EventEmitter6 {
  constructor(options = {}, requestListener) {
    super();
    this._listening = false;
    this.options = options;
    this.requestListener = requestListener;
  }
  listen(...args) {
    let port = 3e3;
    let hostname = "0.0.0.0";
    let callback;
    const firstArg = args[0];
    if (typeof firstArg === "number") {
      port = firstArg;
      const secondArg = args[1];
      if (typeof secondArg === "string") {
        hostname = secondArg;
        callback = args[2] || args[3];
      } else if (typeof secondArg === "function") {
        callback = secondArg;
      }
    } else if (firstArg && typeof firstArg === "object") {
      port = firstArg.port || 3e3;
      hostname = firstArg.hostname || "0.0.0.0";
      callback = args[1];
    }
    const self = this;
    if (isNode) {
      const { IncomingMessage: IncomingMessage2, ServerResponse: ServerResponse2 } = loadHttpClasses();
      this.nativeServer = https2.createServer(this.options, (req, res) => {
        const incomingMessage = new IncomingMessage2(req);
        const serverResponse = new ServerResponse2(incomingMessage, res);
        if (self.requestListener) {
          self.requestListener(incomingMessage, serverResponse);
        } else {
          self.emit("request", incomingMessage, serverResponse);
        }
      });
      this.nativeServer.listen(port, hostname, () => {
        this._listening = true;
        this.emit("listening");
        if (callback) callback();
      });
      this.nativeServer.on("error", (err) => this.emit("error", err));
      this.nativeServer.on("close", () => {
        this._listening = false;
        this.emit("close");
      });
    } else if (isBun) {
      const { IncomingMessage: IncomingMessage2, ServerResponse: ServerResponse2 } = loadHttpClasses();
      const tlsOptions = {
        port,
        hostname,
        fetch: (req) => {
          return new Promise((resolve) => {
            const incomingMessage = new IncomingMessage2(req);
            const serverResponse = new ServerResponse2();
            serverResponse._setResolver(resolve);
            if (self.requestListener) {
              self.requestListener(incomingMessage, serverResponse);
            } else {
              self.emit("request", incomingMessage, serverResponse);
            }
          });
        },
        error: (error) => {
          this.emit("error", error);
          return createErrorResponse();
        }
      };
      if (this.options.key || this.options.cert) {
        tlsOptions.tls = {
          key: this.options.key,
          cert: this.options.cert,
          ca: this.options.ca,
          passphrase: this.options.passphrase
        };
      } else if (this.options.tls) {
        tlsOptions.tls = this.options.tls;
      }
      this.nativeServer = Bun.serve(tlsOptions);
      emitListeningWithCallback(this, callback);
    } else if (isDeno) {
      const { IncomingMessage: IncomingMessage2, ServerResponse: ServerResponse2 } = loadHttpClasses();
      const serveOptions = {
        port,
        hostname,
        handler: (req) => {
          return new Promise((resolve) => {
            const incomingMessage = new IncomingMessage2(req);
            const serverResponse = new ServerResponse2();
            serverResponse._setResolver(resolve);
            if (self.requestListener) {
              self.requestListener(incomingMessage, serverResponse);
            } else {
              self.emit("request", incomingMessage, serverResponse);
            }
          });
        },
        onError: (error) => {
          this.emit("error", error);
          return createErrorResponse();
        }
      };
      if (this.options.key && this.options.cert) {
        serveOptions.cert = this.options.cert;
        serveOptions.key = this.options.key;
      }
      this.nativeServer = Deno.serve(serveOptions);
      emitListeningWithCallback(this, callback);
    }
    return this;
  }
  close(callback) {
    if (!this.nativeServer) {
      if (callback) queueCallback(() => callback());
      return this;
    }
    if (isNode) {
      this.nativeServer.close(callback);
    } else if (isBun) {
      this.nativeServer.stop();
      closeAndEmit(this, callback);
    } else if (isDeno) {
      this.nativeServer.shutdown();
      closeAndEmit(this, callback);
    }
    return this;
  }
  address() {
    if (!this.nativeServer) return null;
    if (isNode) {
      const addr = this.nativeServer.address();
      if (!addr) return null;
      if (typeof addr === "string") {
        return createAddress(0, addr, "unix");
      }
      return addr;
    }
    if (isBun) {
      return createAddress(this.nativeServer.port, this.nativeServer.hostname);
    }
    if (isDeno) {
      const addr = this.nativeServer.addr;
      return createAddress(addr.port, addr.hostname);
    }
    return null;
  }
  get listening() {
    return this._listening;
  }
};
function createServer2(options = {}, requestListener) {
  return new Server2(options, requestListener);
}

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
init_runtime();
import { EventEmitter as EventEmitter8 } from "events";

// src/server/ws/utils.ts
init_runtime();
function queueCallback2(callback, error) {
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
function getRequestPath2(url) {
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
import { EventEmitter as EventEmitter7 } from "events";
var WebSocket = class extends EventEmitter7 {
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
      queueCallback2(cb, new Error("WebSocket is not open"));
      return;
    }
    try {
      this._socket.send(data);
      queueCallback2(cb);
    } catch (error) {
      queueCallback2(cb, error);
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
    queueCallback2(callback);
  }
  /**
   * Send a pong frame (no-op for native WebSocket).
   */
  pong(_data, _mask, callback) {
    queueCallback2(callback);
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
var WebSocketServer = class extends EventEmitter8 {
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
        const http2 = __require("http");
        this._httpServer = http2.createServer();
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
      queueCallback2(callback);
    } else {
      queueCallback2(callback);
    }
  }
  _setupUpgradeHandler() {
    this._httpServer.on("upgrade", (request3, socket, head) => {
      const requestPath = getRequestPath2(request3.url);
      console.log("[WebSocket] Upgrade request:", requestPath, "Expected:", this.path || "(any)");
      if (this.path && requestPath !== this.path) {
        console.log("[WebSocket] Path mismatch, ignoring");
        return;
      }
      this.handleUpgrade(request3, socket, head, (client) => {
        console.log("[WebSocket] Client connected");
        this.emit("connection", client, request3);
      });
    });
  }
  /**
   * Handle HTTP upgrade for WebSocket.
   */
  handleUpgrade(request3, socket, _head, callback) {
    const key = request3.headers["sec-websocket-key"];
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
    EventEmitter8.call(client);
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
        queueCallback2(callback, error);
        return;
      }
      try {
        const frame = createFrame(data);
        socket.write(frame, (error) => {
          if (!error) {
            queueCallback2(callback);
            return;
          }
          if (isIgnorableConnectionError(error)) {
            client.readyState = 3 /* CLOSED */;
            queueCallback2(callback);
            return;
          }
          queueCallback2(callback, error);
        });
      } catch (error) {
        queueCallback2(callback, error);
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
    EventEmitter8.call(client);
    client.readyState = 1 /* OPEN */;
    client.url = "ws://localhost";
    client.protocol = "";
    client.extensions = "";
    client.binaryType = "nodebuffer";
    client._socket = socket;
    client.send = (data, _options, callback) => {
      if (client.readyState !== 1 /* OPEN */) {
        queueCallback2(callback, new Error("WebSocket is not open"));
        return;
      }
      try {
        socket.send(data);
        queueCallback2(callback);
      } catch (error) {
        queueCallback2(callback, error);
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
  _handleBunOpen(socket, request3 = {}) {
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
      url: request3.url || this.path,
      headers: request3.headers || {},
      socket: request3.socket || { remoteAddress: void 0 }
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
    queueCallback2(callback);
  }
  /**
   * Check if server should handle request.
   */
  shouldHandle(request3) {
    if (this.path && getRequestPath2(request3.url) !== this.path) {
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

// src/server/ws/runtime.ts
init_runtime();

// src/server/wss.ts
init_runtime();
function queueCallback3(callback) {
  if (callback) {
    queueMicrotask(callback);
  }
}
function buildHttpsOptions(options) {
  const httpsOptions = {};
  if (options?.key) httpsOptions.key = options.key;
  if (options?.cert) httpsOptions.cert = options.cert;
  if (options?.ca) httpsOptions.ca = options.ca;
  if (options?.passphrase) httpsOptions.passphrase = options.passphrase;
  if (options?.rejectUnauthorized !== void 0) httpsOptions.rejectUnauthorized = options.rejectUnauthorized;
  if (options?.requestCert !== void 0) httpsOptions.requestCert = options.requestCert;
  return httpsOptions;
}
function emitCloseWithCallback(emitter, callback) {
  emitter.emit("close");
  queueCallback3(callback);
}
var WSSClient = class extends WebSocket {
  constructor(address, protocols, options) {
    const urlString = typeof address === "string" ? address : address.toString();
    const secureUrl = urlString.replace(/^ws:\/\//i, "wss://");
    super(secureUrl, protocols, options);
  }
};
var WSSServer = class extends EventEmitter9 {
  constructor(options, callback) {
    super();
    this.clients = /* @__PURE__ */ new Set();
    this.options = options || {};
    this.path = options?.path || "/";
    if (runtime === "node") {
      if (options?.httpsServer) {
        this._httpsServer = options.httpsServer;
        this._setupServer(callback);
      } else if (options?.noServer) {
        this._wsServer = new WebSocketServer({ noServer: true });
        queueCallback3(callback);
      } else {
        this._httpsServer = createServer2(buildHttpsOptions(options));
        this._setupServer(callback);
        if (options?.port) {
          this._httpsServer.listen(options.port, options.host, callback);
        }
      }
    } else {
      this._wsServer = new WebSocketServer(options);
      queueCallback3(callback);
    }
  }
  _setupServer(callback) {
    this._wsServer = new WebSocketServer({
      ...this.options,
      server: this._httpsServer,
      noServer: false
    });
    this._wsServer.on("connection", (client, request3) => {
      if (this.options.clientTracking !== false) {
        this.clients.add(client);
        client.on("close", () => {
          this.clients.delete(client);
        });
      }
      this.emit("connection", client, request3);
    });
    this._wsServer.on("error", (error) => {
      this.emit("error", error);
    });
    if (!this.options?.port) {
      queueCallback3(callback);
    }
  }
  /**
   * Handle HTTP upgrade for WebSocket
   */
  handleUpgrade(request3, socket, head, callback) {
    if (this._wsServer) {
      this._wsServer.handleUpgrade(request3, socket, head, callback);
    }
  }
  /**
   * Check if server should handle request
   */
  shouldHandle(request3) {
    if (this._wsServer) {
      return this._wsServer.shouldHandle(request3);
    }
    if (this.path && request3.url !== this.path) {
      return false;
    }
    return true;
  }
  /**
   * Close the server
   */
  close(callback) {
    this.clients.forEach((client) => client.close());
    this.clients.clear();
    if (this._wsServer) {
      this._wsServer.close(() => {
        if (this._httpsServer) {
          this._httpsServer.close(callback);
        } else {
          emitCloseWithCallback(this, callback);
        }
      });
    } else if (this._httpsServer) {
      this._httpsServer.close(callback);
    } else {
      emitCloseWithCallback(this, callback);
    }
  }
  /**
   * Get server address
   */
  address() {
    if (this._httpsServer && this._httpsServer.address) {
      return this._httpsServer.address();
    }
    if (this._wsServer) {
      return this._wsServer.address();
    }
    return null;
  }
};
function createWSSClient(address, protocols, options) {
  return new WSSClient(address, protocols, options);
}
function createWSSServer(options, callback) {
  return new WSSServer(options, callback);
}
function getRuntime4() {
  return runtime;
}
var wss_default = {
  WSSClient,
  WSSServer,
  createWSSClient,
  createWSSServer,
  ReadyState,
  CLOSE_CODES,
  getRuntime: getRuntime4
};
export {
  CLOSE_CODES,
  ReadyState,
  WSSClient,
  WSSServer,
  createWSSClient,
  createWSSServer,
  wss_default as default,
  getRuntime4 as getRuntime
};
