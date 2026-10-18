# MINIMAX-HANDOFF — Inkbound REQ3 meta / economy / progression

## Status
`awaiting-cursor`

## Task

On branch `cursor/inkbound-final-dev-c3dd` under `/workspace/inkbound`, accept meta against `TerritoryIO_Professional_Requirements_GDD.md` (read with the locked Inkbound decisions).

Score **PASS / PARTIAL / FAIL** for:

1. **Best %** — live HUD and run summary; new best sticks.
2. **Skins** — at least five; unlock by best %; equip an unlocked skin; locked skins stay locked.
3. **Stages** — cumulative credit from the run, clear into the next zone, stage HUD readable.
4. **FTUE** — one soft claim hint, dismissed after the first claim, and it stays dismissed.
5. **Persistence** — `localStorage` key `inkbound.profile.v1` keeps best, equipped skin, unlocks, stage credit, and the FTUE flag across an in-game Restart and a full page reload.

Shop, real multiplayer, and revive are **N/A-MVP** when the GDD places them after Must-have MVP. Do not score those FAIL.

### Gates
- `node tools/smoke_meta.mjs` (complete run)
- `node tools/smoke_hud.mjs` (complete run)
- Browser, served from `/workspace/inkbound`: unlock path or a simulated profile, equip, restart shows Best + skin, stage HUD readable. Shots in `/opt/cursor/artifacts/req3_*.png`.

### Bugfix
Only if persistence or the HUD is broken. No new meta systems.

### Done when
`docs/ACCEPTANCE_REQ3_META.md` records the matrix, the tip SHA, and the verdict.

### Constraints
- Brand **Inkbound**; no Paper.io IP
- **Godot:** do not fill gameplay stubs

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
