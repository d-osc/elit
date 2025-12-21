/**
 * Comprehensive Benchmark: Elit vs Express on Deno
 * Run with: deno run --allow-net --allow-read benchmark/deno-comparison.ts
 */

import { createServer } from '../dist/http.mjs';

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
  console.log(`  Latency (ms):`);
  console.log(`    Min:           ${result.minLatency.toFixed(2)}`);
  console.log(`    Max:           ${result.maxLatency.toFixed(2)}`);
  console.log(`    Average:       ${result.avgLatency.toFixed(2)}`);
  console.log(`    P50:           ${result.p50.toFixed(2)}`);
  console.log(`    P95:           ${result.p95.toFixed(2)}`);
  console.log(`    P99:           ${result.p99.toFixed(2)}`);
}

async function main() {
  console.log('🏁 Comprehensive Benchmark: Elit vs Express on Deno');
  console.log('='.repeat(60));
  console.log(`Configuration: ${REQUESTS} requests, ${CONCURRENT} concurrent\n`);

  const results: Record<string, BenchmarkResult> = {};

  // 1. Benchmark Elit
  console.log('\n🚀 Testing Elit/HTTP...');
  const elitServer = createServer((req: any, res: any) => {
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

  // 2. Benchmark Express (if available)
  try {
    console.log('\n\n🌐 Testing Express...');
    console.log('⚠️  Express requires npm:express in Deno. Skipping for now.');
    console.log('    To test Express on Deno, install it first:');
    console.log('    deno add npm:express');
  } catch (error) {
    console.log('⚠️  Express not available on Deno');
  }

  // Print comparison
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 COMPARISON SUMMARY');
  console.log('='.repeat(60));

  console.log('\n🏆 Results:');
  console.log(`  🥇 Elit:    ${results['Elit'].reqPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 })} req/s  (${results['Elit'].avgLatency.toFixed(2)}ms avg)`);

  console.log('\n✅ Benchmark complete!');
  console.log('\n💡 Note: Elysia does not support Deno runtime (Bun-only framework)');
  console.log('    Express on Deno requires npm compatibility layer');
}

main().catch(console.error);
