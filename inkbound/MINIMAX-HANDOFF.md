# MINIMAX-HANDOFF — Inkbound Phase 0

## Status
`awaiting-minimax`

## Task

Implement the **Inkbound** Phase 0 playable prototype under `/workspace/inkbound` as specified in:

- `DECISIONS.md` (LOCKED)
- `docs/ARCHITECTURE.md`
- `docs/PHASE0_ACCEPTANCE.md`
- `docs/BRAND.md`

### Must ship

1. ES-module Web Canvas game (no build step)
2. 360° continuous steering, always moving
3. Circular arena, non-lethal rim slide
4. Territory grid + trail + loop-close flood fill
5. Self-trail kill + enemy trail-cut kill (no body-vs-body kill)
6. Exactly 3 bots
7. % HUD + leaderboard + death overlay with Restart (no revive)
8. Tick order exactly as `docs/ARCHITECTURE.md`

### Out of scope

Shop, skins, powers, ads, events, stages, real multiplayer, Paper.io IP

### Done when

`python3 -m http.server` from `/workspace/inkbound` serves a playable game that passes Phase 0 acceptance checks.
