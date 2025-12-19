/**
 * Benchmark: elit/http vs Elysia
 * Tests throughput and latency for both frameworks
 */

import { createServer } from '../src/http';

// Benchmark configuration
const PORT = 3000;
const WARMUP_REQUESTS = 1000;
const BENCHMARK_REQUESTS = 10000;
const CONCURRENT_CONNECTIONS = 100;

/**
 * Simple response benchmark
 */
async function benchmarkSimpleResponse() {
  console.log('\n📊 Benchmark: Simple "Hello World" Response\n');

  // 1. elit/http
  console.log('Starting elit/http server...');
  const elitServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  });

  await new Promise<void>((resolve) => {
    elitServer.listen(PORT, () => {
      console.log(`✓ elit/http listening on port ${PORT}`);
      resolve();
    });
  });

  // Warmup
  console.log('Warming up...');
  await runRequests(PORT, WARMUP_REQUESTS, 10);

  // Benchmark
  console.log(`Running ${BENCHMARK_REQUESTS} requests...`);
  const elitResults = await runRequests(PORT, BENCHMARK_REQUESTS, CONCURRENT_CONNECTIONS);

  elitServer.close();
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n✓ elit/http results:');
  printResults(elitResults);

  // 2. Elysia (if available)
  try {
    const { Elysia } = await import('elysia');
    console.log('\n\nStarting Elysia server...');

    const elysiaApp = new Elysia()
      .get('/', () => 'Hello World')
      .listen(PORT);

    console.log(`✓ Elysia listening on port ${PORT}`);

    // Warmup
    console.log('Warming up...');
    await runRequests(PORT, WARMUP_REQUESTS, 10);

    // Benchmark
    console.log(`Running ${BENCHMARK_REQUESTS} requests...`);
    const elysiaResults = await runRequests(PORT, BENCHMARK_REQUESTS, CONCURRENT_CONNECTIONS);

    elysiaApp.stop();
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n✓ Elysia results:');
    printResults(elysiaResults);

    // Comparison
    console.log('\n\n📈 Comparison:');
    console.log(`elit/http:  ${elitResults.reqPerSec.toFixed(2)} req/sec`);
    console.log(`Elysia:     ${elysiaResults.reqPerSec.toFixed(2)} req/sec`);
    const speedup = elitResults.reqPerSec / elysiaResults.reqPerSec;
    if (speedup > 1) {
      console.log(`\n🚀 elit/http is ${speedup.toFixed(2)}x faster!`);
    } else {
      console.log(`\n⚡ Elysia is ${(1/speedup).toFixed(2)}x faster!`);
    }
  } catch (error) {
    console.log('\n⚠️  Elysia not installed. Install with: bun add elysia');
  }
}

/**
 * JSON response benchmark
 */
async function benchmarkJSONResponse() {
  console.log('\n\n📊 Benchmark: JSON Response\n');

  const testData = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    created: new Date().toISOString(),
    tags: ['benchmark', 'test', 'performance']
  };

  // 1. elit/http
  console.log('Starting elit/http server...');
  const elitServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(testData));
  });

  await new Promise<void>((resolve) => {
    elitServer.listen(PORT, () => {
      console.log(`✓ elit/http listening on port ${PORT}`);
      resolve();
    });
  });

  // Warmup
  await runRequests(PORT, WARMUP_REQUESTS, 10);

  // Benchmark
  console.log(`Running ${BENCHMARK_REQUESTS} requests...`);
  const elitResults = await runRequests(PORT, BENCHMARK_REQUESTS, CONCURRENT_CONNECTIONS);

  elitServer.close();
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n✓ elit/http results:');
  printResults(elitResults);

  // 2. Elysia (if available)
  try {
    const { Elysia } = await import('elysia');
    console.log('\n\nStarting Elysia server...');

    const elysiaApp = new Elysia()
      .get('/', () => testData)
      .listen(PORT);

    console.log(`✓ Elysia listening on port ${PORT}`);

    // Warmup
    await runRequests(PORT, WARMUP_REQUESTS, 10);

    // Benchmark
    console.log(`Running ${BENCHMARK_REQUESTS} requests...`);
    const elysiaResults = await runRequests(PORT, BENCHMARK_REQUESTS, CONCURRENT_CONNECTIONS);

    elysiaApp.stop();
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n✓ Elysia results:');
    printResults(elysiaResults);

    // Comparison
    console.log('\n\n📈 Comparison:');
    console.log(`elit/http:  ${elitResults.reqPerSec.toFixed(2)} req/sec`);
    console.log(`Elysia:     ${elysiaResults.reqPerSec.toFixed(2)} req/sec`);
    const speedup = elitResults.reqPerSec / elysiaResults.reqPerSec;
    if (speedup > 1) {
      console.log(`\n🚀 elit/http is ${speedup.toFixed(2)}x faster!`);
    } else {
      console.log(`\n⚡ Elysia is ${(1/speedup).toFixed(2)}x faster!`);
    }
  } catch (error) {
    console.log('\n⚠️  Elysia not installed.');
  }
}

/**
 * Run HTTP requests
 */
async function runRequests(port: number, count: number, concurrent: number) {
  const latencies: number[] = [];
  const startTime = performance.now();

  const batchSize = Math.ceil(count / concurrent);
  const batches: Promise<void>[] = [];

  for (let i = 0; i < concurrent; i++) {
    batches.push((async () => {
      for (let j = 0; j < batchSize && (i * batchSize + j) < count; j++) {
        const reqStart = performance.now();

        try {
          const response = await fetch(`http://localhost:${port}/`);
          await response.text();

          const reqEnd = performance.now();
          latencies.push(reqEnd - reqStart);
        } catch (error) {
          // Ignore errors
        }
      }
    })());
  }

  await Promise.all(batches);

  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000; // Convert to seconds

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  return {
    totalRequests: count,
    totalTime,
    reqPerSec: count / totalTime,
    avgLatency,
    minLatency,
    maxLatency,
    p50,
    p95,
    p99,
  };
}

/**
 * Print benchmark results
 */
function printResults(results: any) {
  console.log(`  Requests:        ${results.totalRequests.toLocaleString()}`);
  console.log(`  Total time:      ${results.totalTime.toFixed(2)}s`);
  console.log(`  Requests/sec:    ${results.reqPerSec.toFixed(2)}`);
  console.log(`  Avg latency:     ${results.avgLatency.toFixed(2)}ms`);
  console.log(`  Min latency:     ${results.minLatency.toFixed(2)}ms`);
  console.log(`  Max latency:     ${results.maxLatency.toFixed(2)}ms`);
  console.log(`  P50 latency:     ${results.p50.toFixed(2)}ms`);
  console.log(`  P95 latency:     ${results.p95.toFixed(2)}ms`);
  console.log(`  P99 latency:     ${results.p99.toFixed(2)}ms`);
}

/**
 * Run all benchmarks
 */
async function main() {
  console.log('🏁 elit/http vs Elysia Benchmark');
  console.log('='.repeat(50));

  await benchmarkSimpleResponse();
  await benchmarkJSONResponse();

  console.log('\n\n✅ Benchmark complete!');
}

main().catch(console.error);
