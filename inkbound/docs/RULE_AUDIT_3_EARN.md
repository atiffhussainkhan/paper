# Inkbound — RULE3 character earn / unlock / progression

**Role:** RULE3 Character Earn / Unlock / Progression Analyst
**Date:** 2026-10-18
**Branch:** `cursor/inkbound-final-dev-c3dd`
**Audited game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`
**Parent while playing:** docs-only commits after `21cf6b0`. `src/`, `css/`, and `index.html` are that tree.
**Server:** `python3 -m http.server 8774 --bind 127.0.0.1`, cwd `/workspace/inkbound`
**Browser:** Chrome 154.0.8037.92, headless, 1280×800. Catalog `ready`. Zero console errors. Zero HTTP responses ≥ 400. No Paper.io string in the document.
**Code probe:** `node tools/smoke_meta.mjs` → `smoke_meta ok` (exit 0), plus a direct `recordRun` / `syncUnlocks` / `equipSkin` ladder on `src/meta/Skins.js`.

Sources: `TerritoryIO_Professional_Requirements_GDD.md` v1.0 (§3 macro loop, §10 characters/skins, §11 economy, §13 game over, §15 persistence, §16 checklist), read with `inkbound/DECISIONS.md` and `inkbound/docs/PHASE1_TRACKS.md`.

Shots: `/opt/cursor/artifacts/rule3_boot.png`, `rule3_earn_death.png`, `rule3_equip.png`, `rule3_restart.png`, `rule3_reload.png`, `rule3_bone_locked.png`, `rule3_bone_open.png`, `rule3_equip_bone.png`, `rule3_bone_restart.png`, `rule3_bone_reload.png`.

## Verdict

**PASS**

A player starts as Seal (the princess on vermilion ink) and earns four more characters by raising **best % of the plane**. The gates are 2, 5, 10, and 20. Equip of an opened character changes the figure on the next life. A locked chip stays disabled, and a click leaves the equipped id alone. Best, the unlock list, and the equipped figure survive Restart and a full reload. A worse run does not lower best and does not take a character away.

There is no shop and no currency. The GDD puts shop and dual currency in Could-have v2, so that absence is **N/A-MVP**. It is not a gap against this rule.

No earn bug turned up. No gameplay file was changed.

## What "a character" is here

Each of the five inks is one playable character: a standing catalog plate, an orb, a splat, and a tint. The tint never changes speed, capture, or combat. Bots keep Tide / Ochre / Moss.

| Ink | Figure | Plate | Opens at best |
|-----|--------|-------|----------------|
| Seal | Princess | `char-plate-princess` | 0% (owned at the start) |
| Tideglass | Knight | `char-plate-knight` | 2% |
| Emberline | Dragon | `char-plate-dragon` | 5% |
| Nightquarry | Robot | `char-toon-robot` | 10% |
| Bone | Person | `char-toon-male-person` | 20% |

`isSkinUnlocked` is `bestPct >= unlockPct`. `recordRun` rounds the death share to one decimal (`Math.round(share * 1000) / 10`) and then syncs. Unlocks are appended and kept.

| Death share | Stored best | Newly opened |
|-------------|-------------|--------------|
| 0.0194 | 1.9% | none (Tideglass still locked) |
| 0.0195 | 2.0% | Tideglass |
| 0.0494 | 4.9% | Tideglass |
| 0.0495 | 5.0% | Tideglass, Emberline |
| 0.0994 | 9.9% | Tideglass, Emberline |
| 0.0995 | 10.0% | Tideglass, Emberline, Nightquarry |
| 0.1994 | 19.9% | Tideglass, Emberline, Nightquarry |
| 0.1995 | 20.0% | all four earned characters |
| 1.0 | 100% | all four; a second sync adds nothing |

A fresh profile refuses `equipSkin(..., "tideglass")` and stays on Seal. At a stored best of 5%, Emberline equips and Bone is refused. A later 1% run keeps best 5%, keeps the unlock list, and keeps Emberline equipped. Loading a new `Profile` on the same storage reads those fields back. Writing `bestPct` back to 0 leaves the unlock list and the equipped id in place: an earned character stays earned.

## Browser

### Real earn (fresh `localStorage`)

Boot is the princess on a 1.0% disk, Best 0.0%, Stage 1 · Quiet Plane (`rule3_boot.png`). A keyboard square seals at 7.1%. Best is still 0.0% while the life is going. An earlier life in this same pass reached 10.7% on the live HUD and, because it had not ended, still had Best 0.0% and every earned chip locked. The earn is applied when the run is recorded, from the share at death.

The life ends on "You crossed your own line." at **6.8%** (`rule3_earn_death.png`):

- "New best. Tideglass, Emberline unlocked."
- "Inks opened" shows Tideglass and Emberline.
- Stage line: "+7.1% toward Quiet Plane (14%)." Stage credit uses the run peak. Best uses the death share. That split is `recordRun(finalShare)` beside `recordStageRun(max(peak, final))`.
- Nightquarry is disabled and labeled **10%**. Bone is disabled and labeled **20%**.
- Profile: `bestPct` 6.8, `unlockedSkinIds` `["seal","tideglass","emberline"]`, `equippedSkinId` `seal`.

Clicking the disabled Nightquarry chip leaves `equippedSkinId` on `seal`. The chip stays disabled and labeled 10%.

Clicking Emberline selects it (`rule3_equip.png`). Profile `equippedSkinId` is `emberline`.

Restart (`rule3_restart.png`): overlay gone, share 1.0%, Best **6.8%**, stage 14%, You is the dragon. The leaderboard portrait is `char-plate-dragon.png`. Ink is the Emberline rose.

Full reload (`rule3_reload.png`): same dragon, Best 6.8%, stage 14%, same profile JSON, including `ftueClaimDone: true`.

### Thresholds the 6.8% life did not reach

Nightquarry (10%) and Bone (20%) were opened by writing `bestPct` and `unlockedSkinIds: ["seal"]`, then reloading. Boot calls `syncUnlocks`, which is the same predicate `recordRun` uses. The following death was a real self-cross at about 6–7%, so it did not raise best and did not announce a new unlock. The card shows the best that was already stored.

| Stored best before reload | After `syncUnlocks` | Death card |
|---------------------------|---------------------|------------|
| 19.9 | Seal, Tideglass, Emberline, Nightquarry. Bone absent. | "Best 19.9%." Nightquarry named and enabled. Bone disabled, labeled **20%** (`rule3_bone_locked.png`). Clicking Bone leaves `equippedSkinId` on `seal`. |
| 20 | All five. | "Best 20.0%." Bone named and enabled (`rule3_bone_open.png`). |

Equipping Bone (`rule3_equip_bone.png`) and Restart draws the person plate on bone-colored ink, Best 20.0%, portrait `char-toon-male-person.png` (`rule3_bone_restart.png`). Reload keeps that figure and that best (`rule3_bone_reload.png`). The 6.9% death did not replace 20.0%.

The 19.9 and 20 sessions inherited stage credit from the 6.8% life (the probe only rewrote best, the unlock list, and the equipped id). That is why the stage bar reads 28% and then 42%. It is accumulated credit, not a sign that a 6% life filled the zone.

## Earn-rules matrix

| ID | Rule | GDD / genre | Score | Evidence |
|----|------|-------------|-------|----------|
| EARN-1 | More characters are earned, not all owned at the start | §3 L104 unlock skins. §10 L341–346 classic cosmetics. §16 L532 at least five skins (Must-have). User: earn to get more character | **PASS** | Seal is free. Four characters sit behind best %. Five plates, five ids, cosmetics only. |
| EARN-2 | Unlock threshold is best % of the plane, at the published gates | §16 L539 Skin unlock challenges (Should-have). §10 L353 example "reach 10%" | **PASS** | Gates 0 / 2 / 5 / 10 / 20. Comparison is `>=` after one-decimal rounding. 1.9 stays shut, 2.0 opens Tideglass. 9.9 shuts Nightquarry, 10.0 opens it. 19.9 shuts Bone, 20.0 opens it. The 10% example is Nightquarry. |
| EARN-3 | The earn is recorded from the finished run | §13 L458 final % and best % on game over | **PASS** | Live 10.7% with the run still open left Best at 0.0% and left every earned chip locked. The 6.8% death wrote best 6.8 and opened Tideglass and Emberline together. |
| EARN-4 | A locked character stays locked | §10 challenge gate. Picker contract in `SkinPicker.js` | **PASS** | Locked chips are `disabled`, `is-locked`, labeled with the percent, `aria-label` "locked until N%". Clicking Nightquarry at best 6.8 and Bone at best 19.9 did not change `equippedSkinId`. `equipSkin` returns false for an id outside `unlockedSkinIds`. Keyboard move only walks enabled chips. |
| EARN-5 | Equip an earned character and play as that figure | §10 L336–339 avatar + fill from the skin. §5 L166 color/pattern from the selected skin | **PASS** | Emberline equip → dragon + rose ink after Restart. Bone equip → person plate + bone ink. Leaderboard `--row-art` matches the plate. Bots are not recolored. |
| EARN-6 | Best, unlocks, and the equipped character persist | §15 L498 persistence. §15 L506–508 `best_pct`, `unlocked_skins[]`, `equipped_skin` | **PASS** | Key `inkbound.profile.v1`. Restart and a hard reload kept 6.8% + Emberline, and 20.0% + Bone. A worse run keeps the higher best and the list. `smoke_meta` reloads Tideglass, best 3.4, and a foreign stage field. |
| EARN-7 | An earned character is kept | §10 unlock, Phase 1 note in `Skins.js`: persisted and never revoked | **PASS** | `syncUnlocks` only appends. A 1% run after a 5% run adds nothing. Setting stored best back to 0 leaves Emberline equipped and the list intact. |
| SHOP-1 | Real shop and currency | §11 L376–379 Gold / Gems / tickets. §16 L546 Shop + dual currency (Could-have v2). §19 Phase 3 | **N/A-MVP** | No shop, gold, gems, coins, or currency string in `src/`, `css/`, `index.html`, tools, or Godot scripts. Nothing to buy. Earned characters do not have a price. |

## Genre comparison (Paper.io-class cosmetics)

The GDD's genre notes, taken from Paper.io 2, earn cosmetics several ways: stage progress, chests, a soft/premium shop, dailies, and challenges such as "reach 10%" or "25 kills" (§10 L348–353). Classic skins are cosmetic. Powered skins are a later tier (§10 L341–346, §16 L545 Could-have).

Inkbound matches the cosmetic challenge path:

- The thing you earn is a new figure, not only a recolor. Princess, knight, dragon, robot, and the bone figure are distinct plates.
- The ladder is short and early (2 / 5 / 10 / 20), so a first real loop that dies around 7% already opens two characters. The GDD's own "reach 10%" example is on the ladder as Nightquarry.
- The locked chip shows the percent that opens it. There is no fill bar from 0 up to that percent. The number and the disabled control are enough to read the gate.
- Unlock is permanent, which is how that genre treats a challenge reward.
- Equip happens on the death card, then the next life spawns as that character. There is no separate Home character screen (§13 L441–447). The meta values are on the match HUD and the summary. That screen shape was already scored adjacent in the REQ3 meta report. It does not block earning or equipping.

These genre pieces are not in the build, and they are not fails for this rule:

| Piece | Where the GDD puts it | In this build |
|-------|----------------------|---------------|
| Shop, Gold, Gems, tickets | Could-have v2, §16 L546, §11 | Absent. **N/A-MVP** |
| Chests, dailies | Named in §10 L350–352, not a §16 Must-have line | Absent. **N/A-MVP** |
| Kill-count challenge ("25 kills") | An example next to "reach 10%" on the same Should-have line, §10 L353 | Not a second vector. Best % is the shipped challenge, and it includes the 10% example. |
| Powers on a skin | Could-have v2, §16 L545 | These five are classic. No power changes the match. |
| Pay to own map % | Won't, §16 L554 | Absent. |

## Adjacent, not a fail

| Item | Score | Why |
|------|-------|-----|
| Cast strip under the arena | **NOTE** | All 15 catalog character plates are drawn on every life, including Dragon, Robot, and Bone before they are earned, plus Ranger and Walker (`char-toon-male-adventurer`, `char-toon-female-person`), who have no ink slot. The strip is a catalog. It is not the locker. You cannot equip from it. The lock lives on the death-card chips. |
| Tideglass and the Tide bot share the knight plate | **NOTE** | Same `char-plate-knight`. Tideglass ink is `#4a7fb5`. The Tide bot stays on the teal bot ink. The figures match; the ink does not. |
| Ranger and Walker | **NOTE** | Roster art on the strip. They are not offered as player characters, so there is no earn gate for them. |

## Bugfix

None. Best stays the death share. Stage credit stays the run peak. Locked clicks no-op. Persistence already round-trips `bestPct`, `equippedSkinId`, and `unlockedSkinIds`.
