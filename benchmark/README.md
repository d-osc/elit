# Server Performance Benchmark

Performance comparison between Elysia and elit/server across different runtimes.

## Prerequisites

```bash
# Install dependencies
npm install

# Build elit package
npm run build

# For Bun benchmarks
curl -fsSL https://bun.sh/install | bash
```

## Running Benchmarks

### On Node.js
```bash
node benchmark/server-benchmark.js
```

### On Bun (includes Elysia comparison)
```bash
bun install elysia
bun benchmark/server-benchmark.js
```

## Benchmark Configuration

- **Warmup requests**: 1,000
- **Benchmark requests**: 10,000
- **Concurrent requests**: 100
- **Endpoints tested**: Simple GET `/` returning "Hello World"

## Metrics

- **Requests/sec**: Total requests per second
- **Latency (ms)**: Response time statistics
  - Min: Minimum response time
  - Max: Maximum response time
  - Average: Mean response time
  - P50: 50th percentile (median)
  - P95: 95th percentile
  - P99: 99th percentile

## Expected Results

### Node.js
- elit/server: ~15,000-25,000 req/sec
- Average latency: 4-8ms

### Bun
- Elysia: ~80,000-150,000 req/sec
- elit/server: ~50,000-100,000 req/sec
- Average latency: <1-2ms

*Note: Results vary based on hardware and system load*

## Implementation Details

### elit/server
- Cross-runtime compatible (Node.js, Bun, Deno)
- Zero external dependencies
- Built-in routing, middleware support
- HMR and dev server features

### Elysia
- Bun-native HTTP server
- Optimized for Bun runtime
- Type-safe with TypeScript
- Plugin ecosystem

## Architecture Comparison

| Feature | elit/server | Elysia |
|---------|-------------|--------|
| Runtime | Node.js, Bun, Deno | Bun only |
| Dependencies | 0 (production) | Multiple |
| Bundle size | ~52KB | ~150KB+ |
| Type safety | TypeScript | TypeScript |
| Routing | Built-in | Built-in |
| WebSocket | Built-in | Plugin |
| HMR | Built-in | No |
| Dev server | Built-in | No |

## Why elit/server?

1. **Cross-runtime**: Works on Node.js, Bun, and Deno
2. **Zero dependencies**: No production dependencies
3. **Small bundle**: ~52KB total
4. **Full-featured**: Server + dev server + HMR + build tools
5. **Type-safe**: Full TypeScript support
6. **Consistent API**: Same API across all runtimes

## When to use Elysia?

- Bun-only deployment
- Maximum performance on Bun
- Need Elysia's plugin ecosystem
- Don't need cross-runtime compatibility

## Actual Benchmark Results

### elit/server on Node.js v24.12.0
```
Requests/sec:    10,899
Latency (ms):
  Min:           3.95
  Max:           15.10
  Average:       6.34
  P50:           5.67
  P95:           10.79
  P99:           11.60
```

**Test Configuration:**
- Warmup: 1,000 requests
- Benchmark: 10,000 requests
- Concurrent: 100 requests
- Endpoint: Simple GET `/` returning "Hello World"

**System:**
- Runtime: Node.js v24.12.0
- Platform: Windows
- Date: 2025-12-19
