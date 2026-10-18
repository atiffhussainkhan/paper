# AI Asset Index

**Canonical machine-readable search index:** `catalog/MASTER_ASSET_INDEX.json`

**Crawler-friendly table:** `catalog/MASTER_ASSET_INDEX.csv`

**Crawler entrypoint:** `CRAWLER_ENTRYPOINT.md`

This repository is the master reusable game-asset library.

## How AI models should use this repository
1. Search this file first by **asset type**, **theme**, **format**, or **gameplay role**.
2. Prefer packs marked **STORED**. These are owned copies in this repository's GitHub Releases.
3. Use source URLs only for provenance/licence verification, never as the primary asset location.
4. Before reusing an asset outside a game project, check the bundled licence in the pack.
5. For engine import, prefer GLB/glTF where available, then FBX, then OBJ for static meshes.

## Release locations
- Core library: https://github.com/atiffhussainkhan/Image/releases/tag/mega-assets-v1
- Expansion v1: https://github.com/atiffhussainkhan/Image/releases/tag/mega-assets-expansion-v1
- Expansion v2: https://github.com/atiffhussainkhan/Image/releases/tag/mega-assets-expansion-v2

## Searchable asset map

| Keywords / use | Stored pack | Release | Notes |
|---|---|---|---|
| 3D character, humanoid, NPC, player, male, female, rigged, animated | oga-3d-character-pack.zip | expansion-v2 | CC0 3D character pack |
| 3D adventurer, RPG, hero, humanoid, animations | kaykit-adventurers.zip | core | Rigged animated characters |
| skeleton, enemy, undead, dungeon enemy, rigged | kaykit-skeletons.zip | core | Animated skeleton characters |
| animation, humanoid animation, walk, run, attack, jump | kaykit-character-animations-1.2.zip | core | Character animation library |
| sprite, 2D character, creature, tile, UI, effect, background | papyszoo-cc0-sprites.zip | expansion-v2 | Large public-domain 2D collection |
| 2D character, sprite, fantasy, sci-fi, urban, nature, UI, vehicle | tiddybub-2d-assets.zip | expansion-v1 | Very large CC0 2D library |
| modular 2D character, vector, animated sprite | opengameart-modular-vector-characters.zip | core | Modular animated vector characters |
| knight, princess, dragon, 2D animation, PNG | opengameart-knight-princess-dragon-2.zip | core | Transparent PNG animation sequences |
| city, building, house, urban, simulation, RTS | kaykit-city-builder.zip | expansion-v2 | City-building 3D pack |
| building, exterior, vegetation, skybox, urban, military, PBR | fps-buildings-env-kit.zip | expansion-v1 | Large environment/building collection |
| dungeon, interior, wall, floor, stair, door, prop | kaykit-dungeon-remastered.zip | expansion-v2 | Modular dungeon kit |
| furniture, room, interior, home, prop | kaykit-furniture.zip | expansion-v2 | Interior furniture kit |
| medieval, hex, village, road, river, nature, strategy | kaykit-medieval-hexagon.zip | expansion-v2 | Hex-based medieval environment |
| graveyard, cemetery, spooky, Halloween, prop | kaykit-halloween.zip | expansion-v2 | Seasonal/graveyard assets |
| prototype, greybox, blockout, level design | kaykit-prototype-bits.zip | expansion-v2 | Rapid level prototyping |
| tree, foliage, environment, world building, low poly | cc0tree.zip | expansion-v1 | CC0 tree/environment pack |
| 3D characters, equipment, farm, building, infrastructure, creature, VFX | holokat-game-assets.zip | expansion-v1 | Mixed open game assets |
| 2D sprite, UI, icon, 3D static model, Kenney | shorepine-kenney.zip | expansion-v1 | Organized Kenney CC0 mirror |
| weapon, FPS, texture, PBR, SFX, HDRI | fps-asset-kit.zip | expansion-v1 | Large FPS asset pack |
| game-dev catalogue, 2D, 3D, UI, textures, HDRI, audio | verified-source-catalog.zip | expansion-v2 | Reference catalogue, not a substitute for stored binary packs |

## File naming convention
Pack names are intentionally descriptive and stable. AI agents should select the smallest relevant pack rather than unpacking the entire library.

## Recommended project layout
```
GameProject/
  Assets/
    Characters/
    Environments/
    Buildings/
    Interiors/
    Props/
    Backgrounds/
    UI/
    VFX/
    Textures/
    Audio/
    ThirdPartyLicences/
```

## Engine guidance
**Unity:** FBX or GLB/glTF -> Assets/; use Humanoid rig where appropriate.
**Unreal Engine:** FBX -> Skeletal Mesh / Static Mesh; preserve skeleton and animation files.
**Godot:** GLB/glTF preferred; import scenes and AnimationPlayer/AnimationTree content.
**Web/Three.js:** GLB/glTF preferred; PNG/WebP for 2D and backgrounds.

## Licence rule
The repository stores reusable copies where redistribution is permitted. Original source URLs remain only as provenance. Do not remove bundled LICENSE/README files from third-party packs.

| mega-library, mixed 2D/3D, UI, icons, audio, broad game assets | jam-ready-assets.zip | core | Large curated mixed asset collection |

## Unverified workplace artwork — separate audit

Start at `catalog/workplace-art-unverified-2026-10-05/README.md`, `search-manifest.json` and `archive-manifest.json`. This collection indexes 102,393 original paths across PNG icons, mixed clipart, EPS vectors and WMF/photo samples. Search gzip shards list pack, original path, category, format, dimensions and technical readiness. `raster-ready` is only a decoding/format classification, never a licence approval. Check archive storage status before assuming binaries exist in the repository. Do not represent these packs as licence-clear or apply this repository metadata licence to their artwork.

## Active cleaned artwork library

The [cleaned search gallery](catalog/game-art-search-v2-2026-10-05/README.md) is the active index for the four user-supplied archives. Unreadable, empty and unconvertible sources are excluded from its searchable records and cleaned PNG/JPEG packs. Use `catalog/user-artwork-active-library.json` for machine discovery. JSON/JSONL, SQLite, CSV and natural-language search are available in the [cleaned release](https://github.com/atiffhussainkhan/Image/releases/tag/game-art-search-v2-2026-10-05). Original archives remain historical backups; licences remain unverified.

## Complete file and image audit

The [6 October 2026 audit](catalog/audits/2026-10-06/REPORT.md) checked Image and animation, all 54 Image release files, 104 ZIPs including nested archives, and 408,439 file occurrences. All 110,490 cleaned master images and all 132 animation frames passed. For older/source packs, consult the [safe import policy](catalog/audits/2026-10-06/safe-import-policy.json) and [corrected preview overrides](catalog/audits/2026-10-06/format-overrides.json): stored availability does not certify every member as standalone engine art.

## Catalog completion

All eight formerly unstored packs are now available in the [catalog completion release](https://github.com/atiffhussainkhan/Image/releases/tag/catalog-completion-2026-10-06). Download links, categories and sizes are in the canonical index. [Validation report](catalog/catalog-completion-2026-10-06/REPORT.md).
