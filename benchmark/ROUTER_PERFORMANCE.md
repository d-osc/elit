# ServerRouter Performance Analysis

## Overview

elit's `ServerRouter` provides a full-featured HTTP router with minimal performance overhead compared to raw HTTP servers.

## Benchmark Results (Node.js v24.12.0)

### Raw HTTP Server
```
Requests/sec:    10,410
Average latency: 6.69ms
```

### ServerRouter (with routing, params, middleware)
```
Requests/sec:    10,128
Average latency: 6.94ms
```

### Performance Overhead
- **Throughput**: -2.7% (282 req/sec difference)
- **Latency**: +0.25ms average
- **Trade-off**: Minimal overhead for significant features

## Features Included in ServerRouter

The 2.7% overhead includes:

1. **Route Matching**
   - Regex pattern matching for URL paths
   - Dynamic parameter extraction (`:id`, `:name`, etc.)
   - Query string parsing

2. **Request Context**
   - Unified context object with req, res, params, query, body
   - Header normalization
   - Body parsing

3. **Middleware Support**
   - Middleware chain execution
   - Built-in middleware (CORS, logger, rate limit, etc.)
   - Error handling

4. **Method Routing**
   - GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
   - Method-specific handlers

## Performance Characteristics

### What Makes ServerRouter Fast?

1. **Efficient Route Matching**
   - Pre-compiled regex patterns
   - Linear route lookup (O(n) where n = number of routes)
   - No tree-based routing overhead for simple cases

2. **Minimal Abstractions**
   - Direct access to underlying HTTP req/res
   - No unnecessary object copying
   - Lazy body parsing (only when needed)

3. **Optimized Context Creation**
   - Object.create(null) for faster property access
   - Minimal property allocation
   - Zero-copy where possible

### Route Matching Performance

```typescript
private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const pattern = path
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, name) => (paramNames.push(name), '([^\\/]+)'));
  return { pattern: new RegExp(`^${pattern}$`), paramNames };
}
```

**Optimization**: Patterns are compiled once during route registration, not on every request.

## Comparison with Elysia (on Bun)

Expected results when running on Bun:

```
Elysia:          ~80,000-150,000 req/sec
elit/Router:     ~40,000-80,000 req/sec (estimated)
```

**Why Elysia is faster on Bun:**
1. Native Bun integration
2. Radix tree routing (O(log n) vs O(n))
3. Bun-specific optimizations
4. No cross-runtime abstraction layer

**Why use elit/ServerRouter:**
1. **Cross-runtime**: Works on Node.js, Bun, and Deno
2. **Zero dependencies**: No production dependencies
3. **Integrated ecosystem**: Works with HMR, dev server, build tools
4. **Simple API**: Familiar Express-like syntax
5. **Minimal overhead**: Only 2.7% slower than raw HTTP

## Middleware Performance Impact

Common middleware overhead estimates:

```
CORS:           ~1-2% overhead
Logger:         ~2-3% overhead
Rate Limit:     ~3-5% overhead (with in-memory store)
Body Parser:    ~5-10% overhead (depends on payload size)
Compression:    ~10-30% overhead (CPU-intensive, but reduces bandwidth)
```

**Tip**: Only use middleware you need. Each middleware adds to the request processing chain.

## Real-World Performance

In production scenarios with multiple routes and middleware:

```
Routes:          10-50 routes
Middleware:      3-5 middleware
Expected RPS:    8,000-9,000 req/sec (Node.js)
Average latency: 8-12ms
```

**Factors affecting performance:**
- Number of routes (linear impact)
- Middleware complexity
- Body parsing (if used)
- Database queries (if applicable)
- Network latency

## Optimization Tips

### 1. Order Routes by Frequency
Place frequently accessed routes first in the route list:

```typescript
router.get('/', handler);              // Most frequent
router.get('/api/users', handler);     // Frequent
router.get('/api/admin', handler);     // Less frequent
```

### 2. Minimize Middleware
Only add middleware that's actually needed:

```typescript
// Good: Specific middleware for specific routes
router.use(cors());
router.get('/api/data', handler);

// Less optimal: Heavy middleware on all routes
router.use(compression());  // CPU-intensive
router.use(bodyParser());   // Not needed for GET requests
```

### 3. Use Lazy Body Parsing
Don't parse body if not needed:

```typescript
// Good: Parse only when needed
router.post('/api/data', async (ctx) => {
  if (ctx.headers['content-type'] === 'application/json') {
    await ctx.req.json();
  }
});

// Less optimal: Always parsing
router.use(bodyParser());  // Parses on every request
```

### 4. Cache Route Patterns
Routes are automatically cached, but you can optimize by reducing regex complexity:

```typescript
// Good: Simple pattern
router.get('/users/:id', handler);

// Less optimal: Complex pattern
router.get('/users/:id/posts/:postId/comments/:commentId', handler);
```

## Benchmark Scripts

Run benchmarks yourself:

```bash
# HTTP Server benchmark
npm run benchmark

# ServerRouter benchmark
npm run benchmark:router

# On Bun (with Elysia comparison)
bun install elysia
bun benchmark/router-benchmark.js
```

## Conclusion

elit's ServerRouter provides **excellent performance** with minimal overhead:

- ✅ **10,128 req/sec** on Node.js (only 2.7% slower than raw HTTP)
- ✅ **Sub-7ms latency** for typical workloads
- ✅ Full routing, params, query parsing, middleware support
- ✅ Cross-runtime compatibility (Node.js, Bun, Deno)
- ✅ Zero production dependencies

**Use ServerRouter when**:
- You need routing and middleware
- Cross-runtime support is important
- You want zero dependencies
- 10K+ req/sec is sufficient for your needs

**Consider alternatives when**:
- You need 100K+ req/sec
- Running exclusively on Bun
- Every millisecond of latency matters
- You need advanced routing features (radix tree, etc.)
