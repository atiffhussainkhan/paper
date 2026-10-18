# Graphics picked

Every bitmap below is a file already in `inkbound/assets/catalog/`, indexed by `inkbound/assets/IMAGE_INDEX.json`, and copied from [atiffhussainkhan/Image](https://github.com/atiffhussainkhan/Image). No image in this list was generated.

Character plates are CC0 figure idles: Knight / Princess / Dragon from `opengameart-knight-princess-dragon-2` (`mega-assets-v1`) and Kenney Toon Characters idle poses from `shorepine-kenney` (`mega-assets-expansion-v1`). Sphere beads are the Kenney 1024+ planet plates. Stage, terrain, UI, and VFX plates stay on the same Kenney release.

Catalog total: **58** (background 7, character 15, skin 8, ui 7, vfx 7, terrain 14).

## Characters

| id | path | role | where it shows |
|---|---|---|---|
| `char-plate-dragon` | `assets/catalog/character/char-plate-dragon.png` | Emberline figure — Dragon idle plate | Emberline skin figure: skin picker and cast strip; arena when Emberline is equipped |
| `char-plate-knight` | `assets/catalog/character/char-plate-knight.png` | Tide figure — Knight idle plate (Tideglass skin and Tide bot) | Tide bot figure and Tideglass skin: arena, leaderboard swatch, skin picker, cast strip |
| `char-plate-princess` | `assets/catalog/character/char-plate-princess.png` | Player figure — Princess idle plate (Seal / You) | Player figure (Seal / You) in the arena, leaderboard swatch, skin picker bead, cast strip |
| `char-toon-female-adventurer` | `assets/catalog/character/char-toon-female-adventurer.png` | Ochre figure — female adventurer idle plate | Ochre bot figure: arena, leaderboard swatch, cast strip |
| `char-toon-female-person` | `assets/catalog/character/char-toon-female-person.png` | Roster figure — female person idle plate | Roster plate (Walker): cast strip |
| `char-toon-male-adventurer` | `assets/catalog/character/char-toon-male-adventurer.png` | Roster figure — male adventurer idle plate | Roster plate (Ranger): cast strip |
| `char-toon-male-person` | `assets/catalog/character/char-toon-male-person.png` | Bone figure — male person idle plate | Bone skin figure: skin picker and cast strip; arena when Bone is equipped |
| `char-toon-robot` | `assets/catalog/character/char-toon-robot.png` | Nightquarry figure — robot idle plate | Nightquarry skin figure: skin picker and cast strip; arena when Nightquarry is equipped |
| `char-toon-zombie` | `assets/catalog/character/char-toon-zombie.png` | Moss figure — zombie idle plate | Moss bot figure: arena, leaderboard swatch, cast strip |
| `char-bead-blue` | `assets/catalog/character/char-bead-blue.png` | Bot ink bead — 1024 shaded sphere | Tide orb under the Tide bot and Tideglass picker; cast strip |
| `char-bead-blue-alt` | `assets/catalog/character/char-bead-blue-alt.png` | Alternate bot bead — 1280 marble sphere | Quarry orb under Ochre and on the Nightquarry picker; cast strip |
| `char-bead-red` | `assets/catalog/character/char-bead-red.png` | Player ink bead — 1024 shaded sphere | Seal orb under the player figure; skin picker orb; cast strip |
| `char-bead-red-alt` | `assets/catalog/character/char-bead-red-alt.png` | Alternate player bead — 1024 shaded sphere | Ember orb on the Emberline picker; cast strip; under the dragon when Emberline is equipped |
| `char-shape-circle` | `assets/catalog/character/char-shape-circle.png` | Circular bead — 1280 marble sphere | Bone orb on the Bone picker; cast strip; under the figure when Bone is equipped |
| `char-shape-squircle` | `assets/catalog/character/char-shape-squircle.png` | Soft bead accent — 1280 marble sphere | Moss orb under the Moss bot; shape accent binding; cast strip |

Standing figures use the `figure` tag. The arena draws that plate upright on its catalog orb. Tide, Ochre, and Moss are the three bots. Seal is the player default. Ranger and Walker have no skin slot; the cast strip under the arena shows them with every other character plate.

## Backgrounds

| id | path | role | bound at |
|---|---|---|---|
| `bg-quiet-plane` | `assets/catalog/background/bg-quiet-plane.png` | Stage plate for Quiet Plane — 1024 cartography parchment | `bindings.stages.quiet-plane` |
| `bg-rimward-marsh` | `assets/catalog/background/bg-rimward-marsh.png` | Stage plate for Rimward Marsh — 4096 day sky field | `bindings.stages.rimward-marsh` |
| `bg-sumi-basin` | `assets/catalog/background/bg-sumi-basin.png` | Stage plate for Sumi Basin — 4096 night sky field | `bindings.stages.sumi-basin` |
| `bg-cinnabar-reach` | `assets/catalog/background/bg-cinnabar-reach.png` | Stage plate for Cinnabar Reach — 4096 warm sky field | `bindings.stages.cinnabar-reach` |
| `bg-obsidian-shallows` | `assets/catalog/background/bg-obsidian-shallows.png` | Stage plate for Obsidian Shallows — 4096 deep sky field | `bindings.stages.obsidian-shallows` |
| `bg-unsealed-horizon` | `assets/catalog/background/bg-unsealed-horizon.png` | Stage plate for Unsealed Horizon — 4096 dawn sky field | `bindings.stages.unsealed-horizon` |
| `bg-plane-fallback` | `assets/catalog/background/bg-plane-fallback.png` | Fallback arena plate — 1024 ancient parchment | `bindings.fallback.background` |

## Terrain

| id | path | role | bound at |
|---|---|---|---|
| `terrain-abstract-01` | `assets/catalog/terrain/terrain-abstract-01.png` | Sumi / plane grain — 1024 crinkled parchment | `bindings.stageTerrain.sumi-basin`, `bindings.stageGrain.quiet-plane`, `bindings.fallback.grain`, `bindings.terrain.planeGrain` |
| `terrain-grass` | `assets/catalog/terrain/terrain-grass.png` | Quiet Plane floor — 1024 folded parchment | `bindings.stageTerrain.quiet-plane`, `bindings.fallback.terrain`, `bindings.terrain.floor` |
| `terrain-pixel-bg-1` | `assets/catalog/terrain/terrain-pixel-bg-1.png` | Cinnabar grain — 512 canopy light mask | `bindings.stageGrain.cinnabar-reach` |
| `terrain-abstract-02` | `assets/catalog/terrain/terrain-abstract-02.png` | Shallows floor — 512 water caustics | `bindings.stageTerrain.obsidian-shallows`, `bindings.stageGrain.rimward-marsh` |
| `terrain-abstract-03` | `assets/catalog/terrain/terrain-abstract-03.png` | Sumi accent — 512 canopy light mask | `bindings.stageAccent.sumi-basin`, `bindings.stageGrain.obsidian-shallows` |
| `terrain-abstract-04` | `assets/catalog/terrain/terrain-abstract-04.png` | Cinnabar accent — 512 canopy light mask | `bindings.stageAccent.cinnabar-reach`, `bindings.stageGrain.unsealed-horizon` |
| `terrain-pixel-01` | `assets/catalog/terrain/terrain-pixel-01.png` | Cinnabar floor — 1024 folded crinkle parchment | `bindings.stageTerrain.cinnabar-reach` |
| `terrain-pixel-02` | `assets/catalog/terrain/terrain-pixel-02.png` | Horizon floor — 512 water caustics | `bindings.stageTerrain.unsealed-horizon` |
| `terrain-pixel-03` | `assets/catalog/terrain/terrain-pixel-03.png` | Sumi grain — 512 water caustics | `bindings.stageGrain.sumi-basin` |
| `terrain-pixel-04` | `assets/catalog/terrain/terrain-pixel-04.png` | Horizon rim stamp — 1024 shaded foliage | `bindings.stageAccent.unsealed-horizon` |
| `terrain-foliage-01` | `assets/catalog/terrain/terrain-foliage-01.png` | Marsh floor — 512 canopy light mask | `bindings.stageTerrain.rimward-marsh` |
| `terrain-foliage-02` | `assets/catalog/terrain/terrain-foliage-02.png` | Quiet Plane rim stamp — 1024 shaded foliage | `bindings.stageAccent.quiet-plane` |
| `terrain-foliage-03` | `assets/catalog/terrain/terrain-foliage-03.png` | Marsh rim stamp — 1024 shaded foliage | `bindings.stageAccent.rimward-marsh` |
| `terrain-foliage-04` | `assets/catalog/terrain/terrain-foliage-04.png` | Shallows rim stamp — 1024 shaded foliage | `bindings.stageAccent.obsidian-shallows` |

## Skins

| id | path | role | bound at |
|---|---|---|---|
| `skin-splat-01` | `assets/catalog/skin/skin-splat-01.png` | Territory fill pattern — Seal, 512px | `bindings.skins.seal.pattern` |
| `skin-splat-05` | `assets/catalog/skin/skin-splat-05.png` | Territory fill pattern — Tideglass, 512px | `bindings.skins.tideglass.pattern` |
| `skin-splat-10` | `assets/catalog/skin/skin-splat-10.png` | Territory fill pattern — Emberline, 512px | `bindings.skins.emberline.pattern` |
| `skin-splat-16` | `assets/catalog/skin/skin-splat-16.png` | Territory fill pattern — Nightquarry, 512px | `bindings.skins.nightquarry.pattern` |
| `skin-splat-22` | `assets/catalog/skin/skin-splat-22.png` | Territory fill pattern — Bone, 512px | `bindings.skins.bone.pattern` |
| `skin-paint-circle` | `assets/catalog/skin/skin-paint-circle.png` | Ink picker bead overlay — double paint | `bindings.skins.seal.picker`, `bindings.skins.tideglass.picker`, `bindings.skins.nightquarry.picker`, `bindings.characters.botPatterns.2` |
| `skin-paint-splat` | `assets/catalog/skin/skin-paint-splat.png` | Wet-ink accent splat — double paint | `bindings.skins.emberline.picker`, `bindings.characters.botPatterns.3` |
| `skin-paint-drips` | `assets/catalog/skin/skin-paint-drips.png` | Trail drip accent — double paint | `bindings.skins.bone.picker`, `bindings.characters.botPatterns.4` |

## UI

| id | path | role | bound at |
|---|---|---|---|
| `ui-brand-seal` | `assets/catalog/ui/ui-brand-seal.png` | Inkbound brand seal — double round button | `bindings.ui.brandSeal` |
| `ui-restart` | `assets/catalog/ui/ui-restart.png` | Restart button face — double rectangle | `bindings.ui.restart` |
| `ui-icon-circle` | `assets/catalog/ui/ui-icon-circle.png` | Circular UI ring — 256 adventure minimap | `bindings.ui.iconCircle` |
| `ui-medal-lead` | `assets/catalog/ui/ui-medal-lead.png` | Leader mark — shaded medal (densest plate in the pack) | `bindings.ui.leaderMedal` |
| `ui-medal-alt` | `assets/catalog/ui/ui-medal-alt.png` | Stage clear mark — shaded medal | `bindings.ui.stageMedal` |
| `ui-hud-jewel` | `assets/catalog/ui/ui-hud-jewel.png` | HUD accent jewel | `bindings.ui.hudJewel` |
| `ui-check` | `assets/catalog/ui/ui-check.png` | Equipped mark — double round check | `bindings.ui.equippedCheck` |

## VFX

| id | path | role | bound at |
|---|---|---|---|
| `vfx-smoke-01` | `assets/catalog/vfx/vfx-smoke-01.png` | Death dissolve smoke | `bindings.vfx.dissolve` |
| `vfx-smoke-04` | `assets/catalog/vfx/vfx-smoke-04.png` | Territory fade smoke | `bindings.vfx.fade` |
| `vfx-circle-02` | `assets/catalog/vfx/vfx-circle-02.png` | Capture / burst ring | `bindings.vfx.burstRing` |
| `vfx-magic-01` | `assets/catalog/vfx/vfx-magic-01.png` | Claim sparkle — 512 magic particle | `bindings.vfx.claimSpark` |
| `vfx-star-05` | `assets/catalog/vfx/vfx-star-05.png` | Capture float spark | `bindings.vfx.floatSpark` |
| `vfx-explosion-03` | `assets/catalog/vfx/vfx-explosion-03.png` | Death burst — large smoke explosion | `bindings.vfx.deathBurst` |
| `vfx-slash-04` | `assets/catalog/vfx/vfx-slash-04.png` | Trail-cut slash accent | `bindings.vfx.cutSlash` |

## Provenance

Each entry's `upstream.source_path`, pack, release, and `sha256_16` live in `IMAGE_INDEX.json`. `node tools/smoke_images.mjs` checks the hash against the file bytes and that every id is bound.
