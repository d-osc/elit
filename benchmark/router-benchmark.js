/**
 * Benchmark: Elysia vs elit/ServerRouter
 * Tests HTTP routing performance across different runtimes
 */

const { performance } = require('perf_hooks');

// Configuration
const WARMUP_REQUESTS = 1000;
const BENCHMARK_REQUESTS = 10000;
const CONCURRENT_REQUESTS = 100;
const PORT_ELYSIA = 3001;
const PORT_ELIT = 3002;

// Results storage
const results = {
  elysia: { warmup: 0, benchmark: 0, rps: 0, latency: [] },
  elit: { warmup: 0, benchmark: 0, rps: 0, latency: [] }
};

/**
 * Make HTTP request
 */
async function makeRequest(url) {
  const start = performance.now();

  try {
    const response = await fetch(url);
    await response.text();
    const end = performance.now();
    return end - start;
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return -1;
  }
}

/**
 * Run concurrent requests
 */
async function runConcurrentRequests(url, count, concurrent = 100) {
  const latencies = [];
  let completed = 0;

  const start = performance.now();

  while (completed < count) {
    const batch = Math.min(concurrent, count - completed);
    const promises = Array(batch).fill(null).map(() => makeRequest(url));
    const batchLatencies = await Promise.all(promises);

    latencies.push(...batchLatencies.filter(l => l > 0));
    completed += batch;

    // Progress indicator
    if (completed % 1000 === 0) {
      process.stdout.write(`\r  Progress: ${completed}/${count} requests`);
    }
  }

  const end = performance.now();
  const totalTime = end - start;

  process.stdout.write('\r');

  return {
    totalTime,
    latencies,
    rps: (count / totalTime) * 1000
  };
}

/**
 * Calculate statistics
 */
function calculateStats(latencies) {
  if (latencies.length === 0) return {};

  latencies.sort((a, b) => a - b);

  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = sum / latencies.length;

  return {
    min: latencies[0].toFixed(2),
    max: latencies[latencies.length - 1].toFixed(2),
    avg: avg.toFixed(2),
    p50: latencies[Math.floor(latencies.length * 0.5)].toFixed(2),
    p95: latencies[Math.floor(latencies.length * 0.95)].toFixed(2),
    p99: latencies[Math.floor(latencies.length * 0.99)].toFixed(2)
  };
}

/**
 * Start Elysia server (if Bun is available)
 */
async function startElysiaServer() {
  // Check if running on Bun
  if (typeof Bun === 'undefined') {
    console.log('⚠ Elysia requires Bun runtime - skipping Elysia benchmark');
    return null;
  }

  try {
    const { Elysia } = await import('elysia');

    const app = new Elysia()
      .get('/', () => 'Hello World')
      .get('/json', () => ({ message: 'Hello World', timestamp: Date.now() }))
      .get('/params/:id', ({ params }) => ({ id: params.id }))
      .post('/echo', ({ body }) => body)
      .listen(PORT_ELYSIA);

    console.log(`✓ Elysia server started on port ${PORT_ELYSIA}`);
    return app;
  } catch (error) {
    console.log(`⚠ Failed to start Elysia: ${error.message}`);
    return null;
  }
}

/**
 * Start elit ServerRouter
 */
async function startElitRouter() {
  try {
    const { ServerRouter } = require('../dist/server.js');
    const { createServer } = require('../dist/http.js');

    const router = new ServerRouter();

    // Add routes
    router.get('/', (ctx) => {
      ctx.res.writeHead(200, { 'Content-Type': 'text/plain' });
      ctx.res.end('Hello World');
    });

    router.get('/json', (ctx) => {
      ctx.res.writeHead(200, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ message: 'Hello World', timestamp: Date.now() }));
    });

    router.get('/params/:id', (ctx) => {
      ctx.res.writeHead(200, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ id: ctx.params.id }));
    });

    router.post('/echo', async (ctx) => {
      ctx.res.writeHead(200, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify(ctx.body));
    });

    // Create HTTP server with router
    const server = createServer(async (req, res) => {
      const handled = await router.handle(req, res);
      if (!handled) {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(PORT_ELIT);

    console.log(`✓ elit ServerRouter started on port ${PORT_ELIT}`);
    return server;
  } catch (error) {
    console.error(`✗ Failed to start elit ServerRouter: ${error.message}`);
    throw error;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(url);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return false;
}

/**
 * Run benchmark
 */
async function runBenchmark() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      Benchmark: Elysia vs elit/ServerRouter          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('Configuration:');
  console.log(`  Warmup requests:     ${WARMUP_REQUESTS.toLocaleString()}`);
  console.log(`  Benchmark requests:  ${BENCHMARK_REQUESTS.toLocaleString()}`);
  console.log(`  Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log('');

  // Start servers
  console.log('Starting servers...');
  const elysiaServer = await startElysiaServer();
  const elitServer = await startElitRouter();
  console.log('');

  // Wait for servers to be ready
  if (elysiaServer) {
    await waitForServer(`http://localhost:${PORT_ELYSIA}`);
  }
  await waitForServer(`http://localhost:${PORT_ELIT}`);

  // Benchmark Elysia (if available)
  if (elysiaServer) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Benchmarking Elysia...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n1. Warmup...');
    await runConcurrentRequests(`http://localhost:${PORT_ELYSIA}`, WARMUP_REQUESTS, CONCURRENT_REQUESTS);

    console.log('2. Running benchmark...');
    const elysiaResults = await runConcurrentRequests(
      `http://localhost:${PORT_ELYSIA}`,
      BENCHMARK_REQUESTS,
      CONCURRENT_REQUESTS
    );

    results.elysia = {
      ...elysiaResults,
      stats: calculateStats(elysiaResults.latencies)
    };

    console.log('  ✓ Complete\n');

    elysiaServer.stop();
  }

  // Benchmark elit ServerRouter
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Benchmarking elit/ServerRouter...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n1. Warmup...');
  await runConcurrentRequests(`http://localhost:${PORT_ELIT}`, WARMUP_REQUESTS, CONCURRENT_REQUESTS);

  console.log('2. Running benchmark...');
  const elitResults = await runConcurrentRequests(
    `http://localhost:${PORT_ELIT}`,
    BENCHMARK_REQUESTS,
    CONCURRENT_REQUESTS
  );

  results.elit = {
    ...elitResults,
    stats: calculateStats(elitResults.latencies)
  };

  console.log('  ✓ Complete\n');

  elitServer.close();

  // Print results
  printResults();
}

/**
 * Print results
 */
function printResults() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTS                             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Table header
  console.log('┌─────────────────┬──────────────┬──────────────┐');
  console.log('│ Metric          │ Elysia       │ elit/Router  │');
  console.log('├─────────────────┼──────────────┼──────────────┤');

  if (results.elysia.rps > 0) {
    // Requests per second
    console.log(`│ Requests/sec    │ ${results.elysia.rps.toFixed(0).padStart(12)} │ ${results.elit.rps.toFixed(0).padStart(12)} │`);
    console.log('├─────────────────┼──────────────┼──────────────┤');

    // Latency statistics
    console.log(`│ Latency (ms)    │              │              │`);
    console.log(`│   Min           │ ${results.elysia.stats.min.padStart(12)} │ ${results.elit.stats.min.padStart(12)} │`);
    console.log(`│   Max           │ ${results.elysia.stats.max.padStart(12)} │ ${results.elit.stats.max.padStart(12)} │`);
    console.log(`│   Average       │ ${results.elysia.stats.avg.padStart(12)} │ ${results.elit.stats.avg.padStart(12)} │`);
    console.log(`│   P50           │ ${results.elysia.stats.p50.padStart(12)} │ ${results.elit.stats.p50.padStart(12)} │`);
    console.log(`│   P95           │ ${results.elysia.stats.p95.padStart(12)} │ ${results.elit.stats.p95.padStart(12)} │`);
    console.log(`│   P99           │ ${results.elysia.stats.p99.padStart(12)} │ ${results.elit.stats.p99.padStart(12)} │`);
    console.log('└─────────────────┴──────────────┴──────────────┘\n');

    // Comparison
    const faster = results.elysia.rps > results.elit.rps ? 'Elysia' : 'elit/ServerRouter';
    const ratio = Math.max(results.elysia.rps, results.elit.rps) / Math.min(results.elysia.rps, results.elit.rps);

    console.log(`🏆 ${faster} is ${ratio.toFixed(2)}x faster\n`);
  } else {
    console.log(`│ Requests/sec    │ N/A          │ ${results.elit.rps.toFixed(0).padStart(12)} │`);
    console.log('├─────────────────┼──────────────┼──────────────┤');
    console.log(`│ Latency (ms)    │              │              │`);
    console.log(`│   Min           │ N/A          │ ${results.elit.stats.min.padStart(12)} │`);
    console.log(`│   Max           │ N/A          │ ${results.elit.stats.max.padStart(12)} │`);
    console.log(`│   Average       │ N/A          │ ${results.elit.stats.avg.padStart(12)} │`);
    console.log(`│   P50           │ N/A          │ ${results.elit.stats.p50.padStart(12)} │`);
    console.log(`│   P95           │ N/A          │ ${results.elit.stats.p95.padStart(12)} │`);
    console.log(`│   P99           │ N/A          │ ${results.elit.stats.p99.padStart(12)} │`);
    console.log('└─────────────────┴──────────────┴──────────────┘\n');

    console.log('ℹ Elysia benchmark skipped (requires Bun runtime)\n');
  }

  console.log('Runtime: ' + (typeof Bun !== 'undefined' ? 'Bun' : 'Node.js'));
  console.log('');
}

// Run benchmark
runBenchmark().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
