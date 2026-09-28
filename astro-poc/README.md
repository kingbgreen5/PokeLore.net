# PokéLore Astro migration — Phase 4A

This isolated Astro application generates all 1,352 canonical Pokémon routes and all 937 canonical Move routes. It is deployed only to the staging Worker at [pokelore-astro-test.thebeakeh.workers.dev](https://pokelore-astro-test.thebeakeh.workers.dev); production React/Vite files, DNS, and other page families are outside this phase.

```sh
cd astro-poc
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

`npm run build` regenerates 1,350 numeric redirects, builds the complete static catalog, verifies every generated document, and runs both catalog audits. The canonical route manifest is written to `evidence/full-catalog/staging-pokemon-urls.txt`; aggregate size and completeness evidence is in `evidence/full-catalog/verification.json`.

With preview running, the remaining local gates are:

```sh
npm run verify:full-crawl
npm run verify:stress-browser
npm run compare:stress-production -- http://127.0.0.1:4321
```

The shared route remains `src/pages/pokemon/[slug].astro`. Core identity, metadata, abilities, stats, matchups, evolution, latest learnset, Pokédex entries, available editorial content, biology, encounters, and facts are static HTML. React islands handle search and focused interactions. Historical learnsets are prebuilt per-route JSON files fetched only when requested.

Form semantics remain registry-driven: 327 non-default routes, 319 automatic classifications, eight explicit overrides, and zero unresolved routes. Missing form-specific source fields are omitted or explicitly labeled; base-form prose or abilities are not silently inherited.

The complete Phase 3 result is in [PHASE3_FULL_CATALOG_REPORT.md](PHASE3_FULL_CATALOG_REPORT.md). The navigation optimization and final Pokémon-family acceptance result are in [PHASE3B_NAVIGATION_OPTIMIZATION.md](PHASE3B_NAVIGATION_OPTIMIZATION.md). Cloudflare commands and HTTP checks are in [CLOUDFLARE_TESTING.md](CLOUDFLARE_TESTING.md).

The carousel renders nine nearby canonical links in each initial document. Its compact island loads the shared 1,352-route registry from `/data/navigation/pokemon-navigation.json` only after carousel interaction. JavaScript-disabled pages retain the nearby window and previous/next links.

Phase 4B scales the shared `src/pages/move/[slug].astro` template to all 937 authoritative routes. Core Move content and a bounded latest-game learner preview are static; 833 compact historical/full learner assets are fetched only after interaction. See [PHASE4B_MOVE_CATALOG_REPORT.md](PHASE4B_MOVE_CATALOG_REPORT.md), [MOVE_MIGRATION_AUDIT.md](MOVE_MIGRATION_AUDIT.md), and [MOVE_STRESS_TEST.md](MOVE_STRESS_TEST.md).
