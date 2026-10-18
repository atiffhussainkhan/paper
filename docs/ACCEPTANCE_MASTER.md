# Inkbound — Master acceptance (REQ1–REQ5)

**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd` → `main`  
**Integration tip:** see git tip after this commit (all five REQ reports are on this branch)

Five parallel acceptance agents audited core play, graphics, meta, full playtests, and deploy readiness. This file is the rollup. Detail lives in the linked REQ reports.

## Executive verdict

| Track | Verdict | Report tip | Detail doc |
|-------|---------|------------|------------|
| REQ1 Core gameplay | **FULL** (all matrix rows PASS) | `cc247af` | [ACCEPTANCE_REQ1_CORE.md](ACCEPTANCE_REQ1_CORE.md) |
| REQ2 Graphics & presentation | **PASS** (58/58 catalog bindings) | `cb665bc` | [ACCEPTANCE_REQ2_GRAPHICS.md](ACCEPTANCE_REQ2_GRAPHICS.md) |
| REQ3 Meta / economy / progression | **PASS** (+ FTUE restart fix) | `521d239` | [ACCEPTANCE_REQ3_META.md](ACCEPTANCE_REQ3_META.md) |
| REQ4 Full playtests | **PASS** (5/5 complete sessions) | `5defb6b` | [ACCEPTANCE_REQ4_PLAYTESTS.md](ACCEPTANCE_REQ4_PLAYTESTS.md) |
| REQ5 Deploy / ship-readiness | **GO** | `41f27cc` | [ACCEPTANCE_REQ5_DEPLOY.md](ACCEPTANCE_REQ5_DEPLOY.md) |

**Release call:** **GO** — ship the static web tree under `inkbound/` per [DEPLOY.md](DEPLOY.md).

## REQ1 — Core gameplay (FULL)

Audited runtime at report tip: `efbf5f5`. Verdict **FULL**: Paper.io-class loop complete (360° steer, constant move, rim slide, trail-only-outside-ink, loop capture, self/enemy cut rules, three named bots with difficulty curve, opening fairness, death → Restart, sealed-plane win in smoke).

- All requirement IDs in the matrix: **PASS** (MOVE, TERR, KILL, AI, WIN, FLOW, FEEL).
- Smokes: `smoke_combat.mjs`, `smoke_loop.mjs`, `smoke_vfx.mjs` — all exit 0.
- Browser: boot → trail → claim (+2.1%) → self-cut death → Restart with Best preserved.
- **Bugfix on track:** none (no core FAIL).

## REQ2 — Graphics (PASS 58/58)

Audited runtime at report tip: `41f27cc`. **Binding completeness 100% (58/58).** Every match bitmap is in `assets/catalog/`, indexed, hash-checked, and bound; no AI-generator metadata; standing catalog figures for player, bots, and skins; six distinct stage plates.

- Smoke: `smoke_images.mjs` — exit 0.
- **Bugfix on track:** none (no binding or renderer edits).

## REQ3 — Meta (PASS)

Audited runtime at report tip: `4e2c896` (fix landed before report at `521d239`). Best %, skin unlock/equip, stage credit, FTUE hint, and `localStorage` profile survive Restart and full reload.

- Smokes: `smoke_meta.mjs`, `smoke_hud.mjs` — exit 0.
- **Bugfix:** `Hud.reset()` now reapplies `ftueClaimDone` so the claim hint stays dismissed after in-game Restart (reload already honored the flag).
- **N/A-MVP (not fails):** shop, real multiplayer, revive.

## REQ4 — Playtests (PASS 5/5)

Audited runtime at report tip: `5d86bb4` (report recorded at `5defb6b`). Five complete sessions: cold load, steer, ≥1 seal, death card, Best/Stage read, Restart, fresh 1.0% disk. Run 4: Emberline equip + reload persistence. Run 5: phone 375×812 touch session.

- **Bugfix:** mobile death overlay stacking — `.hud-overlay` z-index 6, safe centering, scroll when tall (`css/style.css?v=mobile-overlay`) so title and Restart are visible and hittable on phone.
- No run sealed the whole plane in these sessions (death-ended lives are still complete sessions; `winShare` = 1 verified in REQ1 smoke).

## REQ5 — Deploy (GO)

Audited runtime at report tip: `efbf5f5` (report at `41f27cc`). Static hosting, ES modules over HTTP, subdirectory-safe asset URLs, 58-image preload, config tables, secrets scan, [DEPLOY.md](DEPLOY.md), `.nojekyll`, Godot non-blocking stubs.

- **Single gate:** `node tools/run_acceptance.mjs` from `inkbound/` — must exit 0 (**PASS 6/6** smokes).
- Requires [FINAL_ACCEPTANCE.md](FINAL_ACCEPTANCE.md) present (rollup gate).

## Automated gate (integration)

From `/workspace/inkbound` on the branch tip that includes all REQ reports:

```bash
node tools/run_acceptance.mjs
```

Expected last line: `ACCEPTANCE: PASS 6/6`

| Smoke | Locks |
|-------|--------|
| `smoke_combat.mjs` | Opening safety, cuts, first-claim forgiveness |
| `smoke_loop.mjs` | Claim, steal, rim slide, sealed-plane win |
| `smoke_hud.mjs` | Best / Stage HUD, FTUE hooks |
| `smoke_vfx.mjs` | Capture float, death juice, crown, kill feedback |
| `smoke_meta.mjs` | Skins, best %, stages, profile |
| `smoke_images.mjs` | 58 images, hashes, bindings |

## Out of scope for this MVP (documented, not blocking)

Revive, shop, powers, settings UI, real multiplayer, Godot playable port, win overlay in every browser session (smoke covers sealed-plane win), five-minute soak / tab-switch soak.

## Evidence locations

- REQ1–REQ5 browser and audit shots: `/opt/cursor/artifacts/req{1..5}_*.png` (per REQ reports).
- Prior full QA: [FINAL_ACCEPTANCE.md](FINAL_ACCEPTANCE.md) and `/opt/cursor/artifacts/inkbound_final_*.png`.

## How to publish

1. Check out the integration tip on `cursor/inkbound-final-dev-c3dd`.
2. Run `node tools/run_acceptance.mjs` in `inkbound/`.
3. Publish the **`inkbound/`** directory as the site root (not the repo root). See [DEPLOY.md](DEPLOY.md).
