import { defineConfig } from 'astro/config';
import { mkdirSync, writeFileSync, createReadStream, existsSync } from 'node:fs';
import react from '@astrojs/react';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicAssets, searchJson, pokemonIndexJson, learnsetJson, navigationJson, moveLearnerJson, learnerFactsJson, copyPublicAssets, copyLearnsetPayloads, copyMoveLearnerPayloads, copyTeamCoveragePayloads, writeNavigationPayload, writeLearnerFacts, writePokemonIndexPayload } from './scripts/public-assets.mjs';
import { POKEMON_SLUG_SET } from './src/lib/routes.js';
import { MOVE_SLUG_SET } from './src/lib/moveData.js';

export default defineConfig({
  site: 'https://pokelore.net',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    server: {
      fs: {
        // Astro imports shared production assets and reads generated source data
        // from the repository root during local development.
        allow: [fileURLToPath(new URL('..', import.meta.url))]
      }
    },
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
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
          if (pathname === '/data/pokemonIndex.json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(req.method === 'HEAD' ? undefined : pokemonIndexJson());
            return;
          }
          if (pathname === '/data/navigation/pokemon-navigation.json') {
            const navigation = navigationJson();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(req.method === 'HEAD' ? undefined : navigation);
            return;
          }
          if (pathname === '/data/pokemon/learner-facts.json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(req.method === 'HEAD' ? undefined : learnerFactsJson());
            return;
          }
          const learnsetMatch = pathname.match(/^\/data\/learnsets\/([a-z0-9-]+)\.json$/);
          if (learnsetMatch && POKEMON_SLUG_SET.has(learnsetMatch[1])) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(req.method === 'HEAD' ? undefined : learnsetJson(learnsetMatch[1]));
            return;
          }
          const moveLearnerMatch = pathname.match(/^\/data\/move-learners\/([a-z0-9-]+)\.json$/);
          if (moveLearnerMatch && MOVE_SLUG_SET.has(moveLearnerMatch[1])) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(req.method === 'HEAD' ? undefined : moveLearnerJson(moveLearnerMatch[1]));
            return;
          }
          const coverageMatch = pathname.match(/^\/data\/teamCoverage\/([a-z0-9-]+)\.json$/);
          if (coverageMatch) {
            const source = join(fileURLToPath(new URL('../public/data/teamCoverage/', import.meta.url)), `${coverageMatch[1]}.json`);
            if (!existsSync(source)) return next();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (req.method === 'HEAD') return res.end();
            createReadStream(source).on('error', next).pipe(res);
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
        writePokemonIndexPayload(output);
        writeNavigationPayload(output);
        copyLearnsetPayloads(output);
        copyMoveLearnerPayloads(output);
        copyTeamCoveragePayloads(output);
        writeLearnerFacts(output);
      }
    }
  }]
});
