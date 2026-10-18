# Inkbound — Godot 4 scaffold

This folder is a **Godot 4.3+** project skeleton for a later mobile port. It is not the
playable build. The playable game is still the web prototype in the parent
directory (`python3 -m http.server` from `inkbound/`).

**Do not fill stubs yet.** Wait until the web loop feels good (easy first claim +
readable Best/Stage HUD). See the gate note in [`../docs/PORT_GODOT4.md`](../docs/PORT_GODOT4.md).

The module map is [`../docs/PORT_GODOT4.md`](../docs/PORT_GODOT4.md). Simulation tick
order is the locked list in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Open it

Godot **4.3 or newer**, GL Compatibility. Import this folder (`inkbound/godot/`), not
the repository root. The main scene is `scenes/main.tscn`.

What you should see: a dark circular plane, the player bead near the center, and a HUD
reading a small percent of the plane. Steering, rim slide, trail cuts, and loop fill
are not ported yet, so the bead does not travel and the match does not end.

## CI

Do **not** require a Godot binary. `project.godot`, the `.tscn` files, and the
`.gd` scripts are the project. The editor writes `.godot/` on import; that directory
is gitignored. Web smoke tests (`node tools/smoke_*.mjs`) do not load this folder.

If a machine has the editor and you want a local parse check:

```bash
godot --headless --path inkbound/godot --import --quit
```

A missing `godot` binary is a skipped check, not a failure.

## Layout

```text
godot/
├── project.godot
├── icon.svg
├── README.md
├── scenes/
│   ├── main.tscn          Boot node, fixed timestep
│   ├── match.tscn         Plane + camera
│   └── hud.tscn           Percent, leaderboard, restart card
└── scripts/
    ├── main.gd
    ├── config.gd          Snapshot of src/config.js + brand hex
    ├── input/steer_input.gd
    ├── sim/               Arena, grid, trail, capture, combat, bots, game
    └── render/            Plane draw + HUD
```
