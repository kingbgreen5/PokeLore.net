# Etsy merchandise promos

To add a real Etsy creative:

1. Add the image to `/public/images/etsy/`.
2. Add an object to `src/data/etsyAds.js`.
3. Assign relevant targeting tags.
4. Add URL tags in `src/data/etsyUrlTags.js` only when page data is not enough.
5. Build and deploy.

`id` identifies the creative image shown on PokéLore. `listingId` identifies the Etsy product listing. Keeping both lets analytics compare which product performs best and which creative performs best.

Disabled examples in `src/data/etsyAds.js` are ignored by the renderer.

