# Inkbound — REQ4 full playtests

**Role:** REQ4 Full Playtest Runner
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd`
**Server:** `python3 -m http.server 8771 --bind 127.0.0.1` with cwd `/workspace/inkbound`
**Browser:** Chrome 154.0.8037.92, headless, Chrome DevTools Protocol. Fresh browser context per run (`localStorage` empty at cold load).
**Viewports:** desktop 1280×800 (runs 1–4); phone 375×812, device scale 2, touch emulation (run 5).
**Shots and notes:** `/opt/cursor/artifacts/req4_runN_*.png` and `req4_runN_notes.txt`

Each run is a full session: cold load, steer, leave the start disk, close at least one claim, play on until death, read Best and Stage, Restart, confirm the new disk.

## Verdict

**PASS**

Five complete sessions finished. Every one left home, sealed at least one loop, ended on a death card, kept Best and Stage across Restart, and spawned a fresh 1.0% disk with four living rows. Run 4 also equipped Emberline and kept that ink, the best, and the stage credit across Restart and a full reload.

One HUD bug was fixed and run 5 was played again on the fix. On a phone, the live leaderboard and score panel (z-index 4) sat above the death card (z-index 3), so the cause was covered and Restart sat under the score panel. The card is now z-index 6, scrolls if it is taller than the screen, and uses safe centering. After the fix the title and Restart are on screen and receive hits.

No run sealed the whole plane. `winShare` is 1, and these sessions ended in death, which is a complete session.

## Five runs

| Run | Session | Result | Seal | End | Best / Stage | Restart |
|-----|---------|--------|------|-----|--------------|---------|
| 1 | First-claim gentle loop. Keyboard square, then a self-cross. | **PASS** | 1.0% → **3.9%**, float **+2.9%** | "You crossed your own line." 3.9% of the plane. Tideglass unlocked. | Best **3.9%**. Stage 1 · Quiet Plane **8%**. | 1.0%. Best 3.9% and stage 8% kept. Four living rows. Hint stays faded. |
| 2 | Larger claim / multi-loop. Second loop after the first seal, then a self-cross. | **PASS** | 1.0% → **4.6%** (+3.5%), then **6.3%** (+1.7%) | "You crossed your own line." 6.3%. Tideglass and Emberline unlocked. | Best **6.3%**. Stage 1 · Quiet Plane **13%**. | 1.0%. Best 6.3% and stage 13% kept. Four living rows. |
| 3 | Self-trail death. Wide loop, long open stem, then a cross of that stem. | **PASS** | 1.0% → **7.8%** peak | "You crossed your own line." Death share **7.2%**. Stage line credits the peak, "+7.8% toward Quiet Plane (16%)." | Best **7.2%** (share at death). Stage **16%**. | 1.0%. Best 7.2% and stage 16% kept. Four living rows. |
| 4 | Skin equip and persistence. Wide loop, death, equip Emberline, Restart, hard reload. | **PASS** | 1.0% → **7.7%** peak. Death share **6.8%**. | "You crossed your own line." Tideglass and Emberline unlocked. Nightquarry and Bone stay locked. | Best **6.8%**. Stage **15%**. Emberline selected. | Restart draws the dragon on rose ink at 1.0%. Reload keeps Best 6.8%, Emberline, stage 15%, `ftueClaimDone`. |
| 5 | Phone 375×812. Touch steer, two seals, long trail south, death, Restart. | **PASS** | 1.0% → **2.7%** (+1.6%), then **4.2%** | "You crossed your own line." 4.2%. Tideglass unlocked. Title and Restart are on screen and hittable. No horizontal overflow. | Best **4.2%**. Stage 1 · Quiet Plane **8%**. | 1.0%. Best 4.2% and stage 8% kept. Four living rows. |

## What each session showed

### Run 1 — gentle first claim

Cold load: title Inkbound, catalog ready, 58 images, share 1.0%, Best 0.0%, Stage 1 · Quiet Plane 0%, rows You / Tide / Ochre / Moss at 1.0%. Keyboard east leaves a wet stroke (`req4_run1_trail.png`). The return north seals a block at 3.9% with float +2.9% (`req4_run1_claim1.png`). A later open stem is crossed and the card reads "You crossed your own line." (`req4_run1_end.png`). Restart restores the start disk (`req4_run1_restart.png`).

An earlier attempt at this same script missed the disk: the bead drifted on its opening heading while the harness took the boot shot before the first key. That was harness timing. The passing session starts the steer on the first framed step. The miss is not a game defect. The passing shots replace that attempt.

### Run 2 — multi-loop

Two separate seals on one life: 4.6% with float +3.5% (`req4_run2_claim1.png`), then 6.3% with float +1.7% (`req4_run2_claim2.png`). Death card unlocks Tideglass and Emberline and shows +6.3% toward Quiet Plane (13%) (`req4_run2_end.png`). Restart keeps both numbers (`req4_run2_restart.png`).

### Run 3 — self-trail death

The wide loop seals 7.8%. The open stem is still outside owned ink at 7.7% (`req4_run3_stem.png`). Crossing that stem kills the player. The card says "You crossed your own line." and "7.2% of the plane." Best stores 7.2%, the share at death. Stage credit uses the run peak, so the stage line is "+7.8% toward Quiet Plane (16%)." (`req4_run3_end.png`). That split matches `recordRun(finalShare)` and `resolveRunShare` (peak). Bots can take cells while a stroke is open. Restart is a clean disk with Best 7.2% and stage 16% still showing.

### Run 4 — Emberline persists

Death at 6.8% unlocks Tideglass and Emberline. Nightquarry (10%) and Bone (20%) stay locked. Clicking Emberline selects it (`req4_run4_skin.png`). Restart spawns the dragon plate on rose ink, share 1.0%, Best 6.8%, stage 15% (`req4_run4_restart.png`). A cache-bypassing reload of the same profile draws the same dragon, the same Best, and the same stage (`req4_run4_reload.png`). Stored profile: `equippedSkinId` `emberline`, `bestPct` 6.8, `ftueClaimDone` true, `stageCredit` about 0.077.

### Run 5 — phone

375×812. Touch points relative to the bead steer the same square a keyboard uses. Boot has no horizontal overflow. Percent, Best 0.0%, and Stage 1 · Quiet Plane sit clear of the character strip (`req4_run5_boot.png`). First seal 2.7% with float +1.6% (`req4_run5_claim1.png`). A second seal reaches 4.2%, then a long southern stroke stays outside (`req4_run5_pressure.png`). The life ends on "You crossed your own line." The death title and the Restart button are inside the viewport and are the top hit targets (`req4_run5_end.png`). Restart returns 1.0% with Best 4.2% and stage 8% (`req4_run5_restart.png`).

The southern trail died on its own line. Bots were alive and gaining share (Moss and Ochre above 2% on the earlier pass of this route). This session's killing blow was the self-cross.

## Fix

`css/style.css`, inside `@media (max-width: 640px)`:

- `.hud-overlay` z-index 6, `overflow-y: auto`, `align-items: safe center`
- Small vertical margin on the card so a tall summary can scroll instead of sliding under the HUD

`index.html` loads `css/style.css?v=mobile-overlay` so a cached sheet does not keep the old stacking.

Desktop runs already showed the title and Restart clear of the HUD. The phone re-run after the fix is the one in the table.

## Checks on every passing run

- Catalog `ready`, count 58. Document title Inkbound.
- No console error and no `http://127.0.0.1:8771/` response ≥ 400.
- Share observed near 1.0% while the stroke was still open, then a seal above that.
- Death card visible. Best and Stage filled in. Stage percent moved off 0%.
- Restart: overlay hidden, share back at 1.0%, You alive at 1.0%, four living rows, Best unchanged, stage label still present.

## Readiness

The web build is ready to play a full life on desktop and at 375px: leave, claim, die, read Best and Stage, Restart, and keep a chosen ink. Ship it from `/workspace/inkbound`.
