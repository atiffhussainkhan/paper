# Inkbound — Master rule audit (RULE1–RULE5)

**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd` → `main`  
**Game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`  
**Runnable URL:** `http://127.0.0.1:8765/` (`python3 -m http.server 8765 --bind 127.0.0.1`, cwd `/workspace/inkbound`). `GET /` returned **200** when this rollup was written. This is a local static server, not a public host.

## Does it fulfill all requirements?

**No.** The twelve GDD §16 must-haves are matched, the core trail / claim / kill rules match, characters unlock by best %, and one life was played from a cold start through a claim, a death, and Restart at `http://127.0.0.1:8765/`. Match start is **PARTIAL**, and the build is not the rest of the GDD and not a Paper.io 2 copy.

## Five reports

| Rule | Verdict | Report | Report commit |
|------|---------|--------|----------------|
| RULE1 Match start | **PARTIAL** (5 PASS, 2 PARTIAL, 0 FAIL) | [RULE_AUDIT_1_START.md](RULE_AUDIT_1_START.md) | `b77c16d` |
| RULE2 Core trail / claim / kill / end | **MATCH** (9/9 PASS) | [RULE_AUDIT_2_CORE.md](RULE_AUDIT_2_CORE.md) | `ed7d6c9` |
| RULE3 Earn characters | **PASS** | [RULE_AUDIT_3_EARN.md](RULE_AUDIT_3_EARN.md) | `594ed16` |
| RULE4 Must-have gaps | **12/12 MATCHED.** Not a Paper.io 2 copy. | [RULE_AUDIT_4_GAPS.md](RULE_AUDIT_4_GAPS.md) | `18f1bb1` |
| RULE5 Runnable session | **PASS** | [RULE_AUDIT_5_RUN.md](RULE_AUDIT_5_RUN.md) | `5f6139c` |

Later commits on this branch are audit notes. `src/`, `css/`, `index.html`, and `assets/` are the `21cf6b0` tree.

## What is fulfilled

- **Must-have MVP (RULE4).** All twelve §16 lines are MATCHED: 360° steer, territory safety, loop capture, self-cut, enemy cut, territory clear on death, three named bots and a board, % and best %, summary plus Restart, five cosmetic skins, original Inkbound identity, desktop and mobile controls. Unmatched must-haves: none. That 100% is only that checklist.
- **Core rules (RULE2).** Trail only outside own ink, loop claim with a `+%` float, self-cut after the first seal, enemy trail kill, bodies do not kill, non-lethal rim, win at `winShare` 1, death clears ink and Restart starts a new disk, no revive. Smokes `smoke_combat`, `smoke_loop`, and `smoke_vfx` exited 0. One browser life: 1.0% → 3.8% (+2.8%) → "Ochre cut your line." at 4.8% → Restart.
- **Earning characters (RULE3).** Seal is free. Tideglass 2%, Emberline 5%, Nightquarry 10%, Bone 20%, all by best %. A 6.8% death opened Tideglass and Emberline; locked chips stayed locked; Emberline survived Restart and reload. Bone stays locked at 19.9% and opens at 20%. Shop and currency are **N/A-MVP**.
- **A complete local session (RULE5).** Chrome 154, fresh profile, 1280×800, `http://127.0.0.1:8765/`. Cold frame: player on the red disk, map, board (You / Tide / Ochre / Moss at 1.0%), HUD 1.0% / Best 0.0% / Quiet Plane 0%, claim hint up. Keyboard loop **1.0% → 3.8%**. Death card: "You crossed your own line.", "4.0% of the plane.", Best 4.0%, Quiet Plane 8%, Tideglass unlocked. Restart: fresh 1.0% disk, Best 4.0% and stage 8% kept, four living rows, hint stays faded. Shots: `/opt/cursor/artifacts/rule5_start.png`, `rule5_claim.png`, `rule5_end.png`, `rule5_restart.png`.

## What is not fulfilled

- **Match start is not a full pass (RULE1).** The first painted frame is already a match, and the disk, camera, bots, HUD, and live steering pass. Two rows are partial. A 15-plate catalog strip sits on the lower playfield, so the map is not the minimal arena the GDD describes. At ≤640px the claim hint is `display: none`, so the phone first frame has no soft line. Neither blocked play. No code was changed for them.
- **Not every GDD line, and not Paper.io 2 (RULE4).** Absent on purpose relative to that product and to later GDD buckets: online multiplayer, a crowd of about 8–15 opponents (this build has 3, which DECISIONS locks), shop, gold, gems, ads, revive, a home screen, powers, settings, gamepad, a kill counter, music, and a store client. Should-have and could-have rows were not scored as unmatched must-haves. Graphics are catalog plates, claimed only as better than a flat paper.io-style web clone, not as official Paper.io 2 art.
- **No public runnable URL.** The proof is `http://127.0.0.1:8765/`. [DEPLOY.md](DEPLOY.md) is still the publish step. No Pages workflow is committed.
- **This browser life did not seal the plane.** RULE5 ended on a self-cross. RULE2's browser life ended on an enemy cut. The win title "The plane is yours." is covered by `smoke_loop.mjs` when share hits 1.

## How to play the proof

```bash
cd /workspace/inkbound
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. The bead is already moving. Point or use WASD, close a loop, die or fill the plane, then Restart.
