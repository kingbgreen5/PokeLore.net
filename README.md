# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Pokemon artwork

Official artwork is mirrored under
`public/images/pokemon/official`. Full PNGs are used on detail
pages, while 384px WebPs are used on summary cards.

To refresh the mirror:

```powershell
python -m pip install -r scripts/requirements-artwork.txt
python scripts/syncPokemonArtwork.py
```

The sync is resumable, validates existing files, writes updates
atomically, and regenerates
`public/data/pokemonArtworkManifest.json`.

## Pokemon static routing

Pokemon detail pages are prerendered and finalized into extensionless static
files during the normal production build. See
`docs/pokemon-static-routing.md` for the Render requirements and maintenance
notes.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
