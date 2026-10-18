# Inkbound — REQ5 deployment / config / ship-readiness

**Role:** REQ5 Deployment / Config / Ship-Readiness Auditor
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd` → `main`
**Runtime audited:** `efbf5f5ff88c9d99a6ac88e5686dbbd6ae97a810`
**Verdict:** **GO** for web deploy

The web build can be published as a static site. Godot does not block that. This note does not change `src/` behavior beyond the `winShare` comment already in `efbf5f5`.

## Checklist

| Check | Result | Evidence |
|-------|--------|----------|
| Static hosting | **GO** | `index.html` loads `css/style.css?v=final-hud` and `<script type="module" src="src/main.js?v=art-layers">`. Imports inside `src/` are relative. No `src="/…"`, `href="/…"`, or `url("/…")` in `index.html`, `css/style.css`, or `src/**/*.js`. |
| ES modules over HTTP | **GO** | `file://` is not a supported launch. Served `inkbound/` with `python3 -m http.server 8773`. `GET /src/main.js` returned `200` `text/javascript`. `GET /css/style.css` returned `200` `text/css`. |
| Subdirectory / Pages prefix | **GO** | Catalog bytes resolve from `import.meta.url` (`ImageCatalog.js` → `../../assets/…`). CSS art uses `new URL(assetPath, window.location.href)` with relative paths (`assets/catalog/…`). A project-page prefix works when `inkbound/` is the published root. |
| Asset preload | **GO** | `IMAGE_INDEX.json` lists 58 images. All 58 paths exist, none are absolute, and there are no extra catalog PNGs. `smoke_images` hashed every file. HTTP `200` on `assets/IMAGE_INDEX.json`, `assets/catalog/ui/ui-brand-seal.png`, and `assets/catalog/background/bg-quiet-plane.png`. |
| `winShare` | **GO** | `CONFIG.winShare` is `1` (the whole plane). `Game.js` ends the match on that share. Commented in `src/config.js`. Table in [DEPLOY.md](DEPLOY.md). |
| Stages | **GO** | Six stages in `src/meta/Stages.js`: Quiet Plane 0.50, Rimward Marsh 0.75, Sumi Basin 1.00, Cinnabar Reach 1.25, Obsidian Shallows 1.50, Unsealed Horizon 2.00. Each has a background and terrain id present in the catalog. |
| Skins | **GO** | Five skins: Seal 0%, Tideglass 2%, Emberline 5%, Nightquarry 10%, Bone 20%. Pattern, figure, and orb ids all resolve in the catalog. |
| Single gate | **GO** | `node tools/run_acceptance.mjs` runs the six smokes and exits `1` if any are missing or fail. A copy with no smoke files exited `1` (`ACCEPTANCE: FAIL 6/6`). The real tree exited `0`. |
| `FINAL_ACCEPTANCE.md` | **GO** | Present at `inkbound/docs/FINAL_ACCEPTANCE.md`. The gate refuses to run if that file is missing. |
| Godot gate | **GO** | Stubs only. `capture_loop` returns `0`. Combat marks nobody dead. Bot headings, slide, and trail collision are still `TODO`. No file under `src/` imports `godot/`. `.godot/` is gitignored. No workflow requires a Godot binary. |
| Secrets | **GO** | No `.env`, no private keys, no `AKIA` / `ghp_` / `github_pat_` / `sk-` material under `inkbound/` (skipping PNGs and `.godot/`). Profile data is `localStorage` key `inkbound.profile.v1` only. |
| Deploy notes | **GO** | [DEPLOY.md](DEPLOY.md) covers GitHub Pages (Actions artifact of `inkbound/`, or `gh-pages`) and any static host. `inkbound/.nojekyll` is in the tree so a branch publish is not passed through Jekyll. |

## Smoke gate

Command: `node tools/run_acceptance.mjs` from `/workspace/inkbound`, on `efbf5f5`.

| Smoke | Exit | Time | Last line |
|-------|------|------|-----------|
| `tools/smoke_combat.mjs` | 0 | 34ms | `All smoke combat checks passed.` |
| `tools/smoke_loop.mjs` | 0 | 257ms | `PASS: rim slide stays alive from several headings` |
| `tools/smoke_hud.mjs` | 0 | 22ms | `PASS: Best / Stage HUD hooks and contrast styles present` |
| `tools/smoke_vfx.mjs` | 0 | 122ms | `PASS: capture floats, death juice, crown, kill feedback` |
| `tools/smoke_meta.mjs` | 0 | 37ms | `smoke_meta ok` |
| `tools/smoke_images.mjs` | 0 | 48ms | `smoke_images: ok 58 images { background: 7, character: 15, skin: 8, ui: 7, vfx: 7, terrain: 14 }` |

`ACCEPTANCE: PASS 6/6`

## How the catalog loads

`loadImageCatalog()` fetches `assets/IMAGE_INDEX.json` and preloads every id. A failed index fetch rejects `boot()` and sets `data-image-catalog="failed"`. A single bitmap `onerror` records the id in `failed` and continues, so a later missing PNG would leave a hole rather than a blank page. That path is not live: all 58 indexed files are on disk and hash-checked.

## Godot

Publish the web tree without opening Godot. `docs/PORT_GODOT4.md` still says not to fill stubs until the web loop is the build you ship. This audit does not fill them.

## Security notes

The only network calls outside the host are the Google Fonts stylesheet and font files in `index.html`. `css/style.css` already falls back to Georgia, Arial, and `ui-monospace`. HUD strings that come from the sim or the skin table are assigned with `textContent`. The percent readout interpolates a `toFixed` number into a fixed `<small>%</small>` template.

## Residuals (do not block GO)

- No Pages workflow is committed. A push does not deploy. [DEPLOY.md](DEPLOY.md) is the operator step. That avoids publishing the repository root, whose `index.html` is not Inkbound.
- `inkbound/README.md` still describes a Phase 0 prototype and lists skins and stages as out of scope. The running tree and [DEPLOY.md](DEPLOY.md) are the ship description.
- Catalog PNGs are not cache-busted. HTML and CSS/JS entry URLs use `?v=`. Purge the CDN when art changes.
- Fonts look different if `fonts.googleapis.com` is blocked. Play is unchanged.
- Godot is not a playable port.

## Release call

**GO.** Host the `inkbound/` directory on GitHub Pages or any static file host, using [DEPLOY.md](DEPLOY.md). Re-run `node tools/run_acceptance.mjs` on the commit you publish.
