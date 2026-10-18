# Inkbound — REQ3 meta / economy / progression

**Role:** REQ3 Meta / Economy / Progression Auditor
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd`
**Audited runtime:** `4e2c89657840dc0267f877d10b603a49d2cae0cc`
**Server:** `python3 -m http.server 8771 --bind 127.0.0.1` with cwd `/workspace/inkbound`
**Browser:** Chrome 154.0.8037.92, headless, 1280×800, fresh `localStorage`. Catalog `ready`. Zero console errors. Zero HTTP responses ≥ 400. No Paper.io string in the document.
**Shots:** `/opt/cursor/artifacts/req3_ftue_boot.png`, `req3_claim.png`, `req3_unlock.png`, `req3_equip.png`, `req3_restart.png`, `req3_reload.png`, `req3_stage_hud.png`, `req3_stage_hud_after.png`

Sources: `TerritoryIO_Professional_Requirements_GDD.md` v1.0 (§3 macro loop, §8 meta credit, §9 stages, §10 skins, §11 economy, §13 HUD / game over, §15 persistence, §16 checklist, §19 build plan), read with `inkbound/DECISIONS.md` and `inkbound/docs/PHASE1_TRACKS.md`.

## Verdict

**PASS**

Best %, skin unlock and equip, stage credit, the first-claim hint, and the local profile all work and survive both an in-game Restart and a full page reload. Shop, real multiplayer, and revive are **N/A-MVP**. They are not fails.

One HUD bug was fixed on this tip. `Hud.reset()` dropped the faded class on Restart, so the claim hint came back even when `ftueClaimDone` was already saved. Reset now reapplies that flag. A reload had already honored it.

## Smoke (complete)

Run from `/workspace/inkbound` at `4e2c896`. Both exit 0.

| Command | Exit | Output |
|---------|------|--------|
| `node tools/smoke_meta.mjs` | **0** | `smoke_meta ok` |
| `node tools/smoke_hud.mjs` | **0** | `PASS: Best / Stage HUD hooks and contrast styles present` |

`smoke_meta.mjs` asserts all of the following, and none failed:

- Five unique skins.
- Fresh profile: best 0, FTUE not done, Seal equipped, Tideglass refused while locked.
- A 3.4% run is a new best and unlocks Tideglass. A later 1.0% run does not replace the best.
- Tideglass equips. A new `Profile` on the same storage reads best 3.4, Tideglass, and `stageIndex` 2.
- `ftueClaimDone` survives a second load.
- A 100% run unlocks every skin; a repeat sync adds nothing.
- Nightquarry recolors only the player. Bots keep Tide / Ochre / Moss. `reset()` returns the player to Seal.
- Corrupt JSON falls back to best 0.
- Four to six stages. Quiet Plane is stage 1. Run credit uses the peak share (`0.35` over a final `0.12`).
- Credit 0.30 then 0.25 seals Quiet Plane (target 0.50) and opens Rimward Marsh with credit 0.

`smoke_hud.mjs` asserts the Best and Stage hooks, the score-panel contrast rules (backdrop, 15px Best, bone stage name, 10px track, bone Best figure), the unlock celebration and FTUE flag, no Paper.io copy, and that `reset()` calls `applyFtueState()`.

## Browser

Fresh profile. Keyboard loop, then a self-cross after the first seal.

| Step | What the page showed |
|------|----------------------|
| Boot | 1.0%, Best 0.0%, Stage 1 · Quiet Plane, bar 0%. Hint: "Point to steer. Close the loop to claim." Princess / Seal. `req3_ftue_boot.png`, `req3_stage_hud.png` |
| Claim | Share 4.0%, float on the ink, hint opacity 0. Best still 0.0% until the run ends. `req3_claim.png` |
| Death | "You crossed your own line." "3.7% of the plane." "New best. Tideglass unlocked." "Ink opened / Tideglass." "+4.0% toward Quiet Plane (8%)." Emberline still labeled 5% and disabled. Nightquarry 10%. Bone 20%. `req3_unlock.png` |
| Equip | Tideglass selected. Profile `equippedSkinId` is `tideglass`. Locked chips stay disabled. `req3_equip.png` |
| Restart | Overlay gone. Share 1.0%. Best **3.7%**. Stage 1 · Quiet Plane **8%** with the fill drawn. You is the knight on blue ink `#4a7fb5`. Hint opacity 0. Four living rows. `req3_restart.png`, `req3_stage_hud_after.png` |
| Reload | Same profile from `localStorage` key `inkbound.profile.v1`. Best 3.7%, stage 8%, Tideglass knight, hint faded. `req3_reload.png` |

Stored profile after the run:

```json
{
  "bestPct": 3.7,
  "equippedSkinId": "tideglass",
  "unlockedSkinIds": ["seal", "tideglass"],
  "stageIndex": 0,
  "stageCredit": 0.040083548836284066,
  "ftueClaimDone": true
}
```

Stage credit is the run peak (4.0% of the plane → about 8% of Quiet Plane's 0.50 target). Best is the share at death (3.7%), after bots had taken a slice of the 4.0% seal. That split matches the code: `recordRun` stores `finalShare`; `recordStageRun` stores `max(runPeakShare, finalShare)`.

### Stage HUD readability

Measured on the live score panel at 1280×800.

| Text | Color | Plate | Size | Overflow | Contrast |
|------|-------|-------|------|----------|----------|
| Best 0.0% / 3.7% | `rgb(239, 233, 219)` | `rgba(53, 58, 65, 0.95)` | 15px | no | about 9.3:1 |
| Stage 1 · Quiet Plane | `rgb(239, 233, 219)` | `rgba(35, 39, 44, 0.95)` | 18px | no | about 12:1 |
| 0% / 8% | `rgb(255, 106, 74)` | same stage plate | 14px | no | about 5.2:1 |
| Track | bone hairline | 228×10 px | — | — | fill is the player ink |

The name, the percent, and the bar sit in the first viewport, on an opaque plate, and they do not clip.

## Requirement matrix

| ID | Requirement | GDD | Score | Evidence |
|----|-------------|-----|-------|----------|
| BEST-1 | % score and best % | §16 Must-have, L530. In-run % §13 L451. Game over final % and best % §13 L458 | **PASS** | Live % to one decimal. Best sits under it. Overlay says "New best." Restart and reload keep 3.7%. Smoke: 3.4 sticks when a worse run follows. |
| SKIN-1 | At least five cosmetic skins | §16 Must-have, L532. Cosmetic classic skins §10 L341–346 | **PASS** | Seal, Tideglass, Emberline, Nightquarry, Bone. Colors only. Bots stay Tide / Ochre / Moss (smoke). |
| SKIN-2 | Unlock by best share, then equip. Locked skins stay locked | §16 Should-have "Skin unlock challenges", L539. Example "reach 10%" §10 L353 | **PASS** | Thresholds 0 / 2 / 5 / 10 / 20. Browser: 3.7% opens Tideglass and leaves Emberline disabled at 5%. Equip persists. Smoke refuses a locked equip and unlocks the full set at 100%. Kill-count challenges are not a second vector. The shipped challenge is best share, which is the GDD's own example. |
| STAGE-1 | Cumulative stage credit across runs, then the next zone | §16 Should-have, L537. §8 L295–297. Original zones §9 L302–305 | **PASS** | Six zones in `Stages.js` (Quiet Plane through Unsealed Horizon). Browser: peak 4.0% becomes "+4.0% toward Quiet Plane (8%)" and the bar matches after Restart and reload. Smoke: 0.30 + 0.25 seals Quiet Plane and opens Rimward Marsh at credit 0. |
| FTUE-1 | One soft line, first claim only, then it stays off | §1 L55. §13 L455 "Soft tutorial line first run only" | **PASS** | Boot shows the line. After the seal, opacity is 0 and `ftueClaimDone` is saved. Restart and reload keep it dismissed. This was broken before `4e2c896` (Restart cleared the fade). |
| PERSIST-1 | Profile, unlocks, best, stage, equipped skin | §15 L506–508. Critical system "Persistence" §15 L498 | **PASS** | Key `inkbound.profile.v1`. Fields `bestPct`, `equippedSkinId`, `unlockedSkinIds`, `stageIndex`, `stageCredit`, `ftueClaimDone`. Corrupt JSON resets to defaults (smoke). Unknown stored fields are kept by the load spread. |
| SHOP-1 | Shop and dual currency | §16 Could-have v2, L546. §19 Phase 3 L603–604 | **N/A-MVP** | Not in the Must-have list. No shop, gold, or gems in the web build. |
| MP-1 | Real human multiplayer | §1 Non-goals L61. §16 Could-have L548. §19 Phase 4 L606–607 | **N/A-MVP** | Locked decision is 3 bots. No networking UI. |
| REV-1 | Revive / continue | §16 Should-have v1, L538. Not in the Must-have MVP list. §8 L289–293 | **N/A-MVP** | GDD places it after MVP. `DECISIONS.md` locks death → summary → Restart. The overlay has Restart only. Not a fail. |

## Adjacent, not a fail

| Item | Score | Why |
|------|-------|-----|
| Separate Home screen (brand, Play, skins, shop) | **PARTIAL** | §13 L441–447. There is no Home. Best, stage, and the hint are on the match HUD. Skins equip on the run summary. Shop on that screen is N/A-MVP. The meta values are reachable. |
| 100% run instantly clears any stage, plus a 6s reward grab | **N/A-MVP** | §8 L280 and L298 say a full clear is an instant stage clear and recommend a reward grab. The grab is currency theater and is not in the §16 checklist. A 100% run still adds at most 1.0 of stage credit, which seals any current zone whose remaining target is ≤ 1.0. Later zones need more than one full plane (targets 1.25, 1.50, 2.00). |
| Stage rewards (skin, currency, power) | **N/A-MVP** | §9 L315. Skins unlock from best %, not from a stage payout. Currency and powers are v2. |
| `player_id`, `currencies`, `settings`, `daily_streak` | **N/A-MVP** | §15 L509. No account, no wallet, no daily. Settings are a different should-have (colorblind), not this meta gate. |
| Powers, weekly events, replay, ads, IAP | **N/A-MVP** | §16 Could-have L545–549 and §16 Won't L551–554. |

## Bugfix

`inkbound/src/render/Hud.js`: `reset()` removes `.is-faded`, then calls `applyFtueState()`. If the profile says the first claim already happened, the hint stays hidden and `hasClaimed` stays true. `tools/smoke_hud.mjs` now requires that call inside `reset()`.

No other meta rule was changed. Best remains the death share. Stage credit remains the run peak.
