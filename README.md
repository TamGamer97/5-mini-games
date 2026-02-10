# 5-mini-games

Five mini games: Object Association, Pattern Completion, Quantitative Recall, Sequence Recall, Symbol Matching.

![Five games overview](assets/five-games-overview.png)

## Run locally

- **Landing page:** Open `index.html` in a browser (or use a static server so the game links work).
- **Single game (dev):** From a game folder, e.g. `object-association`, run `npm install` then `npm run dev`.

## Build (for deploy)

From the repo root:

```bash
npm run build
```

This installs and builds each game, then outputs everything into the `out/` folder (landing page at root, each game in its own subfolder).

## Deploy to Netlify

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In [Netlify](https://app.netlify.com): **Add new site** → **Import an existing project** → connect your repo.
3. Netlify will use the repo’s `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
4. Click **Deploy site**. The first deploy will run `npm run build` (which runs `npm ci` and `npm run build` in each game folder, then copies everything into `out/`).
5. Your site URL will be like `https://your-site.netlify.app`. The root shows the landing page; each game is at `/object-association/`, `/pattern-completion/`, etc.

**Note:** Root has no `node_modules` (the build script only runs the game subprojects). If Netlify expects a root install, add a root `package.json` with no dependencies (already added) and use **Build command:** `npm run build` — no root `npm install` is required since the script runs `npm ci` inside each game folder.
