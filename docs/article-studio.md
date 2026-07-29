# PokeLore Article Studio

PokeLore Article Studio is a local development-only article editor at:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173/article-studio
```

## Existing Topics Architecture Found

Before adding Article Studio, Topics worked like this:

- `src/pages/TopicsPage.jsx` loaded static topics from `src/topics/topicRegistry.jsx` and generated Pokedex topics from `public/data/pokedexTopics.json`.
- `src/pages/TopicDetailPage.jsx` first checked `itemLocationTopicComponents` for static React topic pages, then fell back to generated Pokedex topic data.
- Static guide metadata lived in `src/topics/topicMetadata.js`.
- Static guide components lived under `src/topics/`, including `FeebasBeautyEvolutionGuide.jsx`, `FossilPokemonGuide.jsx`, `HerbaMysticaGuide.jsx`, `RaticateAquaticPokemon.jsx`, and item-location pages.
- SEO helpers lived in `src/seo/seoConfig.js` and were rendered through `src/seo/Seo.jsx`.
- Shared site chrome came from `src/components/Banner.jsx`, `src/components/Navbar.jsx`, and `src/components/ScrollToTop.jsx`.
- Global styling lived mainly in `src/index.css`, with feature-specific topic CSS already present for some static topics.

Article Studio extends this system. It does not replace static topics or generated Pokedex topics.

## New Article File Layout

Full articles live here:

```text
public/data/topics/articles/<slug>.json
```

The lightweight article index lives here:

```text
public/data/topics/topicIndex.json
```

The index contains card/navigation metadata only. Article bodies stay in individual article JSON files.

Article images live here:

```text
public/images/topics/<slug>/
```

## Internal Links

Paragraphs, lists, quotes, comparison text, and Oak notes support simple markdown-style links:

```text
[Greninja](/pokemon/greninja)
[Water Shuriken](/move/water-shuriken)
[Poke Ball](/item/poke-ball)
[Water type](/type/water)
[Another article](/topic/another-article-slug)
```

Use internal paths for PokeLore pages. External `http` and `https` links also render, but should be used sparingly and backed by source entries when appropriate.

## Pokemon Card Grids

Use a `pokemon-card-grid` block to show Pokemon summary cards inside an article:

```json
{
  "id": "block-related-starters",
  "type": "pokemon-card-grid",
  "title": "Related Pokemon",
  "pokemonIds": [658, 94],
  "cardSize": "compact"
}
```

Supported card sizes are `compact`, `full`, and `subcompact`.

## Local API

The write API is mounted by Vite middleware only during local development:

```text
GET    /api/article-studio/articles
GET    /api/article-studio/articles/:slug
POST   /api/article-studio/articles
PUT    /api/article-studio/articles/:slug
DELETE /api/article-studio/articles/:slug
GET    /api/article-studio/images/:slug
POST   /api/article-studio/images
```

The browser never writes files directly. The Node middleware validates input, rejects unsafe slugs and traversal paths, writes formatted JSON, updates the topic index, and creates backups before overwrites or deletes.

## Production Behavior

`/article-studio` is only registered when `import.meta.env.DEV` is true. Production builds do not expose the editor route and do not bundle the browser editor page.

The file-writing API is Vite development middleware. It is not part of the production React client and is not mounted by the built static site.

Draft articles with `"active": false` can be previewed in development, but production treats them as not found.

## Backups

Backups are written before overwriting or deleting article JSON and before changing the topic index:

```text
backups/article-studio/articles/<slug>/<timestamp>.json
backups/article-studio/topic-index/_topic-index/<timestamp>-topicIndex.json
```

`backups/article-studio/` is ignored by git.

To recover from a backup, copy the relevant backup JSON back into:

```text
public/data/topics/articles/<slug>.json
```

or restore the topic index backup to:

```text
public/data/topics/topicIndex.json
```

Then restart or refresh the dev server.

## Image Uploads

The Studio accepts PNG, JPEG, WebP, and GIF image uploads up to 8 MB. Filenames are sanitized before writing to:

```text
public/images/topics/<slug>/
```

If `sharp` is installed, uploads are converted to WebP, capped at 1600 px wide without upscaling, and a 400 px thumbnail is generated. Without `sharp`, the original safe image format is saved and dimensions are read where possible.

Quality defaults with `sharp`:

- main WebP: quality 82
- thumbnail WebP: quality 78

Images can also set an optional article display size without changing the underlying file:

```json
{
  "src": "/images/topics/example/image.webp",
  "alt": "Example image",
  "displaySize": "small"
}
```

Supported `displaySize` values are `small`, `medium`, `large`, `wide`, and `full`. Leaving it blank uses the default article image width.

## Adding A Block Type

1. Add the type to `ARTICLE_BLOCK_TYPES` in `src/utils/articleSchema.js`.
2. Add validation rules in `src/utils/articleValidation.js`.
3. Add word extraction in `src/utils/articleReadingTime.js` if the block contains readable text.
4. Add rendering in `src/components/topics/ArticleBlockRenderer.jsx`.
5. Add editor controls in `src/pages/ArticleStudioPage.jsx`.
6. Add a focused test for validation and rendering.

Unknown block types render as an unsupported-block message instead of crashing.

## Starter Drafts

The slugs `why-is-gengar-poison` and `greninja-real-history-ninjas` are seeded as inactive draft placeholders because no existing article content was present to migrate. Mark a draft active in Article Studio when it is ready to appear in the Topics index.
