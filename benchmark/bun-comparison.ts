/**
 * Comprehensive Benchmark: Elit vs Elysia vs Express on Bun
 * Run with: bun benchmark/bun-comparison.ts
 */

import { createServer } from '../src/http';

const PORT = 3000;
const WARMUP = 1000;
const REQUESTS = 10000;
const CONCURRENT = 100;

interface BenchmarkResult {
  reqPerSec: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p50: number;
  p95: number;
  p99: number;
}

async function runRequests(port: number, count: number, concurrent: number): Promise<BenchmarkResult> {
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

function printResults(name: string, result: BenchmarkResult) {
  console.log(`\n📊 ${name} Results:`);
  console.log(`  Requests/sec:    ${result.reqPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  console.log(`  Avg latency:     ${result.avgLatency.toFixed(2)}ms`);
  console.log(`  Min latency:     ${result.minLatency.toFixed(2)}ms`);
  console.log(`  Max latency:     ${result.maxLatency.toFixed(2)}ms`);
  console.log(`  P50 latency:     ${result.p50.toFixed(2)}ms`);
  console.log(`  P95 latency:     ${result.p95.toFixed(2)}ms`);
  console.log(`  P99 latency:     ${result.p99.toFixed(2)}ms`);
}

async function main() {
  console.log('🏁 Comprehensive Benchmark: Elit vs Elysia vs Express on Bun');
  console.log('='.repeat(60));
  console.log(`Configuration: ${REQUESTS} requests, ${CONCURRENT} concurrent\n`);

  const results: Record<string, BenchmarkResult> = {};

  // 1. Benchmark Elit
  console.log('\n🚀 Testing Elit/HTTP...');
  const elitServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  });

  await new Promise<void>((resolve) => {
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

  // 2. Benchmark Elysia
  try {
    const { Elysia } = await import('elysia');
    console.log('\n\n⚡ Testing Elysia...');

    const elysiaApp = new Elysia()
      .get('/', () => 'Hello World')
      .listen(PORT);

    console.log(`✓ Elysia listening on port ${PORT}`);

    console.log('Warming up...');
    await runRequests(PORT, WARMUP, 10);
    console.log(`Running ${REQUESTS} requests...`);
    results['Elysia'] = await runRequests(PORT, REQUESTS, CONCURRENT);

    elysiaApp.stop();
    await new Promise(resolve => setTimeout(resolve, 200));

    printResults('Elysia', results['Elysia']);
  } catch (error) {
    console.log('\n⚠️  Elysia not found. Installing...');
    try {
      const { spawnSync } = await import('child_process');
      spawnSync('bun', ['add', 'elysia'], { stdio: 'inherit' });
      console.log('Please run the benchmark again.');
      process.exit(0);
    } catch (e) {
      console.log('⚠️  Could not install Elysia. Skipping...');
    }
  }

  // 3. Benchmark Express
  try {
    const express = await import('express');
    console.log('\n\n🌐 Testing Express...');

    const app = express.default();
    app.get('/', (req: any, res: any) => {
      res.send('Hello World');
    });

    const expressServer = await new Promise<any>((resolve) => {
      const server = app.listen(PORT, () => {
        console.log(`✓ Express listening on port ${PORT}`);
        resolve(server);
      });
    });

    console.log('Warming up...');
    await runRequests(PORT, WARMUP, 10);
    console.log(`Running ${REQUESTS} requests...`);
    results['Express'] = await runRequests(PORT, REQUESTS, CONCURRENT);

    await new Promise<void>((resolve) => {
      expressServer.close(() => resolve());
    });
    await new Promise(resolve => setTimeout(resolve, 200));

    printResults('Express', results['Express']);
  } catch (error) {
    console.log('\n⚠️  Express not found. Installing...');
    try {
      const { spawnSync } = await import('child_process');
      spawnSync('bun', ['add', 'express', '@types/express'], { stdio: 'inherit' });
      console.log('Please run the benchmark again.');
      process.exit(0);
    } catch (e) {
      console.log('⚠️  Could not install Express. Skipping...');
    }
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

  if (results['Elit'] && results['Elysia']) {
    const ratio = results['Elit'].reqPerSec / results['Elysia'].reqPerSec;
    console.log(`\n💡 Elit vs Elysia: ${(ratio * 100).toFixed(1)}% of Elysia's performance`);
  }

  if (results['Elit'] && results['Express']) {
    const ratio = results['Elit'].reqPerSec / results['Express'].reqPerSec;
    console.log(`💡 Elit vs Express: ${ratio.toFixed(2)}x faster`);
  }

  console.log('\n✅ Benchmark complete!');
}

main().catch(console.error);
