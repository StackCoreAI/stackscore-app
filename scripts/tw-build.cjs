// scripts/tw-build.cjs
const { spawn } = require('child_process');
const { join, dirname } = require('path');
const fs = require('fs');

let pkgPath;
try {
  pkgPath = require.resolve('tailwindcss/package.json', { paths: [process.cwd()] });
} catch {
  console.error('❌ Tailwind not installed. Run: npm i -D tailwindcss');
  process.exit(1);
}

const root = dirname(pkgPath);
const candidates = [
  'lib/cli.js',      // v3/v4 common
  'dist/cli.js',     // some builds
  'src/cli.js',      // source layout
  'cli.js'           // fallback
].map(p => join(root, p));

const cli = candidates.find(p => fs.existsSync(p));
if (!cli) {
  console.error(`❌ Tailwind CLI not found under ${root}`);
  process.exit(1);
}

const args = [
  cli,
  '-i', './public/templates/input.css',
  '-o', './public/templates/stack.css',
  '--minify',
  '--content', './public/templates/stacktemplate.html'
];

const child = spawn(process.execPath, args, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code));
