import { defineConfig } from 'astro/config';
import { mkdirSync, writeFileSync, createReadStream } from 'node:fs';
import react from '@astrojs/react';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicAssets, searchJson, copyPublicAssets } from './scripts/public-assets.mjs';

export default defineConfig({
  site: 'https://pokelore.net',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    resolve: { dedupe: ['react', 'react-dom'] },
    plugins: [{
      name: 'poc-dev-public-assets',
      configureServer(server) {
        const assets = publicAssets();
        let search;
        server.middlewares.use((req, res, next) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return next();
          let pathname;
          try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
          catch { return next(); }
          if (pathname === '/data/search.json') {
            search ??= searchJson();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(req.method === 'HEAD' ? undefined : search);
            return;
          }
          const source = assets.get(pathname);
          if (!source) return next();
          const mime = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
          res.setHeader('Content-Type', mime[extname(source)] ?? 'application/octet-stream');
          if (req.method === 'HEAD') return res.end();
          const stream = createReadStream(source);
          stream.on('error', next);
          stream.pipe(res);
        });
      }
    }]
  },
  integrations: [react(), {
    name: 'poc-local-artwork',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const output = fileURLToPath(dir);
        copyPublicAssets(output);
        mkdirSync(join(output, 'data'), { recursive: true });
        writeFileSync(join(output, 'data/search.json'), searchJson());
      }
    }
  }]
});
