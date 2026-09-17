import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: 'dist/index.js',
  external: ['@modelcontextprotocol/sdk', 'openai', 'playwright'],
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'info',
});
