# SYS2 — World map

**Role:** SYS2 System Analyst + Implementer  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Runnable URL:** `http://127.0.0.1:8765/` (cwd `/workspace/inkbound`, `python3 -m http.server 8765 --bind 127.0.0.1`)

## Was a world map embedded?

**No.** Before this pass the six shores existed only as names and a stage-credit counter. `IMAGE_INDEX.json` has no globe, no world-map bitmap, and no country plate. The title could name Quiet Plane. It could not show a map, and nothing you tapped changed the next arena.

## Catalog plates used

Every bitmap is an id already in `assets/IMAGE_INDEX.json`. Nothing was generated, and no outside map art was added.

| Role | Catalog id | What it is |
|------|------------|------------|
| Atlas sheet | `bg-plane-fallback` | Ancient cartography parchment |
| Sheet grain | `terrain-abstract-01` | Crinkled parchment |
| Compass ring | `ui-icon-circle` | Adventure minimap ring, transparent center |
| Quiet Plane | `bg-quiet-plane` + `terrain-grass` + stage accent | Parchment shore |
| Rimward Marsh | `bg-rimward-marsh` + marsh terrain/accent | Day sky |
| Sumi Basin | `bg-sumi-basin` + basin terrain/accent | Night sky |
| Cinnabar Reach | `bg-cinnabar-reach` + reach terrain/accent | Warm sky |
| Obsidian Shallows | `bg-obsidian-shallows` + shallows terrain/accent | Deep sky |
| Unsealed Horizon | `bg-unsealed-horizon` + horizon terrain/accent | Dawn sky |
| Sealed mark | `ui-medal-alt` | Stage medal |
| Lock mark | `ui-hud-jewel` | HUD jewel |

The vermilion conquest wash is UI ink (the same `--ink-player` token), not a bitmap.

## What is on screen

Home has **World map**. That opens the atlas inside the game (`data-screen="map"`, `game.state` `map`). The match loop does not tick there.

Six shores sit on the parchment, with the compass ring behind them. On a narrow screen they become two columns of the same plates so each shore stays a tap target.

- A shore at or behind `stageIndex` is open. Later shores are locked. Clicking a locked shore explains the seal and does not change the next arena.
- Clicking an open shore writes `selectedStageIndex` and points the next match at that shore's catalog plate.
- Sealed shores (index below the frontier) read 100%. The frontier fills from `stageCredit / completionTarget`. `bestPct` is the best-claim line on the atlas, not a second way to skip ahead.
- **Play** is still the only start. The atlas, Home, and a locked tap leave `game.state` at `map` or `title`.
- After a match, the card's **Map** button opens the same atlas.
- A run on the frontier still credits that shore. A replay of an earlier shore keeps the frontier where it is. Clearing the frontier moves the next arena forward with it.

## Checks

`node tools/run_acceptance.mjs` — **PASS 6/6**.

Chrome on `http://127.0.0.1:8765/`:

- Cold load is the title. `game.state` is `title`.
- World map opens the atlas. State stays `map`. Five shores are locked. Quiet Plane is next.
- Rimward Marsh stays locked and does not become the next arena.
- Play from Home starts a match on Quiet Plane.
- A profile at Sumi Basin with 0.35 credit and best 6.8% shows two sealed shores, Sumi at 35%, three locked shores, and best 6.8%.
- Choosing sealed Quiet Plane, then Home, labels the title with that shore. Play is still required.
- At 375×812 all six shores, Play, Ink, and Home are on the map screen.

Shots: `/opt/cursor/artifacts/sys2_worldmap_title.png`, `sys2_worldmap_fresh.png`, `sys2_worldmap_locked.png`, `sys2_worldmap_progress.png`, `sys2_worldmap_play.png`, `sys2_worldmap_mobile.png`.
