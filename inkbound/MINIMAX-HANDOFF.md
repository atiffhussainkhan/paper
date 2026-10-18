# MINIMAX-HANDOFF — Inkbound Phase 1.5 feel / HUD / fairness

## Status
`awaiting-cursor`

## Task

On branch `cursor/inkbound-phase0-prototype-c3dd` under `/workspace/inkbound`, five system tracks:

1. **SYS-A Feel / first claim** — softer steer, wider self grace, early-match `playerSelfForgiveness*` so a gentle first loop succeeds. Smokes green.
2. **SYS-B HUD readability** — Best % + Stage (Quiet Plane + bar) clearly visible in first viewport (score panel contrast).
3. **SYS-C Claim juice** — capture `+%` float obvious on first successful claim (Vfx polish only).
4. **SYS-D Bot opening fairness** — longer teaching window / ramp so bots don't ruin first claims without hard-breaking late difficulty.
5. **SYS-E Verify + ship** — all smokes; serve from `/workspace/inkbound` (not `/tmp/headtree`); commit + push.

### Constraints
- Brand **Inkbound**; no Paper.io IP
- No shop, ads, powers, real multiplayer
- **Godot:** do not fill gameplay stubs; port docs/scaffold polish only

### Done when
Smokes pass; early loop is more forgiving; Best/Stage read at a glance; claim float is obvious; bot opening stays fair.
