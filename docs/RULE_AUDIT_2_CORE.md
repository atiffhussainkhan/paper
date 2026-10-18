# Inkbound — RULE2 core rules (trail / claim / kill / end)

**Role:** RULE2 Core Rules Analyst  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Audited game bytes:** `21cf6b0867c1dcb08bd1131313719bc1198d2614`  
Sim, combat, capture, HUD, and `index.html` are unchanged since that commit. Later commits on this branch are audit reports only.  
**Server:** `python3 -m http.server 8772 --bind 127.0.0.1` with cwd `/workspace/inkbound`  
**Browser:** Chrome 154.0.8037.92, 1280×800, fresh `localStorage`. Zero console errors.  
**Shots:** `/opt/cursor/artifacts/rule2_boot.png`, `rule2_trail.png`, `rule2_claim.png`, `rule2_death.png`, `rule2_restart.png`

Sources: `TerritoryIO_Professional_Requirements_GDD.md` v1.0 (FR-TERR-03/04/05/06, FR-KILL-01/02/03, FR-MOVE-05, §8 win/lose/revive, §16 must-have, §18 T01–T04, T06, T08, T09), read with `inkbound/DECISIONS.md` (circular non-lethal rim, death → Restart, revive skipped).

## Verdict

**MATCH**

All nine core rules score **PASS**. No gameplay bug. No code change.

## Matrix

| ID | Rule | Score | Evidence |
|----|------|-------|----------|
| TRAIL | Wet stroke only outside own land. Inside the disk, and on a graze that never clears the body, no committed line. Enemy ink is still outside, so a stroke there keeps growing and does not claim by itself. | **PASS** | `updateInkContact` starts a stroke when the center leaves own ink and seals only after the body has fully left and touches own ink again. Probe: 180 ticks circling inside the start disk, **0** trail points, radius **69.93** (disk 120), share stuck at **0.0103**. Egress onto Tide’s disk grew the stroke for **28** samples on enemy cells; share stayed **0.0103**. Graze back home cleared the stroke and added **0** cells. Browser `rule2_trail.png`: wet line outside the disk, HUD still **1.0%**. |
| CLAIM | Re-entering own ink closes the loop, fills the interior (including enclosed enemy ink), clears the trail, and shows `+%`. | **PASS** | `captureLoop` bridges the stroke onto own ink and fills the winding interior. Smoke `smoke_loop.mjs`: **0.0103 → 0.0276**, pocket steal, majority circuit **0.6715**. Probe square: **0.0103 → 0.0296**, delta **0.0193**, trail length **0**, `firstClaim` true. Enclosed bot disk became owner 1; a disk outside the loop stayed owner 2. Browser: **1.0% → 3.8%**, float **+2.8%**, hint faded (`rule2_claim.png`). 1.0 + 2.8 = 3.8. |
| SELF | After the first seal, crossing your own open trail kills you, clears your ink, and ends the life. A straight run along a fresh stem does not. | **PASS** | `resolveCombat` skips the player’s own line until `playerClaimed`, then tests a swept body against the stroke outside self-grace. Probe, live `Game.tick` after a real seal and age 23s: **"You crossed your own line."**, killer is self, state `over`, cells **0**, still dead after **180** further ticks. The same first square seals instead of dying (share **0.0227**). Smoke: straight stem lives; short early curve lives; the teaching square is forgiven before the first seal and kills after it; a same-tick arrival on own ink seals through a self-clip. This browser life died to Ochre before a self-cross, so the self-cut line was not on screen. |
| ENEMY | A body on another entity’s open trail kills the owner and credits the cutter. Same-tick mutual cuts kill both. | **PASS** | Contact is attacker radius plus half the stroke, excluding the owner’s newest `enemyHeadGracePoints` (4) of arc. Probe: player sweep **"You cut Tide's line."**, Tide’s cells **0**, player lives. Moss placed on the player’s old stroke: **"Moss cut your line."**, state `over`, cells **0**, still dead after **90** ticks. The same geometry at age 5s leaves the player alive (opening safety). Mutual cross at age 40s: both dead, **"Moss cut your line."** and **"You cut Moss's line."** Smoke: opening block, low-share extension, kill after grace. Browser `rule2_death.png`: **"Ochre cut your line."**, You row **0.0%**. |
| BODY | Body against body does not kill. Only a wet stroke kills. A head-on overlap of the fresh stem, inside enemy-head grace, is not a cut. | **PASS** | `resolveCombat` has no body-body test. Probe: coinciding centers, empty trails, both live. Charger overlapping Tide’s head and the graced stem, both live. The same body crossing an older segment of that stroke kills Tide. |
| RIM | Circular rim is non-lethal. The bead slides, stays inside `R − bodyRadius`, and keeps moving. | **PASS** | `Arena.slide` drops the outward component and, on a head-on hit, supplies a tangent so speed does not fall to zero. `moveEntity` never marks a death. Probe: 520 ticks due east, still alive, minimum step **3.194**, max radius **1187.0** (arena 1200, body 13). Smoke: the same radius, plus five headings (0, 0.8, 2.1, −1.4, π/2) with no death, stall, or escape. This browser life ended inland, so the rim was not in the shots. |
| WIN | Owning the whole plane (`winShare` 1) ends the match. One cell short does not. The seal stays sealed. | **PASS** | Step 9 sets `outcome.type = "win"` and title **"The plane is yours."** when `share >= winShare`. Respawn is skipped once the plane is sealed. Probe: share **0.99995** stays `playing`; the last cell makes share **1.0000**, title as above, and 30 further ticks leave every bot dead. A closed rim circuit through `captureLoop` reaches share **1.0000**. Smoke: painted plane wins and does not respawn bots for 8 ticks. This life died at 4.8%, so the win card was not opened. |
| END | Death ends the life. Trail and territory clear. The card shows the cause and final %. Restart is a new disk, not a continuation of the corpse. | **PASS** | Player death sets `state = "over"` and `tick` returns immediately afterward. `clearOwner` zeroes that id. `reset()` builds a new player entity; the corpse stays dead. Probe: after the self-cut, 180 ticks, still dead, cells 0. `reset()` then share **0.0103**, age **0**, empty trail, **3** living bots, `outcome` null, corpse still dead. Smoke: game over does not respawn bots. Browser: You **0.0%**, **"4.8% of the plane."**, then Restart → fresh disk, **1.0%**, Best **4.8%** kept, four living rows (`rule2_restart.png`). |
| REVIVE | No mid-match revive and no continue. The only way back in is Restart, which starts a new life. | **PASS** | `index.html` has one match-end button, **Restart**. The overlay is `display: none` while `hidden`. No `revive` string in `Game.js`, `main.js`, `Hud.js`, or `index.html`. Nothing sets `alive` back to true except a new `Entity`. DECISIONS locks revive as skipped. GDD §16 lists revive as should-have, so its absence is the rule under test, not a miss. |

## Specified exceptions

These are written into the sim. They do not flip a row.

- **Until the first seal, the player’s own line cannot kill them** (`playerFirstClaimSelfImmune`). A pointer square’s closing side often crosses the outbound stem. Immunity ends when that seal lands.
- **For 22s**, self-grace is ×1.85, the self-hit radius scale drops to 0.18, and a stroke shorter than 220 units is ignored. After that window, a real cross kills.
- **Bots cannot cut the player** during 14s, plus up to 8s while share is low. Player cuts and self-cuts still resolve. The browser cut by Ochre landed after that window, on a later open stroke.
- **A same-tick return onto own ink beats a self-clip.** An enemy cut in that same pass still denies the capture, because combat runs before capture.
- **100% ends the run with the win title and Restart.** The GDD’s 6-second reward grab and bonus mini-game are not in this build. DECISIONS and the Phase 0 tick list stop at the banner and a fresh restart.
- **Start disk is about 1.03%** (HUD **1.0%**). The GDD’s ~0.66% figure is a reference number, not this lock.

## Smoke log

Re-run from `/workspace/inkbound` against `21cf6b0`. All exit 0.

| Command | Result | What it locked |
|---------|--------|----------------|
| `node tools/smoke_combat.mjs` | **PASS** | Opening bot safety, low-share extension, bot cut after grace, no false self-kill on a straight stroke, early short-curve forgiveness, first-claim self-cross forgiven, post-claim self-cross kills, same-tick seal ignores a self-clip |
| `node tools/smoke_loop.mjs` | **PASS** | Claim 1.03% → 2.76%; pocket steal; majority circuit 67.15%; graze does not commit; rim slide at 1187; sealed-plane win with no bot respawn; rim circuit share 1.0000; game over does not respawn; sharp hook; first-claim nose; rim slide from five headings |
| `node tools/smoke_vfx.mjs` | **PASS** | `+%` float, three-phase death, scripted seal that survives and emits the float, player self-cut title **"You crossed your own line."** |

Auditor probe (`/tmp/rule2_probe.mjs`, not a repo test) drove `Game.tick` for trail, claim, self-cut, both cut directions, body overlap, rim, the 99.995% / 100% boundary, and reset-as-new-life. **RULE2_PROBE_OK**.

## Browser life

One Chrome life. Fresh profile. Pointer aim plus WASD. Spawn → leave the disk → close one loop → later open stroke cut by Ochre → Restart.

| Moment | HUD | Shot |
|--------|-----|------|
| Start | 1.0%, Best 0.0%, four rows at 1.0%, hint up | `rule2_boot.png`. Princess on the start disk. |
| Just outside | still 1.0% | `rule2_trail.png`. Wet stroke begins at the disk edge. |
| First seal | **3.8%**, float **+2.8%**, hint faded, You leads | `rule2_claim.png`. Filled loop. |
| Cut | overlay **"Ochre cut your line."**, **"4.8% of the plane."**, You **0.0%**, New best 4.8% | `rule2_death.png`. The only action button is **RESTART**. |
| After the click | overlay gone, **1.0%**, Best **4.8%**, four living rows at 1.0% | `rule2_restart.png`. New disk. The hint stays dismissed because this profile already sealed. |

The card has no Revive and no Continue. Restart did not put the 4.8% ink back.

## Bugfix

None. No core rule failed.
