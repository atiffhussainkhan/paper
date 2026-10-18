# Inkbound Phase 1 — System track ownership

| Track | Owner role | Primary files (prefer) | Do not thrash |
|-------|------------|------------------------|---------------|
| **J Juice** | Presentation systems | `src/render/Vfx.js` (new), `Renderer.js`, `Hud.js`, light `Game.js` event hooks | `Bots.js`, `Combat.js` |
| **B Bots** | AI systems | `src/sim/Bots.js`, `config.js` bot/grace keys, `Combat.js` grace API only | skins/meta UI |
| **S Skins** | Meta cosmetics | `src/meta/Skins.js`, `src/meta/Profile.js`, HUD select UI, `css/style.css` skin bits | Godot folder |
| **M Stages** | Meta progression | `src/meta/Stages.js`, Profile stage fields, HUD stage bar | Combat core |
| **G Godot** | Port lead | `godot/**`, `docs/PORT_GODOT4.md` | Do not break web `src/` |

## Integration order after agents land
1. Merge non-overlapping files  
2. Wire `main.js` / `Game.js` hooks once  
3. Run `node tools/smoke_combat.mjs && node tools/smoke_loop.mjs`  
4. Manual browser check  

## Track S — skins + best % (landed)

- `src/meta/Profile.js`: localStorage (`inkbound.profile.v1`), `get/set/update/save`, unknown fields preserved. Fields: `bestPct` (0-100), `equippedSkinId`, `unlockedSkinIds`.
- `src/meta/Skins.js`: five skins, `recordRun`, `equipSkin`, `syncUnlocks`.
- Unlock rule: skin opens when best share reaches `unlockPct`; unlocks persist.

| Skin | Best needed |
|------|-------------|
| Seal (default vermilion) | 0% |
| Tideglass | 2% |
| Emberline | 5% |
| Nightquarry | 10% |
| Bone | 20% |

- Wiring: `main.js` passes `playerSkin` to `Game` (boot and every restart); `Game.createEntity` applies it to the player only. Run end calls `recordRun` once. Picker lives on the death/win overlay (`src/render/SkinPicker.js`); best % sits under the live % readout.
- Test: `node tools/smoke_meta.mjs`.
