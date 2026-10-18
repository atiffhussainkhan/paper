# Inkbound — RULE1 match start

**Role:** RULE1 Match Start / Map / Player Spawn Analyst  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Audited game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`  
**Parent at audit:** `18f1bb1` (docs only; sim, HUD, and catalog are the `21cf6b0` tree)  
**Browser:** Chrome 154.0.8037.92, headless, fresh profile, cache bypassed. Served from `/workspace/inkbound` at `http://127.0.0.1:8765/`.  
**Sources:** `TerritoryIO_Professional_Requirements_GDD.md` v1.0 (§1, §3, FR-MOVE-06, FR-TERR-02, FR-AI-01/02, §12, §13, §17), read with `inkbound/DECISIONS.md`. Paper.io-class reference is the Poki session shot (own %, Best, named board, soft steer line, camera on the avatar, rivals only at the edge of view).

Cold load waited until the catalog was `ready`, the board had four rows, and the live share read `1.0%`. That landed on animation frame 2. Zero console errors. Zero HTTP responses ≥ 400. No `Paper.io` string in the document. Title is Inkbound.

Shots:

| Shot | What it is |
|------|------------|
| `/opt/cursor/artifacts/rule1_start_first.png` | Desktop 1280×800, frame 2, bead still on the disk |
| `/opt/cursor/artifacts/rule1_start_drift.png` | Same load, frame 37, no keys, wet stroke leaving home |
| `/opt/cursor/artifacts/rule1_start_steer.png` | ArrowDown held, stroke hooks south |
| `/opt/cursor/artifacts/rule1_start_mobile.png` | Fresh load, 375×812, frame 2 |

## Verdict

**PARTIAL.** The match is already playing on the first painted frame. Five of the seven start rules pass. Two are partial, and neither blocks play, so no gameplay code was changed.

| ID | Rule | Score |
|----|------|-------|
| START-DISK | Player spawn disk on the map | **PASS** |
| START-CAM | Camera follow | **PASS** |
| START-MAP | Arena / map presentation | **PARTIAL** |
| START-BOT | Bots present at start | **PASS** |
| START-HUD | HUD (% / names) | **PASS** |
| START-CTL | Controls ready | **PASS** |
| START-FTUE | FTUE hint | **PARTIAL** |

## Matrix

| ID | Rule | GDD / class | Score | Evidence |
|----|------|-------------|-------|----------|
| START-DISK | Player is on a small disk of their own ink when the match starts | §3 L97. FR-TERR-02 L162–166: disk ≈ `start_pct`, reference ~0.66%. Tuning table L563: 0.6%, small but visible. Skin color. | **PASS** | `Game.reset` places You at `(0, 0)` and stamps `startTerritoryRadius` 120 (`src/sim/Game.js` L40–42, `src/config.js` L10–11). Center cell owner is player id 1. Grid share is 208 / 20108 = **1.034%**, shown as **1.0%**. Geometric area is `(120/1200)²` = 1.0%. Frame 2 pixel at the predicted bead `(532.5, 421.8)` is RGB `211,69,44`, next to Seal dry `#d9452b`. Samples inside the disk radius are the same vermilion; samples at 1.6–1.8 radii are the olive plate (`95,83,59`), not ink. `rule1_start_first.png`: princess standing on the red disk. The 1.0% disk is the teaching size named in `config.js`, larger than the GDD’s ~0.66% reference. It is still a small visible patch, and REQ1 already accepted it. Not a fail. |
| START-CAM | View follows the player, with look-ahead, and does not show the whole arena | FR-MOVE-06 L145–149. Tuning L567: about 15–25% of the arena. | **PASS** | `resetCamera` runs before the first frame (`src/main.js` L73, `src/render/Renderer.js` L180–188) and parks the camera one `cameraLookAhead` (120) along heading `-0.2` (`src/config.js` L86–88). Follow smoothing is `cameraFollow` 7.5 (`Renderer.js` L396–423). Desktop scale 0.914 shows a **700 × 437.5** world window, **27.2%** of the disk by area sample. Phone scale 0.58 shows **20.1%**, inside the tuning band. The rim (radius 1200) is outside that window; faint range rings are the only circle cue. Frame 37 with no keys: the bead has left the disk to the right and the disk stays in frame behind it (`rule1_start_drift.png`). ArrowDown keeps both the disk and the head on screen (`rule1_start_steer.png`). Desktop is about two points over the 15–25% note. Tide and Moss are still fully off-screen, so distant threats stay partial. |
| START-MAP | Circular plane reads as the arena: plate, neutral ground, own ink, rim language | §12 L414–423. Arena disk is a clean play surface. HUD stays minimal. | **PARTIAL** | Draw order is stage plate, grid, territory, trails, avatars, rim (`Renderer.js` L441–472, plate L479–540, grid L542–562, rim L565–628). CSS parchment sits under the HUD and does not take input (`css/style.css` L121–141). Frame 2 shows the parchment, the grid, the red disk, and Ochre’s yellow ink cut off at the right edge. The circle itself is mostly off-screen, which matches the limited view. The drop to partial is the catalog strip: `Hud.mountCast` lays every character plate on the match (`src/render/Hud.js` L77–98). On the first frame that strip is **640×165** at `(320, 607)` — 15 plates, two rows — over the lower playfield (`css/style.css` L745–762). It does not cover the spawn disk (disk bottom ~532, strip top 607) and `pointer-events` is none. It is still a gallery on the map, not the minimal % + board the GDD asks for. |
| START-BOT | Locked roster is in the match at start, each on its own ink, named | FR-AI-01 L234–235. FR-AI-02 L237–240 (example count 8–15; respawn only on unowned ground). `DECISIONS.md` locks **3** bots. | **PASS** | `botCount` 3, initial radius 920 (`src/config.js` L41–42). Reset spawns Tide, Ochre, and Moss at angles `-0.72π`, `-0.05π`, `0.62π` (`Game.js` L45–51, `spawnBot` stamps a disk at L82). Each body cell is owned by that bot. Shares 1.000%, 1.000%, and 0.985% (all draw as 1.0%). Distance from You is 920, so the disks do not overlap (edge gap 680). Frame 2 board: You, Tide, Ochre, Moss, all alive at 1.0%. Ochre’s disk clips the right edge of the desktop view; Tide and Moss are outside it, which is the limited view, not a missing spawn. By the steer shot Tide has climbed to **1.2%**, so the bots are ticking from the opening, not frozen. The GDD’s 8–15 figure stays the locked-out example. |
| START-HUD | Own share and the names are on the first frame | §13 L450–455: own %, leaderboard. §16 L529–530. Score to 1 decimal, FR-TERR-07 L195–196. | **PASS** | Shell hooks: percent, Best, board (`index.html` L36–51). `Hud.render` writes one decimal and one row per entity (`src/render/Hud.js` L327–364). Frame 2, desktop and 375px: **1.0%**, label “of the plane”, Best **0.0%**, Stage 1 · Quiet Plane **0%**, rows You / Tide / Ochre / Moss at 1.0% with You marked self and lead. You’s row carries the vermilion inset. No death card (`overlay.hidden` true). Coins and a kill counter are not on this HUD. Coins are outside this MVP. A kill feed is GDD should-have (§16 L541), not this rule. |
| START-CTL | Steering is live. No play button and no tutorial wall | §1 L55: core fun in the first 30 seconds without tutorial walls. FR-MOVE-01 L112–113 always moves. FR-MOVE-03 L123–128 mouse / WASD. | **PASS** | `Input` is constructed before the loop and the first `tick` runs on the first frame (`src/main.js` L20–21, L77–96). With no input, `headingFor` returns null (`src/input/Input.js` L219–265) and the bead keeps heading `-0.2` at speed 195 (`src/sim/Movement.js` L110–127, `Game.js` L174–185). A headless probe leaves the disk at **0.63 s**. Frame 37 of the cold load, still with no key, shows the wet stroke leaving the disk to the right (`rule1_start_drift.png`) while share stays 1.0%. Chrome then held ArrowDown: the stroke hooks south (`rule1_start_steer.png`). The HUD root does not take the pointer (`css/style.css` L149). The overlay starts `hidden` (`index.html` L57). There is no Play gate. Phone touch was not re-sent in this pass; the 375px cold load has the same live sim and no modal, and the listeners are on `touchstart` / `touchmove` (`Input.js` L155–158). |
| START-FTUE | One soft line on a fresh profile, first run only | §1 L55. §13 L455: soft tutorial line, first run only. | **PARTIAL** | Fresh profile, desktop frame 2: the line is **“Point to steer. Close the loop to claim.”** (`index.html` L55), `display: block`, not `.is-faded`. `ftueClaimDone` defaults false (`src/meta/Profile.js` L21). After a real seal, `Hud.render` fades it and saves the flag (`src/render/Hud.js` L317–323); `applyFtueState` keeps it faded on a later boot (`Hud.js` L106–111). That desktop path matches the rule. At `max-width: 640px` the same line is `display: none` (`css/style.css` L908–910), and the phone grid has no `hint` area (L882–891). The 375×812 cold load computed `display: none` while the text was still in the DOM. The phone first frame has no soft line. That does not stop the match. |

## What the first frame actually shows

Desktop frame 2 is the match, not a menu. The bead is on the vermilion disk, slightly left of screen center because the camera sits 120 units ahead of heading `-0.2`. Neutral parchment and the grid surround the disk. A slice of Ochre’s yellow ink is on the right edge. The board and the 1.0% readout are up. The claim line is in the lower right. A two-row character strip sits under the disk and does not cover it.

About half a second later, with no key pressed, the bead is outside the disk and a wet stroke runs back to the edge. The camera has stayed with the bead. Holding ArrowDown turns that stroke south. Tide’s row moves from 1.0% to 1.2% during that same window.

The 375px frame has the same disk, the same 1.0%, and the same four names. The claim line is not painted. A single row of figure plates sits between the board and the disk. Page scroll size equals the viewport (375×812), so the canvas is full-bleed.

## Not changed

No start-blocking bug. The phone hint is a layout omission, and the character strip is extra chrome. Both leave the disk visible and steering live. This pass does not add a home screen, a kill counter, or a new tutorial.
