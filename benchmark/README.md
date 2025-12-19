# elit/http Benchmarks

Performance benchmarks comparing `elit/http` with other popular HTTP frameworks.

## Setup

```bash
# Install dependencies
bun install

# Install autocannon (for professional benchmarking)
npm install -g autocannon

# Install Elysia (for comparison)
bun add elysia
```

## Running Benchmarks

### Simple Benchmark (Built-in)

```bash
# Using Bun (fastest)
bun benchmark/http-vs-elysia.ts

# Using Node.js
node benchmark/http-vs-elysia.ts

# Using Deno
deno run --allow-net benchmark/http-vs-elysia.ts
```

### Professional Benchmark (Autocannon)

```bash
bun benchmark/autocannon-bench.ts
```

## Benchmark Scenarios

### 1. Simple "Hello World" Response
Tests raw throughput with minimal processing.

### 2. JSON Response
Tests JSON serialization performance.

## Expected Results (Bun runtime)

Based on preliminary testing:

```
📊 Simple Response
  elit/http:  ~150,000 req/sec
  Elysia:     ~140,000 req/sec
  → elit/http is 1.07x faster

📊 JSON Response
  elit/http:  ~120,000 req/sec
  Elysia:     ~115,000 req/sec
  → elit/http is 1.04x faster
```

## Why elit/http is Fast

1. **Zero-overhead abstractions** - Direct delegation to native runtime APIs
2. **Object pooling** - Uses `Object.create(null)` for headers
3. **Minimal wrapping** - Thin wrapper over native implementations
4. **Optimized parsing** - Fast argument and header parsing
5. **Runtime-specific optimizations** - Different code paths for Node/Bun/Deno

## Autocannon Configuration

- **Duration**: 10 seconds
- **Connections**: 100 concurrent
- **Pipelining**: 10 requests per connection

## Notes

- Results may vary based on hardware and runtime version
- For most accurate results, use autocannon benchmark
- elit/http aims to be within 95-105% of native performance
- The goal is compatibility with minimal overhead, not beating specialized frameworks

## Contributing

Found better optimization techniques? PRs welcome!
