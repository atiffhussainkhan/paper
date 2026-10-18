# Inkbound — Final acceptance

**Role:** FULL FINAL QA / RELEASE
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd` → `main`
**Tip:** `ed4d76178272a9de69470b128b52966ea80390ad`
**Server:** `python3 -m http.server 8771 --bind 127.0.0.1` with cwd `/workspace/inkbound`
**Browser:** Chrome 154, Linux. Desktop 1280×800 and phone 375×812.
**Shots:** `/opt/cursor/artifacts/inkbound_final_*.png`

This is the full web build (catalog art, claim, skins, stages, juice). It is not a Phase 0-only prototype. Godot stays a scaffold.

## Smoke matrix

Run from `/workspace/inkbound` at `ed4d761`. All exit 0.

| Smoke | Result | What it locks |
|-------|--------|----------------|
| `node tools/smoke_combat.mjs` | **PASS** | Opening bot safety, self-forgiveness, first-claim self-immunity, self-cross after the first seal, same-tick contact vs clip |
| `node tools/smoke_loop.mjs` | **PASS** | Scripted claim 1.03% → 2.76%; pocket steal; majority circuit 67%; rim slide; sealed-plane win with no bot respawn; sharp hook; nose seal |
| `node tools/smoke_hud.mjs` | **PASS** | Best % and Stage hooks, contrast, no Paper.io strings |
| `node tools/smoke_vfx.mjs` | **PASS** | Capture float, three-phase death, crown, kill slash / pop |
| `node tools/smoke_meta.mjs` | **PASS** | Five skins, best %, stage credit and clear |
| `node tools/smoke_images.mjs` | **PASS** | 58 images `{ background: 7, character: 15, skin: 8, ui: 7, vfx: 7, terrain: 14 }`, hashes, bindings, catalog-only CSS |

## Browser proof

Served only from `/workspace/inkbound`. Fresh profile. Catalog `ready`, count 58. Zero console exceptions. Zero HTTP ≥ 400. No Paper.io in the document. Brand seal resolves to `http://127.0.0.1:8771/assets/catalog/ui/ui-brand-seal.png`.

| Check | Result | What happened |
|-------|--------|----------------|
| Boot | **PASS** | Title Inkbound. 1.0%, Best 0.0%, Stage 1 · Quiet Plane. Princess figure on a parchment plate. Four living rows (You, Tide, Ochre, Moss). `inkbound_final_boot.png` |
| Always moving + trail | **PASS** | WASD leaves the start disk and draws a wet stroke. `inkbound_final_trail.png`, `inkbound_final_stage_hud.png` |
| Human claim | **PASS** | Keyboard square (D, S, A, W) closed the loop. Share 1.0% → **6.4%**. Float **+5.4%**. Hint faded. `inkbound_final_claim.png` |
| Self-cut after the seal | **PASS** | Overlay: "You crossed your own line." Stats "6.4% of the plane." You row 0.0%. `inkbound_final_death.png` |
| Skins | **PASS** | New best. Tideglass and Emberline unlocked from catalog picker art. Emberline equipped. Restart spawned the dragon plate on rose ink, Best stayed 6.4%. `inkbound_final_skins.png`, `inkbound_final_restart.png` |
| Stage HUD | **PASS** | After the run: "+6.4% toward Quiet Plane (13%)." A profile on stage 6 shows Unsealed Horizon at 40% on a different catalog plate and the Bone figure. `inkbound_final_catalog_stage.png` |
| Catalog load | **PASS** | All 7 backgrounds and all 15 character files decoded. Figures draw as standing plates (Princess, Knight, Dragon, Kenney toons), not missing-image fallbacks |
| Phone 375×812 | **PASS** | No horizontal overflow. Percent, Best 6.4%, and Stage 1 · Quiet Plane stay clear of the character strip. `inkbound_final_mobile.png` |
| Restart | **PASS** | Overlay hides. Share returns to 1.0%. Four living rows. No leftover trail |

The recorded claim used WASD, which is the desktop bias control. An earlier pointer pass did turn the bead (east, then south) before the first-seal immunity landed. This session did not close a second loop with the mouse.

## GDD requirements

Source: `TerritoryIO_Professional_Requirements_GDD.md`, read against the locked Inkbound decisions (web canvas, 3 bots, no revive, original IP).

### Must-have MVP

| Requirement | Result | Note |
|-------------|--------|------|
| 360° continuous motion, no full stop | **PASS** | Steer rate limited. Avatar keeps moving with no input |
| Own territory is safety | **PASS** | Open trail only while outside owned ink |
| Trail + loop capture, `+%` float | **PASS** | Browser 6.4% and +5.4%. Smoke also covers pocket steal and a majority circuit |
| Self-trail death | **PASS** | Browser overlay after the first seal. The first loop may clip its own stem and still seal (`playerFirstClaimSelfImmune`) |
| Enemy trail cut | **PASS** | `smoke_combat.mjs`. Not driven in this browser session |
| Territory clears on death | **PASS** | You dropped to 0.0% on the board |
| Bots, names, leaderboard | **PASS** | Tide, Ochre, Moss. Three bots, not the GDD's example of 8–15 |
| % score and best % | **PASS** | One decimal. Best persisted across restart |
| Run summary and restart | **PASS** | Cause, final %, new best, stage line, Restart |
| At least 5 cosmetic skins | **PASS** | Seal, Tideglass, Emberline, Nightquarry, Bone. Unlock by best % |
| Original art identity | **PASS** | Image-repo / CC0 catalog. No Paper.io strings |
| Mobile and desktop controls | **PASS** | Pointer aim and WASD / arrows. Phone layout checked at 375px |

### Should-have

| Requirement | Result | Note |
|-------------|--------|------|
| Stage progression with cumulative credit | **PASS** | Six zones. Run peak share credits the active stage. Quiet Plane moved to 13% in the browser |
| Revive / continue | **Not in this build** | Locked decision: death, summary, Restart. Not a defect |
| Skin unlocks | **PASS** | Tideglass at 2%, Emberline at 5%, shown in the browser |
| Crown for the leader | **PASS** | Leader row wears the medal. World crown is in `smoke_vfx.mjs` |
| Kill callout | **PARTIAL** | Slash and pop are in `smoke_vfx.mjs`. This browser session did not cut a bot |
| Settings and colorblind mode | **PARTIAL** | No settings screen. Territory uses catalog splat patterns; there is no colorblind toggle |

### Could-have and won't

Powers, shop, dual currency, weekly events, true multiplayer, and replay are **not in this build**. Open world, loot-box gambling, and pay-to-win map percentage are absent. Those match the locked non-goals.

### QA matrix

| ID | Result | Note |
|----|--------|------|
| T01 Leave and return | **PASS** | Browser 1.0% → 6.4%, trail cleared |
| T02 Cross own trail | **PASS** | After the first seal |
| T03 Enemy crosses you | **PARTIAL** | Smoke only this session |
| T04 You cross an enemy | **PARTIAL** | Smoke only this session |
| T05 Die with territory | **PASS** | Ink cleared. +6.4% stage credit remained |
| T06 Reach 100% | **PARTIAL** | `smoke_loop.mjs` reaches `outcome.type === "win"` and the line "The plane is yours." The overlay was not opened in the browser |
| T07 Bot spawn off your fill | **PASS** | Smoke. Restart showed three fresh bots |
| T08 Rim slide | **PASS** | Smoke, several headings. Not repeated in the browser this session |
| T09 Mutual cut | **PASS** | Same-tick cuts kill both. Combat runs before capture, so a cut denies the seal |
| T10 Colorblind mode | **PARTIAL** | Patterns exist. No mode switch |
| T11 Background / foreground | **Not run** | Frame clamp is `maxFrameTime` 0.2s and 8 steps. No 30s tab-switch was performed |
| T12 Ad revive cancel | **Not in this build** | No ads |

## Gaps

- **Win overlay was not shown in the browser.** Headless smoke does seal the plane.
- **No five-minute soak and no tab-switch test.**
- **Browser did not cut a bot or get cut by a bot** in this session.
- **Godot is not the game.** `godot/scripts/sim/capture.gd` still returns 0. Ship the web build from `/workspace/inkbound`.
- **No home screen, settings, revive, shop, powers, or real multiplayer.**
- **Population is 3 bots.** The GDD's 8–15 figure was an example, and the locked decision is 3.

## Release call

The web build at `ed4d761` is the full final candidate to open against `main`. Play it over HTTP from `/workspace/inkbound`.
