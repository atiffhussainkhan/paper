# Inkbound — REQ2 graphics and presentation

**Role:** REQ2 Graphics & Presentation Auditor
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd`
**Runtime audited:** `41f27cc5f914026a1011ecf0b5fff5d420e7ad15`
**Server:** `python3 -m http.server 8772 --bind 127.0.0.1` with cwd `/workspace/inkbound`
**Browser:** Chrome 154.0.8037.92, headless, 1280×800. Catalog `ready`, count 58. Zero console errors. Zero HTTP responses ≥ 400.
**Shots:** `/opt/cursor/artifacts/req2_boot.png`, `req2_match_characters.png`, `req2_skins_picker.png`, `req2_stage_quiet-plane.png`, `req2_stage_rimward-marsh.png`, `req2_stage_sumi-basin.png`, `req2_stage_cinnabar-reach.png`, `req2_stage_obsidian-shallows.png`, `req2_stage_unsealed-horizon.png`

The commits after `65de734` (`efbf5f5`, `41f27cc`) add the acceptance gate, deploy notes, and a `winShare` comment. They do not change `IMAGE_INDEX.json`, catalog bytes, `Renderer.js`, `Skins.js`, `Stages.js`, or `Vfx.js`.

## Verdict

**PASS**

**Binding completeness: 100% (58 / 58).** Missing list: none.

Every bitmap the match draws is a file in `inkbound/assets/catalog/`, indexed by `IMAGE_INDEX.json`, with an upstream path in [atiffhussainkhan/Image](https://github.com/atiffhussainkhan/Image). No catalog PNG carries AI-generator metadata. No 16px platformer tile is used as a stage plate or a character. Standing figures are the catalog idle plates. That is sharper than the flat colored circles typical paper.io web clones use.

No binding was added. `smoke_images.mjs` already requires every id to appear as a binding leaf, and the leaf set covers the index.

## Catalog

| | |
|---|---|
| Schema | `1.0` |
| Source | `https://github.com/atiffhussainkhan/Image` |
| Total | **58** |
| background | 7 |
| character | 15 |
| skin | 8 |
| ui | 7 |
| vfx | 7 |
| terrain | 14 |
| Files on disk not in the index | none |
| Index paths missing on disk | none |
| Duplicate ids | none |
| `sha256_16` mismatches | none (`smoke_images.mjs`) |
| PNG `tEXt` / `iTXt` / `zTXt` / `eXIf`, or the strings stable diffusion, midjourney, dall-e, openai, comfyui, novelai | none |

Stage plates are 1024×1024 cartography parchment (`bg-quiet-plane`, `bg-plane-fallback`) or 4096×2048 Kenney sky fields (the other five stages). Character figures are the source idle frames: OpenGameArt princess 265×319, knight 414×288, dragon 314×214, and Kenney Toon Characters “Poses HD” 192×256. Sphere orbs are 1024 or 1280. Territory splats are the 512px Kenney double pack. Files whose ids still say `terrain-pixel-*` are parchment, canopy masks, caustics, or shaded foliage at 512 or 1024, not pixel-platformer tiles. UI medals are the native 40×80 Kenney medals and are used as HUD marks, not as stage art.

## Binding map

78 binding leaves. Each leaf is a catalog id. Each of the 58 ids is named at least once.

| Slot | Runtime id | Where it is read |
|---|---|---|
| Player (You / Seal) | bead `char-plate-princess`, orb `char-bead-red`, pattern `skin-splat-01`, picker `skin-paint-circle` | `SKINS`, `bindings.skins.seal`, `bindings.characters.defaultBead`, `bindings.characters.playerOrb` |
| Tide (bot 2) | bead `char-plate-knight`, orb `char-bead-blue`, pattern `skin-paint-circle` | `bindings.characters.botBeads.2`, `botOrbs.2`, `botPatterns.2`, `botBead` |
| Ochre (bot 3) | bead `char-toon-female-adventurer`, orb `char-bead-blue-alt`, pattern `skin-paint-splat` | `botBeads.3`, `botOrbs.3`, `botPatterns.3` |
| Moss (bot 4) | bead `char-toon-zombie`, orb `char-shape-squircle`, pattern `skin-paint-drips` | `botBeads.4`, `botOrbs.4`, `botPatterns.4`, `characters.shapeAccent` |
| Tideglass | bead `char-plate-knight`, orb `char-bead-blue`, pattern `skin-splat-05`, picker `skin-paint-circle` | `bindings.skins.tideglass` |
| Emberline | bead `char-plate-dragon`, orb `char-bead-red-alt`, pattern `skin-splat-10`, picker `skin-paint-splat` | `bindings.skins.emberline` |
| Nightquarry | bead `char-toon-robot`, orb `char-bead-blue-alt`, pattern `skin-splat-16`, picker `skin-paint-circle` | `bindings.skins.nightquarry` |
| Bone | bead `char-toon-male-person`, orb `char-shape-circle`, pattern `skin-splat-22`, picker `skin-paint-drips` | `bindings.skins.bone` |
| Ranger / Walker | `char-toon-male-adventurer`, `char-toon-female-person` | `bindings.characters.roster`. Shown on the cast strip with every other character plate. No skin slot. |
| Stages 1–6 | `bg-quiet-plane`, `bg-rimward-marsh`, `bg-sumi-basin`, `bg-cinnabar-reach`, `bg-obsidian-shallows`, `bg-unsealed-horizon` | `STAGES.backgroundImageId` equals `bindings.stages` |
| Stage floor / accent / grain | all 14 terrain ids | `bindings.stageTerrain`, `stageAccent`, `stageGrain` |
| Fallback plate | `bg-plane-fallback`, terrain `terrain-grass`, grain `terrain-abstract-01` | `bindings.fallback`. Renderer reads the id from the binding, not a hardcoded string |
| HUD | brand seal, restart, leader medal, stage medal, jewel, equipped check, icon ring | `bindings.ui.*` → CSS `--art-*` and `Renderer` / `Vfx` |
| VFX | dissolve, fade, burst ring, claim spark, float spark, death burst, cut slash | `bindings.vfx.*` via `Vfx.art(role)` |

Chrome at boot reported the same four living beads and orbs, all `figure`-tagged, all decoded (princess 265×319, knight 414×288, adventurer 192×256, zombie 192×256). `catalog.failed` was empty. `catalog.coverage().unbound` was empty.

`docs/GRAPHICS_PICKED.md` lists the same 58 ids. Every `bindings.*` path in that file exists in `IMAGE_INDEX.json`. The character table states roles in prose instead of repeating the path; those roles match the leaves above (You / Seal = princess, Tide and Tideglass = knight, Ochre = female adventurer, Moss = zombie, Emberline = dragon, Nightquarry = robot, Bone = male person, Ranger and Walker = the two roster plates, orbs as named).

## Renderer

`Renderer.drawCover` cover-fits the stage plate. Catalog figures, orbs, territory stamps, rim accents, HUD jewels, and VFX sprites are `drawImage` of a catalog bitmap. There is no method named `drawSprite`.

`drawEntity` takes the figure path when the bead’s tags include `figure`. That path draws the catalog orb, then the catalog idle plate. It does not draw eyes, a mouth, or a stand-in face. The player, the three bots, and all five skins use that path.

A non-figure bead (or a missing bitmap) falls through to a clipped catalog sphere, or a solid ink disc if the bitmap never loaded, plus a wet core and a directional nib. That path is not used for the live cast. The nib on a figure is a small vector arrow, not a face.

`Vfx.art` resolves `dissolve`, `fade`, `burstRing`, `claimSpark`, `floatSpark`, `deathBurst`, and `cutSlash` to catalog images and draws them. A three-point crown polygon is only the fallback when the leader medal image is missing. The medal loaded.

`plateFrames` in `ImageCatalog.js` is unused. Stages still come from catalog ids: `drawCover` plus a sumi multiply, a terrain tile, a grain tile, and a rim of accent stamps. The six stage shots are different plates (parchment, blue caustic field, night, purple foliage, dark hex, warm stone), not one reused color.

CSS custom properties `--art-*` point at catalog files. `style.css` has no `feTurbulence` and no `data:image/svg`. The tab icon in `index.html` is a 32×32 vermilion SVG swatch. It is not a bitmap, not stage art, and not a character. The in-game seal is `ui-brand-seal`.

## Smoke

From `/workspace/inkbound` on this tree:

```text
node tools/smoke_images.mjs
smoke_images: ok 58 images { background: 7, character: 15, skin: 8, ui: 7, vfx: 7, terrain: 14 }
```

Exit 0. The gate checks hashes, provenance, category floors (≥ 4 each), stage and skin ids, every binding leaf, every id bound, bot bead/pattern fallbacks, CSS catalog vars, and that the renderer does not hardcode `bg-plane-fallback`.

## Browser

| Shot | What it shows |
|---|---|
| `req2_boot.png` | Quiet Plane parchment, princess on the red catalog orb, leaderboard portraits for You, Tide, Ochre, and Moss, cast strip of all 15 character plates, brand seal, stage HUD |
| `req2_match_characters.png` | The four living figures gathered into one frame so Tide, Ochre, and Moss are readable with You. Beads are the knight, the female adventurer, and the zombie, each on its catalog orb. Positions were moved for the frame; the draw path was not |
| `req2_skins_picker.png` | Profile `bestPct` 25 with all five skins unlocked and Emberline equipped, then the overlay opened. Chips are Seal, Tideglass, Emberline (selected), Nightquarry, Bone. Each chip’s figure, orb, and paint URL is a catalog file. Overlay title text was set for the shot; the chip art and names come from `SkinPicker.update` |
| `req2_stage_*.png` | `setStageArt` for all six stages while the match kept running. HUD stage name matches the plate. Quiet Plane stays parchment; the five sky stages read as distinct catalog fields under the sumi wash |

## Fidelity

Paper.io-style web clones usually draw a flat disc, a solid trail, and a flat arena color. Inkbound draws a standing catalog figure on a shaded orb, a splat-stamped territory, a parchment or sky plate, and catalog HUD and VFX marks. The figures stay crisp at play size because the source frames are larger than the on-screen sprite. Stage grain is kept quiet so the ink stays the loud layer. That is equal to or better than those clones.

## Not changed

No unbound catalog file. No binding edit. No renderer edit.
