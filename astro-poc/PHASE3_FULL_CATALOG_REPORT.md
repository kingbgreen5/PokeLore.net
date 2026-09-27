# Phase 3 full Pokémon catalog report

Run date: September 27, 2026. Branch: `astro-migration`. Staging Worker version: `e4402f13-dc03-4c0e-880f-442ae04d2d34`.

1. **Expected canonical count:** 1,352 names from the authoritative by-name registry.
2. **Generated count:** 1,352 Pokémon documents, plus the homepage and 404 document.
3. **Route parity:** missing 0, unexpected 0, duplicate canonical routes 0. All 1,352 internal Pokémon targets belong to the registry.
4. **Numeric redirects:** all 1,350 unique mappings passed source, destination, 301, target-existence, no-self-redirect, and no-numeric-destination checks. Wrangler parsed 1,352 total rules: 1,350 static and two dynamic.
5. **Form semantics:** 327 non-default routes; 319 automatically classified; eight explicit overrides; zero unresolved. No battle/state form was inserted as an evolution stage.
6. **SEO:** all pages passed one title, description, canonical and H1; production-host canonical identity; robots policy; Open Graph; Twitter metadata; parseable WebPage/BreadcrumbList/Thing JSON-LD; and routed-name checks. Mismatches and malformed documents: 0.
7. **Content/model:** fatal model failures 0. Every route passed identity, types, available abilities/descriptions, six stats and total, matchups, evolution interpretation, learnsets, available Dex/editorial/encounter data, artwork policy, facts, and size-comparison eligibility.
8. **Links:** broken Pokémon links 0; numeric, `.html`, trailing-slash, and nonexistent-form Pokémon hrefs 0.
9. **Assets:** broken required assets 0. Twelve routes use the approved artwork fallback policy and eight IDs lack optional sprite bounds.
10. **Learnsets:** latest level-up data is static where available; full historical payloads exist as 1,352 on-demand JSON assets; largest hydration prop is 682 bytes; largest historical payload is Mew at 918,901 bytes. Complete move/learnset datasets are absent from hydration props.
11. **HTML sizes:** minimum 407,356 bytes; median 1,502,267; p75 1,534,740; p90 1,574,603; p95 1,610,680; p99 1,840,863; maximum 3,267,050. Seven pages exceed 2 MB and one exceeds 3 MB. Representative gzip sizes are 53,819 bytes minimum, 121,898 median, 148,958 at p95, and 125,706 for the maximum page.
12. **Largest pages:** Magikarp 3,267,050; Rattata 2,209,079; Zubat 2,203,745; Goldeen 2,177,310; Golbat 2,143,436; Tentacool 2,133,223; Poliwag 2,075,248; Geodude 1,951,406; Gyarados 1,940,923; Gastly 1,920,724; Graveler 1,885,507; Pidgey 1,855,258; Krabby 1,853,276; Psyduck 1,840,863; Spearow 1,822,460; Audino 1,810,572; Hoothoot 1,809,703; Exeggcute 1,790,070; Tentacruel 1,766,988; Slowpoke 1,755,625 bytes.
13. **Navigation payload:** hydration props are 213,184–221,097 bytes (median 215,246) and duplicated in all 1,352 documents. The server-rendered carousel plus props is about 1.32 MB on Kakuna. A later pass should externalize the shared registry and initially render a small adjacent window.
14. **Artifact count:** 6,783 physical files: 1,354 HTML, 15 JS, one CSS, 1,353 JSON, 4,058 images, and two routing/header files. Wrangler created 6,800 logical asset entries after HTML handling.
15. **Artifact size:** 2,508,804,336 bytes (2.51 GB decimal; 2.34 GiB). The duplicated carousel markup is the main optimization opportunity.
16. **Cloudflare limits:** within published limits: 6,783 files versus 20,000 on Free, largest file 3.27 MB versus 25 MiB, 1,350 static redirects versus 2,000, and two dynamic redirects versus 100. Cloudflare publishes no total static-asset byte cap. The initial upload completed successfully.
17. **Build duration:** 677.44 seconds total. Astro build and 1,354-page generation took about 335 seconds; exhaustive verification took about 342 seconds. Peak memory was not instrumented. Form audit: 0.35 seconds; catalog audit: 3.00 seconds.
18. **Verification/crawl:** local HTTP crawl covered all 1,352 routes in 23.399 seconds (24.46 seconds command wall time), with zero failures and real 404s for invalid paths. Browser sample wall time was 52.92 seconds.
19. **Browser sample:** 30 stress routes passed with JavaScript disabled at 390 px; six difficult routes passed at 768 and 1,440 px; artwork and optional-section policies passed; the hydrated historical learnset interaction passed; no page overflow or reported browser errors.
20. **Production parity:** eight representative routes passed identity, types, abilities, stats, evolution, artwork, learnset, Dex text, encounters, editorial handling, and biological facts. Intentional Astro differences remain static SEO/JSON-LD, ability descriptions, semantic headings, and safe omission of unsupported form data.
21. **Sitemap/manifest:** the staging manifest contains exactly 1,352 canonical production URLs. Production sitemap policy contains the same 1,352 URLs; missing 0 and unexpected 0. The production sitemap itself was not modified.
22. **Remaining anomalies:** 158 routes lack explicit form analysis; 592 lack routed encounters; 12 require artwork fallback; eight lack sprite bounds; 14 new routed forms lack direct ability source data; 48 lack base experience; one lacks valid weight. Missing facts are labeled or omitted, and no unrelated base-form data is invented. The navigation duplication should be optimized before production cutover.
23. **Staging:** deployed successfully to the existing staging Worker. Upload: 6,470 changed files in 314.30 seconds; total deployment 339.75 seconds. Live HEAD/GET acceptance passed every numeric redirect, representative catalog/form routes, slash normalization, custom 404s, assets, MIME types, and staging noindex.

Evidence files are under `evidence/full-catalog`, `evidence/stress`, and `evidence/cloudflare`. The production React/Vite site, DNS, custom domain, sitemap, and non-Pokémon page families were not changed.

A. FULL POKÉMON CATALOG READY FOR STAGING

Phase 3B subsequently externalized the repeated carousel registry and reduced the artifact to 816,095,541 bytes. See [PHASE3B_NAVIGATION_OPTIMIZATION.md](PHASE3B_NAVIGATION_OPTIMIZATION.md) for the final Pokémon-family result.
