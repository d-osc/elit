/**
 * Comprehensive Benchmark: Elit vs Express on Node.js
 * Run with: node benchmark/node-comparison.js
 */

const { createServer } = require('../dist/http.js');

const PORT = 3000;
const WARMUP = 1000;
const REQUESTS = 10000;
const CONCURRENT = 100;

async function runRequests(port, count, concurrent) {
  const latencies = [];
  const startTime = performance.now();

  const batchSize = Math.ceil(count / concurrent);
  const batches = [];

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
          // Ignore
        }
      }
    })());
  }

  await Promise.all(batches);
  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000;

  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  return {
    reqPerSec: count / totalTime,
    avgLatency,
    minLatency: latencies[0],
    maxLatency: latencies[latencies.length - 1],
    p50: latencies[Math.floor(latencies.length * 0.5)],
    p95: latencies[Math.floor(latencies.length * 0.95)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
  };
}

function printResults(name, result) {
  console.log(`\n📊 ${name} Results:`);
  console.log(`  Requests/sec:    ${result.reqPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  console.log(`  Latency (ms):`);
  console.log(`    Min:           ${result.minLatency.toFixed(2)}`);
  console.log(`    Max:           ${result.maxLatency.toFixed(2)}`);
  console.log(`    Average:       ${result.avgLatency.toFixed(2)}`);
  console.log(`    P50:           ${result.p50.toFixed(2)}`);
  console.log(`    P95:           ${result.p95.toFixed(2)}`);
  console.log(`    P99:           ${result.p99.toFixed(2)}`);
}

async function main() {
  console.log('🏁 Comprehensive Benchmark: Elit vs Express on Node.js');
  console.log('='.repeat(60));
  console.log(`Configuration: ${REQUESTS} requests, ${CONCURRENT} concurrent\n`);

  const results = {};

  // 1. Benchmark Elit
  console.log('\n🚀 Testing Elit/HTTP...');
  const elitServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  });

  await new Promise((resolve) => {
    elitServer.listen(PORT, () => {
      console.log(`✓ Elit listening on port ${PORT}`);
      resolve();
    });
  });

  console.log('Warming up...');
  await runRequests(PORT, WARMUP, 10);
  console.log(`Running ${REQUESTS} requests...`);
  results['Elit'] = await runRequests(PORT, REQUESTS, CONCURRENT);

  elitServer.close();
  await new Promise(resolve => setTimeout(resolve, 200));

  printResults('Elit', results['Elit']);

  // 2. Benchmark Express
  try {
    const express = require('express');
    console.log('\n\n🌐 Testing Express...');

    const app = express();
    app.get('/', (req, res) => {
      res.send('Hello World');
    });

    const expressServer = await new Promise((resolve) => {
      const server = app.listen(PORT, () => {
        console.log(`✓ Express listening on port ${PORT}`);
        resolve(server);
      });
    });

    console.log('Warming up...');
    await runRequests(PORT, WARMUP, 10);
    console.log(`Running ${REQUESTS} requests...`);
    results['Express'] = await runRequests(PORT, REQUESTS, CONCURRENT);

    await new Promise((resolve) => {
      expressServer.close(() => resolve());
    });
    await new Promise(resolve => setTimeout(resolve, 200));

    printResults('Express', results['Express']);
  } catch (error) {
    console.log('\n⚠️  Express not found. Installing...');
    console.log('    Please run: npm install express');
    console.log('    Then run this benchmark again.');
  }

  // Print comparison
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 COMPARISON SUMMARY');
  console.log('='.repeat(60));

  const frameworks = Object.keys(results).sort((a, b) =>
    results[b].reqPerSec - results[a].reqPerSec
  );

  console.log('\n🏆 Ranking by Requests/sec:');
  frameworks.forEach((name, index) => {
    const result = results[name];
    const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
    console.log(`  ${emoji} ${name.padEnd(10)} ${result.reqPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(10)} req/s  (${result.avgLatency.toFixed(2)}ms avg)`);
  });

  if (results['Elit'] && results['Express']) {
    const ratio = results['Elit'].reqPerSec / results['Express'].reqPerSec;
    console.log(`\n💡 Elit vs Express: ${ratio.toFixed(2)}x faster`);
  }

  console.log('\n✅ Benchmark complete!');
  console.log('\n💡 Note: Elysia does not support Node.js runtime (Bun-only framework)');
}

main().catch(console.error);
