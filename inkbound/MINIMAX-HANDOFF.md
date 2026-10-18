# MINIMAX-HANDOFF — Inkbound SYS5 integrate

## Status
`awaiting-cursor`

## Task

SYS5 — System Analyst: integrate SYS2–SYS4, verify, and ship on `cursor/inkbound-final-dev-c3dd`.

1. Wait for SYS2 (world map), SYS3 (flow screens), and SYS4 (gameplay parity) commits, including `docs/SYS_AUDIT_2.md`, `docs/SYS_AUDIT_3.md`, and `docs/SYS_AUDIT_4.md`.
2. Merge or rebase to one clean tip and fix conflicts.
3. Run `node tools/run_acceptance.mjs` plus any new smokes. Fix failures.
4. Browser proof on `http://127.0.0.1:8765/`: title → world map → select region → home → Play → claim → death → Home. The world map must be embedded in the game, not a separate page.
5. Write `docs/SYS_AUDIT_MASTER.md`: does the build fulfill every user requirement (YES/NO table). Exact Paper.io 2 copy is NO, with what is still absent (online multiplayer and the rest). World map status.
6. Update PR #3. The local server must serve the latest tree.

## SYS5 (Cursor)

**Status:** `awaiting-cursor` — polling origin for SYS2–SYS4 (started 2026-10-18).
**Runnable URL:** `http://127.0.0.1:8765/` (cwd `/workspace/inkbound`, `python3 -m http.server 8765 --bind 127.0.0.1`)

## SYS1 — gap closure (Cursor)

**Status:** `done`
**Tip scored:** `31afde0` (game). Handoff commit `9c541e0` does not change `src/`.
**Report:** `docs/SYS_AUDIT_1_GAPS.md`

Must-haves **12/12 MATCHED**. Title holds the sim until Play. Highest gaps: 8-rival crowd and revive (**SYS4**), original zone map (**SYS2**), local shop plus home entries and settings (**SYS3**). **SYS5** integrates and does not build those. Online multiplayer, Paper.io art, copyrighted countries, ads, and IAP are **BLOCKED**.

## Prior task — title gate (done)

Add Paper.io-class home/start screen with Play gate; match must not run until Play.

## Start flow (Cursor)

**Status:** `done`
**Implementation:** `9d14947`
**Runnable URL:** `http://127.0.0.1:8765/` (cwd `/workspace/inkbound`, `python3 -m http.server 8765 --bind 127.0.0.1`)

Cold load paints the title first. `game.state` is `title` until Play, and the frame loop does not tick while the screen is the title, so bots stay still and no wet trail is emitted. Play calls `reset()` and cold-spawns the disk, the three bots, and the HUD. Restart on the death card starts that match again. Home, on the death card and in the match, returns to the title. Figure plates live on the home screen; they do not cover the playfield. The steer line is on the title and in the match, including at 375px. Locked inks stay locked until best % earns them.

Shots: `/opt/cursor/artifacts/home_title.png`, `home_play.png`, `home_claim.png`, `home_death.png`, `home_restart.png`, `home_menu.png`, `home_mobile_title.png`, `home_mobile.png`.

## RULE master (Cursor)

**Status:** `done`
**Verdict:** **No** — must-haves and a full local life are in; the whole GDD is not.
**Runnable URL:** `http://127.0.0.1:8765/`
**Game bytes:** `21cf6b0`

RULE1 match start is **PARTIAL**. RULE2 core rules **MATCH**. RULE3 earn is **PASS**. RULE4 must-haves are **12/12**, and the build is not a Paper.io 2 copy. RULE5 played cold start → 3.8% claim → self-trail death at 4.0% → Restart on that local URL. Report: `docs/RULE_AUDIT_MASTER.md`.

## RULE2 — core rules (Cursor)

**Status:** `done`
**Verdict:** **MATCH**
**Audited game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`
**Report commit:** `ed7d6c908747eff65b3802cefad2b03a6e4554af`

Trail outside own land, loop claim, self-cut, enemy trail kill, non-lethal bodies, non-lethal rim, win at 100%, and death → Restart all **PASS**. No mid-match revive. One Chrome life went 1.0% → trail → 3.8% claim → "Ochre cut your line." → Restart onto a fresh 1.0% disk. Report: `docs/RULE_AUDIT_2_CORE.md`. Shots: `/opt/cursor/artifacts/rule2_*.png`.

## RULE3 — earn characters (Cursor)

**Status:** `done`
**Verdict:** **PASS**
**Audited game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`
**Report commit:** `594ed16b37c7880253aec83012a5e9866cd3cd5b`

Players earn characters by best % of the plane: Seal free, Tideglass 2, Emberline 5, Nightquarry 10, Bone 20. A real 6.8% death opened Tideglass and Emberline; locked chips stayed disabled; Emberline equipped and survived Restart and reload as the dragon. Stored best 19.9 keeps Bone locked; 20 opens Bone and the person plate persists. Shop and currency are **N/A-MVP**, not a gap. Report: `docs/RULE_AUDIT_3_EARN.md`. Shots: `/opt/cursor/artifacts/rule3_*.png`.

## RULE1 — match start (Cursor)

**Status:** `done`
**Verdict:** **PARTIAL** (5 PASS, 2 PARTIAL, 0 FAIL)
**Audited game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`  
**Report commit:** `b77c16d2be84c82ae4cf307c11c476800d254ee1`

First painted frame (animation frame 2) is already the match: vermilion spawn disk, camera on the bead, three named bots, 1.0% and the board, steering live. Arena chrome is partial because a 15-plate catalog strip covers the lower playfield. The FTUE line shows on desktop and is `display: none` at ≤640px. Nothing blocked start, so no gameplay change. Report: `docs/RULE_AUDIT_1_START.md`. Shots: `/opt/cursor/artifacts/rule1_start_*.png`.

## RULE5 — runnable link + full session (Cursor)

**Status:** `done`
**Verdict:** **PASS** — one complete life on a local static server
**Runnable URL:** `http://127.0.0.1:8765/` (cwd `/workspace/inkbound`, `python3 -m http.server 8765 --bind 127.0.0.1`)
**Audited game bytes:** `21cf6b0` (docs-only commits after that do not change `src/`)

Cold start shows the player on the 1.0% disk, the map, bot names on the board, and the HUD. A keyboard loop claims 3.8%. The life ends on "You crossed your own line." at 4.0%. Restart returns a fresh 1.0% disk and keeps Best 4.0% and Quiet Plane at 8%. This is a local URL, not a public host. Report: `docs/RULE_AUDIT_5_RUN.md`.

## RULE4 — requirements gaps (Cursor)

**Status:** `done`
**Verdict:** **12/12 MATCHED (100%)** of GDD §16 Must-have MVP. Unmatched must-haves: none.
**Exact copy of Paper.io 2:** **No.** Online play, real players, shop, revive, ads, powers, a home screen, and a 8–15 opponent crowd are not in this build.
**Audited tree:** `b8faf77` (smokes re-run; game bytes unchanged since `21cf6b0`)

Report: `docs/RULE_AUDIT_4_GAPS.md`. Graphics claim stays catalog-only, better-or-equal to a flat paper.io-style web clone, not to official Paper.io 2 art.

## REQ3 — meta (Cursor)

**Status:** `done`
**Verdict:** **PASS**
**Audited runtime:** `4e2c89657840dc0267f877d10b603a49d2cae0cc`

Best %, five skins (unlock by best, equip, locked stay locked), stage credit, FTUE, and `inkbound.profile.v1` all hold across Restart and a full reload. Shop, real multiplayer, and revive are **N/A-MVP**. One HUD fix: Restart was clearing the saved claim-hint fade. Report: `docs/ACCEPTANCE_REQ3_META.md`.

## REQ5 — deploy (Cursor)

**Status:** `done`
**Verdict:** **GO** for web deploy
**Audited runtime:** `efbf5f5ff88c9d99a6ac88e5686dbbd6ae97a810`

`node tools/run_acceptance.mjs` runs all six smokes and exits non-zero on failure. Notes: `docs/DEPLOY.md`. Report: `docs/ACCEPTANCE_REQ5_DEPLOY.md`. Godot stays a stub and does not block the static host.

## REQ1 — core play (Cursor)

**Status:** `done`
**Verdict:** **FULL**
**Audited runtime:** `efbf5f5ff88c9d99a6ac88e5686dbbd6ae97a810`

Core loop meets the locked Paper.io-class rules (360° steer, constant move, non-lethal rim, trail outside own ink, loop claim, self-cut, enemy cut, non-lethal bodies, bot roles and opening curve, 100% seal, death → Restart, first-claim forgiveness). Report: `docs/ACCEPTANCE_REQ1_CORE.md`. No gameplay bugfix.

## REQ2 — graphics (Cursor)

**Status:** `done`
**Verdict:** **PASS**
**Binding completeness:** 100% (58/58). Missing: none.
**Audited runtime:** `41f27cc5f914026a1011ecf0b5fff5d420e7ad15`

Every catalog bitmap is bound and drawn from the Image repo mirror. No binding fix. Report: `docs/ACCEPTANCE_REQ2_GRAPHICS.md`.

## REQ4 — full playtests (Cursor)

**Status:** `done`
**Verdict:** **PASS**
**Audited runtime:** `5d86bb430bcd8c3bc2e4b70eabf17c5c91076b6f`

Five complete Chrome sessions from a server rooted at `/workspace/inkbound`: gentle first claim, multi-loop, self-trail death, Emberline equip with reload persistence, and a 375px touch session. Each one seals, dies, shows Best and Stage, and Restarts onto a fresh 1.0% disk. Phone overlay stacking was fixed so the death title and Restart sit above the live HUD. Report: `docs/ACCEPTANCE_REQ4_PLAYTESTS.md`.
