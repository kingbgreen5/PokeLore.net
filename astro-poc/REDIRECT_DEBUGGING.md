# Numeric redirect investigation — September 24, 2026

## Resolved: live acceptance passed

The user successfully deployed locally with Wrangler: version `9f3b01b4-2506-4c2e-a171-8daa63cbf221`. The build completed in 5.40 seconds and logged the expected redirect SHA256. After that deployment, `node scripts/test-cloudflare-http.mjs https://pokelore-astro-test.thebeakeh.workers.dev` passed the complete live matrix: all 1,350 numeric redirects via both HEAD and GET, including initial `/pokemon/10325` → `/pokemon/baxcalibur-mega` 301; canonical 200s, slash 301s, numeric slash chain, custom 404s, MIME, assets and staging noindex. Results are saved in ignored `evidence/cloudflare/http-results.json`.

All 1,350 live numeric mappings are now verified for this deployment. The earlier failure was an old deployment remaining active after the hosted build timed out. The underlying Cloudflare hosted initialization timeout remains undiagnosed, but local build/deploy bypassed it successfully. The investigation below records the pre-fix evidence.

Live origin: `https://pokelore-astro-test.thebeakeh.workers.dev`.

## Finding

The live deployment does not expose the current generated redirect artifact. The read-only sample passed only 4/22 IDs: **6, 14, 25, 10100**. These exactly match the old manually maintained numeric rules in commit `25a70b3f`. The first rule, quartile samples and all final ten rules return initial HTTP 404 without Location. This is not a late-file cutoff or merely an unmigrated destination returning 404 after a redirect.

Additional evidence: live Kakuna still links to `https://pokelore.net/pokemon/weedle`, while current dist links to `/pokemon/weedle`. Together these strongly indicate an older deployment artifact. The precise deployment mistake (selected revision, skipped build, wrong working directory or other pipeline issue) cannot be confirmed without authenticated deployment metadata/logs.

User subsequently confirmed that the latest “astro infrastructure” build failed after 9 minutes 26 seconds with a timeout. This explains why that revision did not replace the old deployment. The reason for the timeout remains unknown until the failed build's final log lines and configured commands are inspected. The local Astro build completed in approximately six seconds (excluding dependency installation); the repository-root build is a separate, much larger production pipeline and must not be used for this POC.

Local HEAD is `ac548a7d78467b3aab5df1e82f1fdba3b4ad1dd5` before these debugging changes. The cached origin branch points there too; no fresh remote fetch was performed. `wrangler deployments list --config wrangler.jsonc` could not access metadata because this noninteractive environment has no Cloudflare API token. No deployment or login was attempted.

## Exact artifact inspection

Both `public/_redirects` and `dist/_redirects` contain this exact line at **line 1352**:

```text
/pokemon/10325 /pokemon/baxcalibur-mega 301
```

The files are byte-identical: 50,263 bytes, SHA256 `03f6837139d9f038bc1749b4830a2ee76d346557f295f70d6fb644b35710fe31`. Each has 1,350 static numeric rules followed by two dynamic rules. LF encoding, no BOM, maximum line length 71 bytes. No duplicate sources, malformed/partial rules, invalid whitespace, unsafe slugs or registry discrepancies were found. Empty/comment lines are intentional and valid.

| Sample | File line | ID | Expected slug | Live initial response |
|---|---:|---:|---|---|
| First | 3 | 1 | bulbasaur | 404 |
| Around 25% | 340 | 338 | solrock | 404 |
| Around 50% | 678 | 676 | furfrou | 404 |
| Around 75% | 1015 | 1013 | sinistcha | 404 |
| Existing form | 1127 | 10100 | raichu-alola | 301 |
| Final ten | 1343 | 10316 | golisopod-mega | 404 |
| | 1344 | 10317 | magearna-mega | 404 |
| | 1345 | 10318 | magearna-original-mega | 404 |
| | 1346 | 10319 | zeraora-mega | 404 |
| | 1347 | 10320 | scovillain-mega | 404 |
| | 1348 | 10321 | glimmora-mega | 404 |
| | 1349 | 10322 | tatsugiri-curly-mega | 404 |
| | 1350 | 10323 | tatsugiri-droopy-mega | 404 |
| | 1351 | 10324 | tatsugiri-stretchy-mega | 404 |
| Final | 1352 | 10325 | baxcalibur-mega | 404 |

Other failed samples: 150, 251, 493, 10001. Sampling alone does not establish the response of every unsampled live ID.

## Changes and verification

- Independent artifact parser now validates every registry entry in both files, rejecting missing/duplicate sources, wrong destinations/statuses, malformed lines and count mismatch. Generator-string equality checks remain in place.
- Ten generator/validator tests passed, including corruption cases. Full Astro build and content/SEO verification passed.
- Wrangler 4.137.0 locally parsed **1,352 valid redirect rules** and one header rule, with no redirect parser warning.
- Full local HTTP matrix passed: **all 1,350 numeric mappings via HEAD and GET**, canonical 200, slash 301, numeric slash chain, custom 404, MIME, assets and staging noindex. No SPA fallback or Worker runtime was added.
- `.html` 404 is accepted by HTTP checks. No additional alias implementation was added.
- `npm run deploy` now runs build/verification before the explicit Wrangler config. The verifier logs the artifact hash. This command was **not executed** in this investigation.

## Required deployment correction

Deploy a revision containing the generated registry redirects and these checks to `pokelore-astro-test`, using repository root, branch `astro-migration`, build `cd astro-poc && npm ci && npm run build`, deploy `cd astro-poc && npm run deploy`. Confirm the successful deployment revision, logged artifact hash and parsed 1,352 rules; inspect any actual deployment parser warnings. Keep existing staging variables and no production custom domain. The code/artifact already contains the missing rule; manually adding it again would not fix an old deployed artifact.

From Git Bash in the repository:

```sh
cd astro-poc
node scripts/sample-numeric-redirects.mjs
# Optional automated verification of every live numeric route:
node scripts/sample-numeric-redirects.mjs --all
```

Representative curl checks (PowerShell: use `curl.exe`):

```sh
for id in 1 6 14 25 150 251 493 338 676 1013 10001 10100 10316 10317 10318 10319 10320 10321 10322 10323 10324 10325; do
  curl -I "https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/$id"
done
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/10325
```

Every initial response must be 301 to its registry slug. Do not use `-L` for this check: Baxcalibur Mega's destination intentionally has no generated page yet.

**Trust assessment:** all 1,350 current local mappings are verified. All 1,350 live routes cannot yet be trusted: only 4/22 sampled routes passed. Deployment log confirmation and a passing live rerun remain necessary; the `--all` sampler provides complete live numeric coverage without manual testing.
