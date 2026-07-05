const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { spawnSync } = require('child_process');

// Load .env values
const envPath = path.join(__dirname, '.env');
const envVars = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

// Prepare define object for esbuild
const define = {};
for (const k in envVars) {
  define[`process.env.${k}`] = JSON.stringify(envVars[k]);
}

console.log("Bundling backend with esbuild...");
esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/index.js',
  minify: true,
  define: define,
  external: ['mock-aws-s3', 'aws-sdk', 'nock', 'ffmpeg-static'], // common express/multer optional dependencies + ffmpeg-static (uses __dirname)
});

console.log("Obfuscating bundled backend...");
spawnSync('npx', [
  'javascript-obfuscator', 
  'dist/index.js', 
  '--output', 'dist/index.js',
  '--compact', 'true',
  '--control-flow-flattening', 'false',
  '--string-array', 'true',
  '--string-array-encoding', 'rc4',
  '--string-array-threshold', '0.5'
], { stdio: 'inherit', shell: true });

console.log("Backend build and obfuscation complete!");
