import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist/assets');

function getSize(file) {
  const stats = fs.statSync(file);
  return stats.size;
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

// Find main bundle (index-*.js)
const files = fs.readdirSync(distDir);
const mainBundle = files.find(f => 
  f.startsWith('index-') && f.endsWith('.js')
);

if (!mainBundle) {
  console.error('❌ No main bundle found');
  process.exit(1);
}

const mainPath = path.join(distDir, mainBundle);
const mainSize = getSize(mainPath);

// Phase 1: max 350KB for main bundle
const maxSize = 350 * 1024;

console.log(`\n📦 Bundle Size Report`);
console.log(`────────────────────────`);
console.log(`Main bundle: ${formatBytes(mainSize)}`);
console.log(`Max allowed: ${formatBytes(maxSize)}`);

console.log(`\nAll chunks:`);
files.filter(f => f.endsWith('.js')).forEach(f => {
  const size = getSize(path.join(distDir, f));
  const status = size > maxSize ? '❌' : '✅';
  console.log(`  ${status} ${f}: ${formatBytes(size)}`);
});

if (mainSize > maxSize) {
  console.error(`\n❌ FAILED: Main bundle exceeds ${formatBytes(maxSize)} limit`);
  console.error(`Actual: ${formatBytes(mainSize)} (${((mainSize/maxSize - 1) * 100).toFixed(1)}% over)`);
  process.exit(1);
} else {
  console.log(`\n✅ PASSED: Main bundle under limit\n`);
  process.exit(0);
}
