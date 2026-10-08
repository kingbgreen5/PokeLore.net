import { buildSync } from 'esbuild';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const pocRoot = process.cwd();
const repositoryRoot = resolve(pocRoot, '..');
const generatedDirectory = join(pocRoot, 'src', 'generated');
const outputPath = join(generatedDirectory, 'editorial-static-guides.json');
// esbuild's aliases and stdin imports accept normal absolute filesystem paths,
// not `file:` URLs. Normalizing separators also avoids Windows alias ambiguity.
const absolutePath = path => join(repositoryRoot, path).replaceAll('\\', '/');
const sourceModule = path => absolutePath(path);
const requireFromGenerator = createRequire(import.meta.url);
const reactEntry = fileURLToPath(import.meta.resolve('react'));
const reactDomServerEntry = fileURLToPath(import.meta.resolve('react-dom/server'));
const reactRouterDomEntry = fileURLToPath(import.meta.resolve('react-router-dom'));
const reactJsxRuntimeEntry = fileURLToPath(import.meta.resolve('react/jsx-runtime'));
const reactJsxDevRuntimeEntry = fileURLToPath(import.meta.resolve('react/jsx-dev-runtime'));

const entries = {
  'evolving-feebas-into-milotic-via-beauty': 'src/topics/FeebasBeautyEvolutionGuide.jsx',
  'fossil-pokemon-guide': 'src/topics/FossilPokemonGuide.jsx',
  'herba-mystica': 'src/topics/HerbaMysticaGuide.jsx',
  'raticate-aquatic-pokemon': 'src/topics/RaticateAquaticPokemon.jsx'
};

async function renderGuide(entryPath, slug) {
  const result = buildSync({
    stdin: {
      contents: `
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import { StaticRouter } from 'react-router-dom';
        import Guide from ${JSON.stringify(sourceModule(entryPath))};
        export default renderToStaticMarkup(React.createElement(StaticRouter, { location: '/topic/${slug}' }, React.createElement(Guide)));
      `,
      resolveDir: repositoryRoot,
      sourcefile: `editorial-${slug}.mjs`
    },
    bundle: true,
    // React DOM's server build is CommonJS and dynamically requires Node built-ins
    // such as `util`. Keep the temporary bundle CommonJS so Node can service them.
    format: 'cjs',
    platform: 'node',
    target: 'node22',
    // Production Vite uses the automatic runtime. Some source guides import hooks
    // but intentionally do not import the legacy `React` JSX identifier.
    jsx: 'automatic',
    write: false,
    loader: { '.css': 'text', '.png': 'dataurl', '.webp': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
    alias: {
      'react/jsx-runtime': reactJsxRuntimeEntry,
      'react/jsx-dev-runtime': reactJsxDevRuntimeEntry,
      react: reactEntry,
      'react-dom/server': reactDomServerEntry,
      'react-router-dom': reactRouterDomEntry
    }
  });
  // stdin builds use an in-memory `<stdout>` path rather than a `.js` name.
  const source = result.outputFiles.find(file => file.path.endsWith('.js'))?.text ?? result.outputFiles[0]?.text;
  if (!source) throw new Error(`No JavaScript bundle created for ${slug}`);
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'pokelore-editorial-'));
  const temporaryModule = join(temporaryDirectory, `${slug}.cjs`);
  writeFileSync(temporaryModule, source);
  try {
    return requireFromGenerator(temporaryModule).default;
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

const rendered = {};
for (const [slug, entryPath] of Object.entries(entries)) rendered[slug] = await renderGuide(entryPath, slug);
mkdirSync(generatedDirectory, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(rendered, null, 2)}\n`);
console.log(`Generated ${Object.keys(rendered).length} static editorial guide fragments.`);
