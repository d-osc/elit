var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// ../../src/runtime.ts
var runtime, isNode, isBun, isDeno;
var init_runtime = __esm({
  "../../src/runtime.ts"() {
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

// ../../src/http.ts
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
function queueCallback(callback) {
  if (callback) queueMicrotask(callback);
}
function headersToInit(headers) {
  const result = {};
  for (const key in headers) {
    const value = headers[key];
    result[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  return result;
}
function createAddress(port, address2, family = "IPv4") {
  return { port, family, address: address2 };
}
function createErrorResponse() {
  return new Response("Internal Server Error", { status: 500 });
}
function emitListeningWithCallback(server2, callback) {
  server2._listening = true;
  server2.emit("listening");
  queueCallback(callback);
}
function closeAndEmit(server2, callback) {
  server2._listening = false;
  server2.emit("close");
  if (callback) queueMicrotask(() => callback());
}
function createServer(optionsOrListener, requestListener) {
  return new Server(typeof optionsOrListener === "function" ? optionsOrListener : requestListener);
}
function request(url, options2, callback) {
  const urlString = typeof url === "string" ? url : url.toString();
  const req = new ClientRequest(urlString, options2);
  if (isNode) {
    const urlObj = new URL(urlString);
    const client2 = urlObj.protocol === "https:" ? https : http;
    const nodeReq = client2.request(urlString, {
      method: options2?.method || "GET",
      headers: options2?.headers,
      timeout: options2?.timeout,
      signal: options2?.signal
    }, (res) => {
      const incomingMessage = new IncomingMessage(res);
      if (callback) callback(incomingMessage);
      req.emit("response", incomingMessage);
    });
    nodeReq.on("error", (error) => req.emit("error", error));
    nodeReq.end();
  } else {
    queueMicrotask(async () => {
      try {
        const response = await fetch(urlString, {
          method: options2?.method || "GET",
          headers: options2?.headers,
          signal: options2?.signal
        });
        const fetchRequest = new Request(urlString);
        const incomingMessage = new IncomingMessage(fetchRequest);
        incomingMessage.statusCode = response.status;
        incomingMessage.statusMessage = response.statusText;
        if (callback) callback(incomingMessage);
        req.emit("response", incomingMessage);
      } catch (error) {
        req.emit("error", error);
      }
    });
  }
  return req;
}
function get(url, options2, callback) {
  return request(url, { ...options2, method: "GET" }, callback);
}
function getRuntime() {
  return runtime;
}
var import_node_events, http, https, METHODS, STATUS_CODES, IncomingMessage, ServerResponse, Server, ClientRequest, Agent, http_default;
var init_http = __esm({
  "../../src/http.ts"() {
    "use strict";
    import_node_events = require("node:events");
    init_runtime();
    if (isNode && typeof process !== "undefined") {
      try {
        http = require("node:http");
        https = require("node:https");
      } catch (e) {
        http = require("http");
        https = require("https");
      }
    }
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
    IncomingMessage = class extends import_node_events.EventEmitter {
      constructor(req) {
        super();
        this.httpVersion = "1.1";
        this.rawHeaders = [];
        this._req = req;
        if (isNode) {
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
          const urlObj = new URL(req.url);
          this.url = urlObj.pathname + urlObj.search;
          this.headers = req.headers;
          this.rawHeaders = [];
        }
      }
      async text() {
        if (isNode) {
          return new Promise((resolve4, reject) => {
            const chunks = [];
            this._req.on("data", (chunk) => chunks.push(chunk));
            this._req.on("end", () => resolve4(Buffer.concat(chunks).toString("utf8")));
            this._req.on("error", reject);
          });
        }
        return this._req.text();
      }
      async json() {
        if (isNode) {
          const text = await this.text();
          return JSON.parse(text);
        }
        return this._req.json();
      }
    };
    ServerResponse = class extends import_node_events.EventEmitter {
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
      _setResolver(resolve4) {
        this._resolve = resolve4;
      }
      // Express.js-like methods
      json(data2, statusCode = 200) {
        if (!this.headersSent) {
          this.setHeader("Content-Type", "application/json");
        }
        this.statusCode = statusCode;
        this.end(JSON.stringify(data2));
        return this;
      }
      send(data2) {
        if (typeof data2 === "object") {
          return this.json(data2);
        }
        if (!this.headersSent) {
          this.setHeader("Content-Type", "text/plain");
        }
        this.end(String(data2));
        return this;
      }
      status(code2) {
        this.statusCode = code2;
        return this;
      }
    };
    Server = class extends import_node_events.EventEmitter {
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
          this.nativeServer.on("upgrade", (req, socket, head2) => {
            self.emit("upgrade", req, socket, head2);
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
              close: (ws, code2, reason) => {
                ws.data?.wsServer?._handleBunClose(ws, code2, reason);
              }
            },
            fetch: (req) => {
              const urlObj = new URL(req.url);
              const pathname = urlObj.pathname;
              const requestUrl = urlObj.pathname + urlObj.search;
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
              let body2 = "";
              const headers = /* @__PURE__ */ Object.create(null);
              let responseReady = false;
              const incomingMessage = {
                method: req.method,
                url: requestUrl,
                headers: req.headers,
                httpVersion: "1.1",
                rawHeaders: [],
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
                  body2 += chunk;
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
              }
              if (responseReady) {
                return new Response(body2, {
                  status: statusCode,
                  statusText: statusMessage,
                  headers
                });
              }
              return new Promise((resolve4) => {
                serverResponse.end = (chunk) => {
                  if (chunk !== void 0) {
                    body2 += chunk;
                  }
                  resolve4(new Response(body2, {
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
              return new Promise((resolve4) => {
                const incomingMessage = new IncomingMessage(req);
                const serverResponse = new ServerResponse();
                serverResponse._setResolver(resolve4);
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
        } else if (isBun) {
          return createAddress(this.nativeServer.port, this.nativeServer.hostname);
        } else if (isDeno) {
          const addr = this.nativeServer.addr;
          return createAddress(addr.port, addr.hostname);
        }
        return null;
      }
      get listening() {
        return this._listening;
      }
    };
    ClientRequest = class extends import_node_events.EventEmitter {
      constructor(_url, _options = {}) {
        super();
      }
      write(_chunk) {
        return true;
      }
      end(callback) {
        queueCallback(callback);
      }
    };
    Agent = class {
      constructor(options2) {
        this.options = options2;
      }
    };
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

// ../../src/fs.ts
var fs_exports = {};
__export(fs_exports, {
  appendFile: () => appendFile,
  appendFileSync: () => appendFileSync,
  copyFile: () => copyFile,
  copyFileSync: () => copyFileSync,
  default: () => fs_default,
  exists: () => exists,
  existsSync: () => existsSync,
  getRuntime: () => getRuntime2,
  mkdir: () => mkdir,
  mkdirSync: () => mkdirSync,
  promises: () => promises,
  readFile: () => readFile,
  readFileSync: () => readFileSync,
  readdir: () => readdir,
  readdirSync: () => readdirSync,
  realpath: () => realpath,
  realpathSync: () => realpathSync,
  rename: () => rename,
  renameSync: () => renameSync,
  rmdir: () => rmdir,
  rmdirSync: () => rmdirSync,
  stat: () => stat,
  statSync: () => statSync,
  unlink: () => unlink,
  unlinkSync: () => unlinkSync,
  writeFile: () => writeFile,
  writeFileSync: () => writeFileSync
});
function parseOptions(options2, defaultValue) {
  return typeof options2 === "string" ? { encoding: options2 } : options2 || defaultValue;
}
function decodeContent(content, encoding) {
  if (encoding) {
    return new TextDecoder(encoding).decode(content);
  }
  return Buffer.from(content instanceof ArrayBuffer ? new Uint8Array(content) : content);
}
function dataToUint8Array(data2) {
  if (typeof data2 === "string") {
    return new TextEncoder().encode(data2);
  }
  if (data2 instanceof Buffer) {
    return new Uint8Array(data2);
  }
  return data2;
}
function processDenoEntries(iterator, withFileTypes) {
  const entries = [];
  for (const entry of iterator) {
    if (withFileTypes) {
      entries.push(createDirentFromDenoEntry(entry));
    } else {
      entries.push(entry.name);
    }
  }
  return entries;
}
async function processDenoEntriesAsync(iterator, withFileTypes) {
  const entries = [];
  for await (const entry of iterator) {
    if (withFileTypes) {
      entries.push(createDirentFromDenoEntry(entry));
    } else {
      entries.push(entry.name);
    }
  }
  return entries;
}
async function readFile(path2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode || isBun) {
    return fsPromises.readFile(path2, opts);
  } else if (isDeno) {
    const content = await Deno.readFile(path2);
    return decodeContent(content, opts.encoding);
  }
  throw new Error("Unsupported runtime");
}
function readFileSync(path2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode || isBun) {
    return fs.readFileSync(path2, opts);
  } else if (isDeno) {
    const content = Deno.readFileSync(path2);
    return decodeContent(content, opts.encoding);
  }
  throw new Error("Unsupported runtime");
}
async function writeFile(path2, data2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode || isBun) {
    return fsPromises.writeFile(path2, data2, opts);
  } else if (isDeno) {
    await Deno.writeFile(path2, dataToUint8Array(data2));
  }
}
function writeFileSync(path2, data2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode || isBun) {
    fs.writeFileSync(path2, data2, opts);
  } else if (isDeno) {
    Deno.writeFileSync(path2, dataToUint8Array(data2));
  }
}
async function appendFile(path2, data2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode) {
    return fsPromises.appendFile(path2, data2, opts);
  } else {
    if (await exists(path2)) {
      const existing = await readFile(path2);
      const combined = Buffer.isBuffer(existing) ? Buffer.concat([existing, Buffer.isBuffer(data2) ? data2 : Buffer.from(data2)]) : existing + (Buffer.isBuffer(data2) ? data2.toString() : data2);
      await writeFile(path2, combined, opts);
    } else {
      await writeFile(path2, data2, opts);
    }
  }
}
function appendFileSync(path2, data2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode) {
    fs.appendFileSync(path2, data2, opts);
  } else {
    if (existsSync(path2)) {
      const existing = readFileSync(path2);
      const combined = Buffer.isBuffer(existing) ? Buffer.concat([existing, Buffer.isBuffer(data2) ? data2 : Buffer.from(data2)]) : existing + (Buffer.isBuffer(data2) ? data2.toString() : data2);
      writeFileSync(path2, combined, opts);
    } else {
      writeFileSync(path2, data2, opts);
    }
  }
}
async function exists(path2) {
  try {
    await stat(path2);
    return true;
  } catch {
    return false;
  }
}
function existsSync(path2) {
  try {
    statSync(path2);
    return true;
  } catch {
    return false;
  }
}
async function stat(path2) {
  if (isNode || isBun) {
    return fsPromises.stat(path2);
  } else if (isDeno) {
    const info = await Deno.stat(path2);
    return createStatsFromDenoFileInfo(info);
  }
  throw new Error("Unsupported runtime");
}
function statSync(path2) {
  if (isNode || isBun) {
    return fs.statSync(path2);
  } else if (isDeno) {
    const info = Deno.statSync(path2);
    return createStatsFromDenoFileInfo(info);
  }
  throw new Error("Unsupported runtime");
}
async function mkdir(path2, options2) {
  const opts = typeof options2 === "number" ? { mode: options2 } : options2 || {};
  if (isNode || isBun) {
    await fsPromises.mkdir(path2, opts);
  } else if (isDeno) {
    await Deno.mkdir(path2, { recursive: opts.recursive });
  }
}
function mkdirSync(path2, options2) {
  const opts = typeof options2 === "number" ? { mode: options2 } : options2 || {};
  if (isNode || isBun) {
    fs.mkdirSync(path2, opts);
  } else if (isDeno) {
    Deno.mkdirSync(path2, { recursive: opts.recursive });
  }
}
async function readdir(path2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode || isBun) {
    return fsPromises.readdir(path2, opts);
  } else if (isDeno) {
    return processDenoEntriesAsync(Deno.readDir(path2), opts.withFileTypes);
  }
  throw new Error("Unsupported runtime");
}
function readdirSync(path2, options2) {
  const opts = parseOptions(options2, {});
  if (isNode || isBun) {
    return fs.readdirSync(path2, opts);
  } else if (isDeno) {
    return processDenoEntries(Deno.readDirSync(path2), opts.withFileTypes);
  }
  throw new Error("Unsupported runtime");
}
async function unlink(path2) {
  if (isNode || isBun) {
    return fsPromises.unlink(path2);
  } else if (isDeno) {
    await Deno.remove(path2);
  }
}
function unlinkSync(path2) {
  if (isNode || isBun) {
    fs.unlinkSync(path2);
  } else if (isDeno) {
    Deno.removeSync(path2);
  }
}
async function rmdir(path2, options2) {
  if (isNode || isBun) {
    return fsPromises.rmdir(path2, options2);
  } else if (isDeno) {
    await Deno.remove(path2, { recursive: options2?.recursive });
  }
}
function rmdirSync(path2, options2) {
  if (isNode || isBun) {
    fs.rmdirSync(path2, options2);
  } else if (isDeno) {
    Deno.removeSync(path2, { recursive: options2?.recursive });
  }
}
async function rename(oldPath, newPath) {
  if (isNode || isBun) {
    return fsPromises.rename(oldPath, newPath);
  } else if (isDeno) {
    await Deno.rename(oldPath, newPath);
  }
}
function renameSync(oldPath, newPath) {
  if (isNode || isBun) {
    fs.renameSync(oldPath, newPath);
  } else if (isDeno) {
    Deno.renameSync(oldPath, newPath);
  }
}
async function copyFile(src, dest, flags) {
  if (isNode || isBun) {
    return fsPromises.copyFile(src, dest, flags);
  } else if (isDeno) {
    await Deno.copyFile(src, dest);
  }
}
function copyFileSync(src, dest, flags) {
  if (isNode || isBun) {
    fs.copyFileSync(src, dest, flags);
  } else if (isDeno) {
    Deno.copyFileSync(src, dest);
  }
}
async function realpath(path2, options2) {
  if (isNode || isBun) {
    return fsPromises.realpath(path2, options2);
  } else if (isDeno) {
    return await Deno.realPath(path2);
  }
  return path2;
}
function realpathSync(path2, options2) {
  if (isNode || isBun) {
    return fs.realpathSync(path2, options2);
  } else if (isDeno) {
    return Deno.realPathSync(path2);
  }
  return path2;
}
function createStatsFromDenoFileInfo(info) {
  return {
    isFile: () => info.isFile,
    isDirectory: () => info.isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => info.isSymlink || false,
    isFIFO: () => false,
    isSocket: () => false,
    dev: info.dev || 0,
    ino: info.ino || 0,
    mode: info.mode || 0,
    nlink: info.nlink || 1,
    uid: info.uid || 0,
    gid: info.gid || 0,
    rdev: 0,
    size: info.size,
    blksize: info.blksize || 4096,
    blocks: info.blocks || Math.ceil(info.size / 512),
    atimeMs: info.atime?.getTime() || Date.now(),
    mtimeMs: info.mtime?.getTime() || Date.now(),
    ctimeMs: info.birthtime?.getTime() || Date.now(),
    birthtimeMs: info.birthtime?.getTime() || Date.now(),
    atime: info.atime || /* @__PURE__ */ new Date(),
    mtime: info.mtime || /* @__PURE__ */ new Date(),
    ctime: info.birthtime || /* @__PURE__ */ new Date(),
    birthtime: info.birthtime || /* @__PURE__ */ new Date()
  };
}
function createDirentFromDenoEntry(entry) {
  return {
    name: entry.name,
    isFile: () => entry.isFile,
    isDirectory: () => entry.isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => entry.isSymlink || false,
    isFIFO: () => false,
    isSocket: () => false
  };
}
function getRuntime2() {
  return runtime;
}
var fs, fsPromises, promises, fs_default;
var init_fs = __esm({
  "../../src/fs.ts"() {
    "use strict";
    init_runtime();
    if (isNode || isBun) {
      fs = require("fs");
      fsPromises = require("fs/promises");
    }
    promises = {
      readFile,
      writeFile,
      appendFile,
      stat,
      mkdir,
      readdir,
      unlink,
      rmdir,
      rename,
      copyFile,
      realpath
    };
    fs_default = {
      readFile,
      readFileSync,
      writeFile,
      writeFileSync,
      appendFile,
      appendFileSync,
      exists,
      existsSync,
      stat,
      statSync,
      mkdir,
      mkdirSync,
      readdir,
      readdirSync,
      unlink,
      unlinkSync,
      rmdir,
      rmdirSync,
      rename,
      renameSync,
      copyFile,
      copyFileSync,
      realpath,
      realpathSync,
      promises,
      getRuntime: getRuntime2
    };
  }
});

// node_modules/elit/src/server.ts
var nodeModule = __toESM(require("node:module"));
init_http();

// ../../src/https.ts
var import_events = require("events");
init_runtime();
function queueCallback2(callback) {
  if (callback) queueMicrotask(callback);
}
function loadHttpClasses() {
  const httpModule = (init_http(), __toCommonJS(http_exports));
  return {
    IncomingMessage: httpModule.IncomingMessage,
    ServerResponse: httpModule.ServerResponse
  };
}
var https2;
var ClientRequest2 = class extends import_events.EventEmitter {
  constructor(_url, _options = {}) {
    super();
  }
  write(_chunk) {
    return true;
  }
  end(callback) {
    queueCallback2(callback);
  }
};
function request2(url, options2, callback) {
  const urlString = typeof url === "string" ? url : url.toString();
  const req = new ClientRequest2(urlString, options2);
  if (isNode) {
    const { IncomingMessage: IncomingMessage3 } = loadHttpClasses();
    if (!https2) https2 = require("https");
    const nodeReq = https2.request(urlString, {
      method: options2?.method || "GET",
      headers: options2?.headers,
      timeout: options2?.timeout,
      signal: options2?.signal
    }, (res) => {
      const incomingMessage = new IncomingMessage3(res);
      if (callback) callback(incomingMessage);
      req.emit("response", incomingMessage);
    });
    nodeReq.on("error", (error) => req.emit("error", error));
    nodeReq.end();
  } else {
    const { IncomingMessage: IncomingMessage3 } = loadHttpClasses();
    queueMicrotask(async () => {
      try {
        const response = await fetch(urlString, {
          method: options2?.method || "GET",
          headers: options2?.headers,
          signal: options2?.signal
        });
        const fetchRequest = new Request(urlString);
        const incomingMessage = new IncomingMessage3(fetchRequest);
        incomingMessage.statusCode = response.status;
        incomingMessage.statusMessage = response.statusText;
        if (callback) callback(incomingMessage);
        req.emit("response", incomingMessage);
      } catch (error) {
        req.emit("error", error);
      }
    });
  }
  return req;
}

// ../../src/ws.ts
var import_events2 = require("events");
init_runtime();
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
function queueCallback3(callback, error) {
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
var WebSocket = class extends import_events2.EventEmitter {
  constructor(address2, protocols, _options) {
    super();
    this.readyState = 0 /* CONNECTING */;
    this.protocol = "";
    this.extensions = "";
    this.binaryType = "nodebuffer";
    this.url = typeof address2 === "string" ? address2 : address2.toString();
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
   * Send data through WebSocket
   */
  send(data2, options2, callback) {
    const cb = typeof options2 === "function" ? options2 : callback;
    if (this.readyState !== 1 /* OPEN */) {
      return queueCallback3(cb, new Error("WebSocket is not open"));
    }
    try {
      this._socket.send(data2);
      queueCallback3(cb);
    } catch (error) {
      queueCallback3(cb, error);
    }
  }
  /**
   * Close the WebSocket connection
   */
  close(code2, reason) {
    if (this.readyState === 3 /* CLOSED */ || this.readyState === 2 /* CLOSING */) {
      return;
    }
    this.readyState = 2 /* CLOSING */;
    this._socket.close(code2, typeof reason === "string" ? reason : reason?.toString());
  }
  /**
   * Pause the socket (no-op for native WebSocket)
   */
  pause() {
  }
  /**
   * Resume the socket (no-op for native WebSocket)
   */
  resume() {
  }
  /**
   * Send a ping frame (no-op for native WebSocket)
   */
  ping(_data, _mask, callback) {
    queueCallback3(callback);
  }
  /**
   * Send a pong frame (no-op for native WebSocket)
   */
  pong(_data, _mask, callback) {
    queueCallback3(callback);
  }
  /**
   * Terminate the connection
   */
  terminate() {
    this._socket.close();
    this.readyState = 3 /* CLOSED */;
  }
  /**
   * Get buffered amount
   */
  get bufferedAmount() {
    return this._socket.bufferedAmount || 0;
  }
};
var WebSocketServer = class extends import_events2.EventEmitter {
  constructor(options2, callback) {
    super();
    this.clients = /* @__PURE__ */ new Set();
    this._ownsHttpServer = false;
    this.options = options2 || {};
    this.path = options2?.path;
    if (runtime === "node") {
      if (options2?.server) {
        this._httpServer = options2.server;
        this._setupUpgradeHandler();
      } else if (options2?.noServer) {
      } else {
        const http2 = require("http");
        this._httpServer = http2.createServer();
        this._ownsHttpServer = true;
        this._setupUpgradeHandler();
        if (options2?.port) {
          this._httpServer.listen(options2.port, options2.host, callback);
        }
      }
    } else if (runtime === "bun") {
      if (options2?.server?.registerWebSocketServer) {
        this._httpServer = options2.server;
        options2.server.registerWebSocketServer(this);
      }
      queueCallback3(callback);
    } else {
      queueCallback3(callback);
    }
  }
  _setupUpgradeHandler() {
    this._httpServer.on("upgrade", (request3, socket, head2) => {
      const requestPath = getRequestPath(request3.url);
      console.log("[WebSocket] Upgrade request:", requestPath, "Expected:", this.path || "(any)");
      if (this.path && requestPath !== this.path) {
        console.log("[WebSocket] Path mismatch, ignoring");
        return;
      }
      this.handleUpgrade(request3, socket, head2, (client2) => {
        console.log("[WebSocket] Client connected");
        this.emit("connection", client2, request3);
      });
    });
  }
  /**
   * Handle HTTP upgrade for WebSocket
   */
  handleUpgrade(request3, socket, _head, callback) {
    const key = request3.headers["sec-websocket-key"];
    if (!key) {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }
    const crypto = require("crypto");
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
    const client2 = this._createClientFromSocket(socket);
    if (this.options.clientTracking !== false) {
      this.clients.add(client2);
      client2.on("close", () => {
        this.clients.delete(client2);
      });
    }
    callback(client2);
  }
  _createClientFromSocket(socket) {
    const client2 = Object.create(WebSocket.prototype);
    import_events2.EventEmitter.call(client2);
    client2.readyState = 1 /* OPEN */;
    client2.url = "ws://localhost";
    client2.protocol = "";
    client2.extensions = "";
    client2.binaryType = "nodebuffer";
    client2._socket = socket;
    socket.on("data", (data2) => {
      try {
        const message = this._parseFrame(data2);
        if (message) {
          client2.emit("message", message, false);
        }
      } catch (error) {
        client2.emit("error", error);
      }
    });
    socket.on("end", () => {
      client2.readyState = 3 /* CLOSED */;
      client2.emit("close", CLOSE_CODES.NORMAL, "");
    });
    socket.on("error", (error) => {
      const errorCode = error.code;
      if (errorCode === "ECONNABORTED" || errorCode === "ECONNRESET" || errorCode === "EPIPE") {
        return;
      }
      client2.emit("error", error);
    });
    client2.send = (data2, _options, callback) => {
      if (!socket.writable || client2.readyState !== 1 /* OPEN */) {
        const err = new Error("WebSocket is not open");
        err.code = "WS_NOT_OPEN";
        queueCallback3(callback, err);
        return;
      }
      try {
        const frame = this._createFrame(data2);
        socket.write(frame, (err) => {
          if (err) {
            const errorCode = err.code;
            if (errorCode !== "ECONNABORTED" && errorCode !== "ECONNRESET" && errorCode !== "EPIPE") {
              queueCallback3(callback, err);
            } else {
              client2.readyState = 3 /* CLOSED */;
              queueCallback3(callback);
            }
          } else {
            queueCallback3(callback);
          }
        });
      } catch (error) {
        queueCallback3(callback, error);
      }
    };
    client2.close = (_code, _reason) => {
      socket.end();
      client2.readyState = 3 /* CLOSED */;
    };
    return client2;
  }
  _createClientFromBunSocket(socket) {
    const client2 = Object.create(WebSocket.prototype);
    import_events2.EventEmitter.call(client2);
    client2.readyState = 1 /* OPEN */;
    client2.url = "ws://localhost";
    client2.protocol = "";
    client2.extensions = "";
    client2.binaryType = "nodebuffer";
    client2._socket = socket;
    client2.send = (data2, _options, callback) => {
      if (client2.readyState !== 1 /* OPEN */) {
        queueCallback3(callback, new Error("WebSocket is not open"));
        return;
      }
      try {
        socket.send(data2);
        queueCallback3(callback);
      } catch (error) {
        queueCallback3(callback, error);
      }
    };
    client2.close = (code2, reason) => {
      if (client2.readyState === 3 /* CLOSED */) {
        return;
      }
      client2.readyState = 2 /* CLOSING */;
      socket.close(code2 ?? CLOSE_CODES.NORMAL, reason);
    };
    client2.terminate = () => {
      socket.close();
      client2.readyState = 3 /* CLOSED */;
    };
    return client2;
  }
  _handleBunOpen(socket, request3 = {}) {
    const client2 = this._createClientFromBunSocket(socket);
    if (socket.data) {
      socket.data.client = client2;
    }
    if (this.options.clientTracking !== false) {
      this.clients.add(client2);
      client2.on("close", () => {
        this.clients.delete(client2);
      });
    }
    const incomingRequest = {
      url: request3.url || this.path,
      headers: request3.headers || {},
      socket: request3.socket || { remoteAddress: void 0 }
    };
    this.emit("connection", client2, incomingRequest);
  }
  _handleBunMessage(socket, message) {
    const client2 = socket.data?.client;
    if (!client2) {
      return;
    }
    const isBinary = typeof message !== "string";
    const payload = typeof message === "string" ? message : message instanceof ArrayBuffer ? Buffer.from(message) : ArrayBuffer.isView(message) ? Buffer.from(message.buffer, message.byteOffset, message.byteLength) : Buffer.from(String(message));
    client2.emit("message", payload, isBinary);
  }
  _handleBunClose(socket, code2, reason) {
    const client2 = socket.data?.client;
    if (!client2) {
      return;
    }
    client2.readyState = 3 /* CLOSED */;
    client2.emit("close", code2, typeof reason === "string" ? reason : reason?.toString() || "");
    this.clients.delete(client2);
  }
  _parseFrame(data2) {
    if (data2.length < 2) return null;
    const firstByte = data2[0];
    const secondByte = data2[1];
    const opcode = firstByte & 15;
    const isMasked = (secondByte & 128) === 128;
    let payloadLength = secondByte & 127;
    let offset = 2;
    if (payloadLength === 126) {
      payloadLength = data2.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      payloadLength = Number(data2.readBigUInt64BE(2));
      offset = 10;
    }
    let payload = data2.subarray(offset);
    if (isMasked) {
      const maskKey = data2.subarray(offset, offset + 4);
      payload = data2.subarray(offset + 4, offset + 4 + payloadLength);
      for (let i2 = 0; i2 < payload.length; i2++) {
        payload[i2] ^= maskKey[i2 % 4];
      }
    }
    if (opcode === 1) {
      return payload.toString("utf8");
    }
    return null;
  }
  _createFrame(data2) {
    const payload = typeof data2 === "string" ? Buffer.from(data2) : data2;
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
  /**
   * Close the server
   */
  close(callback) {
    this.clients.forEach((client2) => client2.close());
    this.clients.clear();
    if (this._httpServer && this._ownsHttpServer) {
      this._httpServer.close(callback);
    } else {
      if (runtime === "bun" && this._httpServer?.unregisterWebSocketServer) {
        this._httpServer.unregisterWebSocketServer(this);
      }
      this.emit("close");
      queueCallback3(callback);
    }
  }
  /**
   * Check if server should handle request
   */
  shouldHandle(request3) {
    if (this.path && getRequestPath(request3.url) !== this.path) {
      return false;
    }
    return true;
  }
  /**
   * Get server address
   */
  address() {
    if (this._httpServer && this._httpServer.address) {
      return this._httpServer.address();
    }
    return null;
  }
};

// ../../src/chokidar.ts
var import_events3 = require("events");
init_fs();

// ../../src/path.ts
init_runtime();
function getSeparator(isWin) {
  return isWin ? "\\" : "/";
}
function getCwd() {
  if (isNode || isBun) {
    return process.cwd();
  } else if (isDeno) {
    return Deno.cwd();
  }
  return "/";
}
function findLastSeparator(path2) {
  return Math.max(path2.lastIndexOf("/"), path2.lastIndexOf("\\"));
}
function createPathOps(isWin) {
  return {
    sep: getSeparator(isWin),
    delimiter: isWin ? ";" : ":",
    normalize: (path2) => normalizePath(path2, isWin),
    join: (...paths) => joinPaths(paths, isWin),
    resolve: (...paths) => resolvePaths(paths, isWin),
    isAbsolute: (path2) => isWin ? isAbsoluteWin(path2) : isAbsolutePosix(path2),
    relative: (from, to) => relativePath(from, to, isWin),
    dirname: (path2) => getDirname(path2, isWin),
    basename: (path2, ext) => getBasename(path2, ext, isWin),
    extname: (path2) => getExtname(path2),
    parse: (path2) => parsePath(path2, isWin),
    format: (pathObject) => formatPath(pathObject, isWin)
  };
}
function isAbsolutePosix(path2) {
  return path2.length > 0 && path2[0] === "/";
}
function isAbsoluteWin(path2) {
  const len = path2.length;
  if (len === 0) return false;
  const code2 = path2.charCodeAt(0);
  if (code2 === 47 || code2 === 92) {
    return true;
  }
  if (code2 >= 65 && code2 <= 90 || code2 >= 97 && code2 <= 122) {
    if (len > 2 && path2.charCodeAt(1) === 58) {
      const code22 = path2.charCodeAt(2);
      if (code22 === 47 || code22 === 92) {
        return true;
      }
    }
  }
  return false;
}
var isWindows = (() => {
  if (isNode) {
    return process.platform === "win32";
  } else if (isDeno) {
    return Deno.build.os === "windows";
  }
  return typeof process !== "undefined" && process.platform === "win32";
})();
var sep = isWindows ? "\\" : "/";
var posix = createPathOps(false);
var win32 = createPathOps(true);
function normalizePath(path2, isWin) {
  if (path2.length === 0) return ".";
  const separator = getSeparator(isWin);
  const isAbsolute = isWin ? isAbsoluteWin(path2) : isAbsolutePosix(path2);
  const trailingSeparator = path2[path2.length - 1] === separator || isWin && path2[path2.length - 1] === "/";
  let normalized = path2.replace(isWin ? /[\/\\]+/g : /\/+/g, separator);
  const parts = normalized.split(separator);
  const result = [];
  for (let i2 = 0; i2 < parts.length; i2++) {
    const part = parts[i2];
    if (part === "" || part === ".") {
      if (i2 === 0 && isAbsolute) result.push("");
      continue;
    }
    if (part === "..") {
      if (result.length > 0 && result[result.length - 1] !== "..") {
        if (!(result.length === 1 && result[0] === "")) {
          result.pop();
        }
      } else if (!isAbsolute) {
        result.push("..");
      }
    } else {
      result.push(part);
    }
  }
  let final = result.join(separator);
  if (final.length === 0) {
    return isAbsolute ? separator : ".";
  }
  if (trailingSeparator && final[final.length - 1] !== separator) {
    final += separator;
  }
  return final;
}
function joinPaths(paths, isWin) {
  if (paths.length === 0) return ".";
  const separator = getSeparator(isWin);
  let joined = "";
  for (let i2 = 0; i2 < paths.length; i2++) {
    const path2 = paths[i2];
    if (path2 && path2.length > 0) {
      if (joined.length === 0) {
        joined = path2;
      } else {
        joined += separator + path2;
      }
    }
  }
  if (joined.length === 0) return ".";
  return normalizePath(joined, isWin);
}
function resolvePaths(paths, isWin) {
  const separator = getSeparator(isWin);
  let resolved = "";
  let isAbsolute = false;
  for (let i2 = paths.length - 1; i2 >= 0 && !isAbsolute; i2--) {
    const path2 = paths[i2];
    if (path2 && path2.length > 0) {
      resolved = path2 + (resolved.length > 0 ? separator + resolved : "");
      isAbsolute = isWin ? isAbsoluteWin(resolved) : isAbsolutePosix(resolved);
    }
  }
  if (!isAbsolute) {
    const cwd = getCwd();
    resolved = cwd + (resolved.length > 0 ? separator + resolved : "");
  }
  return normalizePath(resolved, isWin);
}
function relativePath(from, to, isWin) {
  from = resolvePaths([from], isWin);
  to = resolvePaths([to], isWin);
  if (from === to) return "";
  const separator = getSeparator(isWin);
  const fromParts = from.split(separator).filter((p2) => p2.length > 0);
  const toParts = to.split(separator).filter((p2) => p2.length > 0);
  let commonLength = 0;
  const minLength = Math.min(fromParts.length, toParts.length);
  for (let i2 = 0; i2 < minLength; i2++) {
    if (fromParts[i2] === toParts[i2]) {
      commonLength++;
    } else {
      break;
    }
  }
  const upCount = fromParts.length - commonLength;
  const result = [];
  for (let i2 = 0; i2 < upCount; i2++) {
    result.push("..");
  }
  for (let i2 = commonLength; i2 < toParts.length; i2++) {
    result.push(toParts[i2]);
  }
  return result.join(separator) || ".";
}
function getDirname(path2, isWin) {
  if (path2.length === 0) return ".";
  const separator = getSeparator(isWin);
  const normalized = normalizePath(path2, isWin);
  const lastSepIndex = normalized.lastIndexOf(separator);
  if (lastSepIndex === -1) return ".";
  if (lastSepIndex === 0) return separator;
  return normalized.slice(0, lastSepIndex);
}
function getBasename(path2, ext, isWin) {
  if (path2.length === 0) return "";
  const lastSepIndex = isWin ? findLastSeparator(path2) : path2.lastIndexOf("/");
  let base2 = lastSepIndex === -1 ? path2 : path2.slice(lastSepIndex + 1);
  if (ext && base2.endsWith(ext)) {
    base2 = base2.slice(0, base2.length - ext.length);
  }
  return base2;
}
function getExtname(path2) {
  const lastDotIndex = path2.lastIndexOf(".");
  const lastSepIndex = findLastSeparator(path2);
  if (lastDotIndex === -1 || lastDotIndex < lastSepIndex || lastDotIndex === path2.length - 1) {
    return "";
  }
  return path2.slice(lastDotIndex);
}
function parsePath(path2, isWin) {
  let root = "";
  if (isWin) {
    if (path2.length >= 2 && path2[1] === ":") {
      root = path2.slice(0, 2);
      if (path2.length > 2 && (path2[2] === "\\" || path2[2] === "/")) {
        root += "\\";
      }
    } else if (path2[0] === "\\" || path2[0] === "/") {
      root = "\\";
    }
  } else {
    if (path2[0] === "/") {
      root = "/";
    }
  }
  const dir = getDirname(path2, isWin);
  const base2 = getBasename(path2, void 0, isWin);
  const ext = getExtname(path2);
  const name = ext ? base2.slice(0, base2.length - ext.length) : base2;
  return { root, dir, base: base2, ext, name };
}
function formatPath(pathObject, isWin) {
  const separator = getSeparator(isWin);
  const dir = pathObject.dir || pathObject.root || "";
  const base2 = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) return base2;
  if (dir === pathObject.root) return dir + base2;
  return dir + separator + base2;
}
function normalize(path2) {
  return normalizePath(path2, isWindows);
}
function join(...paths) {
  return joinPaths(paths, isWindows);
}
function resolve(...paths) {
  return resolvePaths(paths, isWindows);
}
function relative(from, to) {
  return relativePath(from, to, isWindows);
}
function dirname(path2) {
  return getDirname(path2, isWindows);
}
function extname(path2) {
  return getExtname(path2);
}

// ../../src/chokidar.ts
init_runtime();
function normalizePath2(path2) {
  return path2.replace(/\\/g, "/");
}
function emitEvent(watcher, eventType, path2) {
  watcher.emit(eventType, path2);
  watcher.emit("all", eventType, path2);
}
function matchesAnyPattern(path2, patterns) {
  return patterns.some((pattern) => matchesPattern(path2, pattern));
}
function handleRenameEvent(watcher, fullPath, fs3) {
  try {
    fs3.statSync(fullPath);
    emitEvent(watcher, "add", fullPath);
  } catch {
    emitEvent(watcher, "unlink", fullPath);
  }
}
function setupFsWatch(watcher, baseDir, patterns, fs3) {
  try {
    const nativeWatcher = fs3.watch(baseDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const fullPath = normalizePath2(`${baseDir}/${filename}`);
      if (!matchesAnyPattern(fullPath, patterns)) return;
      if (eventType === "rename") {
        handleRenameEvent(watcher, fullPath, fs3);
      } else if (eventType === "change") {
        emitEvent(watcher, "change", fullPath);
      }
    });
    watcher._setWatcher(nativeWatcher);
    watcher["_watched"].add(baseDir);
    queueMicrotask(() => watcher.emit("ready"));
  } catch (error) {
    watcher.emit("error", error);
  }
}
var FSWatcher = class extends import_events3.EventEmitter {
  constructor(options2) {
    super();
    this._closed = false;
    this._watched = /* @__PURE__ */ new Set();
    this.options = options2 || {};
  }
  /**
   * Add paths to be watched
   */
  add(paths) {
    if (this._closed) {
      throw new Error("Watcher has been closed");
    }
    const pathArray = Array.isArray(paths) ? paths : [paths];
    if (runtime === "node") {
      if (this._watcher) {
        this._watcher.add(pathArray);
      }
    } else {
      pathArray.forEach((path2) => this._watched.add(path2));
    }
    return this;
  }
  /**
   * Stop watching paths
   */
  unwatch(paths) {
    if (this._closed) {
      return this;
    }
    const pathArray = Array.isArray(paths) ? paths : [paths];
    if (runtime === "node") {
      if (this._watcher) {
        this._watcher.unwatch(pathArray);
      }
    } else {
      pathArray.forEach((path2) => this._watched.delete(path2));
    }
    return this;
  }
  /**
   * Close the watcher
   */
  async close() {
    if (this._closed) {
      return;
    }
    this._closed = true;
    if (runtime === "node") {
      if (this._watcher) {
        await this._watcher.close();
      }
    }
    this.removeAllListeners();
  }
  /**
   * Get watched paths
   */
  getWatched() {
    if (runtime === "node" && this._watcher) {
      return this._watcher.getWatched();
    }
    const result = {};
    this._watched.forEach((path2) => {
      const dir = path2.substring(0, path2.lastIndexOf("/")) || ".";
      const file = path2.substring(path2.lastIndexOf("/") + 1);
      if (!result[dir]) {
        result[dir] = [];
      }
      result[dir].push(file);
    });
    return result;
  }
  /**
   * Internal method to set native watcher
   * @internal
   */
  _setWatcher(watcher) {
    this._watcher = watcher;
  }
};
function getBaseDirectory(pattern) {
  const normalizedPattern = normalizePath2(pattern);
  const parts = normalizedPattern.split(/[\\\/]/);
  let baseDir = "";
  let sawGlob = false;
  for (const part of parts) {
    if (part.includes("*") || part.includes("?")) {
      sawGlob = true;
      break;
    }
    baseDir = baseDir ? `${baseDir}/${part}` : part;
  }
  if (sawGlob) {
    return baseDir || ".";
  }
  if (normalizedPattern && existsSync(normalizedPattern)) {
    try {
      return statSync(normalizedPattern).isDirectory() ? normalizedPattern : normalizePath2(dirname(normalizedPattern)) || ".";
    } catch {
      return normalizePath2(dirname(normalizedPattern)) || ".";
    }
  }
  const lastSegment = parts[parts.length - 1] || "";
  if (lastSegment.includes(".") && !lastSegment.startsWith(".")) {
    return normalizePath2(dirname(normalizedPattern)) || ".";
  }
  return normalizedPattern || ".";
}
function matchesPattern(filePath, pattern) {
  const regexPattern = normalizePath2(pattern).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".");
  const regex = new RegExp(`^${regexPattern}$`);
  const normalizedPath = normalizePath2(filePath);
  return regex.test(normalizedPath);
}
function watch(paths, options2) {
  const watcher = new FSWatcher(options2);
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const watchMap = /* @__PURE__ */ new Map();
  pathArray.forEach((path2) => {
    const baseDir = getBaseDirectory(path2);
    if (!watchMap.has(baseDir)) {
      watchMap.set(baseDir, []);
    }
    watchMap.get(baseDir).push(path2);
  });
  if (runtime === "node") {
    const fs3 = require("fs");
    watchMap.forEach((patterns, baseDir) => setupFsWatch(watcher, baseDir, patterns, fs3));
  } else if (runtime === "bun") {
    const fs3 = require("fs");
    watchMap.forEach((patterns, baseDir) => setupFsWatch(watcher, baseDir, patterns, fs3));
  } else if (runtime === "deno") {
    const baseDirs = Array.from(watchMap.keys());
    const allPatterns = Array.from(watchMap.values()).flat();
    (async () => {
      try {
        const denoWatcher = Deno.watchFs(baseDirs);
        for await (const event of denoWatcher) {
          if (watcher["_closed"]) break;
          for (const path2 of event.paths) {
            const normalizedPath = normalizePath2(path2);
            if (!matchesAnyPattern(normalizedPath, allPatterns)) continue;
            switch (event.kind) {
              case "create":
                emitEvent(watcher, "add", path2);
                break;
              case "modify":
                emitEvent(watcher, "change", path2);
                break;
              case "remove":
                emitEvent(watcher, "unlink", path2);
                break;
            }
          }
        }
      } catch (error) {
        if (!watcher["_closed"]) {
          watcher.emit("error", error);
        }
      }
    })();
    pathArray.forEach((path2) => watcher.add(path2));
    queueMicrotask(() => watcher.emit("ready"));
  }
  return watcher;
}

// node_modules/elit/src/server.ts
init_fs();

// ../../src/mime-types.ts
init_runtime();
var MIME_TYPES = {
  // Text
  "txt": "text/plain",
  "html": "text/html",
  "htm": "text/html",
  "css": "text/css",
  "js": "text/javascript",
  "mjs": "text/javascript",
  "json": "application/json",
  "xml": "application/xml",
  "csv": "text/csv",
  "md": "text/markdown",
  "markdown": "text/x-markdown",
  // Images
  "png": "image/png",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "gif": "image/gif",
  "svg": "image/svg+xml",
  "webp": "image/webp",
  "ico": "image/x-icon",
  "bmp": "image/bmp",
  "tiff": "image/tiff",
  "tif": "image/tiff",
  // Audio
  "mp3": "audio/mpeg",
  "wav": "audio/wav",
  "ogg": "audio/ogg",
  "aac": "audio/aac",
  "m4a": "audio/mp4",
  "flac": "audio/flac",
  // Video
  "mp4": "video/mp4",
  "webm": "video/webm",
  "avi": "video/x-msvideo",
  "mov": "video/quicktime",
  "mkv": "video/x-matroska",
  "flv": "video/x-flv",
  // Application
  "pdf": "application/pdf",
  "zip": "application/zip",
  "gz": "application/gzip",
  "tar": "application/x-tar",
  "rar": "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  // Documents
  "doc": "application/msword",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "xls": "application/vnd.ms-excel",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "ppt": "application/vnd.ms-powerpoint",
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Fonts
  "woff": "font/woff",
  "woff2": "font/woff2",
  "ttf": "font/ttf",
  "otf": "font/otf",
  "eot": "application/vnd.ms-fontobject",
  // Web
  "wasm": "application/wasm",
  "manifest": "application/manifest+json",
  // Binary
  "bin": "application/octet-stream",
  "exe": "application/x-msdownload",
  "dll": "application/x-msdownload",
  // TypeScript/Modern JS
  "ts": "text/typescript",
  "tsx": "text/tsx",
  "jsx": "text/jsx"
};
var TYPE_TO_EXTENSIONS = {};
for (const ext in MIME_TYPES) {
  const type = MIME_TYPES[ext];
  if (!TYPE_TO_EXTENSIONS[type]) {
    TYPE_TO_EXTENSIONS[type] = [];
  }
  TYPE_TO_EXTENSIONS[type].push(ext);
}
function getExtension(path2) {
  const match = /\.([^./\\]+)$/.exec(path2);
  return match ? match[1].toLowerCase() : "";
}
function lookup(path2) {
  const ext = getExtension(path2) || path2.toLowerCase();
  return MIME_TYPES[ext] || false;
}

// node_modules/elit/src/server.ts
init_runtime();

// ../../src/render-context.ts
var RUNTIME_TARGET_KEY = "__ELIT_RUNTIME_TARGET__";
var CAPTURED_RENDER_KEY = "__ELIT_CAPTURED_RENDER__";
var RUNTIME_TARGET_ENV = "ELIT_RUNTIME_TARGET";
function getGlobalRenderScope() {
  return globalThis;
}
function isRenderRuntimeTarget(value) {
  return value === "web" || value === "desktop" || value === "mobile" || value === "unknown";
}
function detectRenderRuntimeTarget() {
  const globalScope = getGlobalRenderScope();
  const explicitTarget = globalScope[RUNTIME_TARGET_KEY] ?? globalScope.process?.env?.[RUNTIME_TARGET_ENV];
  if (isRenderRuntimeTarget(explicitTarget)) {
    return explicitTarget;
  }
  if (typeof globalScope.document !== "undefined" && typeof globalScope.window !== "undefined") {
    return "web";
  }
  if (typeof globalScope.createWindow === "function") {
    return "desktop";
  }
  const argv = Array.isArray(globalScope.process?.argv) ? globalScope.process.argv.join(" ") : "";
  if (/\bdesktop\b/i.test(argv)) {
    return "desktop";
  }
  if (/\b(mobile|native)\b/i.test(argv)) {
    return "mobile";
  }
  return "unknown";
}
function captureRenderedVNode(rootElement, vNode, target = detectRenderRuntimeTarget()) {
  const globalScope = getGlobalRenderScope();
  globalScope[RUNTIME_TARGET_KEY] = target;
  globalScope[CAPTURED_RENDER_KEY] = {
    rootElement,
    target,
    vNode
  };
}

// ../../src/dom.ts
function resolveElement(rootElement) {
  return typeof rootElement === "string" ? document.getElementById(rootElement.replace("#", "")) : rootElement;
}
function ensureElement(el, rootElement) {
  if (!el) {
    throw new Error(`Element not found: ${rootElement}`);
  }
  return el;
}
function shouldSkipChild(child) {
  return child == null || child === false;
}
function isPrimitiveJson(json2) {
  return json2 == null || typeof json2 === "boolean" || typeof json2 === "string" || typeof json2 === "number";
}
function normalizeFormControlValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(",");
  }
  return value == null ? "" : String(value);
}
function resolveTextareaValue(tagName, props) {
  return tagName === "textarea" && props.value != null ? normalizeFormControlValue(props.value) : void 0;
}
function hasDocumentApi() {
  return typeof document !== "undefined";
}
var DomNode = class {
  constructor() {
    this.elementCache = /* @__PURE__ */ new WeakMap();
    this.reactiveNodes = /* @__PURE__ */ new Map();
  }
  createElement(tagName, props = {}, children = []) {
    return { tagName, props, children };
  }
  renderToDOM(vNode, parent) {
    if (vNode == null || vNode === false) return;
    if (typeof vNode !== "object") {
      parent.appendChild(document.createTextNode(String(vNode)));
      return;
    }
    if (this.isState(vNode)) {
      const textNode2 = document.createTextNode(String(vNode.value ?? ""));
      parent.appendChild(textNode2);
      vNode.subscribe((newValue) => {
        textNode2.textContent = String(newValue ?? "");
      });
      return;
    }
    if (Array.isArray(vNode)) {
      for (const child of vNode) {
        this.renderToDOM(child, parent);
      }
      return;
    }
    const { tagName, props, children } = vNode;
    const textareaValue = resolveTextareaValue(tagName, props);
    if (!tagName) {
      for (const child of children) {
        if (shouldSkipChild(child)) continue;
        if (Array.isArray(child)) {
          for (const c of child) {
            !shouldSkipChild(c) && this.renderToDOM(c, parent);
          }
        } else {
          this.renderToDOM(child, parent);
        }
      }
      return;
    }
    const isSVG = tagName === "svg" || tagName[0] === "s" && tagName[1] === "v" && tagName[2] === "g" || parent.namespaceURI === "http://www.w3.org/2000/svg";
    const el = isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tagName.replace("svg", "").toLowerCase() || tagName) : document.createElement(tagName);
    for (const key in props) {
      const value = props[key];
      if (value == null || value === false) continue;
      const c = key.charCodeAt(0);
      if (c === 99 && (key.length < 6 || key[5] === "N")) {
        const classValue = Array.isArray(value) ? value.join(" ") : value;
        isSVG ? el.setAttribute("class", classValue) : el.className = classValue;
      } else if (c === 115 && key.length === 5) {
        if (typeof value === "string") {
          el.style.cssText = value;
        } else {
          const s2 = el.style;
          for (const k in value) s2[k] = value[k];
        }
      } else if (c === 111 && key.charCodeAt(1) === 110) {
        el[key.toLowerCase()] = value;
      } else if (c === 100 && key.length > 20) {
        el.innerHTML = value.__html;
      } else if (c === 114 && key === "ref") {
        setTimeout(() => {
          typeof value === "function" ? value(el) : value.current = el;
        }, 0);
      } else if (textareaValue !== void 0 && key === "value") {
        continue;
      } else {
        el.setAttribute(key, value === true ? "" : String(value));
      }
    }
    const renderableChildren = textareaValue === void 0 ? children : [];
    const len = renderableChildren.length;
    if (!len) {
      if (textareaValue !== void 0) {
        el.value = textareaValue;
      }
      parent.appendChild(el);
      return;
    }
    const renderChildren = (target) => {
      for (let i2 = 0; i2 < len; i2++) {
        const child = renderableChildren[i2];
        if (shouldSkipChild(child)) continue;
        if (Array.isArray(child)) {
          for (let j = 0, cLen = child.length; j < cLen; j++) {
            const c = child[j];
            !shouldSkipChild(c) && this.renderToDOM(c, target);
          }
        } else {
          this.renderToDOM(child, target);
        }
      }
    };
    if (len > 30) {
      const fragment2 = document.createDocumentFragment();
      renderChildren(fragment2);
      el.appendChild(fragment2);
    } else {
      renderChildren(el);
    }
    parent.appendChild(el);
  }
  render(rootElement, vNode) {
    if (!hasDocumentApi()) {
      const runtimeTarget = detectRenderRuntimeTarget();
      if (runtimeTarget === "desktop" || runtimeTarget === "mobile") {
        captureRenderedVNode(rootElement, vNode, runtimeTarget);
        return {};
      }
      throw new Error("render() requires a DOM or an Elit desktop/mobile runtime target.");
    }
    const el = ensureElement(resolveElement(rootElement), rootElement);
    el.innerHTML = "";
    if (vNode.children && vNode.children.length > 500) {
      const fragment2 = document.createDocumentFragment();
      this.renderToDOM(vNode, fragment2);
      el.appendChild(fragment2);
    } else {
      this.renderToDOM(vNode, el);
    }
    return el;
  }
  batchRender(rootElement, vNodes) {
    const el = ensureElement(resolveElement(rootElement), rootElement);
    const len = vNodes.length;
    if (len > 3e3) {
      const fragment2 = document.createDocumentFragment();
      let processed = 0;
      const chunkSize = 1500;
      const processChunk = () => {
        const end = Math.min(processed + chunkSize, len);
        for (let i2 = processed; i2 < end; i2++) {
          this.renderToDOM(vNodes[i2], fragment2);
        }
        processed = end;
        if (processed >= len) {
          el.appendChild(fragment2);
        } else {
          requestAnimationFrame(processChunk);
        }
      };
      processChunk();
    } else {
      const fragment2 = document.createDocumentFragment();
      for (let i2 = 0; i2 < len; i2++) {
        this.renderToDOM(vNodes[i2], fragment2);
      }
      el.appendChild(fragment2);
    }
    return el;
  }
  renderChunked(rootElement, vNodes, chunkSize = 5e3, onProgress) {
    const el = ensureElement(resolveElement(rootElement), rootElement);
    const len = vNodes.length;
    let index = 0;
    const renderChunk = () => {
      const end = Math.min(index + chunkSize, len);
      const fragment2 = document.createDocumentFragment();
      for (let i2 = index; i2 < end; i2++) {
        this.renderToDOM(vNodes[i2], fragment2);
      }
      el.appendChild(fragment2);
      index = end;
      if (onProgress) onProgress(index, len);
      if (index < len) {
        requestAnimationFrame(renderChunk);
      }
    };
    requestAnimationFrame(renderChunk);
    return el;
  }
  renderToHead(...vNodes) {
    const head2 = document.head;
    if (head2) {
      for (const vNode of vNodes.flat()) {
        vNode && this.renderToDOM(vNode, head2);
      }
    }
    return head2;
  }
  addStyle(cssText) {
    const el = document.createElement("style");
    el.textContent = cssText;
    return document.head.appendChild(el);
  }
  addMeta(attrs) {
    const el = document.createElement("meta");
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return document.head.appendChild(el);
  }
  addLink(attrs) {
    const el = document.createElement("link");
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return document.head.appendChild(el);
  }
  setTitle(text) {
    return document.title = text;
  }
  // Reactive State Management
  createState(initialValue, options2 = {}) {
    let value = initialValue;
    const listeners = /* @__PURE__ */ new Set();
    let updateTimer = null;
    const { throttle = 0, deep = false } = options2;
    const notify = () => listeners.forEach((fn) => fn(value));
    const scheduleUpdate = () => {
      if (throttle > 0) {
        if (!updateTimer) {
          updateTimer = setTimeout(() => {
            updateTimer = null;
            notify();
          }, throttle);
        }
      } else {
        notify();
      }
    };
    return {
      get value() {
        return value;
      },
      set value(newValue) {
        const changed = deep ? JSON.stringify(value) !== JSON.stringify(newValue) : value !== newValue;
        if (changed) {
          value = newValue;
          scheduleUpdate();
        }
      },
      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      destroy() {
        listeners.clear();
        updateTimer && clearTimeout(updateTimer);
      }
    };
  }
  computed(states, computeFn) {
    const values = states.map((s2) => s2.value);
    const result = this.createState(computeFn(...values));
    states.forEach((state, index) => {
      state.subscribe((newValue) => {
        values[index] = newValue;
        result.value = computeFn(...values);
      });
    });
    return result;
  }
  effect(stateFn) {
    stateFn();
  }
  // Virtual scrolling helper for large lists
  createVirtualList(container, items, renderItem, itemHeight = 50, bufferSize = 5) {
    const viewportHeight = container.clientHeight;
    const totalHeight = items.length * itemHeight;
    let scrollTop = 0;
    const getVisibleRange = () => {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
      const end = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize);
      return { start, end };
    };
    const render2 = () => {
      const { start, end } = getVisibleRange();
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `height:${totalHeight}px;position:relative`;
      for (let i2 = start; i2 < end; i2++) {
        const itemEl = document.createElement("div");
        itemEl.style.cssText = `position:absolute;top:${i2 * itemHeight}px;height:${itemHeight}px;width:100%`;
        this.renderToDOM(renderItem(items[i2], i2), itemEl);
        wrapper.appendChild(itemEl);
      }
      container.innerHTML = "";
      container.appendChild(wrapper);
    };
    const scrollHandler = () => {
      scrollTop = container.scrollTop;
      requestAnimationFrame(render2);
    };
    container.addEventListener("scroll", scrollHandler);
    render2();
    return {
      render: render2,
      destroy: () => {
        container.removeEventListener("scroll", scrollHandler);
        container.innerHTML = "";
      }
    };
  }
  // Lazy load components
  lazy(loadFn) {
    let component = null;
    let loading = false;
    return async (...args) => {
      if (!component && !loading) {
        loading = true;
        component = await loadFn();
        loading = false;
      }
      return component ? component(...args) : { tagName: "div", props: { class: "loading" }, children: ["Loading..."] };
    };
  }
  // Memory management - cleanup unused elements
  cleanupUnusedElements(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const toRemove = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.id && node.id.startsWith("r") && !this.elementCache.has(node)) {
        toRemove.push(node);
      }
    }
    toRemove.forEach((el) => el.remove());
    return toRemove.length;
  }
  // Server-Side Rendering - convert VNode to HTML string
  renderToString(vNode, options2 = {}) {
    const { pretty = false, indent = 0 } = options2;
    const indentStr = pretty ? "  ".repeat(indent) : "";
    const newLine = pretty ? "\n" : "";
    let resolvedVNode = this.resolveStateValue(vNode);
    resolvedVNode = this.unwrapReactive(resolvedVNode);
    if (Array.isArray(resolvedVNode)) {
      return resolvedVNode.map((child) => this.renderToString(child, options2)).join("");
    }
    if (typeof resolvedVNode !== "object" || resolvedVNode === null) {
      if (resolvedVNode === null || resolvedVNode === void 0 || resolvedVNode === false) {
        return "";
      }
      return this.escapeHtml(String(resolvedVNode));
    }
    const { tagName, props, children } = resolvedVNode;
    const textareaValue = resolveTextareaValue(tagName, props);
    const isSelfClosing = this.isSelfClosingTag(tagName);
    let html2 = `${indentStr}<${tagName}`;
    const attrs = this.propsToAttributes(props, tagName);
    if (attrs) {
      html2 += ` ${attrs}`;
    }
    if (isSelfClosing) {
      html2 += ` />${newLine}`;
      return html2;
    }
    html2 += ">";
    if (textareaValue !== void 0) {
      html2 += this.escapeHtml(textareaValue);
      html2 += `</${tagName}>${newLine}`;
      return html2;
    }
    if (props.dangerouslySetInnerHTML) {
      html2 += props.dangerouslySetInnerHTML.__html;
      html2 += `</${tagName}>${newLine}`;
      return html2;
    }
    if (children && children.length > 0) {
      const resolvedChildren = children.map((c) => {
        const resolved = this.resolveStateValue(c);
        return this.unwrapReactive(resolved);
      });
      const hasComplexChildren = resolvedChildren.some(
        (c) => typeof c === "object" && c !== null && !Array.isArray(c) && "tagName" in c
      );
      if (pretty && hasComplexChildren) {
        html2 += newLine;
        for (const child of resolvedChildren) {
          if (shouldSkipChild(child)) continue;
          if (Array.isArray(child)) {
            for (const c of child) {
              if (!shouldSkipChild(c)) {
                html2 += this.renderToString(c, { pretty, indent: indent + 1 });
              }
            }
          } else {
            html2 += this.renderToString(child, { pretty, indent: indent + 1 });
          }
        }
        html2 += indentStr;
      } else {
        for (const child of resolvedChildren) {
          if (shouldSkipChild(child)) continue;
          if (Array.isArray(child)) {
            for (const c of child) {
              if (!shouldSkipChild(c)) {
                html2 += this.renderToString(c, { pretty: false, indent: 0 });
              }
            }
          } else {
            html2 += this.renderToString(child, { pretty: false, indent: 0 });
          }
        }
      }
    }
    html2 += `</${tagName}>${newLine}`;
    return html2;
  }
  resolveStateValue(value) {
    if (value && typeof value === "object" && "value" in value && "subscribe" in value) {
      return value.value;
    }
    return value;
  }
  isReactiveWrapper(vNode) {
    if (!vNode || typeof vNode !== "object" || !vNode.tagName) {
      return false;
    }
    return vNode.tagName === "span" && vNode.props?.id && typeof vNode.props.id === "string" && vNode.props.id.match(/^r[a-z0-9]{9}$/);
  }
  unwrapReactive(vNode) {
    if (!this.isReactiveWrapper(vNode)) {
      return vNode;
    }
    const children = vNode.children;
    if (!children || children.length === 0) {
      return "";
    }
    if (children.length === 1) {
      const child = children[0];
      if (child && typeof child === "object" && child.tagName === "span") {
        const props = child.props;
        const hasNoProps = !props || Object.keys(props).length === 0;
        const hasSingleStringChild = child.children && child.children.length === 1 && typeof child.children[0] === "string";
        if (hasNoProps && hasSingleStringChild) {
          return child.children[0];
        }
      }
      return this.unwrapReactive(child);
    }
    return children.map((c) => this.unwrapReactive(c));
  }
  escapeHtml(text) {
    const htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;"
    };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }
  isSelfClosingTag(tagName) {
    const selfClosingTags = /* @__PURE__ */ new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ]);
    return selfClosingTags.has(tagName.toLowerCase());
  }
  propsToAttributes(props, tagName) {
    const attrs = [];
    for (const key in props) {
      if (key === "children" || key === "dangerouslySetInnerHTML" || key === "ref" || tagName === "textarea" && key === "value") {
        continue;
      }
      let value = props[key];
      value = this.resolveStateValue(value);
      if (value == null || value === false) continue;
      if (key.startsWith("on") && typeof value === "function") {
        continue;
      }
      if (key === "className" || key === "class") {
        const className = Array.isArray(value) ? value.join(" ") : value;
        if (className) {
          attrs.push(`class="${this.escapeHtml(String(className))}"`);
        }
        continue;
      }
      if (key === "style") {
        const styleStr = this.styleToString(value);
        if (styleStr) {
          attrs.push(`style="${this.escapeHtml(styleStr)}"`);
        }
        continue;
      }
      if (value === true) {
        attrs.push(key);
        continue;
      }
      attrs.push(`${key}="${this.escapeHtml(String(value))}"`);
    }
    return attrs.join(" ");
  }
  styleToString(style2) {
    if (typeof style2 === "string") {
      return style2;
    }
    if (typeof style2 === "object" && style2 !== null) {
      const styles = [];
      for (const key in style2) {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        styles.push(`${cssKey}:${style2[key]}`);
      }
      return styles.join(";");
    }
    return "";
  }
  isState(value) {
    return value && typeof value === "object" && "value" in value && "subscribe" in value && typeof value.subscribe === "function";
  }
  createReactiveChild(state, renderFn) {
    const currentValue = renderFn(state.value);
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const entry = { node: null, renderFn };
      this.reactiveNodes.set(state, entry);
      state.subscribe(() => {
        if (entry.node && entry.node.parentNode) {
          const newValue = renderFn(state.value);
          entry.node.textContent = String(newValue ?? "");
        }
      });
    }
    return currentValue;
  }
  jsonToVNode(json2) {
    if (this.isState(json2)) {
      return this.createReactiveChild(json2, (v) => v);
    }
    if (isPrimitiveJson(json2)) {
      return json2;
    }
    const { tag, attributes = {}, children } = json2;
    const props = {};
    for (const key in attributes) {
      const value = attributes[key];
      if (key === "class") {
        props.className = this.isState(value) ? value.value : value;
      } else {
        props[key] = this.isState(value) ? value.value : value;
      }
    }
    const childrenArray = [];
    if (children != null) {
      if (Array.isArray(children)) {
        for (const child of children) {
          if (this.isState(child)) {
            childrenArray.push(this.createReactiveChild(child, (v) => v));
          } else {
            const converted = this.jsonToVNode(child);
            if (converted != null && converted !== false) {
              childrenArray.push(converted);
            }
          }
        }
      } else if (this.isState(children)) {
        childrenArray.push(this.createReactiveChild(children, (v) => v));
      } else if (typeof children === "object" && "tag" in children) {
        const converted = this.jsonToVNode(children);
        if (converted != null && converted !== false) {
          childrenArray.push(converted);
        }
      } else {
        childrenArray.push(children);
      }
    }
    return { tagName: tag, props, children: childrenArray };
  }
  vNodeJsonToVNode(json2) {
    if (this.isState(json2)) {
      return this.createReactiveChild(json2, (v) => v);
    }
    if (isPrimitiveJson(json2)) {
      return json2;
    }
    const { tagName, props = {}, children = [] } = json2;
    const resolvedProps = {};
    for (const key in props) {
      const value = props[key];
      resolvedProps[key] = this.isState(value) ? value.value : value;
    }
    const childrenArray = [];
    for (const child of children) {
      if (this.isState(child)) {
        childrenArray.push(this.createReactiveChild(child, (v) => v));
      } else {
        const converted = this.vNodeJsonToVNode(child);
        if (converted != null && converted !== false) {
          childrenArray.push(converted);
        }
      }
    }
    return { tagName, props: resolvedProps, children: childrenArray };
  }
  renderJson(rootElement, json2) {
    const vNode = this.jsonToVNode(json2);
    if (!vNode || typeof vNode !== "object" || !("tagName" in vNode)) {
      throw new Error("Invalid JSON structure");
    }
    return this.render(rootElement, vNode);
  }
  renderVNode(rootElement, json2) {
    const vNode = this.vNodeJsonToVNode(json2);
    if (!vNode || typeof vNode !== "object" || !("tagName" in vNode)) {
      throw new Error("Invalid VNode JSON structure");
    }
    return this.render(rootElement, vNode);
  }
  renderJsonToString(json2, options2 = {}) {
    const vNode = this.jsonToVNode(json2);
    return this.renderToString(vNode, options2);
  }
  renderVNodeToString(json2, options2 = {}) {
    const vNode = this.vNodeJsonToVNode(json2);
    return this.renderToString(vNode, options2);
  }
  // Generate complete HTML document as string (for SSR)
  renderToHTMLDocument(vNode, options2 = {}) {
    const { title: title2 = "", meta: meta2 = [], links = [], scripts = [], styles = [], lang = "en", head: head2 = "", bodyAttrs = {}, pretty = false } = options2;
    const nl = pretty ? "\n" : "";
    const indent = pretty ? "  " : "";
    const indent2 = pretty ? "    " : "";
    let html2 = `<!DOCTYPE html>${nl}<html lang="${lang}">${nl}${indent}<head>${nl}${indent2}<meta charset="UTF-8">${nl}${indent2}<meta name="viewport" content="width=device-width, initial-scale=1.0">${nl}`;
    if (title2) html2 += `${indent2}<title>${this.escapeHtml(title2)}</title>${nl}`;
    for (const m of meta2) {
      html2 += `${indent2}<meta`;
      for (const k in m) html2 += ` ${k}="${this.escapeHtml(m[k])}"`;
      html2 += `>${nl}`;
    }
    for (const l of links) {
      html2 += `${indent2}<link`;
      for (const k in l) html2 += ` ${k}="${this.escapeHtml(l[k])}"`;
      html2 += `>${nl}`;
    }
    for (const s2 of styles) {
      if (s2.href) {
        html2 += `${indent2}<link rel="stylesheet" href="${this.escapeHtml(s2.href)}">${nl}`;
      } else if (s2.content) {
        html2 += `${indent2}<style>${s2.content}</style>${nl}`;
      }
    }
    if (head2) html2 += head2 + nl;
    html2 += `${indent}</head>${nl}${indent}<body`;
    for (const k in bodyAttrs) html2 += ` ${k}="${this.escapeHtml(bodyAttrs[k])}"`;
    html2 += `>${nl}`;
    html2 += this.renderToString(vNode, { pretty, indent: 2 });
    for (const script2 of scripts) {
      html2 += `${indent2}<script`;
      if (script2.type) html2 += ` type="${this.escapeHtml(script2.type)}"`;
      if (script2.async) html2 += ` async`;
      if (script2.defer) html2 += ` defer`;
      if (script2.src) {
        html2 += ` src="${this.escapeHtml(script2.src)}"></script>${nl}`;
      } else if (script2.content) {
        html2 += `>${script2.content}</script>${nl}`;
      } else {
        html2 += `></script>${nl}`;
      }
    }
    html2 += `${indent}</body>${nl}</html>`;
    return html2;
  }
  // Expose elementCache for reactive updates
  getElementCache() {
    return this.elementCache;
  }
};
var dom = new DomNode();
var render = dom.render.bind(dom);
var renderToString = dom.renderToString.bind(dom);

// node_modules/elit/src/server.ts
var stripTypeScriptTypes2 = typeof nodeModule.stripTypeScriptTypes === "function" ? nodeModule.stripTypeScriptTypes : void 0;
var cachedNodeEsbuildTransformSync;
function stripBrowserTypeScriptSource(source2, filename) {
  if (!stripTypeScriptTypes2) {
    throw new Error(`TypeScript dev server transpilation requires Node.js 22+ or the esbuild package (${filename}).`);
  }
  const originalEmitWarning = process.emitWarning;
  try {
    process.emitWarning = ((warning, ...args) => {
      if (typeof warning === "string" && warning.includes("stripTypeScriptTypes")) {
        return;
      }
      return originalEmitWarning.call(process, warning, ...args);
    });
    return stripTypeScriptTypes2(source2, {
      mode: "transform",
      sourceUrl: filename
    });
  } finally {
    process.emitWarning = originalEmitWarning;
  }
}
async function getNodeEsbuildTransformSync() {
  if (cachedNodeEsbuildTransformSync !== void 0) {
    return cachedNodeEsbuildTransformSync;
  }
  try {
    const esbuildModule = await import("esbuild");
    cachedNodeEsbuildTransformSync = typeof esbuildModule.transformSync === "function" ? esbuildModule.transformSync.bind(esbuildModule) : null;
  } catch {
    cachedNodeEsbuildTransformSync = null;
  }
  return cachedNodeEsbuildTransformSync;
}
async function transpileNodeBrowserModule(source2, options2) {
  const compileWithEsbuild = async () => {
    const esbuildTransformSync = await getNodeEsbuildTransformSync();
    if (!esbuildTransformSync) {
      const runtimeLabel = options2.loader === "tsx" ? "TSX" : "TypeScript";
      throw new Error(`${runtimeLabel} dev server transpilation requires the esbuild package (${options2.filename}).`);
    }
    if (options2.mode === "preview") {
      const { default: JavaScriptObfuscator } = await import("javascript-obfuscator");
      const tsResult = esbuildTransformSync(source2, {
        loader: options2.loader,
        format: "esm",
        target: "es2020",
        sourcemap: false
      });
      return JavaScriptObfuscator.obfuscate(tsResult.code, {
        compact: true,
        renameGlobals: false
      }).getObfuscatedCode();
    }
    return esbuildTransformSync(source2, {
      loader: options2.loader,
      format: "esm",
      target: "es2020",
      sourcemap: "inline"
    }).code;
  };
  if (options2.loader === "ts") {
    try {
      const stripped = stripBrowserTypeScriptSource(source2, options2.filename);
      if (options2.mode === "preview") {
        const { default: JavaScriptObfuscator } = await import("javascript-obfuscator");
        return JavaScriptObfuscator.obfuscate(stripped, {
          compact: true,
          renameGlobals: false
        }).getObfuscatedCode();
      }
      return stripped;
    } catch {
      return compileWithEsbuild();
    }
  }
  return compileWithEsbuild();
}
var ServerRouter = class {
  constructor() {
    __publicField(this, "routes", []);
    __publicField(this, "middlewares", []);
    // Express-like .all() method - matches all HTTP methods
    __publicField(this, "all", (path2, ...handlers) => this.addRoute("ALL", path2, handlers));
    // Support per-route middleware: accept middleware(s) before the final handler
    __publicField(this, "get", (path2, ...handlers) => this.addRoute("GET", path2, handlers));
    __publicField(this, "post", (path2, ...handlers) => this.addRoute("POST", path2, handlers));
    __publicField(this, "put", (path2, ...handlers) => this.addRoute("PUT", path2, handlers));
    __publicField(this, "delete", (path2, ...handlers) => this.addRoute("DELETE", path2, handlers));
    __publicField(this, "patch", (path2, ...handlers) => this.addRoute("PATCH", path2, handlers));
    __publicField(this, "options", (path2, ...handlers) => this.addRoute("OPTIONS", path2, handlers));
    __publicField(this, "head", (path2, ...handlers) => this.addRoute("HEAD", path2, handlers));
  }
  // Accept both internal Middleware and Express-style `(req, res, next?)` functions
  // Also support path-based middleware like Express: use(path, middleware)
  use(...args) {
    if (typeof args[0] === "string") {
      const path2 = args[0];
      const middlewares = args.slice(1);
      return this.addRoute("ALL", path2, middlewares);
    }
    const mw = args[0];
    this.middlewares.push(this.toMiddleware(mw));
    return this;
  }
  // Convert Express-like handler/middleware to internal Middleware
  toMiddleware(fn) {
    if (fn.length === 2 && fn.name !== "bound ") {
    }
    return async (ctx, next) => {
      const f = fn;
      if (f.length >= 3) {
        const expressNext = () => {
          void next();
        };
        const res = f(ctx.req, ctx.res, expressNext);
        if (res && typeof res.then === "function") await res;
        return;
      }
      if (f.length === 2) {
        const res = f(ctx.req, ctx.res);
        if (res && typeof res.then === "function") await res;
        await next();
        return;
      }
      const out = fn(ctx);
      if (out && typeof out.then === "function") await out;
      await next();
    };
  }
  addRoute(method, path2, handlers) {
    const { pattern, paramNames } = this.pathToRegex(path2);
    if (!handlers || handlers.length === 0) throw new Error("Route must include a handler");
    const rawMiddlewares = handlers.slice(0, handlers.length - 1);
    const rawLast = handlers[handlers.length - 1];
    const middlewares = rawMiddlewares.map((h) => this.toMiddleware(h));
    const last = (() => {
      const f = rawLast;
      if (typeof f !== "function") throw new Error("Route handler must be a function");
      if (f.length >= 2) {
        return async (ctx) => {
          if (f.length >= 3) {
            await new Promise((resolve4) => {
              try {
                f(ctx.req, ctx.res, () => resolve4());
              } catch (e) {
                resolve4();
              }
            });
          } else {
            const res = f(ctx.req, ctx.res);
            if (res && typeof res.then === "function") await res;
          }
        };
      }
      return f;
    })();
    this.routes.push({ method, pattern, paramNames, handler: last, middlewares });
    return this;
  }
  pathToRegex(path2) {
    const paramNames = [];
    const pattern = path2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/").replace(/:(\w+)/g, (_, name) => (paramNames.push(name), "([^\\/]+)"));
    return { pattern: new RegExp(`^${pattern}$`), paramNames };
  }
  parseQuery(url) {
    const query = {};
    const queryString = url.split("?")[1];
    if (!queryString) return query;
    queryString.split("&").forEach((p2) => {
      const [k, v] = p2.split("=");
      if (k) {
        query[k] = v !== void 0 ? v : "";
      }
    });
    return query;
  }
  /**
   * List all registered routes for debugging
   */
  listRoutes() {
    return this.routes.map((route) => ({
      method: route.method,
      pattern: route.pattern.source,
      paramNames: route.paramNames,
      handler: route.handler.name || "(anonymous)"
    }));
  }
  async parseBody(req) {
    if (typeof req.text === "function") {
      try {
        const text = await req.text();
        if (!text) return {};
        const contentType = req.headers["content-type"];
        const ct = (Array.isArray(contentType) ? contentType[0] : contentType || "").toLowerCase();
        if (ct.includes("application/json") || ct.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }
        if (ct.includes("application/x-www-form-urlencoded") || ct.includes("urlencoded")) {
          return Object.fromEntries(new URLSearchParams(text));
        }
        return text;
      } catch (e) {
        console.log("[ServerRouter] Bun body parse error:", e);
        return {};
      }
    }
    return new Promise((resolve4, reject) => {
      const contentLengthHeader = req.headers["content-length"];
      const contentLength = parseInt(Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : contentLengthHeader || "0", 10);
      if (contentLength === 0) {
        resolve4({});
        return;
      }
      const chunks = [];
      req.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      req.on("end", () => {
        const body2 = Buffer.concat(chunks).toString();
        try {
          const ct = req.headers["content-type"] || "";
          resolve4(ct.includes("json") ? body2 ? JSON.parse(body2) : {} : ct.includes("urlencoded") ? Object.fromEntries(new URLSearchParams(body2)) : body2);
        } catch (e) {
          reject(e);
        }
      });
      req.on("error", reject);
    });
  }
  async handle(req, res) {
    const method = req.method, url = req.url || "/", path2 = url.split("?")[0];
    for (const route of this.routes) {
      if (route.method !== "ALL" && route.method !== method) continue;
      if (!route.pattern.test(path2)) continue;
      const match = path2.match(route.pattern);
      const params = Object.fromEntries(route.paramNames.map((name, i3) => [name, match[i3 + 1]]));
      let body2 = {};
      if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
          body2 = await this.parseBody(req);
          req.body = body2;
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end('{"error":"Invalid request body"}');
          return true;
        }
      }
      const query = this.parseQuery(url);
      req.query = query;
      req.params = params;
      let _statusCode = 200;
      const elitRes = res;
      elitRes.status = function(code2) {
        _statusCode = code2;
        return this;
      };
      elitRes.json = function(data2, statusCode) {
        const code2 = statusCode !== void 0 ? statusCode : _statusCode;
        this.writeHead(code2, { "Content-Type": "application/json" });
        this.end(JSON.stringify(data2));
        return this;
      };
      elitRes.send = function(data2) {
        if (typeof data2 === "string") {
          this.writeHead(_statusCode, { "Content-Type": "text/html" });
          this.end(data2);
        } else {
          this.writeHead(_statusCode, { "Content-Type": "application/json" });
          this.end(JSON.stringify(data2));
        }
        return this;
      };
      const ctx = {
        req,
        res: elitRes,
        params,
        query,
        body: body2,
        headers: req.headers
      };
      const routeMiddlewares = route.middlewares || [];
      const chain = [
        ...this.middlewares,
        ...routeMiddlewares,
        async (c, n) => {
          await route.handler(c, n);
        }
      ];
      let i2 = 0;
      const next = async () => {
        if (i2 >= chain.length) return;
        const mw = chain[i2++];
        await mw(ctx, next);
      };
      try {
        await next();
      } catch (e) {
        console.error("[ServerRouter] Route error:", e);
        !res.headersSent && (res.writeHead(500, { "Content-Type": "application/json" }), res.end(JSON.stringify({ error: "Internal Server Error", message: e instanceof Error ? e.message : "Unknown" })));
      }
      return true;
    }
    return false;
  }
};
var json = (res, data2, status = 200) => (res.writeHead(status, { "Content-Type": "application/json" }), res.end(JSON.stringify(data2)));
var sendError = (res, code2, msg) => {
  res.writeHead(code2, { "Content-Type": "text/plain" });
  res.end(msg);
};
var send404 = (res, msg = "Not Found") => sendError(res, 404, msg);
var send403 = (res, msg = "Forbidden") => sendError(res, 403, msg);
var send500 = (res, msg = "Internal Server Error") => sendError(res, 500, msg);
async function resolveWorkspaceElitImportBasePath(rootDir, basePath, mode) {
  const resolvedRootDir = await realpath(resolve(rootDir));
  try {
    const packageJsonBuffer = await readFile(join(resolvedRootDir, "package.json"));
    const packageJson = JSON.parse(packageJsonBuffer.toString());
    if (packageJson.name === "elit") {
      const workspaceDir = mode === "dev" ? "src" : "dist";
      return basePath ? `${basePath}/${workspaceDir}` : `/${workspaceDir}`;
    }
  } catch {
  }
  return void 0;
}
var createElitImportMap = async (rootDir, basePath = "", mode = "dev") => {
  const workspaceImportBasePath = await resolveWorkspaceElitImportBasePath(rootDir, basePath, mode);
  const fileExt = mode === "dev" ? ".ts" : ".js";
  const elitImports = workspaceImportBasePath ? {
    "elit": `${workspaceImportBasePath}/index${fileExt}`,
    "elit/": `${workspaceImportBasePath}/`,
    "elit/dom": `${workspaceImportBasePath}/dom${fileExt}`,
    "elit/state": `${workspaceImportBasePath}/state${fileExt}`,
    "elit/style": `${workspaceImportBasePath}/style${fileExt}`,
    "elit/el": `${workspaceImportBasePath}/el${fileExt}`,
    "elit/universal": `${workspaceImportBasePath}/universal${fileExt}`,
    "elit/router": `${workspaceImportBasePath}/router${fileExt}`,
    "elit/hmr": `${workspaceImportBasePath}/hmr${fileExt}`,
    "elit/types": `${workspaceImportBasePath}/types${fileExt}`,
    "elit/native": `${workspaceImportBasePath}/native${fileExt}`
  } : {};
  const externalImports = await generateExternalImportMaps(rootDir, basePath);
  const allImports = { ...externalImports, ...elitImports };
  return `<script type="importmap">${JSON.stringify({ imports: allImports }, null, 2)}</script>`;
};
var ELIT_INTERNAL_WS_PATH = "/__elit_ws";
var createHMRScript = (port) => `<script>(function(){let ws;let retries=0;let maxRetries=5;const protocol=window.location.protocol==='https:'?'wss://':'ws://';function connect(){ws=new WebSocket(protocol+window.location.hostname+':${port}${ELIT_INTERNAL_WS_PATH}');ws.onopen=()=>{console.log('[Elit HMR] Connected');retries=0};ws.onmessage=(e)=>{const d=JSON.parse(e.data);if(d.type==='update'){console.log('[Elit HMR] File updated:',d.path);window.location.reload()}else if(d.type==='reload'){console.log('[Elit HMR] Reloading...');window.location.reload()}else if(d.type==='error')console.error('[Elit HMR] Error:',d.error)};ws.onclose=()=>{if(retries<maxRetries){retries++;setTimeout(connect,1000*retries)}else if(retries===maxRetries){console.log('[Elit HMR] Connection closed. Start dev server to reconnect.')}};ws.onerror=()=>{ws.close()}}connect()})();</script>`;
var rewriteRelativePaths = (html2, basePath) => {
  if (!basePath) return html2;
  html2 = html2.replace(/(<script[^>]+src=["'])(?!https?:\/\/|\/)(\.\/)?([^"']+)(["'])/g, `$1${basePath}/$3$4`);
  html2 = html2.replace(/(<link[^>]+href=["'])(?!https?:\/\/|\/)(\.\/)?([^"']+)(["'])/g, `$1${basePath}/$3$4`);
  return html2;
};
var normalizeBasePath = (basePath) => basePath && basePath !== "/" ? basePath : "";
var normalizeWebSocketPath = (path2) => {
  let normalizedPath = path2.trim();
  if (!normalizedPath) {
    return "/";
  }
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  return normalizedPath;
};
var getRequestPath2 = (url) => {
  const [pathname = "/"] = url.split("?");
  return pathname || "/";
};
var parseRequestQuery = (url) => {
  const query = {};
  const queryString = url.split("?")[1];
  if (!queryString) {
    return query;
  }
  for (const entry of queryString.split("&")) {
    if (!entry) {
      continue;
    }
    const [rawKey, rawValue = ""] = entry.split("=");
    if (!rawKey) {
      continue;
    }
    query[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
  }
  return query;
};
var normalizeWebSocketEndpoints = (endpoints, basePath = "") => {
  const normalizedBasePath = normalizeBasePath(basePath);
  return (endpoints || []).map((endpoint) => {
    const normalizedPath = normalizeWebSocketPath(endpoint.path);
    const fullPath = !normalizedBasePath ? normalizedPath : normalizedPath === normalizedBasePath || normalizedPath.startsWith(`${normalizedBasePath}/`) ? normalizedPath : normalizedPath === "/" ? normalizedBasePath : `${normalizedBasePath}${normalizedPath}`;
    return {
      path: fullPath,
      handler: endpoint.handler
    };
  });
};
var requestAcceptsGzip = (acceptEncoding) => {
  if (Array.isArray(acceptEncoding)) {
    return acceptEncoding.some((value) => /\bgzip\b/i.test(value));
  }
  return typeof acceptEncoding === "string" && /\bgzip\b/i.test(acceptEncoding);
};
async function findSpecialDir(startDir, targetDir) {
  let currentDir = startDir;
  const maxLevels = 5;
  for (let i2 = 0; i2 < maxLevels; i2++) {
    const targetPath = resolve(currentDir, targetDir);
    try {
      const stats = await stat(targetPath);
      if (stats.isDirectory()) {
        return currentDir;
      }
    } catch {
    }
    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return null;
}
var importMapCache = /* @__PURE__ */ new Map();
function clearImportMapCache() {
  importMapCache.clear();
}
function toBuffer(content) {
  return typeof content === "string" ? Buffer.from(content) : content;
}
function createTransformCacheKey(filePath, mode, query) {
  return `${mode}:${query}:${filePath}`;
}
function getValidTransformCacheEntry(transformCache, cacheKey, stats) {
  const entry = transformCache.get(cacheKey);
  if (!entry) {
    return void 0;
  }
  if (entry.mtimeMs === stats.mtimeMs && entry.size === stats.size) {
    return entry;
  }
  transformCache.delete(cacheKey);
  return void 0;
}
async function generateExternalImportMaps(rootDir, basePath = "") {
  const cacheKey = `${rootDir}:${basePath}`;
  if (importMapCache.has(cacheKey)) {
    return importMapCache.get(cacheKey);
  }
  const importMap = {};
  const nodeModulesPath = await findNodeModules(rootDir);
  if (!nodeModulesPath) {
    importMapCache.set(cacheKey, importMap);
    return importMap;
  }
  try {
    const { readdir: readdir2 } = await Promise.resolve().then(() => (init_fs(), fs_exports));
    const packages = await readdir2(nodeModulesPath);
    for (const pkgEntry of packages) {
      const pkg = typeof pkgEntry === "string" ? pkgEntry : pkgEntry.name;
      if (pkg.startsWith(".")) continue;
      if (pkg.startsWith("@")) {
        try {
          const scopedPackages = await readdir2(join(nodeModulesPath, pkg));
          for (const scopedEntry of scopedPackages) {
            const scopedPkg = typeof scopedEntry === "string" ? scopedEntry : scopedEntry.name;
            const fullPkgName = `${pkg}/${scopedPkg}`;
            await processPackage(nodeModulesPath, fullPkgName, importMap, basePath);
          }
        } catch {
        }
      } else {
        await processPackage(nodeModulesPath, pkg, importMap, basePath);
      }
    }
  } catch (error) {
    console.error("[Import Maps] Error scanning node_modules:", error);
  }
  importMapCache.set(cacheKey, importMap);
  return importMap;
}
async function findNodeModules(startDir) {
  const foundDir = await findSpecialDir(startDir, "node_modules");
  return foundDir ? join(foundDir, "node_modules") : null;
}
function isBrowserCompatible(pkgName, pkgJson) {
  const buildTools = [
    "typescript",
    "esbuild",
    "@esbuild/",
    "tsx",
    "tsup",
    "rollup",
    "vite",
    "webpack",
    "parcel",
    "terser",
    "uglify",
    "babel",
    "@babel/",
    "postcss",
    "autoprefixer",
    "cssnano",
    "sass",
    "less",
    "stylus"
  ];
  const nodeOnly = [
    "node-",
    "@node-",
    "fsevents",
    "chokidar",
    "express",
    "koa",
    "fastify",
    "nest",
    "commander",
    "yargs",
    "inquirer",
    "chalk",
    "ora",
    "nodemon",
    "pm2",
    "dotenv"
  ];
  const testingTools = [
    "jest",
    "vitest",
    "mocha",
    "chai",
    "jasmine",
    "@jest/",
    "@testing-library/",
    "@vitest/",
    "playwright",
    "puppeteer",
    "cypress"
  ];
  const linters = [
    "eslint",
    "@eslint/",
    "prettier",
    "tslint",
    "stylelint",
    "commitlint"
  ];
  const typeDefinitions = [
    "@types/",
    "@typescript-eslint/"
  ];
  const utilities = [
    "get-tsconfig",
    "resolve-pkg-maps",
    "pkg-types",
    "fast-glob",
    "globby",
    "micromatch",
    "execa",
    "cross-spawn",
    "shelljs"
  ];
  const skipPatterns = [
    ...buildTools,
    ...nodeOnly,
    ...testingTools,
    ...linters,
    ...typeDefinitions,
    ...utilities
  ];
  if (skipPatterns.some((pattern) => pkgName.startsWith(pattern))) {
    return false;
  }
  if (pkgName === "lodash") {
    return false;
  }
  if (pkgJson.browser || pkgJson.module) {
    return true;
  }
  if (pkgJson.exports) {
    const exportsStr = JSON.stringify(pkgJson.exports);
    if (exportsStr.includes('"import"') || exportsStr.includes('"browser"')) {
      return true;
    }
  }
  if (pkgJson.type === "commonjs" && !pkgJson.module && !pkgJson.browser) {
    return false;
  }
  return !!(pkgJson.exports || pkgJson.type === "module" || pkgJson.module);
}
async function processPackage(nodeModulesPath, pkgName, importMap, basePath) {
  const pkgPath = join(nodeModulesPath, pkgName);
  const pkgJsonPath = join(pkgPath, "package.json");
  try {
    const pkgJsonContent = await readFile(pkgJsonPath);
    const pkgJson = JSON.parse(pkgJsonContent.toString());
    if (!isBrowserCompatible(pkgName, pkgJson)) {
      return;
    }
    const baseUrl = basePath ? `${basePath}/node_modules/${pkgName}` : `/node_modules/${pkgName}`;
    if (pkgJson.exports) {
      processExportsField(pkgName, pkgJson.exports, baseUrl, importMap);
    } else {
      const entryPoint = pkgJson.browser || pkgJson.module || pkgJson.main || "index.js";
      importMap[pkgName] = `${baseUrl}/${entryPoint}`;
      importMap[`${pkgName}/`] = `${baseUrl}/`;
    }
  } catch {
  }
}
function processExportsField(pkgName, exports2, baseUrl, importMap) {
  if (typeof exports2 === "string") {
    importMap[pkgName] = `${baseUrl}/${exports2}`;
    importMap[`${pkgName}/`] = `${baseUrl}/`;
    return;
  }
  if (typeof exports2 === "object" && exports2 !== null) {
    if ("." in exports2) {
      const dotExport = exports2["."];
      const resolved = resolveExport(dotExport);
      if (resolved) {
        importMap[pkgName] = `${baseUrl}/${resolved}`;
      }
    } else if ("import" in exports2) {
      const resolved = resolveExport(exports2);
      if (resolved) {
        importMap[pkgName] = `${baseUrl}/${resolved}`;
      }
    }
    for (const [key, value] of Object.entries(exports2)) {
      if (key === "." || key === "import" || key === "require" || key === "types" || key === "default") {
        continue;
      }
      const resolved = resolveExport(value);
      if (resolved) {
        const cleanKey = key.startsWith("./") ? key.slice(2) : key;
        const importName = cleanKey ? `${pkgName}/${cleanKey}` : pkgName;
        importMap[importName] = `${baseUrl}/${resolved}`;
      }
    }
    importMap[`${pkgName}/`] = `${baseUrl}/`;
  }
}
function resolveExport(exportValue) {
  if (typeof exportValue === "string") {
    return exportValue.startsWith("./") ? exportValue.slice(2) : exportValue;
  }
  if (typeof exportValue === "object" && exportValue !== null) {
    const resolved = exportValue.import || exportValue.browser || exportValue.default || exportValue.require;
    if (typeof resolved === "object" && resolved !== null) {
      return resolveExport(resolved);
    }
    if (typeof resolved === "string") {
      return resolved.startsWith("./") ? resolved.slice(2) : resolved;
    }
  }
  return null;
}
function rewritePath(path2, pathRewrite) {
  if (!pathRewrite) return path2;
  for (const [from, to] of Object.entries(pathRewrite)) {
    const regex = new RegExp(from);
    if (regex.test(path2)) {
      return path2.replace(regex, to);
    }
  }
  return path2;
}
function createProxyHandler(proxyConfigs) {
  return async (req, res) => {
    const url = req.url || "/";
    const path2 = url.split("?")[0];
    const proxy = proxyConfigs.find((p2) => path2.startsWith(p2.context));
    if (!proxy) return false;
    const { target, changeOrigin, pathRewrite, headers } = proxy;
    try {
      const targetUrl = new URL(target);
      const isHttps = targetUrl.protocol === "https:";
      const requestLib = isHttps ? request2 : request;
      let proxyPath = rewritePath(url, pathRewrite);
      const proxyUrl = `${isHttps ? "https" : "http"}://${targetUrl.hostname}:${targetUrl.port || (isHttps ? 443 : 80)}${proxyPath}`;
      const proxyReqHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== void 0) {
          proxyReqHeaders[key] = value;
        }
      }
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (value !== void 0) {
            proxyReqHeaders[key] = value;
          }
        }
      }
      if (changeOrigin) {
        proxyReqHeaders.host = targetUrl.host;
      } else {
        delete proxyReqHeaders["host"];
      }
      const proxyReqOptions = {
        method: req.method,
        headers: proxyReqHeaders
      };
      const proxyReq = requestLib(proxyUrl, proxyReqOptions, (proxyRes) => {
        const outgoingHeaders = {};
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (value !== void 0) {
            outgoingHeaders[key] = value;
          }
        }
        res.writeHead(proxyRes.statusCode || 200, outgoingHeaders);
        proxyRes.on("data", (chunk) => res.write(chunk));
        proxyRes.on("end", () => res.end());
      });
      proxyReq.on("error", (error) => {
        console.error("[Proxy] Error proxying %s to %s:", url, target, error.message);
        if (!res.headersSent) {
          json(res, { error: "Bad Gateway", message: "Proxy error" }, 502);
        }
      });
      req.on("data", (chunk) => proxyReq.write(chunk));
      req.on("end", () => proxyReq.end());
      return true;
    } catch (error) {
      console.error("[Proxy] Invalid proxy configuration for %s:", path2, error);
      return false;
    }
  };
}
var SharedState = class {
  constructor(key, options2) {
    this.key = key;
    __publicField(this, "_value");
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "changeHandlers", /* @__PURE__ */ new Set());
    __publicField(this, "options");
    this.options = options2;
    this._value = options2.initial;
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
    __publicField(this, "states", /* @__PURE__ */ new Map());
  }
  create(key, options2) {
    if (this.states.has(key)) return this.states.get(key);
    const state = new SharedState(key, options2);
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
    if (state) state.value = value;
  }
  keys() {
    return Array.from(this.states.keys());
  }
  clear() {
    this.states.forEach((state) => state.clear());
    this.states.clear();
  }
};
var defaultOptions = {
  port: 3e3,
  host: "localhost",
  https: false,
  open: true,
  standalone: false,
  outDir: "dev-dist",
  outFile: "index.js",
  watch: ["**/*.ts", "**/*.js", "**/*.html", "**/*.css"],
  ignore: ["node_modules/**", "dist/**", ".git/**", "**/*.d.ts"],
  logging: true,
  worker: [],
  mode: "dev"
};
function shouldUseClientFallbackRoot(primaryRoot, fallbackRoot, indexPath) {
  if (!fallbackRoot) {
    return false;
  }
  const resolvedPrimaryRoot = resolve(primaryRoot);
  const resolvedFallbackRoot = resolve(fallbackRoot);
  if (!existsSync(resolvedFallbackRoot)) {
    return false;
  }
  const normalizedIndexPath = (indexPath || "/index.html").replace(/^\//, "");
  const primaryHasRuntimeSources = existsSync(join(resolvedPrimaryRoot, "src")) || existsSync(join(resolvedPrimaryRoot, "public")) || existsSync(join(resolvedPrimaryRoot, normalizedIndexPath));
  return !primaryHasRuntimeSources;
}
function createDevServer(options2) {
  const config = { ...defaultOptions, ...options2 };
  const wsClients = /* @__PURE__ */ new Set();
  const stateManager = new StateManager();
  const transformCache = /* @__PURE__ */ new Map();
  if (config.mode === "dev") {
    clearImportMapCache();
  }
  const usesClientArray = Boolean(config.clients?.length);
  const clientsToNormalize = usesClientArray ? config.clients : config.root ? [{ root: config.root, fallbackRoot: config.fallbackRoot, basePath: config.basePath || "", index: config.index, ssr: config.ssr, api: config.api, proxy: config.proxy, ws: config.ws, mode: config.mode }] : null;
  if (!clientsToNormalize) throw new Error('DevServerOptions must include either "clients" array or "root" directory');
  const normalizedClients = clientsToNormalize.map((client2) => {
    let basePath = client2.basePath || "";
    if (basePath) {
      while (basePath.startsWith("/")) basePath = basePath.slice(1);
      while (basePath.endsWith("/")) basePath = basePath.slice(0, -1);
      basePath = basePath ? "/" + basePath : "";
    }
    let indexPath = client2.index;
    if (indexPath) {
      indexPath = indexPath.replace(/^\.\//, "/");
      if (!indexPath.startsWith("/")) {
        indexPath = "/" + indexPath;
      }
    }
    const useFallbackRoot = shouldUseClientFallbackRoot(client2.root, client2.fallbackRoot, indexPath);
    const activeRoot = useFallbackRoot ? client2.fallbackRoot || client2.root : client2.root;
    return {
      root: activeRoot,
      basePath,
      index: useFallbackRoot ? void 0 : indexPath,
      ssr: useFallbackRoot ? void 0 : client2.ssr,
      api: client2.api,
      ws: normalizeWebSocketEndpoints(client2.ws, basePath),
      proxyHandler: client2.proxy ? createProxyHandler(client2.proxy) : void 0,
      mode: client2.mode || "dev"
    };
  });
  const globalWebSocketEndpoints = usesClientArray ? normalizeWebSocketEndpoints(config.ws) : [];
  const normalizedWebSocketEndpoints = [...normalizedClients.flatMap((client2) => client2.ws), ...globalWebSocketEndpoints];
  const seenWebSocketPaths = /* @__PURE__ */ new Set();
  for (const endpoint of normalizedWebSocketEndpoints) {
    if (endpoint.path === ELIT_INTERNAL_WS_PATH) {
      throw new Error(`WebSocket path "${ELIT_INTERNAL_WS_PATH}" is reserved for Elit internals`);
    }
    if (seenWebSocketPaths.has(endpoint.path)) {
      throw new Error(`Duplicate WebSocket endpoint path: ${endpoint.path}`);
    }
    seenWebSocketPaths.add(endpoint.path);
  }
  const globalProxyHandler = config.proxy ? createProxyHandler(config.proxy) : null;
  const server2 = createServer(async (req, res) => {
    const originalUrl = req.url || "/";
    const hostHeader = req.headers.host;
    const hostName = hostHeader ? (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader).split(":")[0] : "";
    if (config.domain && hostName === (config.host || "localhost")) {
      const redirectUrl = `http://${config.domain}${originalUrl}`;
      if (config.logging) {
        console.log(`[Domain Map] ${hostName}:${config.port}${originalUrl} -> ${redirectUrl}`);
      }
      res.writeHead(302, { Location: redirectUrl });
      res.end();
      return;
    }
    const matchedClient = normalizedClients.find((c) => c.basePath && originalUrl.startsWith(c.basePath)) || normalizedClients.find((c) => !c.basePath);
    if (!matchedClient) return send404(res, "404 Not Found");
    if (matchedClient.proxyHandler) {
      try {
        const proxied = await matchedClient.proxyHandler(req, res);
        if (proxied) {
          if (config.logging) console.log(`[Proxy] ${req.method} ${originalUrl} -> proxied (client-specific)`);
          return;
        }
      } catch (error) {
        console.error("[Proxy] Error (client-specific):", error);
      }
    }
    if (globalProxyHandler) {
      try {
        const proxied = await globalProxyHandler(req, res);
        if (proxied) {
          if (config.logging) console.log(`[Proxy] ${req.method} ${originalUrl} -> proxied (global)`);
          return;
        }
      } catch (error) {
        console.error("[Proxy] Error (global):", error);
      }
    }
    const url = matchedClient.basePath ? originalUrl.slice(matchedClient.basePath.length) || "/" : originalUrl;
    if (matchedClient.api) {
      if (matchedClient.basePath) req.url = url;
      const handled = await matchedClient.api.handle(req, res);
      if (matchedClient.basePath) req.url = originalUrl;
      if (handled) return;
    }
    if (config.api) {
      const handled = await config.api.handle(req, res);
      if (handled) return;
    }
    if ((matchedClient.api || config.api) && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method || "")) {
      if (!res.headersSent) {
        if (config.logging) console.log(`[405] ${req.method} ${url} - Method not allowed`);
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method Not Allowed", message: "No API route found for this request" }));
      }
      return;
    }
    let filePath;
    if (url === "/" && config.mode !== "preview" && matchedClient.ssr && !matchedClient.index) {
      return await serveSSR(res, matchedClient);
    } else {
      filePath = url === "/" ? matchedClient.index || "/index.html" : url;
    }
    filePath = filePath.split("?")[0];
    if (config.logging && filePath === "/src/pages") {
      console.log(`[DEBUG] Request for /src/pages received`);
    }
    if (filePath.includes("\0")) {
      if (config.logging) console.log(`[403] Rejected path with null byte: ${filePath}`);
      return send403(res, "403 Forbidden");
    }
    const isDistRequest = filePath.startsWith("/dist/");
    const isNodeModulesRequest = filePath.startsWith("/node_modules/");
    let normalizedPath;
    const tempPath = normalize(filePath).replace(/\\/g, "/").replace(/^\/+/, "");
    if (tempPath.includes("..")) {
      if (config.logging) console.log(`[403] Path traversal attempt: ${filePath}`);
      return send403(res, "403 Forbidden");
    }
    normalizedPath = tempPath;
    const rootDir = await realpath(resolve(matchedClient.root));
    let baseDir = rootDir;
    if (isDistRequest || isNodeModulesRequest) {
      const targetDir = isDistRequest ? "dist" : "node_modules";
      const foundDir = await findSpecialDir(matchedClient.root, targetDir);
      baseDir = foundDir ? await realpath(foundDir) : rootDir;
    }
    let fullPath;
    try {
      const unresolvedPath = resolve(join(baseDir, normalizedPath));
      if (!unresolvedPath.startsWith(baseDir.endsWith(sep) ? baseDir : baseDir + sep)) {
        if (config.logging) console.log(`[403] File access outside of root (before symlink): ${unresolvedPath}`);
        return send403(res, "403 Forbidden");
      }
      fullPath = await realpath(unresolvedPath);
      if (config.logging && filePath === "/src/pages") {
        console.log(`[DEBUG] Initial resolve succeeded: ${fullPath}`);
      }
    } catch (firstError) {
      let resolvedPath;
      if (config.logging && !normalizedPath.includes(".")) {
        console.log(`[DEBUG] File not found: ${normalizedPath}, trying extensions...`);
      }
      if (normalizedPath.endsWith(".js")) {
        const tsPath = normalizedPath.replace(/\.js$/, ".ts");
        try {
          const tsFullPath = await realpath(resolve(join(baseDir, tsPath)));
          if (!tsFullPath.startsWith(baseDir.endsWith(sep) ? baseDir : baseDir + sep)) {
            if (config.logging) console.log(`[403] Fallback TS path outside of root: ${tsFullPath}`);
            return send403(res, "403 Forbidden");
          }
          resolvedPath = tsFullPath;
        } catch {
        }
      }
      if (!resolvedPath && !normalizedPath.includes(".")) {
        try {
          resolvedPath = await realpath(resolve(join(baseDir, normalizedPath + ".ts")));
          if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}.ts`);
        } catch {
          try {
            resolvedPath = await realpath(resolve(join(baseDir, normalizedPath + ".js")));
            if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}.js`);
          } catch {
            try {
              resolvedPath = await realpath(resolve(join(baseDir, normalizedPath, "index.ts")));
              if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}/index.ts`);
            } catch {
              try {
                resolvedPath = await realpath(resolve(join(baseDir, normalizedPath, "index.js")));
                if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}/index.js`);
              } catch {
                if (config.logging) console.log(`[DEBUG] Not found: all attempts failed for ${normalizedPath}`);
              }
            }
          }
        }
      }
      if (!resolvedPath) {
        if (!res.headersSent) {
          if (filePath === "/index.html" && matchedClient.ssr) {
            return await serveSSR(res, matchedClient);
          }
          if (config.logging) console.log(`[404] ${filePath}`);
          return send404(res, "404 Not Found");
        }
        return;
      }
      fullPath = resolvedPath;
    }
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        if (config.logging) console.log(`[DEBUG] Path is directory: ${fullPath}, trying index files...`);
        let indexPath;
        try {
          indexPath = await realpath(resolve(join(fullPath, "index.ts")));
          if (config.logging) console.log(`[DEBUG] Found index.ts in directory`);
        } catch {
          try {
            indexPath = await realpath(resolve(join(fullPath, "index.js")));
            if (config.logging) console.log(`[DEBUG] Found index.js in directory`);
          } catch {
            if (config.logging) console.log(`[DEBUG] No index file found in directory`);
            if (matchedClient.ssr) {
              return await serveSSR(res, matchedClient);
            }
            return send404(res, "404 Not Found");
          }
        }
        fullPath = indexPath;
      }
    } catch (statError) {
      if (config.logging) console.log(`[404] ${filePath}`);
      return send404(res, "404 Not Found");
    }
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        try {
          const indexPath = await realpath(resolve(join(fullPath, "index.html")));
          if (!indexPath.startsWith(rootDir + sep) && indexPath !== rootDir) {
            return send403(res, "403 Forbidden");
          }
          await stat(indexPath);
          return serveFile(indexPath, req, res, matchedClient, isDistRequest || isNodeModulesRequest);
        } catch {
          return send404(res, "404 Not Found");
        }
      }
      await serveFile(fullPath, req, res, matchedClient, isDistRequest || isNodeModulesRequest);
    } catch (error) {
      if (!res.headersSent) {
        if (config.logging) console.log(`[404] ${filePath}`);
        send404(res, "404 Not Found");
      }
    }
  });
  async function serveFile(filePath, req, res, client2, isNodeModulesOrDist = false) {
    function escapeForTemplateLiteral(input2) {
      return input2.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    }
    try {
      const rootDir = await realpath(resolve(client2.root));
      const unresolvedPath = resolve(filePath);
      if (!isNodeModulesOrDist) {
        if (!unresolvedPath.startsWith(rootDir + sep) && unresolvedPath !== rootDir) {
          if (config.logging) console.log(`[403] Attempted to serve file outside allowed directories: ${filePath}`);
          return send403(res, "403 Forbidden");
        }
      }
      let resolvedPath;
      try {
        resolvedPath = await realpath(unresolvedPath);
        if (isNodeModulesOrDist && resolvedPath) {
          if (config.logging && !resolvedPath.startsWith(rootDir + sep)) {
            console.log(`[DEBUG] Serving symlinked file: ${resolvedPath}`);
          }
        }
      } catch {
        if (filePath.endsWith("index.html") && client2.ssr) {
          return await serveSSR(res, client2);
        }
        return send404(res, "404 Not Found");
      }
      const ext = extname(resolvedPath);
      const urlQuery = req.url?.split("?")[1] || "";
      const isInlineCSS = urlQuery.includes("inline");
      const cacheableTransform = ext === ".ts" || ext === ".tsx" || ext === ".css" && isInlineCSS;
      const resolvedStats = cacheableTransform ? await stat(resolvedPath) : void 0;
      let mimeType = lookup(resolvedPath) || "application/octet-stream";
      let content;
      if (cacheableTransform && resolvedStats) {
        const cacheKey = createTransformCacheKey(resolvedPath, config.mode, urlQuery);
        const cachedTransform = getValidTransformCacheEntry(transformCache, cacheKey, resolvedStats);
        if (cachedTransform) {
          content = cachedTransform.content;
          mimeType = cachedTransform.mimeType;
        } else {
          const sourceContent = toBuffer(await readFile(resolvedPath));
          if (ext === ".css" && isInlineCSS) {
            const cssContent = escapeForTemplateLiteral(sourceContent.toString());
            const jsModule = `
const css = \`${cssContent}\`;
const style = document.createElement('style');
style.setAttribute('data-file', '${filePath}');
style.textContent = css;
document.head.appendChild(style);
export default css;
`;
            content = Buffer.from(jsModule);
            mimeType = "application/javascript";
          } else {
            try {
              let transpiled;
              if (isDeno) {
                const result = await Deno.emit(resolvedPath, {
                  check: false,
                  compilerOptions: {
                    sourceMap: config.mode !== "preview",
                    inlineSourceMap: config.mode !== "preview",
                    target: "ES2020",
                    module: "esnext"
                  },
                  sources: {
                    [resolvedPath]: sourceContent.toString()
                  }
                });
                transpiled = result.files[resolvedPath.replace(/\.tsx?$/, ".js")] || "";
              } else if (isBun) {
                const transpiler = new Bun.Transpiler({
                  loader: ext === ".tsx" ? "tsx" : "ts",
                  target: "browser"
                });
                transpiled = transpiler.transformSync(sourceContent.toString());
              } else {
                transpiled = await transpileNodeBrowserModule(sourceContent.toString(), {
                  filename: resolvedPath,
                  loader: ext === ".tsx" ? "tsx" : "ts",
                  mode: config.mode
                });
              }
              transpiled = transpiled.replace(
                /from\s+["']([^"']+)\.ts(x?)["']/g,
                (_, path2, tsx) => `from "${path2}.js${tsx}"`
              );
              transpiled = transpiled.replace(
                /import\s+["']([^"']+)\.ts(x?)["']/g,
                (_, path2, tsx) => `import "${path2}.js${tsx}"`
              );
              transpiled = transpiled.replace(
                /import\s+["']([^"']+\.css)["']/g,
                (_, path2) => `import "${path2}?inline"`
              );
              transpiled = transpiled.replace(
                /from\s+["']([^"']+\.css)["']/g,
                (_, path2) => `from "${path2}?inline"`
              );
              content = Buffer.from(transpiled);
              mimeType = "application/javascript";
            } catch (error) {
              if (config.logging) console.error("[500] TypeScript compilation error:", error);
              return send500(res, `TypeScript compilation error:
${error}`);
            }
          }
          transformCache.set(cacheKey, {
            content,
            mimeType,
            mtimeMs: resolvedStats.mtimeMs,
            size: resolvedStats.size
          });
        }
      } else {
        content = toBuffer(await readFile(resolvedPath));
      }
      if (ext === ".html") {
        const hmrScript = config.mode !== "preview" ? createHMRScript(config.port) : "";
        let html2 = content.toString();
        let ssrStyles = "";
        if (client2.ssr) {
          try {
            const result = client2.ssr();
            let ssrHtml;
            if (typeof result === "string") {
              ssrHtml = result;
            } else if (typeof result === "object" && result !== null && "tagName" in result) {
              ssrHtml = dom.renderToString(result);
            } else {
              ssrHtml = String(result);
            }
            const styleMatches = ssrHtml.match(/<style[^>]*>[\s\S]*?<\/style>/g);
            if (styleMatches) {
              ssrStyles = styleMatches.join("\n");
            }
          } catch (error) {
            if (config.logging) console.error("[Warning] Failed to extract styles from SSR:", error);
          }
        }
        const basePath = normalizeBasePath(client2.basePath);
        html2 = rewriteRelativePaths(html2, basePath);
        if (client2.basePath && client2.basePath !== "/") {
          const baseTag = `<base href="${client2.basePath}/">`;
          if (!html2.includes("<base")) {
            if (html2.includes('<meta name="viewport"')) {
              html2 = html2.replace(
                /<meta name="viewport"[^>]*>/,
                (match) => `${match}
  ${baseTag}`
              );
            } else if (html2.includes("<head>")) {
              html2 = html2.replace("<head>", `<head>
  ${baseTag}`);
            }
          }
        }
        const elitImportMap = await createElitImportMap(client2.root, basePath, client2.mode);
        const modeScript = config.mode === "preview" ? "<script>window.__ELIT_MODE__='preview';</script>" : "";
        const headInjection = `${modeScript}${ssrStyles ? "\n" + ssrStyles : ""}
${elitImportMap}`;
        html2 = html2.includes("</head>") ? html2.replace("</head>", `${headInjection}</head>`) : html2;
        html2 = html2.includes("</body>") ? html2.replace("</body>", `${hmrScript}</body>`) : html2 + hmrScript;
        content = Buffer.from(html2);
      }
      const cacheControl = ext === ".html" || ext === ".ts" || ext === ".tsx" ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable";
      const headers = {
        "Content-Type": mimeType,
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      };
      const compressible = /^(text\/|application\/(javascript|json|xml))/.test(mimeType);
      const acceptsGzip = requestAcceptsGzip(req.headers["accept-encoding"]);
      if (compressible) {
        headers["Vary"] = "Accept-Encoding";
      }
      if (!isBun && acceptsGzip && compressible && content.length > 1024) {
        const { gzipSync } = require("zlib");
        const compressed = gzipSync(content);
        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = compressed.length;
        res.writeHead(200, headers);
        res.end(compressed);
      } else {
        res.writeHead(200, headers);
        res.end(content);
      }
      if (config.logging) console.log(`[200] ${relative(client2.root, filePath)}`);
    } catch (error) {
      if (config.logging) console.error("[500] Error reading file:", error);
      send500(res, "500 Internal Server Error");
    }
  }
  async function serveSSR(res, client2) {
    try {
      if (!client2.ssr) {
        return send500(res, "SSR function not configured");
      }
      const result = client2.ssr();
      let html2;
      if (typeof result === "string") {
        html2 = result;
      } else if (typeof result === "object" && result !== null && "tagName" in result) {
        const vnode = result;
        if (vnode.tagName === "html") {
          html2 = dom.renderToString(vnode);
        } else {
          html2 = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${dom.renderToString(vnode)}</body></html>`;
        }
      } else {
        html2 = String(result);
      }
      const basePath = normalizeBasePath(client2.basePath);
      html2 = rewriteRelativePaths(html2, basePath);
      const hmrScript = config.mode !== "preview" ? createHMRScript(config.port) : "";
      const elitImportMap = await createElitImportMap(client2.root, basePath, client2.mode);
      const modeScript = config.mode === "preview" ? "<script>window.__ELIT_MODE__='preview';</script>\n" : "";
      html2 = html2.includes("</head>") ? html2.replace("</head>", `${modeScript}${elitImportMap}</head>`) : html2;
      html2 = html2.includes("</body>") ? html2.replace("</body>", `${hmrScript}</body>`) : html2 + hmrScript;
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      });
      res.end(html2);
      if (config.logging) console.log(`[200] SSR rendered`);
    } catch (error) {
      if (config.logging) console.error("[500] SSR Error:", error);
      send500(res, "500 SSR Error");
    }
  }
  const wss = new WebSocketServer({ server: server2, path: ELIT_INTERNAL_WS_PATH });
  const webSocketServers = [wss];
  if (config.logging) {
    console.log(`[WebSocket] Internal server initialized at ${ELIT_INTERNAL_WS_PATH}`);
  }
  wss.on("connection", (ws, req) => {
    wsClients.add(ws);
    const message = { type: "connected", timestamp: Date.now() };
    ws.send(JSON.stringify(message));
    if (config.logging) {
      console.log("[WebSocket] Internal client connected from", req.socket.remoteAddress);
    }
    ws.on("message", (data2) => {
      try {
        const msg = JSON.parse(data2.toString());
        if (msg.type === "state:subscribe") {
          stateManager.subscribe(msg.key, ws);
          if (config.logging) {
            console.log(`[State] Client subscribed to "${msg.key}"`);
          }
        } else if (msg.type === "state:unsubscribe") {
          stateManager.unsubscribe(msg.key, ws);
          if (config.logging) {
            console.log(`[State] Client unsubscribed from "${msg.key}"`);
          }
        } else if (msg.type === "state:change") {
          stateManager.handleStateChange(msg.key, msg.value);
          if (config.logging) {
            console.log(`[State] Client updated "${msg.key}"`);
          }
        }
      } catch (error) {
        if (config.logging) {
          console.error("[WebSocket] Message parse error:", error);
        }
      }
    });
    ws.on("close", () => {
      wsClients.delete(ws);
      stateManager.unsubscribeAll(ws);
      if (config.logging) {
        console.log("[WebSocket] Internal client disconnected");
      }
    });
  });
  for (const endpoint of normalizedWebSocketEndpoints) {
    const endpointServer = new WebSocketServer({ server: server2, path: endpoint.path });
    webSocketServers.push(endpointServer);
    if (config.logging) {
      console.log(`[WebSocket] Endpoint ready at ${endpoint.path}`);
    }
    endpointServer.on("connection", (ws, req) => {
      const requestUrl = req.url || endpoint.path;
      const ctx = {
        ws,
        req,
        path: getRequestPath2(requestUrl),
        query: parseRequestQuery(requestUrl),
        headers: req.headers
      };
      void Promise.resolve(endpoint.handler(ctx)).catch((error) => {
        if (config.logging) {
          console.error(`[WebSocket] Endpoint error at ${endpoint.path}:`, error);
        }
        try {
          ws.close(CLOSE_CODES.INTERNAL_ERROR, "Internal Server Error");
        } catch {
        }
      });
    });
  }
  let watcher = null;
  if (config.mode !== "preview") {
    const watchPaths = normalizedClients.flatMap(
      (client2) => config.watch.map((pattern) => join(client2.root, pattern))
    );
    watcher = watch(watchPaths, {
      ignored: (path2) => config.ignore.some((pattern) => path2.includes(pattern.replace("/**", "").replace("**/", ""))),
      ignoreInitial: true,
      persistent: true
    });
    watcher.on("change", (path2) => {
      if (config.logging) console.log(`[HMR] File changed: ${path2}`);
      const message = JSON.stringify({ type: "update", path: path2, timestamp: Date.now() });
      wsClients.forEach((client2) => {
        if (client2.readyState === 1 /* OPEN */) {
          client2.send(message, {}, (err) => {
            const code2 = err?.code;
            if (code2 === "ECONNABORTED" || code2 === "ECONNRESET" || code2 === "EPIPE" || code2 === "WS_NOT_OPEN") {
              return;
            }
          });
        }
      });
    });
    watcher.on("add", (path2) => {
      if (config.logging) console.log(`[HMR] File added: ${path2}`);
      const message = JSON.stringify({ type: "update", path: path2, timestamp: Date.now() });
      wsClients.forEach((client2) => {
        if (client2.readyState === 1 /* OPEN */) client2.send(message, {});
      });
    });
    watcher.on("unlink", (path2) => {
      if (config.logging) console.log(`[HMR] File removed: ${path2}`);
      const message = JSON.stringify({ type: "reload", path: path2, timestamp: Date.now() });
      wsClients.forEach((client2) => {
        if (client2.readyState === 1 /* OPEN */) client2.send(message, {});
      });
    });
  }
  server2.setMaxListeners(20);
  server2.listen(config.port, config.host, () => {
    if (config.logging) {
      console.log("\n\u{1F680} Elit Dev Server");
      console.log(`
  \u279C Local:   http://${config.host}:${config.port}`);
      if (normalizedClients.length > 1) {
        console.log(`  \u279C Clients:`);
        normalizedClients.forEach((client2) => {
          const clientUrl = `http://${config.host}:${config.port}${client2.basePath}`;
          console.log(`     - ${clientUrl} \u2192 ${client2.root}`);
        });
      } else {
        const client2 = normalizedClients[0];
        console.log(`  \u279C Root:    ${client2.root}`);
        if (client2.basePath) {
          console.log(`  \u279C Base:    ${client2.basePath}`);
        }
      }
      if (config.mode !== "preview") console.log(`
[HMR] Watching for file changes...
`);
    }
    if (config.open && normalizedClients.length > 0) {
      const firstClient = normalizedClients[0];
      const url = `http://${config.host}:${config.port}${firstClient.basePath}`;
      const open = async () => {
        const { default: openBrowser } = await import("open");
        await openBrowser(url);
      };
      open().catch(() => {
      });
    }
  });
  let isClosing = false;
  const close = async () => {
    if (isClosing) return;
    isClosing = true;
    if (config.logging) console.log("\n[Server] Shutting down...");
    transformCache.clear();
    if (watcher) await watcher.close();
    if (webSocketServers.length > 0) {
      webSocketServers.forEach((wsServer) => wsServer.close());
      wsClients.clear();
    }
    return new Promise((resolve4) => {
      server2.close(() => {
        if (config.logging) console.log("[Server] Closed");
        resolve4();
      });
    });
  };
  const primaryClient = normalizedClients[0];
  const primaryUrl = `http://${config.host}:${config.port}${primaryClient.basePath}`;
  return {
    server: server2,
    wss,
    url: primaryUrl,
    state: stateManager,
    close
  };
}

// elit-standalone-dev-entry.ts
var import_node_path2 = require("node:path");

// node_modules/elit/src/database.ts
var import_node_vm = __toESM(require("node:vm"));
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var nodeModule2 = __toESM(require("node:module"));
var stripTypeScriptTypes4 = typeof nodeModule2.stripTypeScriptTypes === "function" ? nodeModule2.stripTypeScriptTypes : void 0;
var cachedEsbuildTransformSync;
function getEsbuildTransformSync() {
  if (cachedEsbuildTransformSync !== void 0) {
    return cachedEsbuildTransformSync;
  }
  if (typeof nodeModule2.createRequire !== "function") {
    cachedEsbuildTransformSync = null;
    return cachedEsbuildTransformSync;
  }
  try {
    const requireFromApp = nodeModule2.createRequire(import_node_path.default.join(process.cwd(), "package.json"));
    const esbuildModule = requireFromApp("esbuild");
    cachedEsbuildTransformSync = typeof esbuildModule?.transformSync === "function" ? esbuildModule.transformSync.bind(esbuildModule) : null;
  } catch {
    cachedEsbuildTransformSync = null;
  }
  return cachedEsbuildTransformSync;
}
function parseModuleBindings(specifiers) {
  return specifiers.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0).map((entry) => {
    const [imported, local] = entry.split(/\s+as\s+/);
    return {
      imported: (imported || "").trim(),
      local: (local || imported || "").trim()
    };
  }).filter((entry) => entry.imported.length > 0 && entry.local.length > 0);
}
function formatNamedImportBindings(specifiers) {
  return parseModuleBindings(specifiers).map(({ imported, local }) => imported === local ? imported : `${imported}: ${local}`).join(", ");
}
function formatNamedExportAssignments(specifiers) {
  return parseModuleBindings(specifiers).map(({ imported, local }) => `module.exports.${local} = ${imported};`).join("\n");
}
function stripTypescriptSource(source2, filename) {
  if (!stripTypeScriptTypes4) {
    throw new Error("TypeScript database execution requires Node.js 22+ or the esbuild package.");
  }
  const originalEmitWarning = process.emitWarning;
  try {
    process.emitWarning = ((warning, ...args) => {
      if (typeof warning === "string" && warning.includes("stripTypeScriptTypes")) {
        return;
      }
      return originalEmitWarning.call(process, warning, ...args);
    });
    return stripTypeScriptTypes4(source2, {
      mode: "transform",
      sourceUrl: filename
    });
  } finally {
    process.emitWarning = originalEmitWarning;
  }
}
function rewriteModuleSyntaxToCommonJs(source2) {
  let code2 = source2;
  let importCounter = 0;
  let hasDefaultExport = false;
  const namedExports = /* @__PURE__ */ new Set();
  const nextImportBinding = () => `__vm_import_${importCounter++}`;
  const resolveDefaultImport = (bindingName) => `${bindingName} && Object.prototype.hasOwnProperty.call(${bindingName}, "default") ? ${bindingName}.default : ${bindingName}`;
  code2 = code2.replace(
    /^\s*import\s+([A-Za-z_$][\w$]*)\s*,\s*\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])([^'"]+)\3\s*;?\s*$/gm,
    (_match, defaultName, namespaceName, _quote, modulePath) => {
      const bindingName = nextImportBinding();
      return `const ${bindingName} = require(${JSON.stringify(modulePath)});
const ${defaultName} = ${resolveDefaultImport(bindingName)};
const ${namespaceName} = ${bindingName};`;
    }
  );
  code2 = code2.replace(
    /^\s*import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+(['"])([^'"]+)\3\s*;?\s*$/gm,
    (_match, defaultName, namedBindings, _quote, modulePath) => {
      const bindingName = nextImportBinding();
      const destructured = formatNamedImportBindings(namedBindings);
      return `const ${bindingName} = require(${JSON.stringify(modulePath)});
const ${defaultName} = ${resolveDefaultImport(bindingName)};
const { ${destructured} } = ${bindingName};`;
    }
  );
  code2 = code2.replace(
    /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])([^'"]+)\2\s*;?\s*$/gm,
    (_match, namespaceName, _quote, modulePath) => `const ${namespaceName} = require(${JSON.stringify(modulePath)});`
  );
  code2 = code2.replace(
    /^\s*import\s+\{([^}]+)\}\s+from\s+(['"])([^'"]+)\2\s*;?\s*$/gm,
    (_match, namedBindings, _quote, modulePath) => `const { ${formatNamedImportBindings(namedBindings)} } = require(${JSON.stringify(modulePath)});`
  );
  code2 = code2.replace(
    /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])([^'"]+)\2\s*;?\s*$/gm,
    (_match, defaultName, _quote, modulePath) => {
      const bindingName = nextImportBinding();
      return `const ${bindingName} = require(${JSON.stringify(modulePath)});
const ${defaultName} = ${resolveDefaultImport(bindingName)};`;
    }
  );
  code2 = code2.replace(
    /^\s*import\s+(['"])([^'"]+)\1\s*;?\s*$/gm,
    (_match, _quote, modulePath) => `require(${JSON.stringify(modulePath)});`
  );
  code2 = code2.replace(
    /^\s*export\s+default\s+/gm,
    () => {
      hasDefaultExport = true;
      return "module.exports = ";
    }
  );
  code2 = code2.replace(
    /^\s*export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)\b/gm,
    (_match, declarationKind, name) => {
      namedExports.add(name);
      return `${declarationKind} ${name}`;
    }
  );
  code2 = code2.replace(
    /^\s*export\s+async\s+function\s+([A-Za-z_$][\w$]*)\b/gm,
    (_match, name) => {
      namedExports.add(name);
      return `async function ${name}`;
    }
  );
  code2 = code2.replace(
    /^\s*export\s+function\s+([A-Za-z_$][\w$]*)\b/gm,
    (_match, name) => {
      namedExports.add(name);
      return `function ${name}`;
    }
  );
  code2 = code2.replace(
    /^\s*export\s+class\s+([A-Za-z_$][\w$]*)\b/gm,
    (_match, name) => {
      namedExports.add(name);
      return `class ${name}`;
    }
  );
  code2 = code2.replace(
    /^\s*export\s+\{([^}]+)\}\s*;?\s*$/gm,
    (_match, specifiers) => formatNamedExportAssignments(specifiers)
  );
  const exportFooter = [...namedExports].map((name) => `module.exports.${name} = ${name};`);
  if (hasDefaultExport) {
    exportFooter.push("module.exports.default = module.exports;");
  }
  return exportFooter.length > 0 ? `${code2.trimEnd()}
${exportFooter.join("\n")}
` : code2;
}
function transpileVmModule(source2, options2 = {}) {
  const loader = options2.loader || "js";
  const filename = options2.filename || `virtual.${loader}`;
  if (loader === "tsx" || loader === "jsx") {
    const esbuildTransformSync = getEsbuildTransformSync();
    if (!esbuildTransformSync) {
      throw new Error(`JSX database execution requires the esbuild package (${filename}).`);
    }
    return esbuildTransformSync(source2, {
      loader,
      format: options2.format
    });
  }
  if (loader === "ts") {
    try {
      return {
        code: rewriteModuleSyntaxToCommonJs(stripTypescriptSource(source2, filename))
      };
    } catch (error) {
      const esbuildTransformSync = getEsbuildTransformSync();
      if (!esbuildTransformSync) {
        throw error;
      }
      return esbuildTransformSync(source2, {
        loader,
        format: options2.format
      });
    }
  }
  return {
    code: rewriteModuleSyntaxToCommonJs(source2)
  };
}
var VM = class {
  constructor(options2) {
    __publicField(this, "transpiler");
    __publicField(this, "ctx");
    __publicField(this, "registerModules");
    __publicField(this, "DATABASE_DIR");
    __publicField(this, "SCRIPTDB_DIR");
    __publicField(this, "pkgScriptDB", {});
    __publicField(this, "language");
    __publicField(this, "_registerModules");
    __publicField(this, "options");
    this.options = options2 || {};
    this.DATABASE_DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
    this.SCRIPTDB_DIR = process.cwd();
    if (!import_node_fs.default.existsSync(this.DATABASE_DIR)) {
      import_node_fs.default.mkdirSync(this.DATABASE_DIR, { recursive: true });
    }
    if (!import_node_fs.default.existsSync(this.SCRIPTDB_DIR)) {
      import_node_fs.default.mkdirSync(this.SCRIPTDB_DIR, { recursive: true });
    }
    const pkgPath = import_node_path.default.join(this.SCRIPTDB_DIR, "package.json");
    if (import_node_fs.default.existsSync(pkgPath)) {
      this.pkgScriptDB = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf8"));
    }
    this.language = options2?.language || "ts";
    this.transpiler = transpileVmModule;
    this.registerModules = options2?.registerModules || {};
    this._registerModules = { ...this.registerModules };
    this._registerModules.require = ((moduleId) => this.createRequire(moduleId)).bind(this);
    this.ctx = import_node_vm.default.createContext(this._registerModules);
  }
  register(context) {
    this.registerModules = { ...this.registerModules, ...context };
    this._registerModules = { ...this._registerModules, ...context };
    const originalRequire = context.require;
    this._registerModules.require = ((moduleId) => {
      try {
        return this.createRequire(moduleId);
      } catch (e) {
        if (originalRequire && !moduleId.startsWith("@db/") && !moduleId.startsWith("./") && !moduleId.startsWith("../")) {
          return originalRequire(moduleId);
        }
        throw e;
      }
    }).bind(this);
    this.ctx = import_node_vm.default.createContext(this._registerModules);
  }
  createRequire(moduleId) {
    if (!moduleId) {
      console.error("[createRequire] moduleId is undefined");
      return {};
    }
    console.log("[createRequire] Loading module:", moduleId, "from DATABASE_DIR:", this.DATABASE_DIR);
    if (moduleId.startsWith("@db/")) {
      const relativePath2 = moduleId.substring(4);
      moduleId = "./" + relativePath2;
      console.log("[createRequire] Resolved @db/ alias to:", moduleId);
    }
    if (moduleId.startsWith("./") || moduleId.startsWith("../")) {
      const dbDir = this.DATABASE_DIR || process.cwd();
      const fullPath = import_node_path.default.join(dbDir, moduleId);
      console.log("[createRequire] Full path:", fullPath);
      let actualPath = fullPath;
      if (import_node_fs.default.existsSync(fullPath)) {
        actualPath = fullPath;
      } else {
        const extensions = [".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"];
        for (const ext of extensions) {
          if (import_node_fs.default.existsSync(fullPath + ext)) {
            actualPath = fullPath + ext;
            break;
          }
        }
      }
      console.log("[createRequire] Actual path:", actualPath);
      if (!actualPath || !import_node_fs.default.existsSync(actualPath)) {
        console.log("[createRequire] File not found, throwing error");
        throw new Error(`Module '${moduleId}' not found at ${fullPath}`);
      }
      if (actualPath.endsWith(".ts") || actualPath.endsWith(".tsx") || actualPath.endsWith(".mts") || actualPath.endsWith(".cts") || actualPath.endsWith(".js") || actualPath.endsWith(".mjs")) {
        const content = import_node_fs.default.readFileSync(actualPath, "utf8");
        const loader = actualPath.endsWith(".ts") || actualPath.endsWith(".mts") || actualPath.endsWith(".cts") ? "ts" : actualPath.endsWith(".tsx") ? "tsx" : "js";
        const js = this.transpiler(content, {
          loader,
          format: "cjs",
          filename: actualPath
        }).code;
        const moduleWrapper = { exports: {} };
        const moduleContext = import_node_vm.default.createContext({
          ...this._registerModules,
          module: moduleWrapper,
          exports: moduleWrapper.exports
        });
        import_node_vm.default.runInContext(js, moduleContext, { filename: actualPath });
        console.log("[createRequire] Returning exports:", moduleWrapper.exports);
        return moduleWrapper.exports;
      }
      const result = require(actualPath);
      console.log("[createRequire] Returning (JS):", result);
      return result;
    }
    return require(moduleId);
  }
  resolvePath(fileList, query) {
    const aliases = { "@db": this.DATABASE_DIR };
    let resolvedPath = query;
    for (const [alias, target] of Object.entries(aliases)) {
      if (resolvedPath.startsWith(alias + "/")) {
        resolvedPath = resolvedPath.replace(alias, target);
        break;
      }
    }
    resolvedPath = import_node_path.default.normalize(resolvedPath);
    return fileList.find((file) => {
      const normalizedFile = import_node_path.default.normalize(file);
      const fileWithoutExt = normalizedFile.replace(/\.[^/.]+$/, "");
      return normalizedFile === resolvedPath || fileWithoutExt === resolvedPath || normalizedFile === resolvedPath + ".ts" || normalizedFile === resolvedPath + ".js";
    });
  }
  async moduleLinker(specifier, referencingModule) {
    console.log("[moduleLinker] Loading specifier:", specifier, "from DATABASE_DIR:", this.DATABASE_DIR);
    const dbFiles = import_node_fs.default.readdirSync(this.DATABASE_DIR).filter((f) => f.endsWith(".ts")).map((f) => import_node_path.default.join(this.DATABASE_DIR, f));
    console.log("[moduleLinker] Database files:", dbFiles);
    const dbResult = this.resolvePath(dbFiles, specifier);
    console.log("[moduleLinker] Resolved path:", dbResult);
    if (dbResult) {
      try {
        const actualModule = await import(dbResult);
        const exportNames = Object.keys(actualModule);
        return new import_node_vm.default.SyntheticModule(
          exportNames,
          function() {
            exportNames.forEach((key) => {
              this.setExport(key, actualModule[key]);
            });
          },
          { identifier: specifier, context: referencingModule.context }
        );
      } catch (err) {
        console.error(`Failed to load database module ${specifier}:`, err);
        throw err;
      }
    }
    const allowedPackages = Object.keys(this.pkgScriptDB.dependencies || {});
    if (allowedPackages.includes(specifier)) {
      try {
        const modulePath = import_node_path.default.join(this.SCRIPTDB_DIR, "node_modules", specifier);
        const actualModule = await import(modulePath);
        const exportNames = Object.keys(actualModule);
        return new import_node_vm.default.SyntheticModule(
          exportNames,
          function() {
            exportNames.forEach((key) => {
              this.setExport(key, actualModule[key]);
            });
          },
          { identifier: specifier, context: referencingModule.context }
        );
      } catch (err) {
        console.error(`Failed to load workspace module ${specifier}:`, err);
        throw err;
      }
    }
    throw new Error(`Module ${specifier} is not allowed or not found.`);
  }
  async run(code2) {
    const logs = [];
    const customConsole = ["log", "error", "warn", "info", "debug", "trace"].reduce((acc, type) => {
      acc[type] = (...args) => logs.push({ type, args });
      return acc;
    }, {});
    this.register({
      console: customConsole
    });
    const systemModules = await SystemModuleResolver(this.options);
    this.register(systemModules);
    const js = this.transpiler(code2, {
      loader: this.language,
      format: "cjs",
      filename: import_node_path.default.join(this.SCRIPTDB_DIR, `virtual-entry.${this.language}`)
    }).code;
    console.log("[run] Transpiled code:", js);
    const SourceTextModule = import_node_vm.default.SourceTextModule;
    console.log("[run] SourceTextModule available:", typeof SourceTextModule === "function");
    if (typeof SourceTextModule === "function") {
      const mod = new SourceTextModule(js, { context: this.ctx, identifier: import_node_path.default.join(this.SCRIPTDB_DIR, "virtual-entry.js") });
      await mod.link(this.moduleLinker.bind(this));
      await mod.evaluate();
      return {
        namespace: mod.namespace,
        logs
      };
    }
    let processedCode = js;
    console.log("[run] Original transpiled code:", processedCode);
    processedCode = processedCode.replace(
      /var\s+(\w+)\s+=\s+require\((['"])([^'"]+)\2\);/g,
      (_match, varName, quote, modulePath) => {
        return `const ${varName} = require(${quote}${modulePath}${quote});`;
      }
    );
    processedCode = processedCode.replace(
      /import\s+\{([^}]+)\}\s+from\s+(['"])([^'"]+)\2/g,
      (_match, imports, quote, modulePath) => {
        return `const { ${imports} } = require(${quote}${modulePath}${quote});`;
      }
    );
    processedCode = processedCode.replace(
      /import\s+(\w+)\s+from\s+(['"])([^'"]+)\2/g,
      (_match, name, quote, modulePath) => {
        return `const ${name} = require(${quote}${modulePath}${quote});`;
      }
    );
    processedCode = processedCode.replace(/import\(([^)]+)\)/g, "require($1)");
    console.log("[run] Processed code:", processedCode);
    console.log("[run] Context has require:", typeof this._registerModules.require);
    console.log("[run] DATABASE_DIR:", this.DATABASE_DIR);
    try {
      const moduleWrapper = { exports: {} };
      const initialExports = moduleWrapper.exports;
      const originalModule = this._registerModules.module;
      const originalExports = this._registerModules.exports;
      this._registerModules.module = moduleWrapper;
      this._registerModules.exports = moduleWrapper.exports;
      this.ctx = import_node_vm.default.createContext(this._registerModules);
      let result;
      try {
        result = import_node_vm.default.runInContext(processedCode, this.ctx, {
          filename: import_node_path.default.join(this.SCRIPTDB_DIR, "virtual-entry.js")
        });
      } finally {
        if (originalModule) {
          this._registerModules.module = originalModule;
        } else {
          delete this._registerModules.module;
        }
        if (originalExports) {
          this._registerModules.exports = originalExports;
        } else {
          delete this._registerModules.exports;
        }
        this.ctx = import_node_vm.default.createContext(this._registerModules);
      }
      const hasExplicitExports = moduleWrapper.exports !== initialExports || typeof initialExports === "object" && initialExports !== null && Object.keys(initialExports).length > 0;
      return {
        namespace: hasExplicitExports ? moduleWrapper.exports : result,
        logs
      };
    } catch (e) {
      console.log("[run] Error executing code:", e);
      throw e;
    }
  }
};
function create(dbName, code2, options2) {
  const DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
  const dbPath = import_node_path.default.join(DIR, `${dbName}.ts`);
  import_node_fs.default.appendFileSync(dbPath, code2.toString(), "utf8");
}
function read(dbName, options2) {
  const DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
  const dbPath = import_node_path.default.join(DIR, `${dbName}.ts`);
  if (!import_node_fs.default.existsSync(dbPath)) {
    throw new Error(`Database '${dbName}' not found`);
  }
  return import_node_fs.default.readFileSync(dbPath, "utf8");
}
function remove(dbName, fnName, options2) {
  const DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
  const dbPath = import_node_path.default.join(DIR, `${dbName}.ts`);
  if (!import_node_fs.default.existsSync(dbPath)) return false;
  if (!fnName) {
    const bak2 = `${dbPath}.bak`;
    try {
      import_node_fs.default.copyFileSync(dbPath, bak2);
    } catch (e) {
    }
    try {
      import_node_fs.default.unlinkSync(dbPath);
      return "Removed successfully";
    } catch (e) {
      return "Removed failed";
    }
  }
  const bak = `${dbPath}.bak`;
  try {
    import_node_fs.default.copyFileSync(dbPath, bak);
  } catch (e) {
  }
  let src = import_node_fs.default.readFileSync(dbPath, "utf8");
  const escaped = fnName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const startRe = new RegExp(
    `function\\s+${escaped}\\s*\\(|\\bclass\\s+${escaped}\\b|\\b(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:function\\b|class\\b|\\(|\\{|\\[)`,
    "m"
  );
  const startMatch = src.match(startRe);
  if (startMatch) {
    const startIdx = startMatch.index;
    const len = src.length;
    const idxCurly = src.indexOf("{", startIdx);
    const idxBracket = src.indexOf("[", startIdx);
    let braceOpen = -1;
    if (idxCurly === -1) braceOpen = idxBracket;
    else if (idxBracket === -1) braceOpen = idxCurly;
    else braceOpen = Math.min(idxCurly, idxBracket);
    if (braceOpen !== -1) {
      const openingChar = src[braceOpen];
      const closingChar = openingChar === "[" ? "]" : "}";
      let i2 = braceOpen + 1;
      let depth = 1;
      while (i2 < len && depth > 0) {
        const ch = src[i2];
        if (ch === openingChar) depth++;
        else if (ch === closingChar) depth--;
        i2++;
      }
      let braceClose = i2;
      let endIdx = braceClose;
      if (src.slice(braceClose, braceClose + 1) === ";")
        endIdx = braceClose + 1;
      const before = src.slice(0, startIdx);
      const after = src.slice(endIdx);
      src = before + after;
    } else {
      const semi = src.indexOf(";", startIdx);
      let endIdx = semi !== -1 ? semi + 1 : src.indexOf("\n\n", startIdx);
      if (endIdx === -1) endIdx = len;
      src = src.slice(0, startIdx) + src.slice(endIdx);
    }
  }
  const exportRe = new RegExp(
    `export\\s+const\\s+${escaped}\\s*:\\s*any\\s*=\\s*${escaped}\\s*;?`,
    "g"
  );
  src = src.replace(exportRe, "");
  src = src.replace(/\n{3,}/g, "\n\n");
  import_node_fs.default.writeFileSync(dbPath, src, "utf8");
  return `Removed ${fnName} from database ${dbName}.`;
}
function rename2(oldName, newName, options2) {
  const DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
  const oldPath = import_node_path.default.join(DIR, `${oldName}.ts`);
  const newPath = import_node_path.default.join(DIR, `${newName}.ts`);
  if (!import_node_fs.default.existsSync(oldPath)) {
    return `Error: File '${oldName}.ts' does not exist in the database`;
  }
  if (import_node_fs.default.existsSync(newPath)) {
    return `Error: File '${newName}.ts' already exists in the database`;
  }
  try {
    import_node_fs.default.renameSync(oldPath, newPath);
    return `Successfully renamed '${oldName}.ts' to '${newName}.ts'`;
  } catch (error) {
    return `Error renaming file: ${error instanceof Error ? error.message : String(error)}`;
  }
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function findMatchingBlockEnd(source2, openIndex) {
  let depth = 0;
  let stringChar = null;
  for (let index = openIndex; index < source2.length; index += 1) {
    const char = source2[index];
    const nextChar = source2[index + 1];
    if (stringChar) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === stringChar) {
        stringChar = null;
      }
      continue;
    }
    if (char === "/" && nextChar === "/") {
      index += 2;
      while (index < source2.length && source2[index] !== "\n") {
        index += 1;
      }
      continue;
    }
    if (char === "/" && nextChar === "*") {
      index += 2;
      while (index < source2.length && !(source2[index] === "*" && source2[index + 1] === "/")) {
        index += 1;
      }
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      stringChar = char;
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return source2.length - 1;
}
function findInitializerEnd(source2, startIndex) {
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let stringChar = null;
  for (let index = startIndex; index < source2.length; index += 1) {
    const char = source2[index];
    const nextChar = source2[index + 1];
    if (stringChar) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === stringChar) {
        stringChar = null;
      }
      continue;
    }
    if (char === "/" && nextChar === "/") {
      index += 2;
      while (index < source2.length && source2[index] !== "\n") {
        index += 1;
      }
      continue;
    }
    if (char === "/" && nextChar === "*") {
      index += 2;
      while (index < source2.length && !(source2[index] === "*" && source2[index + 1] === "/")) {
        index += 1;
      }
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      stringChar = char;
      continue;
    }
    if (char === "{") {
      braceDepth += 1;
    } else if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (char === "[") {
      bracketDepth += 1;
    } else if (char === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (char === "(") {
      parenDepth += 1;
    } else if (char === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (char === ";" && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      return index;
    }
  }
  return source2.length;
}
function looksLikeDeclarationSnippet(source2) {
  const trimmed = source2.trim();
  return /^(?:export\s+)?(?:async\s+function\b|function\b|class\b|(?:const|let|var)\b)/.test(trimmed);
}
function replaceExistingBindingValue(source2, bindingName, serializedValue) {
  const escapedName = escapeRegExp(bindingName);
  const declarationRegex = new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${escapedName}(?:\\s*:\\s*[^=;]+)?\\s*=`, "m");
  const declarationMatch = declarationRegex.exec(source2);
  if (!declarationMatch || declarationMatch.index === void 0) {
    return null;
  }
  const equalsIndex = source2.indexOf("=", declarationMatch.index);
  if (equalsIndex === -1) {
    return null;
  }
  const initializerEnd = findInitializerEnd(source2, equalsIndex + 1);
  const suffix = initializerEnd < source2.length ? source2.slice(initializerEnd) : ";";
  return `${source2.slice(0, equalsIndex + 1)} ${serializedValue}${suffix}`;
}
function buildDatabaseModuleSource(dbName, code2, dbPath) {
  if (typeof code2 === "string") {
    return code2;
  }
  if (typeof code2 === "function") {
    return code2.toString();
  }
  const serializedValue = valueToCode(code2, 0);
  if (import_node_fs.default.existsSync(dbPath) && isIdentifier(dbName)) {
    const existingSource = import_node_fs.default.readFileSync(dbPath, "utf8");
    const updatedSource = replaceExistingBindingValue(existingSource, dbName, serializedValue);
    if (updatedSource) {
      return updatedSource;
    }
  }
  if (isIdentifier(dbName)) {
    return `const ${dbName} = ${serializedValue};

export { ${dbName} };
export default ${dbName};
`;
  }
  return `const value = ${serializedValue};

export default value;
`;
}
function toInitializerSource(code2) {
  if (typeof code2 === "function") {
    return code2.toString().trim();
  }
  if (typeof code2 === "string") {
    const trimmed = code2.trim();
    if (looksLikeDeclarationSnippet(trimmed) || /=>/.test(trimmed) || /^(?:\{|\[|\(|"|'|`|\d|-\d|true\b|false\b|null\b|undefined\b|new\b|await\b)/.test(trimmed)) {
      return trimmed;
    }
    return valueToCode(code2, 0);
  }
  return valueToCode(code2, 0);
}
function shouldUseDeclarationSource(code2) {
  return typeof code2 === "function" || typeof code2 === "string" && looksLikeDeclarationSnippet(code2);
}
function normalizeFunctionDeclaration(name, code2) {
  const trimmed = code2.trim().replace(/^export\s+/, "");
  if (/^async\s+function\s+[A-Za-z_$][\w$]*/.test(trimmed)) {
    return trimmed.replace(/^async\s+function\s+[A-Za-z_$][\w$]*/, `async function ${name}`);
  }
  if (/^async\s+function\s*\(/.test(trimmed)) {
    return trimmed.replace(/^async\s+function\s*\(/, `async function ${name}(`);
  }
  if (/^function\s+[A-Za-z_$][\w$]*/.test(trimmed)) {
    return trimmed.replace(/^function\s+[A-Za-z_$][\w$]*/, `function ${name}`);
  }
  if (/^function\s*\(/.test(trimmed)) {
    return trimmed.replace(/^function\s*\(/, `function ${name}(`);
  }
  return `function ${name}() {
${trimmed}
}`;
}
function normalizeClassDeclaration(name, code2) {
  const trimmed = code2.trim().replace(/^export\s+/, "");
  if (/^class\s+[A-Za-z_$][\w$]*/.test(trimmed)) {
    return trimmed.replace(/^class\s+[A-Za-z_$][\w$]*/, `class ${name}`);
  }
  if (/^class(?:\s+extends\b|\s*\{)/.test(trimmed)) {
    return trimmed.replace(/^class/, `class ${name}`);
  }
  return `class ${name} ${trimmed}`;
}
function findDeclaration(source2, name) {
  const escaped = escapeRegExp(name);
  const matches = [];
  const valueRegex = new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${escaped}(?:\\s*:\\s*[^=;]+)?\\s*=`, "m");
  const valueMatch = valueRegex.exec(source2);
  if (valueMatch && valueMatch.index !== void 0) {
    const equalsIndex = source2.indexOf("=", valueMatch.index);
    if (equalsIndex !== -1) {
      const initializerEnd = findInitializerEnd(source2, equalsIndex + 1);
      const end = initializerEnd < source2.length && source2[initializerEnd] === ";" ? initializerEnd + 1 : initializerEnd;
      matches.push({
        kind: "valueDecl",
        start: valueMatch.index,
        end,
        exported: /^\s*export\b/.test(valueMatch[0]),
        prefixEnd: equalsIndex + 1
      });
    }
  }
  const functionRegex = new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${escaped}\\s*\\(`, "m");
  const functionMatch = functionRegex.exec(source2);
  if (functionMatch && functionMatch.index !== void 0) {
    const braceOpen = source2.indexOf("{", functionMatch.index);
    if (braceOpen !== -1) {
      const braceClose = findMatchingBlockEnd(source2, braceOpen);
      const end = braceClose + 1 < source2.length && source2[braceClose + 1] === ";" ? braceClose + 2 : braceClose + 1;
      matches.push({
        kind: "functionDecl",
        start: functionMatch.index,
        end,
        exported: /^\s*export\b/.test(functionMatch[0])
      });
    }
  }
  const classRegex = new RegExp(`(?:export\\s+)?class\\s+${escaped}(?=\\s|\\{)`, "m");
  const classMatch = classRegex.exec(source2);
  if (classMatch && classMatch.index !== void 0) {
    const braceOpen = source2.indexOf("{", classMatch.index);
    if (braceOpen !== -1) {
      const braceClose = findMatchingBlockEnd(source2, braceOpen);
      const end = braceClose + 1 < source2.length && source2[braceClose + 1] === ";" ? braceClose + 2 : braceClose + 1;
      matches.push({
        kind: "classDecl",
        start: classMatch.index,
        end,
        exported: /^\s*export\b/.test(classMatch[0])
      });
    }
  }
  if (matches.length === 0) {
    return null;
  }
  matches.sort((left, right) => left.start - right.start);
  return matches[0];
}
function createStructuredReplacement(kind, name, code2) {
  if (!shouldUseDeclarationSource(code2)) {
    return `const ${name} = ${toInitializerSource(code2)};`;
  }
  const source2 = code2.toString();
  return kind === "functionDecl" ? normalizeFunctionDeclaration(name, source2) : normalizeClassDeclaration(name, source2);
}
function createDeclarationSnippet(name, code2) {
  if (typeof code2 === "function") {
    const fnSource = code2.toString().trim();
    if (/^(?:async\s+)?function\b/.test(fnSource)) {
      return `export ${normalizeFunctionDeclaration(name, fnSource)}`;
    }
    if (/^class\b/.test(fnSource)) {
      return `export ${normalizeClassDeclaration(name, fnSource)}`;
    }
    return `export const ${name} = ${fnSource};`;
  }
  if (typeof code2 === "string") {
    const trimmed = code2.trim();
    if (looksLikeDeclarationSnippet(trimmed)) {
      return trimmed;
    }
  }
  return `export const ${name} = ${toInitializerSource(code2)};`;
}
function save(dbName, code2, options2) {
  const DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
  const dbPath = import_node_path.default.join(DIR, `${dbName}.ts`);
  const fileContent = buildDatabaseModuleSource(dbName, code2, dbPath);
  import_node_fs.default.writeFileSync(dbPath, fileContent, "utf8");
}
function update(dbName, fnName, code2, options2) {
  const DIR = options2?.dir || import_node_path.default.join(process.cwd(), "databases");
  const dbPath = import_node_path.default.join(DIR, `${dbName}.ts`);
  if (!import_node_fs.default.existsSync(dbPath)) {
    try {
      import_node_fs.default.writeFileSync(dbPath, "", "utf8");
    } catch {
      return `Failed to create dbPath file: ${dbPath}`;
    }
  }
  let src = import_node_fs.default.readFileSync(dbPath, "utf8");
  const originalSrc = src;
  const declaration = findDeclaration(src, fnName);
  if (declaration) {
    if (declaration.kind === "valueDecl" && declaration.prefixEnd !== void 0) {
      const initializer = toInitializerSource(code2);
      src = src.slice(0, declaration.start) + src.slice(declaration.start, declaration.prefixEnd) + ` ${initializer};` + src.slice(declaration.end);
    } else if (declaration.kind === "functionDecl") {
      const replacement = createStructuredReplacement("functionDecl", fnName, code2);
      src = src.slice(0, declaration.start) + `${declaration.exported ? "export " : ""}${replacement.replace(/^export\s+/, "")}` + src.slice(declaration.end);
    } else {
      const replacement = createStructuredReplacement("classDecl", fnName, code2);
      src = src.slice(0, declaration.start) + `${declaration.exported ? "export " : ""}${replacement.replace(/^export\s+/, "")}` + src.slice(declaration.end);
    }
  } else {
    const snippet = createDeclarationSnippet(fnName, code2);
    const separator = src.trim().length > 0 ? "\n\n" : "";
    src = `${src.trimEnd()}${separator}${snippet}
`;
  }
  import_node_fs.default.writeFileSync(dbPath, src, "utf8");
  if (src === originalSrc) {
    return `Saved ${fnName} to database ${dbName}.`;
  }
  return `Updated ${dbName} with ${fnName}.`;
}
function valueToCode(val, depth = 0) {
  const indentUnit = "    ";
  const indent = indentUnit.repeat(depth);
  const indentInner = indentUnit.repeat(depth + 1);
  if (val === null) return "null";
  const t = typeof val;
  if (t === "string") return JSON.stringify(val);
  if (t === "number" || t === "boolean") return String(val);
  if (t === "function") return val.toString();
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const items = val.map((v) => valueToCode(v, depth + 1));
    return "[\n" + items.map((it) => indentInner + it).join(",\n") + "\n" + indent + "]";
  }
  if (t === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "{}";
    const entries = keys.map((k) => {
      const keyPart = isIdentifier(k) ? k : JSON.stringify(k);
      const v = valueToCode(val[k], depth + 1);
      return indentInner + keyPart + ": " + v;
    });
    return "{\n" + entries.join(",\n") + "\n" + indent + "}";
  }
  return String(val);
}
function isIdentifier(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}
async function SystemModuleResolver(customOptions) {
  const moduleRegistry = /* @__PURE__ */ new Map();
  moduleRegistry.set("update", (dbName, fnName, code2) => update(dbName, fnName, code2, customOptions));
  moduleRegistry.set("remove", (dbName, fnName) => remove(dbName, fnName, customOptions));
  moduleRegistry.set("create", (dbName, code2) => create(dbName, code2, customOptions));
  moduleRegistry.set("save", (dbName, code2) => save(dbName, code2, customOptions));
  moduleRegistry.set("read", (dbName) => read(dbName, customOptions));
  const context = {
    // Add require-like functionality
    require: (moduleName) => {
      const module2 = moduleRegistry.get(moduleName);
      if (!module2) {
        throw new Error(`Module '${moduleName}' not found`);
      }
      return module2.default || module2;
    },
    // Add import functionality (simulated)
    import: async (moduleName) => {
      const module2 = moduleRegistry.get(moduleName);
      if (!module2) {
        throw new Error(`Module '${moduleName}' not found`);
      }
      return {
        default: module2.default || module2
      };
    }
  };
  for (const [name, moduleExports] of moduleRegistry) {
    context[name] = moduleExports.default || moduleExports;
  }
  return context;
}
var Database = class {
  constructor(options2) {
    __publicField(this, "vm");
    __publicField(this, "options");
    this.options = {
      language: "ts",
      registerModules: {},
      ...options2
    };
    this.vm = new VM(this.options);
  }
  register(context) {
    this.vm.register(context);
  }
  async execute(code2) {
    return await this.vm.run(code2);
  }
  // ===== Database Helper Methods =====
  /**
   * Create a new database file with the given code
   */
  create(dbName, code2) {
    return create(dbName, code2, this.options);
  }
  /**
   * Read the contents of a database file
   */
  read(dbName) {
    return read(dbName, this.options);
  }
  /**
   * Remove a function or the entire database file
   */
  remove(dbName, fnName) {
    return remove(dbName, fnName || "", this.options);
  }
  /**
   * Rename a database file
   */
  rename(oldName, newName) {
    return rename2(oldName, newName, this.options);
  }
  /**
   * Save code to a database file (overwrites existing content)
   */
  save(dbName, code2) {
    return save(dbName, code2, this.options);
  }
  /**
   * Update a function in a database file
   */
  update(dbName, fnName, code2) {
    return update(dbName, fnName, code2, this.options);
  }
};

// src/server.ts
var import_path3 = require("path");
var import_crypto = require("crypto");
var import_util = require("util");
var scryptAsync = (0, import_util.promisify)(import_crypto.scrypt);
var router = new ServerRouter();
var sseClients = /* @__PURE__ */ new Map();
function broadcastToRoom(roomId, data2) {
  const clients = sseClients.get(roomId);
  if (clients) {
    clients.forEach((client2) => {
      try {
        client2.write(`data: ${JSON.stringify(data2)}

`);
      } catch (err) {
        clients.delete(client2);
      }
    });
  }
}
var db = new Database({
  dir: (0, import_path3.resolve)(process.cwd(), "databases"),
  language: "ts"
});
async function hashPassword(password) {
  const salt = (0, import_crypto.randomBytes)(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}.${derivedKey.toString("hex")}`;
}
async function verifyPassword(storedHash, suppliedPassword) {
  const [salt, key] = storedHash.split(".");
  const derivedKey = await scryptAsync(suppliedPassword, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  return (0, import_crypto.timingSafeEqual)(derivedKey, keyBuffer);
}
router.get("/api/hello", async (req, res) => {
  console.log("Received request at /api/hello", req.query);
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  return res.send("Hello from Elit ServerRouter!");
});
router.get("/api/path/:id", async (req, res) => {
  console.log("Received request at /api/path", req.params);
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  return res.send("Hello from Elit ServerRouter!");
});
router.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please provide name, email, and password" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Please provide a valid email" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const checkEmailCode = `
      import { users } from '@db/users';
      const email = ${JSON.stringify(email)};
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        console.log('EMAIL_EXISTS');
      } else {
        console.log('EMAIL_AVAILABLE');
      }
    `;
    const checkResult = await db.execute(checkEmailCode);
    const emailStatus = checkResult.logs[0]?.args?.[0];
    if (emailStatus === "EMAIL_EXISTS") {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashedPassword = await hashPassword(password);
    const userId = "user_" + Date.now();
    const userData = JSON.stringify({
      id: userId,
      name,
      email,
      password: hashedPassword,
      bio: "New user",
      location: "",
      website: "",
      avatar: "",
      stats: {
        projects: 0,
        followers: 0,
        following: 0,
        stars: 0
      },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const code2 = `
      import { users } from '@db/users';
      const user = ${userData};
          users.push(user);
          update('users', 'users', users);
          console.log(user);
    `;
    const result = await db.execute(code2);
    console.log("Registration result:", result);
    const user = result.logs[0]?.args?.[0];
    const { password: _, ...userWithoutPassword } = user;
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
});
router.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }
  try {
    const findUserCode = `
      import { users } from './users';
      const email = ${JSON.stringify(email)};
      const user = users.find(u => u.email === email);
      if (user) {
        console.log(JSON.stringify(user));
      } else {
        console.error('USER_NOT_FOUND');
      }
    `;
    const findResult = await db.execute(findUserCode);
    if (!findResult.logs || findResult.logs.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const userLog = findResult.logs[0]?.args?.[0];
    if (userLog === "USER_NOT_FOUND") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = typeof userLog === "string" ? JSON.parse(userLog) : userLog;
    const isValidPassword = await verifyPassword(user.password, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please provide email" });
  }
  res.json({
    message: "If an account exists with this email, a password reset link has been sent"
  });
});
function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId] = decoded.split(":");
    return userId || null;
  } catch {
    return null;
  }
}
router.get("/api/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - Invalid token format" });
  }
  const tokenValue = token.substring(7);
  const userId = verifyToken(tokenValue);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
  try {
    const code2 = `
      import { users } from './users';
      const userId = ${JSON.stringify(userId)};
      const user = users.find(u => u.id === userId);
      if (user) {
        console.log(JSON.stringify(user));
      } else {
        console.error('USER_NOT_FOUND');
      }
    `;
    const result = await db.execute(code2);
    if (!result.logs || result.logs.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userLog = result.logs[0]?.args?.[0];
    if (userLog === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    const user = typeof userLog === "string" ? JSON.parse(userLog) : userLog;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.put("/api/profile", async (req, res) => {
  const { name, bio, location, website } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - Invalid token format" });
  }
  const tokenValue = token.substring(7);
  const userId = verifyToken(tokenValue);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
  try {
    const code2 = `
      import { users } from './users';
      const userId = ${JSON.stringify(userId)};
      const updates = ${JSON.stringify({ name, bio, location, website })};
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        console.error('USER_NOT_FOUND');
      } else {
        const user = users[userIndex];
        if (updates.name) user.name = updates.name;
        if (updates.bio) user.bio = updates.bio;
        if (updates.location) user.location = updates.location;
        if (updates.website) user.website = updates.website;
        update('users', 'users', users);
        console.log(JSON.stringify(user));
      }
    `;
    const result = await db.execute(code2);
    if (!result.logs || result.logs.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userLog = result.logs[0]?.args?.[0];
    if (userLog === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    const user = typeof userLog === "string" ? JSON.parse(userLog) : userLog;
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: "Profile updated successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.get("/api/users", async (_req, res) => {
  try {
    const code2 = `
      import { users } from './users';
      // Remove passwords from users before returning
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      console.log(JSON.stringify(usersWithoutPasswords));
    `;
    const result = await db.execute(code2);
    const userLog = result.logs && result.logs.length > 0 ? result.logs[0]?.args?.[0] : [];
    const userList = typeof userLog === "string" ? JSON.parse(userLog) : userLog;
    return res.json({ users: userList, count: Array.isArray(userList) ? userList.length : 0 });
  } catch (error) {
    return res.json({ users: [], count: 0 });
  }
});
router.get("/api/users/:id", async (req, res) => {
  const url = req.url || "";
  const userId = url.split("/").pop();
  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }
  try {
    const code2 = `
      import { users } from './users';
      const userId = ${JSON.stringify(userId)};
      const user = users.find(u => u.id === userId);
      if (user) {
        // Remove password before sending
        const { password, ...userWithoutPassword } = user;
        console.log(JSON.stringify(userWithoutPassword));
      } else {
        console.error('USER_NOT_FOUND');
      }
    `;
    const result = await db.execute(code2);
    if (!result.logs || result.logs.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userLog = result.logs[0]?.args?.[0];
    if (userLog === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    const user = typeof userLog === "string" ? JSON.parse(userLog) : userLog;
    return res.json({ user });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
var chatMessages = /* @__PURE__ */ new Map();
router.get("/api/chat/messages", async (req, res) => {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const roomId = url.searchParams.get("roomId") || "general";
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = verifyToken(token.substring(7));
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const messages = chatMessages.get(roomId) || [];
    res.json({ messages, roomId });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router.post("/api/chat/send", async (req, res) => {
  const { roomId = "general", message } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = verifyToken(token.substring(7));
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }
  try {
    const findUserCode = `
      import { users } from './users';
      const userId = ${JSON.stringify(userId)};
      const user = users.find(u => u.id === userId);
      if (user) {
        console.log(JSON.stringify(user));
      } else {
        console.error('USER_NOT_FOUND');
      }
    `;
    const findResult = await db.execute(findUserCode);
    const userLog = findResult.logs[0]?.args?.[0];
    if (userLog === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    const user = typeof userLog === "string" ? JSON.parse(userLog) : userLog;
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      roomId,
      userId: user.id,
      userName: user.name,
      text: message.trim(),
      timestamp: Date.now()
    };
    const messages = chatMessages.get(roomId) || [];
    messages.push(newMessage);
    if (messages.length > 100) {
      messages.shift();
    }
    chatMessages.set(roomId, messages);
    broadcastToRoom(roomId, {
      type: "new-message",
      data: newMessage
    });
    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});
router.get("/api/chat/events", async (req, res) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const roomId = url.searchParams.get("roomId") || "general";
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!sseClients.has(roomId)) {
    sseClients.set(roomId, /* @__PURE__ */ new Set());
  }
  const clients = sseClients.get(roomId);
  clients.add(res);
  res.write(`data: ${JSON.stringify({ type: "connected", roomId })}

`);
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat

`);
    } catch (err) {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 3e4);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
  return;
});
function errorResponse(code2, message, details2, includeStack = false) {
  const response = {
    success: false,
    error: {
      code: code2,
      message
    }
  };
  if (details2) {
    response.error.details = details2;
  }
  if (includeStack) {
    const err = new Error();
    if (err.stack) {
      response.error.stack = err.stack;
    }
  }
  return response;
}
var HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};
var ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_TOKEN: "INVALID_TOKEN",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  NO_TOKEN: "NO_TOKEN",
  // Authorization errors
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",
  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE"
};
function notFoundHandler(req, res, next) {
  const isPath = router.listRoutes().filter((route) => {
    const cleanPath = req.url.split("?")[0];
    return route.method === req.method && RegExp(route.pattern).test(cleanPath);
  });
  if (!isPath.length) {
    return res.status(HttpStatus.NOT_FOUND).json(
      errorResponse(
        ErrorCodes.NOT_FOUND,
        `Route ${req.method} ${req.url} not found`
      )
    );
  }
  return next();
}
router.use(notFoundHandler);
var server = router;

// node_modules/elit/src/el.ts
var hasDocument = typeof document !== "undefined";
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function bindDocMethod(method) {
  return hasDocument && method ? method.bind(doc) : void 0;
}
function createPrefixedFactories(tags2, prefix, elements2) {
  tags2.forEach((tag) => {
    const name = prefix + capitalize(tag);
    elements2[name] = createElementFactory(tag);
  });
}
var createElementFactory = (tag) => {
  return function(props, ...rest) {
    if (!arguments.length) return { tagName: tag, props: {}, children: [] };
    const isState = props && typeof props === "object" && "value" in props && "subscribe" in props;
    const isVNode = props && typeof props === "object" && "tagName" in props;
    const isChild = typeof props !== "object" || Array.isArray(props) || props === null || isState || isVNode;
    const actualProps = isChild ? {} : props;
    const args = isChild ? [props, ...rest] : rest;
    if (!args.length) return { tagName: tag, props: actualProps, children: [] };
    const flatChildren = [];
    for (let i2 = 0, len = args.length; i2 < len; i2++) {
      const child = args[i2];
      if (child == null || child === false) continue;
      if (Array.isArray(child)) {
        for (let j = 0, cLen = child.length; j < cLen; j++) {
          const c = child[j];
          c != null && c !== false && flatChildren.push(c);
        }
      } else {
        flatChildren.push(child);
      }
    }
    return { tagName: tag, props: actualProps, children: flatChildren };
  };
};
var tags = [
  "html",
  "head",
  "body",
  "title",
  "base",
  "link",
  "meta",
  "style",
  "address",
  "article",
  "aside",
  "footer",
  "header",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "main",
  "nav",
  "section",
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "ul",
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "wbr",
  "area",
  "audio",
  "img",
  "map",
  "track",
  "video",
  "embed",
  "iframe",
  "object",
  "param",
  "picture",
  "portal",
  "source",
  "canvas",
  "noscript",
  "script",
  "del",
  "ins",
  "caption",
  "col",
  "colgroup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "button",
  "datalist",
  "fieldset",
  "form",
  "input",
  "label",
  "legend",
  "meter",
  "optgroup",
  "option",
  "output",
  "progress",
  "select",
  "textarea",
  "details",
  "dialog",
  "menu",
  "summary",
  "slot",
  "template"
];
var svgTags = [
  "svg",
  "circle",
  "rect",
  "path",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "g",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "pattern",
  "mask",
  "clipPath",
  "use",
  "symbol",
  "marker",
  "image",
  "foreignObject",
  "animate",
  "animateTransform",
  "animateMotion",
  "set",
  "filter",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feFlood",
  "feGaussianBlur",
  "feMorphology",
  "feOffset",
  "feSpecularLighting",
  "feTile",
  "feTurbulence"
];
var mathTags = [
  "math",
  "mi",
  "mn",
  "mo",
  "ms",
  "mtext",
  "mrow",
  "mfrac",
  "msqrt",
  "mroot",
  "msub",
  "msup"
];
var elements = {};
tags.forEach((tag) => {
  elements[tag] = createElementFactory(tag);
});
createPrefixedFactories(svgTags, "svg", elements);
createPrefixedFactories(mathTags, "math", elements);
elements.varElement = createElementFactory("var");
var {
  html,
  head,
  body,
  title,
  base,
  link,
  meta,
  style,
  address,
  article,
  aside,
  footer,
  header,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  main,
  nav,
  section,
  blockquote,
  dd,
  div,
  dl,
  dt,
  figcaption,
  figure,
  hr,
  li,
  ol,
  p,
  pre,
  ul,
  a,
  abbr,
  b,
  bdi,
  bdo,
  br,
  cite,
  code,
  data,
  dfn,
  em,
  i,
  kbd,
  mark,
  q,
  rp,
  rt,
  ruby,
  s,
  samp,
  small,
  span,
  strong,
  sub,
  sup,
  time,
  u,
  wbr,
  area,
  audio,
  img,
  map,
  track,
  video,
  embed,
  iframe,
  object,
  param,
  picture,
  portal,
  source,
  canvas,
  noscript,
  script,
  del,
  ins,
  caption,
  col,
  colgroup,
  table,
  tbody,
  td,
  tfoot,
  th,
  thead,
  tr,
  button,
  datalist,
  fieldset,
  form,
  input,
  label,
  legend,
  meter,
  optgroup,
  option,
  output,
  progress,
  select,
  textarea,
  details,
  dialog,
  menu,
  summary,
  slot,
  template,
  svgSvg,
  svgCircle,
  svgRect,
  svgPath,
  svgLine,
  svgPolyline,
  svgPolygon,
  svgEllipse,
  svgG,
  svgText,
  svgTspan,
  svgDefs,
  svgLinearGradient,
  svgRadialGradient,
  svgStop,
  svgPattern,
  svgMask,
  svgClipPath,
  svgUse,
  svgSymbol,
  svgMarker,
  svgImage,
  svgForeignObject,
  svgAnimate,
  svgAnimateTransform,
  svgAnimateMotion,
  svgSet,
  svgFilter,
  svgFeBlend,
  svgFeColorMatrix,
  svgFeComponentTransfer,
  svgFeComposite,
  svgFeConvolveMatrix,
  svgFeDiffuseLighting,
  svgFeDisplacementMap,
  svgFeFlood,
  svgFeGaussianBlur,
  svgFeMorphology,
  svgFeOffset,
  svgFeSpecularLighting,
  svgFeTile,
  svgFeTurbulence,
  mathMath,
  mathMi,
  mathMn,
  mathMo,
  mathMs,
  mathMtext,
  mathMrow,
  mathMfrac,
  mathMsqrt,
  mathMroot,
  mathMsub,
  mathMsup,
  varElement
} = elements;
var doc = hasDocument ? document : void 0;
var getEl = bindDocMethod(doc?.querySelector);
var getEls = bindDocMethod(doc?.querySelectorAll);
var createEl = bindDocMethod(doc?.createElement);
var createSvgEl = hasDocument ? doc.createElementNS.bind(doc, "http://www.w3.org/2000/svg") : void 0;
var createMathEl = hasDocument ? doc.createElementNS.bind(doc, "http://www.w3.org/1998/Math/MathML") : void 0;
var fragment = bindDocMethod(doc?.createDocumentFragment);
var textNode = bindDocMethod(doc?.createTextNode);
var commentNode = bindDocMethod(doc?.createComment);
var getElId = bindDocMethod(doc?.getElementById);
var getElClass = bindDocMethod(doc?.getElementsByClassName);
var getElTag = bindDocMethod(doc?.getElementsByTagName);
var getElName = bindDocMethod(doc?.getElementsByName);

// src/client.ts
var client = html(
  head(
    title("my-elit-app - Elit App"),
    link({ rel: "icon", type: "image/svg+xml", href: "public/favicon.svg" }),
    meta({ charset: "UTF-8" }),
    meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
    meta({ name: "description", content: "Elit - Full-stack TypeScript framework with dev server, HMR, routing, SSR, and REST API." })
  ),
  body(
    div({ id: "app" }),
    script({ type: "module", src: "/main.js" })
  )
);

// elit.config.ts
var elit_config_default = {
  dev: {
    port: 3003,
    host: "localhost",
    open: true,
    logging: true,
    outDir: "./dev-dist",
    outFile: "index.js",
    clients: [{
      root: ".",
      basePath: "",
      ssr: () => client,
      api: server
    }]
  },
  build: [{
    entry: "./src/main.ts",
    outDir: "./dist",
    outFile: "main.js",
    format: "esm",
    minify: true,
    sourcemap: true,
    target: "es2020",
    external: [],
    copy: [
      {
        from: "./public/index.html",
        to: "./index.html",
        transform: (content, config) => {
          let html2 = content.replace('src="../src/main.ts"', 'src="main.js"');
          if (config.basePath) {
            const baseTag = `<base href="${config.basePath}/">`;
            html2 = html2.replace(
              '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
              `<meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseTag}`
            );
          }
          return html2;
        }
      },
      { from: "./public/favicon.svg", to: "./favicon.svg" }
    ]
  }],
  preview: {
    port: 3e3,
    host: "localhost",
    open: false,
    logging: false,
    clients: [{
      root: ".",
      basePath: "",
      ssr: () => client,
      api: server
    }]
  },
  test: {
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "benchmark", "docs", "coverage"],
    testTimeout: 5e3,
    bail: false,
    globals: true,
    watch: false,
    reporter: "verbose",
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "html", "lcov", "json", "coverage-final.json", "clover"],
      include: ["**/*.ts"],
      // รวมทุกไฟล์ TypeScript ในโปรเจกต์
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**", "**/dist/**", "**/coverage/**"]
    }
  },
  wapk: {
    name: "elit-full-db-example",
    version: "1.0.0",
    runtime: "node",
    entry: "./dev-dist/index.js",
    script: {
      start: "node ./dev-dist/index.js"
    },
    env: {
      APP_NAME: "Elit Full DB Example"
    },
    run: {
      runtime: "node",
      useWatcher: true,
      watchArchive: true,
      syncInterval: 150,
      archiveSyncInterval: 150
    }
  },
  // Add scripts for running tests
  scripts: {
    "test": "elit test",
    "test:run": "elit test --run",
    "test:unit": "elit test --run",
    "test:watch": "elit test --watch"
  }
};

// elit-standalone-dev-entry.ts
var resolvedConfig = elit_config_default ?? {};
var inlineDevConfig = { "port": 3003, "host": "localhost", "open": true, "logging": true, "env": { "MODE": "development" } };
var runtimeConfig = resolvedConfig.dev ?? {};
var mergedConfig = { ...runtimeConfig, ...inlineDevConfig };
var runtimeClients = [
  {
    ...mergedConfig.clients?.[0] ?? {},
    basePath: mergedConfig.clients?.[0]?.basePath ?? "",
    fallbackRoot: (0, import_node_path2.resolve)(__dirname, "../dist"),
    index: mergedConfig.clients?.[0]?.index ?? void 0,
    root: (0, import_node_path2.resolve)(__dirname, ".."),
    mode: "dev"
  }
];
var options = {
  port: mergedConfig.port || 3e3,
  host: mergedConfig.host || "localhost",
  open: mergedConfig.open ?? false,
  logging: mergedConfig.logging ?? true,
  domain: mergedConfig.domain,
  api: mergedConfig.api,
  ws: mergedConfig.ws,
  https: mergedConfig.https,
  ssr: mergedConfig.ssr,
  proxy: mergedConfig.proxy,
  worker: mergedConfig.worker ?? [],
  watch: mergedConfig.watch ?? ["**/*.ts", "**/*.js", "**/*.html", "**/*.css"],
  ignore: mergedConfig.ignore ?? ["node_modules/**", "dist/**", ".git/**", "**/*.d.ts"],
  env: mergedConfig.env,
  clients: runtimeClients,
  mode: "dev"
};
var devServer = createDevServer(options);
var shutdown = async () => {
  await devServer.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
