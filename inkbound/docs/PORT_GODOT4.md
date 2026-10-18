# Inkbound — Godot 4 port map

**Status:** scaffold. The playable sim is the web prototype under `src/`. This
document maps those modules onto the Godot 4 project in `godot/`. Filling a stub
means porting the named web file, not inventing a second ruleset.

Godot is optional in CI. Nothing in the web smoke tests imports `godot/`. See
[`godot/README.md`](../godot/README.md).

## Decisions carried over

From `DECISIONS.md` and `docs/ARCHITECTURE.md`:

- Sim is authoritative. Render and HUD only read it.
- Fixed step is `simHz` (60). The clock is an accumulator in `scripts/main.gd`, the same shape as `src/main.js`. Do not move the sim onto `_physics_process`: editor physics FPS would then desync from `InkConfig.SIM_HZ`.
- World origin is the arena center. **Y grows downward**, same as the canvas (`Renderer.worldToScreen` does not flip Y). Godot 2D already uses Y-down, so positions copy across as `Vector2`. Do not switch the sim to 3D Y-up.
- Arena radius `R` from config. Cells outside the circle are owner `-1` and are ignored by share and capture.
- Walls slide. They never kill.
- Three bots, no networking, no shop, no powers.
- Brand hex values live in `docs/BRAND.md`. `InkConfig.color(token)` is the stand-in for `readBrandTokens()`, because there is no stylesheet in Godot.

`scripts/config.gd` is a **snapshot** of `src/config.js`. The web file wins until this port is the build you ship. Re-copy tunables before implementing combat, capture, or bot headings. Bot policy in particular should be read from `src/sim/Bots.js` at fill-in time.

## Scene tree

```text
Main (Node)                          scripts/main.gd
├── SteerInput (Node)                scripts/input/steer_input.gd
├── Match (Node2D)                   scenes/match.tscn
│   ├── Camera2D                     zoom = viewportHeight / cameraViewHeight
│   └── Plane (Node2D)               scripts/render/plane_renderer.gd
└── Hud (CanvasLayer)                scripts/render/match_hud.gd
    └── Root (Control)
        ├── percent, "of the plane", leaderboard, hint
        └── death/win card + Restart
```

Sim objects are `RefCounted` values owned by `InkGame`, not nodes. A bead does not get a `Node2D` per entity in this scaffold: the plane script draws from the entity array, the way the canvas renderer walks `game.entities`. Promoting an entity to a node later must not move rules into `_process`.

Territory stays a flat `PackedInt32Array` (`InkTerritoryGrid`). Do not put ownership in a `TileMap`. Flood fill wants the same index math as `src/sim/TerritoryGrid.js`. When territory drawing is ported, blit an `ImageTexture` on `grid.version`, matching the web offscreen canvas. Do not `draw_rect` every cell every frame.

Camera follow stays a manual exponential blend (`cameraFollow`, `cameraLookAheadFollow`). Leave `Camera2D.position_smoothing_enabled` off so Godot's smoother does not fight those numbers.

## Tick order

`InkGame.tick` is the locked order. Step numbers match `docs/ARCHITECTURE.md`.

| Step | What | Web | Godot |
|------|------|-----|--------|
| — | Fixed step + alpha | `src/main.js` `frame` | `scripts/main.gd` `_process` |
| 1 | Read input, set player `desired_heading` | `Input.headingFor` | `InkSteerInput.heading_for` |
| 2 | Bot headings | `updateBotHeadings` | `InkBots.update_headings` |
| 3 | Move living entities, rim slide | `moveEntity` | `InkMovement.move_entity` |
| 4 | Trail samples outside own fill; flag re-entry | `Game.tick` loop + `Trail` | same loop in `InkGame.tick` + `InkTrail` |
| 5 | Cuts mark deaths only | `resolveCombat` | `InkCombat.resolve` |
| 6 | Captures, then swallows | `captureLoop` | `InkCapture.capture_loop` |
| 7 | Clear trail + territory for deaths | `Game.tick` | `InkGame.tick` |
| 8 | Respawn bots on unowned ground | `spawnBot` | `InkGame.spawn_bot` |
| 9 | Win at `winShare` | `grid.share >= winShare` | `InkTerritoryGrid.share` |

Death copy and the win line stay the web strings: "You crossed your own line.", "Tide cut your line.", "The plane is yours."

## Module map

### config — `src/config.js`

| | |
|--|--|
| Godot | `InkConfig` in `scripts/config.gd` (no node) |
| Role | Tunables + `ENTITY_SPECS` + brand hex |
| Notes | `color("--ink-player")` replaces `readBrandTokens`. Specs use the same ids: You 1, Tide 2, Ochre 3, Moss 4. |

### Arena — `src/sim/Arena.js`

| | |
|--|--|
| Godot | `InkArena` in `scripts/sim/arena.gd` (no node; owned by `InkGame`) |
| Ported | `contains`, `clamp_point`, `random_point` |
| TODO | `slide` — non-lethal rim, stable tangent on a head-on hit, preserve `rim_sign` |
| Notes | Return dictionary keys: `position`, `velocity`, `hit_rim`, `rim_sign`. |

### TerritoryGrid — `src/sim/TerritoryGrid.js`

| | |
|--|--|
| Godot | `InkTerritoryGrid` in `scripts/sim/territory_grid.gd` |
| Ported | Grid alloc, inside/outside mask, `index_of`, `world_to_cell`, `set_disk`, `clear_owner`, `share`, `is_disk_unowned` |
| Notes | Web `Int16Array` is `PackedInt32Array` here (ids are tiny). `world_to_cell` returns `{}` instead of `null`. `share` divides by inside-circle cells only. `version` increments when the mask changes so a future texture blit can cache. |

### Trail — `src/sim/Trail.js`

| | |
|--|--|
| Godot | `InkTrail` in `scripts/sim/trail.gd` (owned by `InkEntity`, not a node) |
| Ported | `begin`, `add`, `clear`, `is_active` (web getter `active`) |
| TODO | `older_segment_count` (arc length, not sample count; clamp head gap to one spacing), `collides_segment` / `segmentDistanceSquared` |
| Notes | Points are `Vector2`, not `{x, y}`. `collides_point` stays false until the swept test exists, so bot respawn does not yet reject wet strokes. |

### Capture — `src/sim/Capture.js`

| | |
|--|--|
| Godot | `InkCapture.capture_loop` in `scripts/sim/capture.gd` (static, no node) |
| TODO | Whole flood fill |
| Notes | Barrier = owned cells + rasterized stroke. Largest component is exterior; smaller components inside the arena are claimed. Return cells changed, or 0 if the trail is inactive. Swallow is **not** decided here; `InkGame` step 6 does it after every capture, so entity order cannot change who dies. |

### Combat — `src/sim/Combat.js`

| | |
|--|--|
| Godot | `InkCombat.resolve` in `scripts/sim/combat.gd` (static, no node) |
| TODO | Whole resolver. The stub marks nobody dead. |
| Notes | Decision pass only: no trail clears, no grid writes. Simultaneous cuts. Bodies do not kill bodies. Self radius uses `self_collision_radius_scale`. Enemy grace is the newest `enemy_head_grace_points * trail_sample_spacing` of arc. A cut on the same tick beats capture because step 5 runs first. While `match_age < bot_hunt_grace_seconds`, bots cannot cut the player; self-cuts and player cuts still resolve. |

### Bots — `src/sim/Bots.js`

| | |
|--|--|
| Godot | `InkBots` in `scripts/sim/bots.gd` (static, no node) |
| Ported | `attach_brain` stores `{role, out_time}` on the entity |
| TODO | `update_headings` — port `updateBotHeadings` from the web file at fill-in time |
| Notes | Roles: Tide `edge-farmer`, Ochre `small-looper`, Moss `opportunistic-cutter`. Headings only. Movement and cuts stay in steps 3 and 5. Teaching grace is a combat rule, not a bot-script side effect. |

### Game — `src/sim/Game.js`

| | |
|--|--|
| Godot | `InkGame` in `scripts/sim/game.gd` (RefCounted, created by `main.gd`) |
| Ported | `reset`, spawn placement, `tick` call order, death apply, win check, swallow bookkeeping |
| TODO | Steps 3, 5, and 6 do nothing useful until movement, combat, and capture are filled. `Trail.collides_point` must land before respawn clearance is real. |
| Notes | `state` is `"playing"` or `"over"`. `outcome` is `{type, title}`. `death_share < 0` means "not snapshotted yet" (web used `null`). Initial bot angles match the web reset: `-0.72π`, `-0.05π`, `0.62π` at `bot_initial_spawn_radius`. |

### Input — `src/input/Input.js`

| | |
|--|--|
| Godot | `InkSteerInput` on node `Main/SteerInput`, `scripts/input/steer_input.gd` |
| Ported | Key and pointer capture (`_unhandled_input`), `reset`, `set_steering_origin` |
| TODO | `heading_for` — still returns `null`, so desired heading does not change |
| Notes | Web blend to preserve: WASD/arrows as a bias, pointer `atan2` past an 8px deadzone, touch-drag fallback, weights 0.42 pointer + 0.88 keys, 160ms pointer freshness, one-tick latch. Ignore steering while the restart card is up (`isOverlayInteractive`). Screen origin comes from the renderer each frame, same as `setSteeringOrigin(playerScreen)`. Raw keycodes stand in for a future InputMap (`steer_up/down/left/right`). `physical_keycode` matches the web `event.code`. |

### Renderer — `src/render/Renderer.js`

| | |
|--|--|
| Godot | `InkPlaneRenderer` on `Match/Plane`, `scripts/render/plane_renderer.gd` |
| Ported | Arena disc + rim, bead at `entity.position`, wet polyline if the trail has two points, camera zoom and the initial look-ahead placement |
| TODO | Territory texture, hairline grid (`plane_grid_spacing`), camera exp-follow, draw interpolation by alpha, cut flash, death presentation |
| Notes | `present(alpha, frame_time)` is the web `render(game, alpha, frameTime)` hook. `player_screen_position` is the viewport center until `worldToScreen` exists. Brand tokens go through `InkConfig.color`. |

### Hud — `src/render/Hud.js`

| | |
|--|--|
| Godot | `InkMatchHud` on `scenes/hud.tscn`, `scripts/render/match_hud.gd` |
| Ported | Percent (`0.0%`), "of the plane", name + percent rows, hint, overlay title, "N% of the plane.", Restart signal |
| TODO | Hint fade after the player ventures out, row sort, dead-row styling, focus ring, brand fonts (Instrument Serif / IBM Plex). Default font is fine for the scaffold. |
| Notes | `restart_requested` is the web `onRestart` callback. `main.gd` connects it to `restart()`. The dimmer swallows pointer events only while the match is over. |

## Supporting modules

These are not in the short list above and the tick does not run without them.

| Web | Godot | Node? |
|-----|--------|-------|
| `src/sim/Entity.js` | `InkEntity` `scripts/sim/entity.gd` | No. `ink_name` is the web `name`. |
| `src/sim/Movement.js` | `InkMovement` `scripts/sim/movement.gd` | No. `turn_toward` is ported. `move_entity` is a stub until `slide` is real. |
| `src/main.js` | `scripts/main.gd` on `scenes/main.tscn` | Yes. Accumulator, max steps, restart. |

`src/render/Renderer.js` `BRAND_TOKENS` are the keys of `InkConfig.INK_HEX`.

## What this scaffold already runs

If the project is opened in Godot: start disks are stamped, four entities exist, the HUD shows each ink's grid share, and `tick` walks all nine steps. Motion, cuts, and fills do not happen, because `move_entity`, `InkCombat.resolve`, `capture_loop`, and `heading_for` are stubs.

## Fill-in order

1. `Arena.slide`, then `InkMovement.move_entity`.
2. `InkSteerInput.heading_for`.
3. `Trail.older_segment_count` and `collides_segment`.
4. `InkCombat.resolve`.
5. `InkCapture.capture_loop`.
6. `InkBots.update_headings` from the current `src/sim/Bots.js`.
7. Plane: territory texture, camera blend, alpha interpolation.
8. HUD polish only after the sim matches the web smoke tests in behavior.

Keep `src/` as the reference while doing that. Do not fork rules in the Godot files to "make the scaffold playable."
