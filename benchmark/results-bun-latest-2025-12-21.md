# Benchmark Results - Bun (Latest) - December 21, 2025

## 🔥 Comprehensive Bun Benchmark Results

### Test Configuration
- **Warmup**: 1,000 requests
- **Total Requests**: 10,000
- **Concurrent Connections**: 100
- **Endpoint**: Simple GET `/` returning "Hello World"

### System Specifications
- **Platform**: Windows 11 Pro (Build 26200)
- **CPU**: Intel Core 13th/14th Gen @ ~2.5GHz (Model 191)
- **Memory**: 64GB RAM (65,246 MB)
- **Motherboard**: ASRock B760M PG Lightning
- **Network**: Realtek Gaming 2.5GbE

### Runtime & Package Versions

**Bun v1.3.2**
- Revision: b131639cc
- Engine: JavaScriptCore (WebKit)
- Built-in: SQLite, WebSocket, HTTP/HTTPS

**Package Versions:**
- Express: v5.2.1 (latest)
- Elysia: v1.4.19
- Elit: v3.2.5

**Test Date**: 2025-12-21

---

## 📊 Results Summary

| Rank | Framework | Requests/sec | Avg Latency | P50 | P95 | P99 |
|------|-----------|--------------|-------------|-----|-----|-----|
| 🥇 | **Express v5** | **15,359** | **6.48ms** | 5.38ms | 12.06ms | 58.82ms |
| 🥈 | **Elit** | **15,050** | **6.62ms** | 5.73ms | 13.18ms | 22.85ms |
| 🥉 | Elysia | 11,303 | 8.81ms | 7.86ms | 15.29ms | 26.77ms |

---

## 📊 Detailed Results

### 🥇 Express v5: 15,359 req/s

```
Requests/sec:    15,359
Latency (ms):
  Min:           0.15
  Max:           65.41
  Average:       6.48
  P50:           5.38
  P95:           12.06
  P99:           58.82
```

**Notes:**
- Express v5.2.1 shows significant Bun optimization
- Latest version highly optimized for Bun runtime
- Best overall throughput

---

### 🥈 Elit: 15,050 req/s (98% of Express)

```
Requests/sec:    15,050
Latency (ms):
  Min:           0.30
  Max:           45.94
  Average:       6.62
  P50:           5.73
  P95:           13.18
  P99:           22.85
```

**Notes:**
- Very close to Express v5 (only 2% difference)
- **Better P99 latency** than Express (22.85ms vs 58.82ms)
- Zero production dependencies
- More consistent performance (lower max latency)

---

### 🥉 Elysia: 11,303 req/s

```
Requests/sec:    11,303
Latency (ms):
  Min:           0.25
  Max:           37.70
  Average:       8.81
  P50:           7.86
  P95:           15.29
  P99:           26.77
```

**Notes:**
- Bun-native optimization
- 26% slower than Elit
- Plugin ecosystem support

---

## 💡 Analysis

### Performance Comparison

**Elit vs Elysia:**
- ✅ **33% faster than Elysia** (15,050 vs 11,303 req/s)
- ✅ Better latency across all percentiles
- ✅ Zero dependencies vs Elysia's dependencies

**Elit vs Express v5:**
- ⚡ **98% of Express performance** (15,050 vs 15,359 req/s)
- ✅ **Better P99 latency** (22.85ms vs 58.82ms)
- ✅ **Lower max latency** (45.94ms vs 65.41ms)
- ✅ **Zero dependencies** vs Express's 30+ dependencies
- ✅ **More consistent** performance

---

## 🏆 Key Takeaways

1. **Express v5 is highly optimized for Bun** - latest release shows impressive performance
2. **Elit is extremely competitive** - 98% of Express's performance with better P99
3. **Elit significantly outperforms Elysia** - 33% faster than Bun-specific framework
4. **Elit offers better consistency** - lower max latency and better P99 than Express
5. **Zero dependencies advantage** - Elit achieves this with no external dependencies

---

## 🎯 When to Choose Each Framework

### ✅ Choose Elit when:
- You want **zero dependencies** (smallest bundle size)
- You need **cross-runtime support** (Node.js, Bun, Deno)
- You value **consistent latency** (better P99 than Express)
- You want **built-in dev tools + HMR**
- Performance is critical AND you want minimal dependencies

### ✅ Choose Express v5 when:
- You need the **absolute highest throughput** on Bun
- You're already invested in Express ecosystem
- You don't mind 30+ dependencies
- You're willing to trade P99 latency for peak throughput

### ✅ Choose Elysia when:
- You prefer Elysia's plugin ecosystem
- You're Bun-only (no cross-runtime needs)

---

## 📈 Cross-Runtime Performance Summary

| Runtime | Elit Performance | vs Best Alternative |
|---------|------------------|---------------------|
| **Bun v1.3.2** | 15,050 req/s | 98% of Express v5, 33% faster than Elysia |
| **Node.js v20.19.5** | 5,943 req/s | 59% faster than Express |
| **Deno v2.5.6** | 7,223 req/s | Native support |

**Conclusion**: Elit delivers excellent performance across all runtimes with **zero production dependencies**, making it ideal for projects requiring small bundle size, cross-runtime compatibility, and consistent performance.
