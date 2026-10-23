import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function build() {
  console.log('[build-api] Bundling Express backend into Vercel Serverless Function...');
  
  const apiDir = path.join(rootDir, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  const outfile = path.join(apiDir, 'index.js');
  
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/server/handler.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    outfile,
  });

  const wildcardFile = path.join(apiDir, '[...path].js');
  fs.copyFileSync(outfile, wildcardFile);

  console.log('[build-api] ✓ Built api/index.js and api/[...path].js successfully!');
}

build().catch((err) => {
  console.error('[build-api] Error bundling API:', err);
  process.exit(1);
});
