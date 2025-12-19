/**
 * Example usage of elit/chokidar
 * Cross-runtime file watching
 */

import { watch } from '../src/chokidar';
import { writeFile, mkdir } from '../src/fs';

console.log('🔍 elit/chokidar File Watcher Example\n');

// Create a test directory
const testDir = './test-watch';

async function setup() {
  try {
    await mkdir(testDir, { recursive: true });
    console.log(`✓ Created test directory: ${testDir}\n`);
  } catch (error) {
    // Directory might already exist
  }
}

async function runExample() {
  await setup();

  console.log('👀 Watching for file changes...');
  console.log(`   Watching: ${testDir}`);
  console.log('   Try creating, modifying, or deleting files in this directory\n');

  // Watch the test directory
  const watcher = watch(testDir, {
    ignoreInitial: false,
    persistent: true,
  });

  // Listen to all events
  watcher
    .on('add', (path, stats) => {
      console.log(`➕ File added: ${path}`);
      if (stats) {
        console.log(`   Size: ${stats.size} bytes`);
      }
    })
    .on('addDir', (path) => {
      console.log(`📁 Directory added: ${path}`);
    })
    .on('change', (path, stats) => {
      console.log(`📝 File changed: ${path}`);
      if (stats) {
        console.log(`   New size: ${stats.size} bytes`);
      }
    })
    .on('unlink', (path) => {
      console.log(`🗑️  File deleted: ${path}`);
    })
    .on('unlinkDir', (path) => {
      console.log(`📁 Directory deleted: ${path}`);
    })
    .on('error', (error) => {
      console.error(`❌ Error: ${error.message}`);
    })
    .on('ready', () => {
      console.log('✅ Watcher is ready and watching for changes\n');
    })
    .on('all', (event, path) => {
      console.log(`🔔 Event '${event}' triggered for: ${path}`);
    });

  // Create a test file after a short delay
  setTimeout(async () => {
    console.log('\n💾 Creating test file...');
    await writeFile(`${testDir}/test.txt`, 'Hello, World!');

    setTimeout(async () => {
      console.log('\n✏️  Modifying test file...');
      await writeFile(`${testDir}/test.txt`, 'Hello, elit/chokidar!');

      setTimeout(() => {
        console.log('\n🛑 Closing watcher...');
        watcher.close().then(() => {
          console.log('✓ Watcher closed\n');
          console.log('📊 Watched paths:', watcher.getWatched());
          process.exit(0);
        });
      }, 2000);
    }, 2000);
  }, 1000);
}

// Common use cases
console.log('💡 Common Use Cases:\n');

console.log('1. Basic File Watching:');
console.log(`   const watcher = watch('./src');`);
console.log(`   watcher.on('change', path => console.log('Changed:', path));`);
console.log();

console.log('2. Watch with Options:');
console.log(`   const watcher = watch('./src', {`);
console.log(`     ignoreInitial: true,`);
console.log(`     ignored: /(^|[\\/\\\\])\\./, // ignore dotfiles`);
console.log(`     depth: 2 // limit subdirectory depth`);
console.log(`   });`);
console.log();

console.log('3. Watch Multiple Paths:');
console.log(`   const watcher = watch(['./src', './dist'], options);`);
console.log();

console.log('4. Add/Remove Paths Dynamically:');
console.log(`   watcher.add('./new-path');`);
console.log(`   watcher.unwatch('./old-path');`);
console.log();

console.log('5. Get Watched Paths:');
console.log(`   const watched = watcher.getWatched();`);
console.log(`   // { './src': ['file1.ts', 'file2.ts'] }`);
console.log();

console.log('───────────────────────────────────────────────────\n');

// Run the interactive example
runExample();
