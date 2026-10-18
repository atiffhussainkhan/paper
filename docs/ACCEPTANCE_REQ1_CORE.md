# Inkbound — REQ1 core gameplay acceptance

**Role:** REQ1 Core Gameplay Acceptance Auditor
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd`
**Audited runtime:** `efbf5f5ff88c9d99a6ac88e5686dbbd6ae97a810`
**Server:** `python3 -m http.server 8771 --bind 127.0.0.1` with cwd `/workspace/inkbound`
**Browser:** Chrome 154.0.8037.92, headless, 1280×800, fresh profile. Zero console errors. Zero HTTP responses ≥ 400.
**Shots:** `/opt/cursor/artifacts/req1_boot.png`, `req1_trail.png`, `req1_claim.png`, `req1_death.png`, `req1_restart.png`

The commit on top of `65de734` is a comment on `winShare` plus `tools/run_acceptance.mjs` and `.nojekyll`. It does not change movement, capture, combat, or bots. Smokes below were re-run on `efbf5f5`.

Sources: `TerritoryIO_Professional_Requirements_GDD.md` v1.0 (FR-MOVE, FR-TERR, FR-KILL, FR-AI, §8, §16, §18), read with the locks in `inkbound/DECISIONS.md` (360° steer, circular non-lethal rim, 3 bots, death → Restart, no revive in this MVP).

## Verdict

**FULL**

Core play is a complete Paper.io-class loop, not a half build. Every requirement in the matrix is **PASS**. No in-scope bug was found, so no gameplay code was changed.

Locked product choices that differ from GDD examples are not fails: 3 named bots rather than the GDD’s “e.g. 8–15”, no revive, start disk about 1.03% rather than ~0.66%.

## Requirement matrix

| ID | Requirement | Score | Evidence |
|----|-------------|-------|----------|
| MOVE-1 | 360° steer. Heading chases a desired angle along the short arc, limited by `steerRate` (`π × 1.72` rad/s). Keyboard is an 8-way bias; the pointer is a free angle. The avatar does not snap to 4- or 8-way cells. | **PASS** | Probe: a sweeping desired heading turned **6.87 rad** with no step larger than one tick of `steerRate`. Browser trail corner in `req1_trail.png` is a curve, not a grid kink. |
| MOVE-2 | Constant move while alive. No input, wall-normal input, and time inside own ink all keep speed at `playerSpeed` (195). | **PASS** | Probe: 180 ticks circling inside the start disk, minimum step **3.250** = `195/60`. Straight run, max step error **0.0000**. `Arena.slide` replaces a near-zero tangent with full speed so a head-on rim hit does not pin the bead. |
| MOVE-3 | Circular arena, non-lethal rim slide. The bead stays inside `R − bodyRadius` and keeps moving. | **PASS** | `smoke_loop.mjs`: straight run ends at radius **1187.0** (arena 1200, body 13) and stays alive. Five headings (0, 0.8, 2.1, −1.4, π/2) slide without death, stall, or leaving the disc. Not repeated against the wall in this browser session. |
| TERR-1 | Trail is emitted only outside own land. A graze that never clears the body does not commit a stroke. Inside the disk, no wet line. | **PASS** | Probe: tight circle inside the start disk, **0** trail points, share unchanged. Smoke: “grazing home does not commit a stroke”; egress keeps share **0.0103** with an open trail. Browser `req1_trail.png`: wet stroke begins at the disk edge; HUD still **1.0%**. |
| TERR-2 | Re-entering own ink closes the loop, flood-fills the interior (including stolen ink), clears the trail, and shows `+%`. | **PASS** | Browser: **1.0% → 3.2%**, float **+2.1%**, hint faded (`req1_claim.png`). Smoke: scripted loop **0.0103 → 0.0276**; pocket steal; majority circuit **0.6715**; sharp hook seals; first-claim nose arms a seal before the center overlaps ink. The 0.1 gap between `1.0 + 2.1` and the shown `3.2` is independent one-decimal rounding of share and delta, not a missed fill. |
| KILL-1 | After the first seal, crossing your own open trail kills you. The message is “You crossed your own line.” Territory clears. A straight run along a fresh stroke does not. | **PASS** | Browser at ~12.8s: overlay “You crossed your own line.”, “3.2% of the plane.”, You row **0.0%** dead (`req1_death.png`). Smoke: same square geometry is forgiven before the first seal and kills after it, past the 22s teaching window. Straight trail: no false self-kill. |
| KILL-2 | An enemy body cutting an open trail kills the owner and credits the cutter. A bot cannot cut the player during opening safety. Same-tick mutual cuts kill both. | **PASS** | `smoke_combat.mjs`: opening at 9.99s and low-share extension at 12s block the bot cut; the same cut kills after grace (`Moss` / player). Probe: player sweep across Tide’s old stroke → “You cut Tide's line.”, attacker lives. Mutual cross → “Moss cut your line.” and “You cut Moss's line.”, both dead. This browser session died by self-cut, so an enemy cut was not on screen. |
| KILL-3 | Body against body is non-lethal. Only a wet stroke kills. A head-on overlap of the fresh stem (inside enemy-head grace) is not a cut. | **PASS** | Probe: coinciding centers, no trails, both live. Head-on contact on a long straight stem, both live. `resolveCombat` has no body-body test; contact radius is body plus half the stroke, with `enemyHeadGracePoints` (4) of arc excluded. |
| AI-1 | Bots have distinct roles and actually expand. Locked roster is 3: Tide edge-farmer, Ochre small-looper, Moss opportunistic-cutter. | **PASS** | Probe, 18s live match: roles exactly those three; all three gained share (Tide 2.0%, Ochre 2.8%, Moss 2.7%) while the player lived. Browser board shows Tide, Ochre, and Moss alive and climbing (Tide **1.2%** on the trail shot, Moss **2.5%** at the death overlay). GDD’s fourth names (turtle, reckless) and the “e.g. 8–15” count are the locked-out example, not a missing system. |
| AI-2 | Difficulty curve is continuous: aggression, cutter range, time outside, and speed rise with match age and player share, and stay 0 through opening safety. | **PASS** | `smoke_combat.mjs`: opening aggression **0**, mid above opening, late above mid, on range, out-time, and speed. Formula in `botDifficultyCurve`: age ramp after 14s, share from 1.5% to 20%, times `sqrt(age)`. |
| AI-3 | Opening fairness. Bots do not cut the player during the teaching window, and that window lengthens while the player’s share is low. Player cuts and self-cuts still resolve. | **PASS** | Smoke: guaranteed 14s, plus the low-share bonus, blocks a real geometric cut; the cut lands once that window ends. Browser: bots were scoring for ~12s and never cut the player; the death was the scripted self-cross. |
| WIN-1 | Owning the whole plane (`winShare` 1) ends the match as a win, title “The plane is yours.”, and does not respawn bots onto the seal. | **PASS** | `smoke_loop.mjs`: painting every inside cell then ticking sets `outcome.type === "win"` and stays sealed for 8 further ticks. A closed rim circuit through `captureLoop` reaches share **1.0000**. This browser session took the death path, so the win overlay was not opened. The death overlay is the same HUD surface. |
| FLOW-1 | Death stops the run, shows the cause and final %, and offers Restart only. Restart is a fresh disk, 1.0%, three living bots, no leftover trail. No revive in this MVP. | **PASS** | `req1_death.png` button is **RESTART** only. Document text has no “revive” or “continue”. `req1_restart.png`: overlay gone, **1.0%**, Best **3.2%** kept, four living rows at 1.0%, hint restored. Probe: death clears the player’s cells; `reset()` restores the start share and 3 living bots. |
| FEEL-1 | First-claim forgiveness / softer early play. Until the first seal, the player’s own line cannot kill them. For 22s, short curves get a wider grace and a smaller self-hit radius. The first return seals on a wider bead plus a nose probe. | **PASS** | Smoke: closing self-cross forgiven while `playerClaimed` is false; same geometry kills after the seal and after 22s; short early curve lives; sharp hook seals at **0.0187**; nose arms capture before the center overlaps ink. Browser: the keyboard square closed (**+2.1%**) instead of suiciding on the outbound stem, then a later cross killed. |

## Smoke log

Re-run from `/workspace/inkbound` at `efbf5f5`. All exit 0. These are the full scripts, not a subset of their asserts.

| Command | Result | What it locked |
|---------|--------|----------------|
| `node tools/smoke_combat.mjs` | **PASS** | Opening bot safety, low-share extension, bot cut after grace, monotonic difficulty outputs, no false self-kill on a straight stroke, early short-curve forgiveness, first-claim self-cross forgiven, post-claim self-cross kills, same-tick seal ignores a self-clip |
| `node tools/smoke_loop.mjs` | **PASS** | Claim 1.03% → 2.76%; pocket steal; majority circuit 67%; graze does not commit; rim slide at 1187; sealed-plane win with no bot respawn; rim circuit share 1.0000; game-over does not respawn; sharp hook; first-claim nose; rim slide from five headings |
| `node tools/smoke_vfx.mjs` | **PASS** | Capture float text, three-phase death (dissolve, burst, territory fade), crown handoff, player kill slash and pop. Also drives a scripted seal that must survive and emit a `+%` float |

Auditor probe (not a repo test; `/tmp/req1_probe.mjs` against the same modules): body overlap, head-on stem, enemy cut credit, mutual cut, in-disk silence, constant step, 360° turn, 18s bot opening, claim-then-reset. **PROBE_OK**.

## Browser session

One session. Fresh Chrome profile. WASD only. Spawn → leave disk → close one loop → self-cut → Restart.

| Time | HUD | What the shot shows |
|------|-----|---------------------|
| 0s | 1.0%, Best 0.0%, four rows at 1.0% | `req1_boot.png`. Princess on the start disk. Hint up. |
| ~2.2s | still 1.0% | `req1_trail.png`. Wet stroke outside the disk, turning south. |
| ~5.0s | **3.2%**, hint faded | `req1_claim.png`. Filled loop, float **+2.1%**. You leads at 3.2%. |
| ~12.8s | overlay open | `req1_death.png`. “You crossed your own line.” You 0.0% and dead. Moss 2.5%, Tide 1.7%, Ochre 1.0%. Restart only. |
| after click | 1.0%, Best 3.2%, overlay hidden | `req1_restart.png`. New disk, four living rows, hint back. |

## Not scored as core failures

- **Revive** is absent on purpose (`DECISIONS.md`). The GDD lists it as should-have. This audit’s rule is death → Restart.
- **Bot population** is 3, with three roles. The GDD’s 8–15 figure is an example.
- **Win overlay** was not screenshotted. The seal rule was executed in `smoke_loop.mjs`.
- **Enemy cut and rim slide** were not driven by the keyboard session. Both are in the full smokes, and the enemy cut plus mutual cut are in the probe.
- **Godot** `capture_loop` is still a stub. The web build is the game.
- Kill coins, a settings screen, and a colorblind toggle are outside this core-play list.

## Bugfix

None. No critical FAIL in shipped core systems.
