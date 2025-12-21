# Benchmark Results - Deno - December 21, 2025

## 🦕 Elit on Deno

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

### Runtime Version

**Deno v2.5.6 (Stable)**
- V8 Engine: 14.0.365.5-rusty
- TypeScript: 5.9.2
- Architecture: x86_64-pc-windows-msvc

**Test Date**: 2025-12-21

---

## 📊 Results

**Elit on Deno: 7,223 req/s**
```
Requests/sec:    7,223
Latency (ms):
  Min:           2.83
  Max:           327.45
  Average:       13.69
  P50:           8.46
  P95:           22.95
  P99:           171.67
```

---

## 💡 Notes

- **Elysia**: Does not support Deno runtime (Bun-only framework)
- **Express**: Requires npm compatibility layer on Deno
- Elit provides native Deno support with zero dependencies

---

## ✅ Key Takeaways

1. **Elit runs natively on Deno** with full TypeScript support
2. **7,223 req/s** demonstrates solid performance on Deno runtime
3. **Cross-runtime compatibility** without compromising functionality
4. **V8 optimization** benefits from Deno's modern V8 engine (14.0)

---

## 🏆 Cross-Runtime Performance Summary

| Runtime | Elit Performance | Notes |
|---------|------------------|-------|
| **Bun v1.3.2** | 14,533 req/s | Best performance (JavaScriptCore) |
| **Node.js v20.19.5** | 10,410 req/s | Solid production runtime |
| **Deno v2.5.6** | 7,223 req/s | Native TypeScript support |

**Conclusion**: Elit delivers consistent, reliable performance across all major JavaScript runtimes while maintaining zero production dependencies.
