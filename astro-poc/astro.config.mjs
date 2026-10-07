import { defineConfig } from 'astro/config';
import { mkdirSync, writeFileSync, createReadStream, existsSync } from 'node:fs';
import react from '@astrojs/react';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicAssets, searchJson, pokemonIndexJson, learnsetJson, navigationJson, moveLearnerJson, learnerFactsJson, copyPublicAssets, copyLearnsetPayloads, copyMoveLearnerPayloads, copyTeamCoveragePayloads, copyEvTrainingRoutesPayload, writeNavigationPayload, writeLearnerFacts, writePokemonIndexPayload } from './scripts/public-assets.mjs';
import { POKEMON_SLUG_SET } from './src/lib/routes.js';
import { MOVE_SLUG_SET } from './src/lib/moveData.js';

// TeamCoveragePage is intentionally imported from the parent production app.
// In Cloudflare's isolated install its bare imports must resolve from this
// Astro project, rather than from the external source file's directory.
// `import.meta.resolve` preserves the package's ESM entrypoint and works both
// with a hoisted local install and Cloudflare's nested `astro-poc/node_modules`.
const reactRouterDomEntry = fileURLToPath(import.meta.resolve('react-router-dom'));

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
        allow: [
          fileURLToPath(new URL('.', import.meta.url)),
          fileURLToPath(new URL('..', import.meta.url))
        ]
      }
    },
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
    resolve: {
      alias: [{ find: /^react-router-dom$/, replacement: reactRouterDomEntry }],
      dedupe: ['react', 'react-dom']
    },
    plugins: [{
      name: 'team-coverage-type-badge-asset-compat',
      transform(code, id) {
        const normalizedId = id.split('?')[0].replace(/\\\\/g, '/');
        if (!normalizedId.endsWith('/src/components/TypeBadge.jsx')) return null;
        // Production Vite supplies these imports as URL strings. Astro's image
        // integration supplies metadata objects, so force Vite's URL import
        // query only for this external compatibility boundary.
        return code.replace(/(from\s+["'][^"']+\.png)(["'])/g, '$1?url$2');
      }
    }, {
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
          if (['/data/pokemonRoutes.json', '/data/movesIndex.json', '/data/moves.json'].includes(pathname)) {
            const source = join(fileURLToPath(new URL('../public', import.meta.url)), pathname);
            if (!existsSync(source)) return next();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (req.method === 'HEAD') return res.end();
            createReadStream(source).on('error', next).pipe(res);
            return;
          }
          const teamMemberMatch = pathname.match(/^\/data\/(pokemonData|pokemonLearnsets)\/(\d+)\.json$/);
          if (teamMemberMatch) {
            const source = join(fileURLToPath(new URL('../public', import.meta.url)), pathname);
            if (!existsSync(source)) return next();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (req.method === 'HEAD') return res.end();
            createReadStream(source).on('error', next).pipe(res);
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
          if (pathname === '/data/evTrainingRoutes.json') {
            const source = join(fileURLToPath(new URL('../public/data/evTrainingRoutes.json', import.meta.url)));
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (req.method === 'HEAD') return res.end();
            createReadStream(source).on('error', next).pipe(res);
            return;
          }
          if (pathname === '/images/maps/mt-coronet-feebas-lake.png') {
            const source = fileURLToPath(new URL('../public/images/maps/mt-coronet-feebas-lake.png', import.meta.url));
            if (!existsSync(source)) return next();
            res.setHeader('Content-Type', 'image/png');
            if (req.method === 'HEAD') return res.end();
            createReadStream(source).on('error', next).pipe(res);
            return;
          }
          if (pathname === '/images/maps/route-119-feebas-map.png') {
            const source = fileURLToPath(new URL('../public/images/maps/route-119-feebas-map.png', import.meta.url));
            if (!existsSync(source)) return next();
            res.setHeader('Content-Type', 'image/png');
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
        copyEvTrainingRoutesPayload(output);
        writeLearnerFacts(output);
      }
    }
  }]
});
