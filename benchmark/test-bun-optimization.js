/**
 * Quick benchmark to test Bun optimizations
 * Run with: bun benchmark/test-bun-optimization.js
 */

import { createServer } from '../dist/http.mjs';

const PORT = 3000;
const REQUESTS = 5000;
const CONCURRENT = 50;

console.log('🚀 Testing Elit HTTP optimizations on Bun\n');

// Create server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});

await new Promise((resolve) => {
  server.listen(PORT, () => {
    console.log(`✓ Server listening on port ${PORT}\n`);
    resolve();
  });
});

// Warmup
console.log('Warming up...');
for (let i = 0; i < 100; i++) {
  await fetch(`http://localhost:${PORT}/`);
}

// Benchmark
console.log(`Running ${REQUESTS} requests with ${CONCURRENT} concurrent connections...\n`);

const startTime = performance.now();
const latencies = [];

// Run concurrent batches
const batchSize = Math.ceil(REQUESTS / CONCURRENT);
const batches = [];

for (let i = 0; i < CONCURRENT; i++) {
  batches.push((async () => {
    for (let j = 0; j < batchSize && (i * batchSize + j) < REQUESTS; j++) {
      const reqStart = performance.now();
      const response = await fetch(`http://localhost:${PORT}/`);
      await response.text();
      const reqEnd = performance.now();
      latencies.push(reqEnd - reqStart);
    }
  })());
}

await Promise.all(batches);

const endTime = performance.now();
const totalTime = (endTime - startTime) / 1000; // seconds

// Calculate stats
latencies.sort((a, b) => a - b);
const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
const minLatency = latencies[0];
const maxLatency = latencies[latencies.length - 1];
const p50 = latencies[Math.floor(latencies.length * 0.5)];
const p95 = latencies[Math.floor(latencies.length * 0.95)];
const p99 = latencies[Math.floor(latencies.length * 0.99)];

const reqPerSec = REQUESTS / totalTime;

console.log('📊 Results:');
console.log(`  Requests:        ${REQUESTS.toLocaleString()}`);
console.log(`  Total time:      ${totalTime.toFixed(2)}s`);
console.log(`  Requests/sec:    ${reqPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Avg latency:     ${avgLatency.toFixed(2)}ms`);
console.log(`  Min latency:     ${minLatency.toFixed(2)}ms`);
console.log(`  Max latency:     ${maxLatency.toFixed(2)}ms`);
console.log(`  P50 latency:     ${p50.toFixed(2)}ms`);
console.log(`  P95 latency:     ${p95.toFixed(2)}ms`);
console.log(`  P99 latency:     ${p99.toFixed(2)}ms`);

// Performance target
const ELYSIA_TARGET = 90000;
if (reqPerSec >= ELYSIA_TARGET) {
  console.log(`\n🎉 SUCCESS! Performance meets/exceeds Elysia target (${ELYSIA_TARGET.toLocaleString()} req/s)`);
} else {
  const percentOfTarget = (reqPerSec / ELYSIA_TARGET * 100).toFixed(1);
  console.log(`\n⚡ Performance: ${percentOfTarget}% of Elysia target (${ELYSIA_TARGET.toLocaleString()} req/s)`);
}

server.close();
process.exit(0);
