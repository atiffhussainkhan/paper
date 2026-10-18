# MINIMAX-HANDOFF — Inkbound RULE1 match start

## Status
`done`

## Task

On branch `cursor/inkbound-final-dev-c3dd` under `/workspace/inkbound`, compare the **first painted frame** and match start to Paper.io-class rules and `TerritoryIO_Professional_Requirements_GDD.md` (read with the locked Inkbound decisions in `DECISIONS.md`).

Score **PASS / PARTIAL / FAIL** for:

1. **Player spawn disk** — the player is on a small disk of their own ink on the map at match start.
2. **Camera follow** — the view follows the player with look-ahead and a limited field of view.
3. **Arena / map presentation** — a circular play surface reads as the arena (plate, ink, rim), not a blank or full-map diagram.
4. **Bots present at start** — the locked roster is already in the match, each on its own ink, named on the board.
5. **HUD (% / names)** — own share and the named rows are visible on the first frame.
6. **Controls ready** — steering is live with no play-button or tutorial wall.
7. **FTUE hint** — one soft claim line on a fresh profile, first run only.

### Gates
- Serve `/workspace/inkbound` and cold-load Chrome (fresh `localStorage`).
- Shots in `/opt/cursor/artifacts/rule1_start_*.png`.

### Bugfix
Only if a clear bug blocks match start. No new features.

### Done when
`docs/RULE_AUDIT_1_START.md` records the matrix, evidence, the tip SHA, and the verdict.

### Constraints
- Brand **Inkbound**; no Paper.io IP
- **Godot:** do not fill gameplay stubs

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
