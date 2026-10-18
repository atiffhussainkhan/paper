# Inkbound — Final acceptance

**Role:** SYSTEM QA / RELEASE
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd` → `main`
**Integrated tip before this doc:** `4fa7c27` (opening fairness + catalog VFX), then the uncommitted sibling tree below
**Server:** `python3 -m http.server 8771 --bind 127.0.0.1` with cwd `/workspace/inkbound`
**Browser:** Chrome 154, Linux. Desktop 1280×800 and phone 375×812.
**Tester:** SYSTEM QA

Siblings SYS1–4 landed on this branch. `git fetch` of `origin/cursor/inkbound-final-dev-c3dd` matched local `4fa7c27` (0 ahead / 0 behind). No conflict markers. Further sibling edits were still in the working tree (catalog bindings, capture polygon, ink contact, trail camera, HUD art). Those edits are part of this acceptance tree. QA added one fix the browser caught: `Vfx.drawCrown` read `crown` without a local, threw `ReferenceError` on the first crown frame, and stopped `requestAnimationFrame`.

## Catalog-only art

Bitmaps come from `assets/IMAGE_INDEX.json` (49 images, Image repo / Kenney CC0). `tools/smoke_images.mjs` checks sha256, upstream `source_path`, and that every id is bound. CSS does not invent grain (`feTurbulence`) or `data:image/svg` bitmaps. UI seals are catalog files. A fresh load resolves the brand seal to `http://127.0.0.1:8771/assets/catalog/ui/ui-brand-seal.png` (absolute, so `css/style.css` does not request `/css/assets/...`).

## Smoke matrix

Run from `/workspace/inkbound` on the integrated tree. All exit 0.

| Smoke | Result | What it locks |
|-------|--------|----------------|
| `node tools/smoke_combat.mjs` | **pass** | Opening safety blocks bot cuts; low-share extension; cut works after grace; aggression ramps with age and share; no false self-kill on a straight trail; early self-forgiveness on short curves |
| `node tools/smoke_loop.mjs` | **pass** | Scripted claim stays alive (0.0103 → 0.0276). Small loop steals only enclosed ink (share 0.0262). Majority circuit claims the interior (share 0.6715) and stays inside the arena. Grazing home does not commit a stroke. Straight run rim-slides (distance 1187) without stopping. A sealed plane wins and does not respawn bots |
| `node tools/smoke_hud.mjs` | **pass** | Best % and Stage (Quiet Plane + bar) hooks and contrast styles. No Paper.io strings in HTML/CSS/HUD |
| `node tools/smoke_vfx.mjs` | **pass** | Capture `+%` floats, three-phase death juice, crown holder, and `drawCrown` does not throw |
| `node tools/smoke_meta.mjs` | **pass** | Five skins, best %, stage credit and clear |
| `node tools/smoke_images.mjs` | **pass** | 49 images `{ background: 7, character: 6, skin: 8, ui: 7, vfx: 7, terrain: 14 }`, hashes, bindings, catalog-only CSS |

## Browser (served from `/workspace/inkbound`)

| Check | Result | Evidence |
|-------|--------|----------|
| Loads. Title Inkbound. Catalog `ready`, count 49. Console exceptions none on a fresh load | **pass** | Second load after the crown fix: `bad: []` |
| HUD at spawn: `1.0%`, Best `0.0%`, Stage 1 · Quiet Plane, hint, four rows (You, Tide, Ochre, Moss). Overlay hidden | **pass** | Boot readout |
| No Paper.io in the document | **pass** | DOM scan |
| Always moving. Full-canvas hash changed across 0.9 s with no input; a wet stroke leaves the start disk | **pass** | Boot frame shows an open trail |
| Pointer square. Self-cut overlay: "You crossed your own line." Stats `1.0% of the plane.` Best becomes `1.0%`. Stage line `+1.0% toward Quiet Plane (2%)`. Ink picker shows Seal | **pass** | Death overlay |
| Restart. Overlay hides, share returns to `1.0%`, four living rows, Best stays `1.0%` | **pass** | Post-restart frame |
| 375×812. No horizontal overflow. Percent, Best, and stage name still in the first screen | **pass** | `overflowX: false` |
| Catalog seal URL is under `/assets/catalog/`, not `/css/assets/` | **pass** | Computed style |
| Fresh reload after the fix: zero HTTP ≥400, zero exceptions, overlay hidden, percent `1.0%` | **pass** | Network log |

## Gaps

- **Godot is not the playable build.** `godot/scripts/sim/capture.gd` `capture_loop` still returns 0. The comment now matches the web fill rule. Do not ship the Godot project as the game.
- **Browser did not close a successful claim.** The pointer square cut its own line first. Territory growth on a closed loop is **pass** in `smoke_loop.mjs` (1.03% → 2.76%, plus the pocket and majority-circuit cases).
- **Win overlay copy was not shown in the browser.** `smoke_loop.mjs` does seal the plane and reaches `state === "over"` with `outcome.type === "win"`. The on-screen line "The plane is yours." was not opened.
- **Rim slide was not driven in the browser.** `smoke_loop.mjs` holds a straight heading for 520 ticks, keeps moving, and finishes at distance 1187 (arena radius 1200).
- **No five-minute soak and no tab-switch test.**
- **A sharp pointer hook still dies on your own line.** Seen in this session. Opening grace does not make every flick safe.
- **Out of scope, confirmed absent as product:** real multiplayer, shop, ads, powers. Not treated as defects.

## Release call

The web build on this branch is acceptable to open against `main` with the gaps above. Play it from `/workspace/inkbound` over HTTP. The Godot folder stays a port scaffold.
