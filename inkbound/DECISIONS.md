# Inkbound — Locked Product Decisions (Phase 0)

**Status:** LOCKED — 2026-10-17  
**Rule:** Do not reopen these without a written change request.

| # | Decision | Lock |
|---|----------|------|
| 1 | **Engine** | **Web Canvas (ES modules)** for Phase 0 prototype. Portable sim layer → Godot 4 for mobile later. Unity not used. |
| 2 | **Steering** | **360° continuous** heading from pointer / stick / WASD bias. Always moving. |
| 3 | **Arena** | **Circular.** Walls **non-lethal** (slide along rim). |
| 4 | **Opponents** | **Bots only** (3 in Phase 0). No real multiplayer. |
| 5 | **Revive** | **Skipped in Phase 0.** Death → brief summary → click/tap Restart. (Stage % credit deferred to Phase 2.) |
| 6 | **Brand** | **Inkbound** — original IP. Never use Paper.io names, logos, or skins. |

## Phase 0 scope (in)

- Always-move avatar
- Own territory + vulnerable trail
- Loop close → flood fill claim
- Self-trail kill + enemy trail cut kill
- 3 dumb bots
- % HUD + leaderboard + restart

## Phase 0 scope (out)

- Shop, skins, powers, ads, events, stages, real PvP

## Tunables (initial)

See `src/config.js`. Change only via playtest notes.
