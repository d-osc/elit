/**
 * Autocannon Benchmark: elit/http vs Elysia
 * Professional HTTP benchmarking tool
 */

import { createServer } from '../src/http';
import { spawn } from 'child_process';

const PORT = 3000;
const DURATION = 10; // seconds
const CONNECTIONS = 100;
const PIPELINING = 10;

/**
 * Run autocannon benchmark
 */
function runAutocannon(name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔥 Running autocannon for ${name}...`);

    const autocannon = spawn('npx', [
      'autocannon',
      '-c', String(CONNECTIONS),
      '-d', String(DURATION),
      '-p', String(PIPELINING),
      '-j', // JSON output
      `http://localhost:${PORT}`
    ]);

    let output = '';
    autocannon.stdout.on('data', (data) => {
      output += data.toString();
    });

    autocannon.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    autocannon.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse autocannon output'));
        }
      } else {
        reject(new Error(`Autocannon exited with code ${code}`));
      }
    });
  });
}

/**
 * Print autocannon results
 */
function printResults(name: string, results: any) {
  console.log(`\n📊 ${name} Results:`);
  console.log('─'.repeat(50));
  console.log(`Requests:       ${results.requests.total.toLocaleString()}`);
  console.log(`Throughput:     ${(results.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`Requests/sec:   ${results.requests.mean.toFixed(2)}`);
  console.log(`Latency (avg):  ${results.latency.mean.toFixed(2)}ms`);
  console.log(`Latency (p50):  ${results.latency.p50.toFixed(2)}ms`);
  console.log(`Latency (p95):  ${results.latency.p95.toFixed(2)}ms`);
  console.log(`Latency (p99):  ${results.latency.p99.toFixed(2)}ms`);
  console.log(`Errors:         ${results.errors}`);
  console.log(`Timeouts:       ${results.timeouts}`);
}

/**
 * Benchmark elit/http
 */
async function benchmarkElit() {
  console.log('\n🚀 Starting elit/http server...');

  const server = createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    });
    res.end(JSON.stringify({ message: 'Hello World', timestamp: Date.now() }));
  });

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`✓ Server listening on port ${PORT}`);
      resolve();
    });
  });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  const results = await runAutocannon('elit/http');

  server.close();
  await new Promise(resolve => setTimeout(resolve, 500));

  return results;
}

/**
 * Benchmark Elysia
 */
async function benchmarkElysia() {
  try {
    const { Elysia } = await import('elysia');

    console.log('\n🦊 Starting Elysia server...');

    const app = new Elysia()
      .get('/', () => ({ message: 'Hello World', timestamp: Date.now() }))
      .listen(PORT);

    console.log(`✓ Server listening on port ${PORT}`);

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results = await runAutocannon('Elysia');

    app.stop();
    await new Promise(resolve => setTimeout(resolve, 500));

    return results;
  } catch (error) {
    console.log('\n⚠️  Elysia not installed. Install with: bun add elysia');
    return null;
  }
}

/**
 * Compare results
 */
function compareResults(elitResults: any, elysiaResults: any) {
  console.log('\n\n📈 Comparison Summary:');
  console.log('='.repeat(70));

  const elitReqSec = elitResults.requests.mean;
  const elysiaReqSec = elysiaResults.requests.mean;
  const elitLatency = elitResults.latency.mean;
  const elysiaLatency = elysiaResults.latency.mean;

  console.log('\nRequests per second:');
  console.log(`  elit/http:  ${elitReqSec.toFixed(2)} req/s`);
  console.log(`  Elysia:     ${elysiaReqSec.toFixed(2)} req/s`);

  const reqSpeedup = elitReqSec / elysiaReqSec;
  if (reqSpeedup > 1) {
    console.log(`  → elit/http is ${reqSpeedup.toFixed(2)}x faster 🚀`);
  } else {
    console.log(`  → Elysia is ${(1/reqSpeedup).toFixed(2)}x faster ⚡`);
  }

  console.log('\nAverage Latency:');
  console.log(`  elit/http:  ${elitLatency.toFixed(2)}ms`);
  console.log(`  Elysia:     ${elysiaLatency.toFixed(2)}ms`);

  const latencyImprovement = ((elysiaLatency - elitLatency) / elysiaLatency * 100);
  if (latencyImprovement > 0) {
    console.log(`  → elit/http has ${latencyImprovement.toFixed(1)}% lower latency 🎯`);
  } else {
    console.log(`  → Elysia has ${Math.abs(latencyImprovement).toFixed(1)}% lower latency 🎯`);
  }

  console.log('\nThroughput:');
  const elitThroughput = elitResults.throughput.mean / 1024 / 1024;
  const elysiaThroughput = elysiaResults.throughput.mean / 1024 / 1024;
  console.log(`  elit/http:  ${elitThroughput.toFixed(2)} MB/s`);
  console.log(`  Elysia:     ${elysiaThroughput.toFixed(2)} MB/s`);

  console.log('\nP99 Latency:');
  console.log(`  elit/http:  ${elitResults.latency.p99.toFixed(2)}ms`);
  console.log(`  Elysia:     ${elysiaResults.latency.p99.toFixed(2)}ms`);
}

/**
 * Main benchmark
 */
async function main() {
  console.log('🏁 elit/http vs Elysia - Autocannon Benchmark');
  console.log('='.repeat(70));
  console.log(`Duration:      ${DURATION}s`);
  console.log(`Connections:   ${CONNECTIONS}`);
  console.log(`Pipelining:    ${PIPELINING}`);

  // Check if autocannon is available
  try {
    await new Promise((resolve, reject) => {
      const check = spawn('npx', ['autocannon', '--version']);
      check.on('close', (code) => {
        if (code === 0) resolve(null);
        else reject();
      });
    });
  } catch {
    console.log('\n⚠️  autocannon not found. Installing...');
    console.log('Run: npm install -g autocannon');
    process.exit(1);
  }

  const elitResults = await benchmarkElit();
  printResults('elit/http', elitResults);

  const elysiaResults = await benchmarkElysia();
  if (elysiaResults) {
    printResults('Elysia', elysiaResults);
    compareResults(elitResults, elysiaResults);
  }

  console.log('\n\n✅ Benchmark complete!');
}

main().catch(console.error);
