# Inkbound Phase 0 — Architecture

## Runtime

`index.html` → `src/main.js` → `Game` loop (fixed sim step + render interpolate).

## Modules (ownership)

| Module | Owner agent | Responsibility |
|--------|-------------|----------------|
| `src/config.js` | Sim | Tunables only |
| `src/sim/Arena.js` | Sim | Circle bounds, rim slide |
| `src/sim/TerritoryGrid.js` | Sim | Ownership grid, fill %, start disk |
| `src/sim/Trail.js` | Sim | Open polyline + width queries |
| `src/sim/Capture.js` | Sim | Loop close → flood fill |
| `src/sim/Entity.js` | Sim | Avatar state (pos, heading, color, id) |
| `src/sim/Movement.js` | Sim | Always-move + 360 steer + rim |
| `src/sim/Combat.js` | Combat | Trail cuts, self-cut, death flags |
| `src/sim/Bots.js` | AI/HUD | 3 bot brains |
| `src/sim/Game.js` | Combat | Match state machine, tick order |
| `src/input/Input.js` | AI/HUD | Pointer / WASD heading |
| `src/render/Renderer.js` | AI/HUD | Canvas draw |
| `src/render/Hud.js` | AI/HUD | % / leaderboard / restart overlay |
| `src/main.js` | AI/HUD | Boot + rAF |

## Authoritative tick order (LOCKED)

1. Read input → update player heading  
2. Update bot headings  
3. Move all living entities (rim slide)  
4. Emit trail samples if outside own territory  
5. Resolve combat (self-cut, enemy trail cuts) — mark deaths  
6. Resolve captures for survivors who re-entered own fill  
7. Apply deaths (clear trail + territory)  
8. Maintain bot count (respawn in unowned cells only)  
9. Check win (player ≥ 100% owned) — Phase 0 shows banner + restart  

## Territory

- Grid covering axis-aligned bbox of circle; cells outside circle ignored.  
- Capture = flood-fill enclosed region of trail polygon clipped to arena.  
- Own trail collision: exclude the last `selfGracePoints * trailSampleSpacing` units of arc length behind the head (not a raw sample count); body motion is swept per tick.
- Enemy cut: attacker body radius + half trail width, swept; the owner's newest `enemyHeadGracePoints * trailSampleSpacing` arc is exempt. Cuts are simultaneous and beat a same-tick capture.
- A living entity left with zero owned cells after a capture is swallowed (dies, trail + ink cleared).

## Coordinate space

World units; arena radius `R` at origin. Renderer maps world→screen with camera follow.
