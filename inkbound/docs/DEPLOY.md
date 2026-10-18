# Inkbound — deploy the web build

The shippable game is the static tree in `inkbound/`. There is no bundler, no `package.json`, and no install step. A browser loads `index.html`, then ES modules under `src/`, then `assets/IMAGE_INDEX.json` and the catalog PNGs.

Godot under `inkbound/godot/` is a scaffold. Do not wait on it, and do not require a Godot binary, to publish the web build. See [PORT_GODOT4.md](PORT_GODOT4.md).

## What to publish

Publish **this directory** (`inkbound/`) as the site root, so these paths exist at the host root:

```text
index.html
.nojekyll
css/style.css
src/**/*.js
assets/IMAGE_INDEX.json
assets/catalog/**/*.png
```

`assets/upstream/` is provenance for the art sync. The running game does not fetch it. `tools/`, `docs/`, and `godot/` are not required at runtime. Leaving them in the upload is harmless.

Do not publish the repository root as if it were Inkbound. The root `index.html` is a different project (Santa's Visit). There is one Inkbound tree in this repository: `inkbound/`. That folder is the deploy root.

To host on your own site, upload the contents of `inkbound/` (or the built Pages root) as static files. `index.html` must stay next to `css/`, `src/`, and `assets/`.

Relative URLs are used throughout (`css/style.css`, `src/main.js`, catalog paths like `assets/catalog/...`). The same files work at a domain root (`https://play.example/`) and at a project-page prefix (`https://<user>.github.io/<repo>/`). Nothing in the web runtime points at a domain-root path such as `/src/` or `/assets/`. GitHub Pages project sites use that prefix and a trailing slash (`https://<user>.github.io/<repo>/`).

## How to serve it

ES modules do not run from `file://` in Chrome, Edge, or Safari. Serve the folder over HTTP.

```bash
cd inkbound
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/`. Any static host that serves `.js` as JavaScript (`text/javascript` or `application/javascript`) and `.png` as `image/png` is enough. No rewrite rules and no SPA fallback are required: there is one page and no client router.

Local check that the entry and the catalog resolve:

```bash
curl -sI http://127.0.0.1:8080/src/main.js | head -n 5
curl -sI http://127.0.0.1:8080/assets/IMAGE_INDEX.json | head -n 5
curl -sI http://127.0.0.1:8080/assets/catalog/ui/ui-brand-seal.png | head -n 5
```

Expect `200` on each.

## GitHub Pages

The public project-site URL pattern is:

```text
https://<user>.github.io/<repo>/
```

For this game the GitHub account is `atiffhussainkhan`. Once the repository that contains `inkbound/` is on that account, the playable link is `https://atiffhussainkhan.github.io/<repo>/`. The published root must be the **contents** of `inkbound/`, not the repository root, so `index.html` is at the site root.

### Actions (committed)

[`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) deploys `inkbound/` with `actions/upload-pages-artifact` and `actions/deploy-pages` on every push to `main`.

In the repository on github.com: **Settings → Pages → Build and deployment → Source: GitHub Actions**. That is the one click that turns the workflow into the live site. The workflow does not run on Cursor Origin (`origin.cursor.com`); it runs only after this repository is on GitHub and Pages is set to GitHub Actions.

### Branch publish

`gh-pages` carries the contents of `inkbound/` at the branch root (including `.nojekyll`, so Jekyll does not rewrite the tree). If Actions is unavailable, use **Settings → Pages → Deploy from a branch → Branch: `gh-pages` / `/ (root)`**.

Do not point Pages at `main` / root. That would publish Santa's Visit at `/` and hide Inkbound under `/inkbound/`.

## Any other static host

Upload the contents of `inkbound/` to the host’s web root (S3 + CloudFront, Netlify, Cloudflare Pages, nginx, `npx serve`).

- Publish directory: `inkbound`
- Build command: none
- Output directory: `inkbound` (already built)
- `index.html` must stay next to `css/`, `src/`, and `assets/`

Netlify and Cloudflare Pages: set the base directory to `inkbound` and leave the build command empty. Do not run a framework build.

nginx example, with the folder copied to `/var/www/inkbound`:

```nginx
server {
  listen 80;
  root /var/www/inkbound;
  index index.html;
  location / {
    try_files $uri $uri/ =404;
  }
}
```

Cache: `index.html`, `css/style.css`, and `src/main.js` already carry `?v=` query strings in the HTML. Catalog PNGs do not. After an art change, purge the CDN or rename the files. A long cache on `index.html` will keep an old module URL.

## Fonts

`index.html` loads IBM Plex and Instrument Serif from `fonts.googleapis.com` / `fonts.gstatic.com`. Those are the only third-party requests. `css/style.css` names system fallbacks (`Georgia`, `Arial`, `ui-monospace`), so a blocked font CDN changes type, not play. No API key is involved.

## Config that ships

Tunables live in `src/config.js` (`CONFIG`, frozen). Meta tables live next to them. Change them in source and re-serve; there is no remote config.

| Constant | Value | Meaning |
|----------|--------|---------|
| `CONFIG.winShare` | `1` | Match seals when the player holds the whole plane (share `0..1`). |
| `CONFIG.simHz` | `60` | Fixed simulation step. |
| `CONFIG.botCount` | `7` | Tide, Ochre, Moss, Bramble, Soot, Lichen, Mulberry. No network. |
| `CONFIG.arenaRadius` | `1200` | World units, circular plane. |

`winShare` is read in `src/sim/Game.js`. A sealed plane sets the win outcome and does not respawn bots.

### Stages (`src/meta/Stages.js`)

Six zones. A run credits `max(runPeakShare, finalShare)` onto the active stage. Clearing advances `stageIndex` and resets `stageCredit` to 0. Background and terrain ids match `assets/IMAGE_INDEX.json`.

| # | id | Name | Completion target (cumulative share) |
|---|----|------|--------------------------------------|
| 1 | `quiet-plane` | Quiet Plane | 0.50 |
| 2 | `rimward-marsh` | Rimward Marsh | 0.75 |
| 3 | `sumi-basin` | Sumi Basin | 1.00 |
| 4 | `cinnabar-reach` | Cinnabar Reach | 1.25 |
| 5 | `obsidian-shallows` | Obsidian Shallows | 1.50 |
| 6 | `unsealed-horizon` | Unsealed Horizon | 2.00 |

Past the last stage, `getStage` stays on Unsealed Horizon.

### Skins (`src/meta/Skins.js`)

Five cosmetic inks. Unlock when best % of the plane reaches `unlockPct`. Unlocks persist in `localStorage` under `inkbound.profile.v1` and are never revoked. Skins recolor the player only.

| id | Name | Unlock | Pattern | Figure |
|----|------|--------|---------|--------|
| `seal` | Seal | 0% | `skin-splat-01` | `char-plate-princess` |
| `tideglass` | Tideglass | 2% | `skin-splat-05` | `char-plate-knight` |
| `emberline` | Emberline | 5% | `skin-splat-10` | `char-plate-dragon` |
| `nightquarry` | Nightquarry | 10% | `skin-splat-16` | `char-toon-robot` |
| `bone` | Bone | 20% | `skin-splat-22` | `char-toon-male-person` |

Each skin also binds an orb bead and a picker paint id. `tools/smoke_images.mjs` checks those bindings against files on disk.

## Gate before you publish

From `inkbound/`:

```bash
node tools/run_acceptance.mjs
```

That runs all six smokes (`smoke_combat`, `smoke_loop`, `smoke_hud`, `smoke_vfx`, `smoke_meta`, `smoke_images`) and exits non-zero if any fail. It also requires `docs/FINAL_ACCEPTANCE.md` to be present. Node 18+ is enough; there are no npm dependencies.

## Security for this static game

- No server, no accounts, no cookies, no API keys.
- The profile (best %, equipped skin, unlocks, stage credit, FTUE flag) stays in the browser under `inkbound.profile.v1`.
- Do not commit `.env` files, export presets, or private keys. `godot/export_presets.cfg` is gitignored.
- Player-facing names are written with `textContent`. The catalog is local files, not remote HTML.
