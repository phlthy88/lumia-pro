const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');

function getSize(file) {
  const stats = fs.statSync(file);
  return stats.size;
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

// Find main bundle
const files = fs.readdirSync(distDir);
const mainBundle = files.find(f => f.startsWith('index') && f.endsWith('.js'));

if (!mainBundle) {
  console.error('❌ No main bundle found');
  process.exit(1);
}

const mainPath = path.join(distDir, mainBundle);
const mainSize = getSize(mainPath);

// Thresholds based on phase (set via env var or default)
const phase = process.env.PHASE || '1';
const maxSize = phase === '2' ? 350 * 1024 : 400 * 1024; // KB

console.log(`\n📦 Bundle Size Report`);
console.log(`─────────────────────`);
console.log(`Main bundle: ${formatBytes(mainSize)}`);
console.log(`Max allowed: ${formatBytes(maxSize)}`);

if (mainSize > maxSize) {
  console.error(`\n❌ FAILED: Bundle exceeds limit by ${formatBytes(mainSize - maxSize)}`);
  process.exit(1);
} else {
  const remaining = maxSize - mainSize;
  console.log(`✅ PASSED (${formatBytes(remaining)} remaining)\n`);
  process.exit(0);
}
