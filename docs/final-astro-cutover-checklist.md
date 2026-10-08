# Final Astro Cutover Checklist

Do not start this checklist without explicit production authorization. Keep Render `pokelore-net` on `master` at `330e2b9` live and unchanged until rollback is no longer needed.

## Build

- [ ] Record exact `astro-migration` commit, clean/deliberate diff, release hash, and target Worker version.
- [ ] Run `cd astro-poc; npm run build:production` in the authoritative foreground environment.
- [ ] Run `npm run verify:production` with zero failures.
- [ ] Confirm `dist/_headers` has no `X-Robots-Tag` directive.

## Staging browser

- [ ] Record the staging Worker URL, Worker version ID, deployment timestamp, and source commit/artifact mapping.
- [ ] Open every core representative route and require visible substantive content, loaded visible assets, working internal links, and zero material console errors.

## Single Type Coverage

- [ ] Verify plain `/single-type-coverage` load.
- [ ] Verify `/single-type-coverage?version=scarlet-violet&type=water` selects Scarlet/Violet and Water with results.
- [ ] Hard-refresh a nondefault parameterized URL and require unchanged URL, controls, and results.
- [ ] Change game and type; require URL/state synchronization.
- [ ] Test back/forward; require synchronized controls/results and zero hydration errors.

## Critical tools

- [ ] DPPt Feebas: calculate a real result, refresh, check map/data assets and console.
- [ ] RSE Feebas: calculate a real result, refresh, check map/data assets and console.
- [ ] Team Coverage: add/change a team member and version; verify data, storage/query behavior, refresh, console.
- [ ] TCG Challenge: start/interact with a challenge; verify data/artwork/runtime assets and console.
- [ ] EV Training Routes: change game/filter; verify results and data request.
- [ ] Single Type Coverage: complete its hard gate above.

## Redirects and 404s

- [ ] Run full numeric redirect inventory: expected 1,350, correct 1,350, all 301, zero wrong destinations/loops/multi-hop chains.
- [ ] Confirm `/DexEntries` 301s to `/dex-entries`.
- [ ] Confirm `.html` and trailing slash normalization are single-hop 301s.
- [ ] Confirm invalid arbitrary, Pokémon, Move, Item, Topic, News, `/learnsets`, `/dev/*`, and `/og-preview/*` routes are true 404s, never SPA/soft 200s.

## Sitemap and robots

- [ ] Confirm production `/robots.txt` uses `https://pokelore.net` and has no global disallow.
- [ ] Confirm production `/sitemap.xml`: 5,648 expected URLs or documented intentional count; zero missing targets, duplicates, malformed entries, `.html`, numeric Pokémon, `/learnsets`, `/DexEntries`, dev routes, or inactive topics.

## Noindex, analytics, canonicals, and assets

- [ ] Confirm staging retains `X-Robots-Tag: noindex`.
- [ ] Confirm production has no blanket noindex; only documented private/404 pages may retain page-level noindex.
- [ ] Confirm exactly one GA4 initialization and measurement ID `G-K4YZXKJHVJ`; staging has none; no duplicate Cloudflare analytics beacon.
- [ ] Confirm homepage, Pokémon/form, Move, Ability, Item, Location, Type, Tool, Topic, Dynamax guide, and hubs canonicalize to `https://pokelore.net` without numeric IDs, `.html`, Render, localhost, or staging host.
- [ ] Crawl CSS, JS, images/sprites/artwork/editorial images, `/data/*`, Team Coverage, TCG, Feebas, and Dynamax assets; require correct MIME and zero missing/stale-host/relative-path failures.

## Search Console, DNS, Cloudflare zone, TLS, and www

- [ ] Preserve `google-site-verification=fiowfuY0gfgPX8LfcpqA2qQc81_TQk_GbzttS9R1guQ` TXT exactly.
- [ ] Preserve token-only TXT, SPF TXT, and all five Namecheap eforward MX records.
- [ ] Record current apex and www CNAME values: `pokelore-net.onrender.com`.
- [ ] Add/verify Cloudflare zone; copy DNS before changing nameservers.
- [ ] Change only to the Cloudflare-assigned nameservers after owner approval and zone review.
- [ ] Bind Worker Custom Domain only for `pokelore.net`; wait for active TLS.
- [ ] Create proxied `www` placeholder and Bulk Redirect 301 to apex with path suffix and query preservation.
- [ ] Test `https://www.pokelore.net/a?b=c` => `https://pokelore.net/a?b=c` in one hop.

## Immediate smoke tests and monitoring

- [ ] Test, in order: `/`, `/pokemon/pikachu`, one form, numeric redirect, `/moves`, Move, `/abilities`, Ability, `/items`, Item, Dynamax guide, `/locations`, Location, `/types`, `/dex-entries`, `/DexEntries`, `/tools`, parameterized Single Type hard refresh, both Feebas tools, Team Coverage, TCG, EV routes, `/topics`, Winds and Waves, Feebas editorial, `/news`, sitemap, robots, invalid route, `.html`, slash, and www.
- [ ] Require expected 200 for canonical pages, 301 for aliases, and 404 for invalid routes; require correct visual behavior for tools.
- [ ] Monitor TLS, Workers errors, browser console/runtime errors, redirects, GA, Search Console, sitemap fetches, and index coverage.

## Rollback

- [ ] Trigger rollback for any listed readiness-document trigger.
- [ ] Restore Namecheap nameservers `dns1.registrar-servers.com` and `dns2.registrar-servers.com`.
- [ ] Restore apex and www CNAMEs to `pokelore-net.onrender.com`.
- [ ] Preserve all verification/email TXT and MX records.
- [ ] Allow current ~30-minute TTL propagation, then validate Render HTTPS, homepage, Pokémon, tools, sitemap, and robots.
