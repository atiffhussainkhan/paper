# Inkbound Phase 0 — Playtest log

**Date:** 2026-10-17  
**URL:** http://127.0.0.1:8765/  
**Branch:** `cursor/inkbound-phase0-prototype-c3dd`

## Agents

| ID | Role | Model | Outcome |
|----|------|-------|---------|
| SYS1 | Architect / brand | Claude Opus 4.5 | Docs, HTML, CSS, acceptance |
| SYS2 | Lead gameplay eng | GPT-5.6 | Playable prototype |
| SYS3 | Combat systems | Claude Sonnet 4.5 | Swept cuts, death ordering |
| SYS4 | AI + presentation | Gemini 4 Argon | Bot roles, renderer, HUD |
| SYS5 | QA playtest | Computer use | Conditional fail → retune |

## SYS5 findings (pre-tune)

- Boot / HUD / restart: pass  
- Death messages: pass  
- **Blocker:** Ochre aggression made player loop capture untestable (death in 1–3s)  
- Screenshots: `/opt/cursor/artifacts/inkbound_boot.webp`, `inkbound_death.webp`, `inkbound_gameplay_midclaim.webp`

## Retune applied after SYS5

- `playerSpeed` 170 → 200  
- `botSpeed` 145 → 125  
- `startTerritoryRadius` 93 → 120  
- `botInitialSpawnRadius` 920  
- `botCutterRange` 265 → 200  
- `botHuntGraceSeconds` 20 (bots cannot cut player during window)  
- `selfGracePoints` 22 + `selfCollisionRadiusScale` 0.45  
- `cameraViewHeight` 820 → 1000  
- `arena.game` wired in `Game.reset()`  

## Automated verification

```bash
cd inkbound && node tools/smoke_combat.mjs && node tools/smoke_loop.mjs
```

Both pass on this branch: hunt grace, post-grace cuts, no false straight self-kill, and a scripted claim loop grows territory (~1.0% → ~2.8%).

Manual computer-use playtest still struggled with sharp pointer U-turns (self-cuts). Prefer gradual mouse arcs; steer rate was softened after that feedback.

## Next QA

Re-run `docs/PHASE0_ACCEPTANCE.md` in a hard-refreshed browser; complete one gentle claim loop and rim slide.
