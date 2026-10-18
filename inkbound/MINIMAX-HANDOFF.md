# MINIMAX-HANDOFF — Inkbound Phase 1 tracks

## Status
`awaiting-minimax`

## Task

Continue **Inkbound** under `/workspace/inkbound` on branch `cursor/inkbound-phase0-prototype-c3dd`.

Phase 0 core loop exists. Implement these **five system tracks** (parallel ownership):

### Track J — Juice
Capture `%` floating text, death VFX (trail dissolve → burst → territory fade), crown on #1.

### Track B — Bot difficulty curve
Fade/remove teaching grace carefully; scale bot aggression with player `%` / match age. Keep early game learnable.

### Track S — Skins + best %
At least 5 cosmetic skins (Inkbound brand colors/patterns). Persist best `%` (localStorage). Skin select on home/restart UI.

### Track M — Stages / meta
Simple stage list + cumulative territory credit toward stage completion. No shop/ads/powers.

### Track G — Godot 4 port scaffold
Create `inkbound/godot/` Godot 4 project skeleton + PORT.md mapping web modules → Godot scenes/scripts. Do not require Godot binary if unavailable; ship valid project files.

### Constraints
- Keep brand **Inkbound** (no Paper.io IP)
- No shop, ads, powers, real multiplayer
- Prefer modular files; avoid rewriting unrelated systems
- Update `docs/` as needed; keep smoke tests green (`node tools/smoke_*.mjs`)

### Done when
Each track has working code or scaffold committed; web game still runs via `python3 -m http.server`.
