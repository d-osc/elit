# elit/wss

Cross-runtime WebSocket Secure (WSS) implementation compatible with the [ws](https://www.npmjs.com/package/ws) package.

## Features

- **Cross-runtime**: Works on Node.js, Bun, and Deno
- **Compatible API**: Similar to `ws` package WSS API
- **Pure implementation**: No external dependencies for WebSocket logic
- **TypeScript**: Full type definitions included
- **Lightweight**: Only ~7KB minified
- **TLS/SSL Support**: Secure WebSocket connections with HTTPS
- **Client & Server**: Both WSS client and server implementations

## Installation

```bash
npm install elit
```

## Usage

### Basic WSS Server

```typescript
import { WSSServer } from 'elit/wss';
import { readFileSync } from 'fs';

const wssServer = new WSSServer({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem'),
  path: '/ws'
});

wssServer.on('connection', (client, request) => {
  console.log('New secure connection');

  client.send('Welcome to WSS!');

  client.on('message', (data, isBinary) => {
    console.log('Received:', data.toString());
    client.send(data); // Echo
  });

  client.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WSS Server listening on wss://localhost:8443/ws');
```

### WSS Server with Existing HTTPS Server

```typescript
import { createWSSServer } from 'elit/wss';
import { createServer } from 'https';
import { readFileSync } from 'fs';

const httpsServer = createServer({
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});

const wss = createWSSServer({
  httpsServer,
  path: '/websocket'
});

wss.on('connection', (client) => {
  client.send('Connected via HTTPS server!');
});

httpsServer.listen(9443, () => {
  console.log('Server listening on wss://localhost:9443/websocket');
});
```

### WSS Client

```typescript
import { WSSClient } from 'elit/wss';

const client = new WSSClient('wss://example.com/ws');

client.on('open', () => {
  console.log('Connected to secure server');
  client.send('Hello!');
});

client.on('message', (data, isBinary) => {
  console.log('Received:', data.toString());
});

client.on('close', (code, reason) => {
  console.log('Disconnected:', code, reason);
});

client.on('error', (error) => {
  console.error('Error:', error);
});
```

## API

### WSSServer

Secure WebSocket server class.

#### Constructor

```typescript
new WSSServer(options?: WSSServerOptions, callback?: () => void)
```

**Options:**
- `port` (number): Port to listen on
- `host` (string): Host to bind to
- `key` (string | Buffer): Private key for TLS
- `cert` (string | Buffer): Certificate for TLS
- `ca` (string | Buffer): Certificate authority
- `passphrase` (string): Passphrase for private key
- `rejectUnauthorized` (boolean): Reject unauthorized connections
- `requestCert` (boolean): Request client certificate
- `httpsServer` (Server): Existing HTTPS server to attach to
- `path` (string): Path to accept connections on (default: '/')
- `noServer` (boolean): Don't create HTTP server
- `clientTracking` (boolean): Track connected clients (default: true)
- `verifyClient` (function): Custom client verification
- `handleProtocols` (function): Custom protocol selection
- `perMessageDeflate` (boolean | object): Enable message compression
- `maxPayload` (number): Maximum message size

#### Events

##### 'connection'

Emitted when a client connects.

```typescript
wssServer.on('connection', (client: WebSocket, request: IncomingMessage) => {
  console.log('Client connected');
});
```

##### 'error'

Emitted when an error occurs.

```typescript
wssServer.on('error', (error: Error) => {
  console.error('Server error:', error);
});
```

##### 'close'

Emitted when the server closes.

```typescript
wssServer.on('close', () => {
  console.log('Server closed');
});
```

#### Methods

##### handleUpgrade(request, socket, head, callback)

Manually handle WebSocket upgrade.

```typescript
wssServer.handleUpgrade(request, socket, head, (client) => {
  wssServer.emit('connection', client, request);
});
```

##### shouldHandle(request)

Check if server should handle a request.

```typescript
if (wssServer.shouldHandle(request)) {
  // Handle upgrade
}
```

##### close(callback?)

Close the server.

```typescript
wssServer.close(() => {
  console.log('Server closed');
});
```

##### address()

Get server address.

```typescript
const addr = wssServer.address();
console.log(`Listening on port ${addr.port}`);
```

#### Properties

##### clients

Set of connected clients (when `clientTracking` is true).

```typescript
wssServer.clients.forEach(client => {
  client.send('Broadcast message');
});
```

### WSSClient

Secure WebSocket client class.

#### Constructor

```typescript
new WSSClient(address: string | URL, protocols?: string | string[], options?: any)
```

**Parameters:**
- `address`: WSS URL (wss://...)
- `protocols`: WebSocket sub-protocols
- `options`: Connection options (e.g., headers, rejectUnauthorized)

#### Events

##### 'open'

Emitted when connection is established.

```typescript
client.on('open', () => {
  console.log('Connected');
});
```

##### 'message'

Emitted when a message is received.

```typescript
client.on('message', (data: Data, isBinary: boolean) => {
  console.log('Received:', data);
});
```

##### 'close'

Emitted when connection closes.

```typescript
client.on('close', (code: number, reason: string) => {
  console.log('Closed:', code, reason);
});
```

##### 'error'

Emitted when an error occurs.

```typescript
client.on('error', (error: Error) => {
  console.error('Error:', error);
});
```

#### Methods

##### send(data, options?, callback?)

Send data through the connection.

```typescript
client.send('Hello');
client.send(Buffer.from('Binary data'));
client.send('Data', (err) => {
  if (err) console.error('Send failed:', err);
});
```

##### close(code?, reason?)

Close the connection.

```typescript
client.close();
client.close(1000, 'Normal closure');
```

##### ping(data?, mask?, callback?)

Send a ping frame.

```typescript
client.ping((err) => {
  if (!err) console.log('Ping sent');
});
```

##### pong(data?, mask?, callback?)

Send a pong frame.

```typescript
client.pong();
```

##### terminate()

Forcefully close the connection.

```typescript
client.terminate();
```

#### Properties

##### readyState

Current connection state.

```typescript
import { ReadyState } from 'elit/wss';

if (client.readyState === ReadyState.OPEN) {
  client.send('Message');
}
```

States:
- `ReadyState.CONNECTING` (0): Connection is being established
- `ReadyState.OPEN` (1): Connection is open
- `ReadyState.CLOSING` (2): Connection is closing
- `ReadyState.CLOSED` (3): Connection is closed

##### url

The WebSocket URL.

```typescript
console.log(client.url); // => 'wss://example.com/ws'
```

##### protocol

The selected sub-protocol.

```typescript
console.log(client.protocol);
```

## Generating Certificates

For development and testing, you can generate self-signed certificates:

```bash
# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Use in your code
import { readFileSync } from 'fs';

const wss = new WSSServer({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});
```

**Note**: For production, use certificates from a trusted Certificate Authority (CA) like Let's Encrypt.

## Common Use Cases

### Secure Chat Server

```typescript
import { createWSSServer, ReadyState } from 'elit/wss';

const wss = createWSSServer({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});

function broadcast(message: string, sender: WebSocket) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === ReadyState.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (client) => {
  client.on('message', (data) => {
    const message = JSON.parse(data.toString());
    broadcast(JSON.stringify({
      type: 'message',
      text: message.text,
      timestamp: Date.now()
    }), client);
  });
});
```

### Secure API Gateway

```typescript
import { WSSServer } from 'elit/wss';
import { createServer } from 'https';

const httpsServer = createServer({
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});

// HTTP endpoint
httpsServer.on('request', (req, res) => {
  res.writeHead(200);
  res.end('API is running');
});

// WebSocket endpoint
const wss = new WSSServer({
  httpsServer,
  path: '/api/ws'
});

wss.on('connection', (client) => {
  client.send(JSON.stringify({ type: 'connected' }));
});

httpsServer.listen(8443);
```

### Authenticated Connections

```typescript
import { WSSServer } from 'elit/wss';

const wss = new WSSServer({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem'),
  verifyClient: (info, callback) => {
    const token = new URL(info.req.url!, 'wss://localhost').searchParams.get('token');

    if (token === 'secret-token') {
      callback(true);
    } else {
      callback(false, 401, 'Unauthorized');
    }
  }
});

wss.on('connection', (client) => {
  console.log('Authenticated client connected');
});
```

### Room-Based Communication

```typescript
import { createWSSServer, ReadyState } from 'elit/wss';

interface ClientWithRoom {
  room?: string;
}

const wss = createWSSServer({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});

function broadcastToRoom(room: string, message: string, sender?: any) {
  wss.clients.forEach((client: any) => {
    if (client.room === room && client !== sender && client.readyState === ReadyState.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (client: any) => {
  client.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'join') {
      client.room = msg.room;
      broadcastToRoom(msg.room, JSON.stringify({
        type: 'user_joined'
      }), client);
    } else if (msg.type === 'message') {
      broadcastToRoom(client.room, JSON.stringify(msg), client);
    }
  });
});
```

## Runtime Behavior

- **Node.js**: Uses HTTPS server with WebSocket upgrade handling
- **Bun**: Uses native WebSocket with TLS support
- **Deno**: Uses native WebSocket with TLS support

## Security Considerations

1. **Use Valid Certificates**: Always use certificates from trusted CAs in production
2. **Verify Clients**: Implement client verification for authentication
3. **Enable Encryption**: Always use WSS (wss://) instead of WS (ws://) for sensitive data
4. **Validate Input**: Always validate and sanitize incoming messages
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Origin Checking**: Verify the origin of connections to prevent CSRF attacks

## Migration from ws Package

elit/wss provides a compatible API with the `ws` package:

```typescript
// Before (using ws package)
import WebSocket from 'ws';
const wss = new WebSocket.Server({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});

// After (using elit/wss)
import { WSSServer } from 'elit/wss';
const wss = new WSSServer({
  port: 8443,
  key: readFileSync('key.pem'),
  cert: readFileSync('cert.pem')
});
```

## Performance

elit/wss is optimized for performance:

- Native WebSocket implementations on all runtimes
- Minimal overhead for TLS/SSL
- Efficient event handling
- Lightweight frame parsing

## License

MIT

## Related Packages

- [elit/ws](./ws.md) - WebSocket (non-secure) implementation
- [elit/https](./https.md) - HTTPS server and client
- [elit/http](./http.md) - HTTP server and client
