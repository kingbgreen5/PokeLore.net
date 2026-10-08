# Editorial / Topics / News production audit

Audit date: 2026-10-07. Scope is the production React/Vite implementation only; no Astro route or production React code was changed.

## Executive summary

* **24 canonical, indexable topic-detail routes** are produced by the current public sources: 7 static JSX guides, 7 active generated Pokédex topics, and 10 active JSON editorial articles under `/topic/`.
* **6 additional non-canonical/hidden topic records** exist: five inactive generated Pokédex topics (available only with `?review=1`) and one inactive editorial JSON record. Thus, there are 30 known topic slugs in total.
* **0 canonical `/news/:newsSlug` routes** exist. `public/data/news/newsIndex.json` is an empty array and there is no `public/data/news/articles/` directory.
* There are **2 indexes**: `/topics` and `/news`. `/topics` exposes the 24 active topic entries; `/news` intentionally renders “No active news stories yet.”
* There are no route aliases or redirects for these classes. React Router's patterns are literal and parameter matching is case-sensitive in application lookups.
* The sitemap contains every one of the 24 active `/topic/` records and no detail `/news/` record. Its only omissions are the six intentionally inactive/hidden records. `news-sitemap.xml` is empty.

Important terminology: the application calls its long-form JSON editorial content `article`, but routes it as `/topic/:topicSlug`; it calls time-stamped news content `news`, routed as `/news/:newsSlug`. The former exists; the latter currently does not.

## Production architecture

### Route declarations and behavior

`src/App.jsx` lazily imports and declares:

| Route | Page component | Content lookup | Invalid slug behavior |
| --- | --- | --- | --- |
| `/topics` | `src/pages/TopicsPage.jsx` | Static metadata + `/data/topics/topicIndex.json` + `/data/pokedexTopics.json` | N/A |
| `/topic/:topicSlug` | `src/pages/TopicDetailPage.jsx` | Static component registry first; then `/data/topics/articles/{slug}.json`; then `/data/pokedexTopics.json` | “Topic not found” in `PokedexTopicDetailPage`, with a link back to `/topics` |
| `/news` | `src/pages/NewsArchivePage.jsx` | `/data/news/newsIndex.json` | N/A |
| `/news/:newsSlug` | `src/pages/NewsDetailPage.jsx` | `/data/news/articles/{slug}.json` | Global `NotFoundPage` |

`TopicDetailPage` first checks the exact key in `itemLocationTopicComponents`; otherwise it fetches the exact JSON filename, verifies `contentType === "article"`, and blocks `active: false` in production. If that does not yield an article, it finds a Pokédex topic by exact `currentTopic.slug === topicSlug`; inactive Pokédex topics are allowed only when the query parameter is exactly `review=1`.

There is no lower-casing, slug normalization, redirect, `.html` handler, or trailing-slash normalizer in this code. React Router path parameters are case-sensitive by default and all data lookups above use exact equality/object keys. Deployment-level behavior for a differently cased static-asset filename is not defined by the app and must not be relied on. A trailing slash may match React Router’s route grammar, but its canonical remains slashless; it is not separately declared or represented in the sitemap.

All four routes are SPA routes: page body and SEO are created after the lazy component and fetches run. `Seo` mutates `document.head` in an effect. Therefore the initial Vite HTML does not provide the index/article content or final metadata; JavaScript is required for production rendering.

### Authoritative sources

| Source | Format and authority | Consumers |
| --- | --- | --- |
| `src/topics/topicMetadata.js` and `src/topics/topicRegistry.jsx` | Seven explicit static topic metadata records and JSX component mapping | `/topics`, static `/topic/:slug`, sitemap |
| `src/topics/*.jsx`, `src/topics/itemLocations/*.jsx`, `src/topics/ItemLocationTopicPage.jsx` | JSX bodies for the seven static guides | Their matching `/topic/` details |
| `public/data/pokedexTopics.json` | Generated JSON: 12 topic records with result Pokémon and entry text | `/topics`, fallback `/topic/:slug`, sitemap |
| `scripts/generatePokedexTopics.js` plus Pokémon data/curation inputs | Generator for `pokedexTopics.json`; do not hand-copy its generated topic bodies | Build input |
| `public/data/topics/articles/*.json` | Eleven article documents. They hold metadata, hero, block body, sources, and relationships together | `/topic/:slug`; their index and sitemap |
| `public/data/topics/topicIndex.json` | Generated/listing projection for those eleven article documents; 10 active | `/topics`, sitemap |
| `public/data/news/newsIndex.json` | News listing projection; currently `{ "articles": [] }` | `/news`, sitemap/news sitemap |
| `public/data/news/articles/{slug}.json` | Intended news body source | `/news/:newsSlug`; absent in this checkout |

Article JSON has explicit `slug` fields; the route does not derive a slug. Its schema supports title, subtitle, excerpt, dates, author, category, tags, hero (source/alt/caption/dimensions), related Pokémon, related topics, sources, and ordered content blocks. Asset paths are local, root-relative files below `public/images/topics/`; some records intentionally have no hero. `src/utils/articleSchema.js` defines supported block types, and `ArticleBlockRenderer.jsx` renders paragraphs, H2/H3 headings, images/grids, lists, quotes, comparisons, tables, callouts, YouTube embeds, Pokémon/item grids, Pokémon/topic links, and Oak notes.

## Topic inventory

Every row below is a slashless canonical URL. “Listed” means it appears in `/topics`; “SM” means sitemap.

| Slug | Title / source | Type | Listed / SM | SEO or route notes |
| --- | --- | --- | --- | --- |
| `evolving-feebas-into-milotic-via-beauty` | Evolving Feebas into Milotic via Beauty — `FeebasBeautyEvolutionGuide.jsx` | static guide | yes / yes | explicit metadata; Feebas breadcrumbs |
| `fossil-pokemon-guide` | Fossil Pokemon Guide — `FossilPokemonGuide.jsx` | static guide | yes / yes | explicit metadata |
| `herba-mystica` | Herba Mystica Guide — `HerbaMysticaGuide.jsx` | static guide | yes / yes | explicit metadata |
| `raticate-aquatic-pokemon` | Raticate: Aquatic Pokemon? — `RaticateAquaticPokemon.jsx` | static lore | yes / yes | explicit metadata |
| `pokemon-red-item-locations` | Pokémon Red Item Locations — `itemLocations/Red.jsx` | static item guide | yes / yes | shared `ItemLocationTopicPage` |
| `pokemon-blue-item-locations` | Pokémon Blue Item Locations — `itemLocations/Blue.jsx` | static item guide | yes / yes | shared `ItemLocationTopicPage` |
| `pokemon-yellow-item-locations` | Pokémon Yellow Item Locations — `itemLocations/Yellow.jsx` | static item guide | yes / yes | shared `ItemLocationTopicPage` |
| `forest-pokemon` | Forest — `pokedexTopics.json` | generated Pokédex | yes / yes | 115 Pokémon / 163 entries |
| `mountain-pokemon` | Mountain — `pokedexTopics.json` | generated Pokédex | yes / yes | 100 / 164 |
| `cave-pokemon` | Cave — `pokedexTopics.json` | generated Pokédex | yes / yes | 57 / 108 |
| `night-pokemon` | Nocturnal — `pokedexTopics.json` | generated Pokédex | yes / yes | 67 / 205 |
| `ocean-pokemon` | Ocean — `pokedexTopics.json` | generated Pokédex | yes / yes | 94 / 297 |
| `ancient-pokemon` | Ancient Pokémon — `pokedexTopics.json` | generated Pokédex | yes / yes | 83 / 186 |
| `urban-pokemon` | Urban — `pokedexTopics.json` | generated Pokédex | yes / yes | 70 / 56 |
| `greninja-real-history-ninjas` | Greninja's Ninja Origins: History, Folklore, and Japanese Art | JSON article | yes / yes | 2026-07-26; hero `greninja-banner.webp` |
| `catching-feebas-in-pokemon-emerald` | Catching Feebas in Pokemon Emerald | JSON article | yes / yes | 2026-07-29; hero `hoennroute119.webp` |
| `catching-feebas-every-generation` | Catching Feebas: The Ultimate Guide | JSON article | yes / yes | 2026-07-30; no hero |
| `catching-feebas-in-pokemon-diamond-pearl-and-platinum` | Catching Feebas in Pokemon Diamond, Pearl, and Platinum | JSON article | yes / yes | 2026-07-30; hero `feebas-calc.webp` |
| `catching-feebas-in-pokemon-omega-ruby-and-alpha-sapphire` | Catching Feebas in Pokemon Omega Ruby and Alpha Sapphire | JSON article | yes / yes | 2026-07-30; hero `feebas-4.webp` |
| `catching-feebas-in-brilliant-diamond-and-shining-pearl` | Catching Feebas in Brilliant Diamond and Shining Pearl | JSON article | yes / yes | 2026-07-30; no hero |
| `pokemon-winds-and-waves-everything-we-know` | Pokemon Winds and Waves: Everything We Know, Plus Leaks and Rumors. | JSON article | yes / yes | 2026-08-07; no hero |
| `overworld-poke-ball-throwing-appears-to-be-returning` | Overworld Poké Ball Throwing Appears to Be Returning | JSON article | yes / yes | 2026-08-07; no hero |
| `winds-and-waves-starters-everything-we-know` | Winds and Waves Starters: Everything We Know About Browt, Pombon, and Gecqua | JSON article | yes / yes | 2026-08-07; hero `starter-group.webp` |
| `winds-and-waves-new-pokemon-and-regional-forms` | Winds and Waves Confirmed Pokémon & Rumored Regional Forms | JSON article | yes / yes | 2026-08-08; no hero |

Hidden/non-canonical records: `river-pokemon`, `aggressive-pokemon`, `dangerous-pokemon`, `rare-pokemon`, and `ghostly-pokemon` have `active: false` in `pokedexTopics.json`. They are omitted from `/topics` and the sitemap, but render only with `?review=1`. `why-is-gengar-poison` has `active: false` in both article JSON/index and is omitted from `/topics` and sitemap; production blocks it on its topic route. These are not aliases or redirects.

### `/topics` contract

Title: `Pokémon Topics, Item Locations & Lore Guides | PokéLore`. Description: `Explore curated Pokémon topics, item-location guides, habitats, behavior, rarity, danger, and Pokédex lore.` Canonical: `https://pokelore.net/topics`. Default robots: `max-image-preview:large`; no structured data.

H1 is `Pokémon Topics`; the fixed intro is “Browse curated topic pages and guides, including item locations, Pokémon habitats, behavior, and official Pokédex lore excerpts.” It fetches both JSON sources concurrently, prepends active static metadata, then appends active article-index records, then active Pokédex records. It does **not** deduplicate. Current source sets have no duplicate active slug. Group ordering is explicit: Guides, Item Locations, Biomes, Behavior, Lore, Miscellaneous, then unknown groups. Within each group, source order is preserved; there is no alphabetical/date sort. Cards show only title, short description, and `countLabel` (or Pokémon/entry counts) and link to `/topic/{slug}`; they have no card images. CSS grid is `repeat(auto-fit, minmax(220px, 1fr))`. Loading copy and empty copy are explicit.

### `/topic/:topicSlug` contract

Static guides have their own JSX layouts. JSON articles share `TopicArticlePage`: breadcrumb, optional category, H1, optional subtitle, author/date/update/reading-time byline, hero figure, H2 table of contents, body blocks, sources, related Pokémon, and related topics. Article order is document-section order; topic index ordering is as above. Article hero alt/caption derive from each JSON record. Related Pokémon cards require a client fetch to `pokemonRoutes.json`; Pokémon/item grids require client index fetches, so these are the only editorial subcomponents with further runtime data dependencies.

Generated Pokédex details use title, intro, visible Pokémon and entry count, masonry-style column cards, type badges and links, habitat/curation text, and Pokédex-entry versions. `?review=1` exposes a browser-local curation UI only for records otherwise inactive. There is no ordinary query-driven variation.

## Article and news inventory

There are 11 JSON editorial article files, 10 production-active. All are `/topic/` documents, not `/news/` documents. Every active row is displayed on `/topics` and in the sitemap; none appears on `/news`. All dates below are `publishedDate`/`updatedDate`; no separate updated time exists. Categories and hero omissions are preserved rather than repaired.

| Slug | Published | Author | Category | Hero | Status |
| --- | --- | --- | --- | --- | --- |
| `why-is-gengar-poison` | 2026-07-24 / 2026-07-24 | PokeLore | Pokemon Origins | none | inactive; route blocked |
| `greninja-real-history-ninjas` | 2026-07-26 / 2026-07-26 | PokeLore | Pokemon Origins | `/images/topics/greninja-real-history-ninjas/greninja-banner.webp` | active |
| `catching-feebas-in-pokemon-emerald` | 2026-07-29 / 2026-07-29 | Brian King - Pokelore.net Webmaster | Guide | `/images/topics/catching-feebas-in-pokemon-emerald/hoennroute119.webp` | active |
| `catching-feebas-every-generation` | 2026-07-30 / 2026-07-30 | PokeLore | empty | none | active |
| `catching-feebas-in-pokemon-diamond-pearl-and-platinum` | 2026-07-30 / 2026-07-30 | PokeLore | empty | `/images/topics/catching-feebas-in-pokemon-diamond-pearl-and-platinum/feebas-calc.webp` | active |
| `catching-feebas-in-pokemon-omega-ruby-and-alpha-sapphire` | 2026-07-30 / 2026-07-30 | PokeLore.net | empty | `/images/topics/catching-feebas-in-pokemon-omega-ruby-and-alpha-sapphire/feebas-4.webp` | active |
| `catching-feebas-in-brilliant-diamond-and-shining-pearl` | 2026-07-30 / 2026-07-30 | PokeLore.net | Guide | none | active |
| `pokemon-winds-and-waves-everything-we-know` | 2026-08-07 / 2026-08-07 | PokeLore | empty | none | active |
| `overworld-poke-ball-throwing-appears-to-be-returning` | 2026-08-07 / 2026-08-07 | PokeLore | empty | none | active |
| `winds-and-waves-starters-everything-we-know` | 2026-08-07 / 2026-08-07 | PokeLore | empty | `/images/topics/winds-and-waves-starters-everything-we-know/starter-group.webp` | active |
| `winds-and-waves-new-pokemon-and-regional-forms` | 2026-08-08 / 2026-08-08 | PokeLore | empty | none | active |

Article text is stored alongside metadata in those JSON documents; it is not separately authored in Markdown/MDX. The index retains excerpt/thumbnail/listing metadata. No duplicate slugs were found across active sources. The intentionally inactive Gengar draft is the only orphan-like article: it has a file and index record but no production route/listing/sitemap exposure. No active topic article is absent from `/topics` or sitemap. There are no news entries shown without detail files because there are no entries at all.

### `/news` and `/news/:newsSlug` contract

`/news` SEO: title `Pokemon News | PokéLore`; description `Read the latest Pokemon news, official updates, analysis, and carefully labeled rumors from PokeLore.`; canonical `https://pokelore.net/news`; default robots; no JSON-LD. H1 is `Latest Pokemon News` and fixed intro reads “Official updates, developing stories, analysis, and clearly labeled rumors from PokeLore.” It sorts active `contentType: "news"` entries newest-first by `publishedAt`; it has no pagination/filtering. A card would show thumbnail (empty alt), label, category, title, excerpt, author, and locale-formatted date/time. Current state is the documented empty state.

If a valid news article were present, `TopicArticlePage` would provide News breadcrumb, label, H1, subtitle, byline with long formatted date/time and optional update, hero/caption, ToC, body, sources, related entities, and a rumor warning for `newsLabel === "Leak / Rumor"`. `newsSeo` provides canonical `/news/{slug}`, Open Graph article type/image, Twitter cards, `article:published_time`/`article:modified_time`, and a `NewsArticle` JSON-LD object. Its author/category/tags are mapped into schema when present. This is an implemented contract, not a presently populated route universe.

## Winds and Waves inventory

All Winds and Waves content is in the JSON topic-article system, not `/news`:

* `/topic/pokemon-winds-and-waves-everything-we-know` — 2026-08-07, no hero.
* `/topic/overworld-poke-ball-throwing-appears-to-be-returning` — 2026-08-07, no hero.
* `/topic/winds-and-waves-starters-everything-we-know` — 2026-08-07, hero and local images under `public/images/topics/winds-and-waves-starters-everything-we-know/`.
* `/topic/winds-and-waves-new-pokemon-and-regional-forms` — 2026-08-08, body images under its matching `public/images/topics/` folder but no declared hero.

All four are active, listed, and in the sitemap. Legacy-looking unused asset folders (including `winds-and-waves-starters-everything-we-know-about-browt-pombon-and-gecqua` and `untitled-article`) are not evidence of additional routes: no matching active JSON/article index record exists.

## Feebas editorial inventory

Editorial/static routes (not the frozen calculators):

* `/topic/evolving-feebas-into-milotic-via-beauty` — static JSX guide in `src/topics/FeebasBeautyEvolutionGuide.jsx`.
* `/topic/catching-feebas-in-pokemon-emerald`
* `/topic/catching-feebas-every-generation`
* `/topic/catching-feebas-in-pokemon-diamond-pearl-and-platinum`
* `/topic/catching-feebas-in-pokemon-omega-ruby-and-alpha-sapphire`
* `/topic/catching-feebas-in-brilliant-diamond-and-shining-pearl`

All six are active, listed, and in the sitemap. The static beauty guide has dedicated Feebas breadcrumbs; JSON Feebas guides use `getFeebasGuideBreadcrumbs` when configured. The editorial Emerald body links to `/rse-feebas-calculator`; calculator pages also link back into these guides. `/dppt-feebas-calculator` and `/rse-feebas-calculator` remain out of scope.

## SEO contract

`topicSeo` uses the record’s explicit `seoTitle`/`seoDescription` where static metadata supplies them; otherwise it uses `title + " | PokéLore"` and `seoDescription`, `excerpt`, or `shortDescription`. Canonicals are always `https://pokelore.net/topic/{exact-slug}`. Topic pages do not emit topic-specific structured data, article Open Graph image, or article JSON-LD. The global `Seo` component does set standard title, description, canonical, OG title/description/url/type (`website`), Twitter title/description/card, and default `max-image-preview:large` robots after hydration.

News (when populated) additionally has the full `NewsArticle` schema/Open Graph article behavior described above. No author update date, image, or structured-data field should be invented where source data is empty.

## Sitemap comparison

`scripts/generateSitemap.js` is the authoritative generator: it merges active static topics, active generated Pokédex topics, and active article-index topics and deduplicates exact URLs. It likewise includes active news-index records, while `public/news-sitemap.xml` includes active news records with `publishedAt` from only the last two days.

Current `public/sitemap.xml` exactly matches the 24 active topic slugs. It does not contain `/news/:slug` because the news index is empty. `public/news-sitemap.xml` has zero URLs. The valid underlying data records missing from the sitemap are the five inactive Pokédex records and inactive Gengar draft; this is intentional according to generator filters, not a reason to delete them. No duplicate topic/news URLs, capitalization anomaly, `.html` variant, or trailing-slash variant was found in either sitemap.

## Internal-link findings

Index cards target canonical `/topic/{slug}` values. JSON article inline links support only root-relative links and external HTTP(S) links; static content uses React `Link`. The renderer also creates links to Pokémon, items, and topics, and article related-Pokémon/topic areas create further canonical internal routes.

Known intentional cross-surface links include Feebas editorial pages to `/rse-feebas-calculator`, and calculator pages back to Feebas topics and `/location/hoenn-route-119`. No internal link in the route/content sources was found pointing to a missing topic/news route. The special concern is representational rather than a dead link: a JSON `topic-link` can target an inactive/hidden topic, and these links are not validated against active indexes at render time. Preserve that behavior unless a later parity decision explicitly changes it.

## Migration implications

Static generation is straightforward for the **current canonical universe**: generate `/topics`, the 24 active `/topic/[topicSlug]` pages, `/news`, and no `/news/[articleSlug]` pages. `getStaticPaths()` can consume the same static metadata, `pokedexTopics.json`, and `topicIndex.json`; detail article bodies should be read directly from their existing JSON files, not copied into Astro content files. Static JSX guides should be wrapped/reused as React islands initially if direct component reuse is desired; the JSON editorial renderer is a small compatibility surface that can be ported or wrapped without altering copy.

The one caveat is generated Pokédex detail cards and JSON block card grids: they currently fetch Pokémon/item route/index data in the browser. For parity, make those build-time inputs available to the page renderer, or retain narrow islands for exactly those widgets. Ordinary JSON article text needs no client JS. Astro must render canonical/metadata server-side (an improvement in delivery, while matching values), preserve exact current slugs/order/empty fields, retain local root-relative asset paths, and preserve `/news`’s empty state.

## Open questions / blockers

1. Decide whether hidden Pokédex review URLs (`?review=1`) and the inactive Gengar draft need non-indexable Astro equivalents. They are not canonical sitemap routes but are observable production behavior.
2. Confirm whether the existing Article Studio/server workflow is intended to remain the publishing source after Astro adoption; its generated indexes and body JSON should remain the single source of truth.
3. Before migration, choose whether static guide JSX is retained as React components or translated mechanically into Astro. Either is compatible with the “reuse, wrap, prove parity” principle; no rewrite is warranted by the audit.

Recommendation: proceed next with **PHASE 11A.2 — TOPICS / NEWS ASTRO MIGRATION**, reusing these production sources and treating zero current news detail paths as an expected static-path result. Do not begin it until explicitly instructed.

## Phase 11A.2 migration status (2026-10-07)

Astro implementation paths:

* `astro-poc/src/lib/editorialTopics.js` is the thin build-time adapter. It reads the existing static metadata, generated Pokédex JSON, article index, and article JSON documents; it does not maintain a copied editorial inventory.
* `astro-poc/src/pages/topics.astro`, `astro-poc/src/pages/topic/[topicSlug].astro`, and `astro-poc/src/pages/news.astro` provide static index/detail output.
* `astro-poc/src/components/ArticleBody.astro` renders the production JSON article-block model into server HTML. `astro-poc/scripts/generate-editorial-static-fragments.mjs` builds the pre-existing static JSX guides in a separate single-runtime step and writes generated static fragments for Astro to consume; it does not copy guide prose by hand.
* `astro-poc/scripts/verify-editorial-routes.mjs` derives and verifies the 24-route active universe, hidden-record exclusion, HTML/SEO markers, the four Winds and Waves routes, six Feebas routes, seven static guides, seven Pokédex topics, ten JSON articles, and the intentionally empty news index.

The adapter produces exactly 24 active topic static paths and zero news-detail paths by construction. Hidden Pokédex review records and the inactive Gengar record are excluded. Canonicals remain extensionless production URLs. The existing Astro sitemap file already contains `/topics`, `/news`, and the same 24 topic URLs; no frozen sitemap family was changed. Editorial topic/image assets are copied from the existing production public source directories during the Astro build.

Build verification status: direct React rendering inside Astro proved incompatible because the production guide modules and Astro renderer resolve separate React installations. The direct renderer has been replaced with a separate single-runtime fragment-generation step (`generate-editorial-static-fragments.mjs`), which is invoked before `astro build`; Astro no longer imports or executes those JSX guides. The generated-HTML verifier, staging deployment, live staging sweep, and full regression command remain pending a successful foreground build. The staging `_headers` file remains unchanged and continues to specify `X-Robots-Tag: noindex`.

Run from `astro-poc` in a normal foreground terminal:

```text
npm run build
node scripts/verify-editorial-routes.mjs
```

After those pass, deploy with the established staging command (`npm run deploy`) and perform the required live route sweep. No production React/Vite implementation was modified.
