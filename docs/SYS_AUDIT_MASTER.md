# SYS5 — Master audit

**Role:** SYS5 System Analyst — integrate, verify, ship  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Game bytes:** `46063314ffd4a880891a72e8dcc380a169c2172e`  
**Runnable URL:** `http://127.0.0.1:8765/` (`python3 -m http.server 8765 --bind 127.0.0.1`, cwd `/workspace/inkbound`). `GET /` returned **200** and the page contains the World map screen.  
**Gate:** `node tools/run_acceptance.mjs` → **ACCEPTANCE: PASS 6/6**. No smoke files beyond those six.

SYS2, SYS3, and SYS4 had already landed on one linear tip (`1ef5274`, `28d35e4`, `4606331` on top of SYS1 `d06cdea`). Nothing needed a conflict merge.

## Does it fulfill every requirement?

**NO.**

The twelve GDD §16 must-haves are in. The world map is in. A full local life was played. The rest of the GDD is not.

## Exact copy of Paper.io 2?

**NO.**

SYS4 scored the player-visible product **11.75 / 20 = 58.8%** in [SYS_AUDIT_4_PARITY.md](SYS_AUDIT_4_PARITY.md). That figure is their table. It is not a claim that this build is Paper.io 2.

Still absent:

- Online multiplayer, matchmaking, accounts, and real human opponents
- A crowd of about 8–15 rivals (this build has **7** named bots)
- Shop, gold, gems, IAP
- Ads and “start bigger”
- Revive / continue
- Character powers
- Settings, a colorblind toggle, and gamepad
- A music bed and official Paper.io art
- Copyrighted countries
- A numeric kill counter (the feed and the Last line are sentences, not a tally)
- Replay, weekly events, analytics
- A playable Godot port
- A public host (this proof is the local URL)

## World map

**YES. Embedded.**

It is a screen in the same document as the match, not another page and not an iframe. Cold load stays on `http://127.0.0.1:8765/`. World map sets `game.state` to `map` and `data-screen` to `map`. Six shores are buttons inside `[data-map="board"]`. `matchAge` stayed 0 and the bead stayed at the origin. Rimward Marsh stayed locked. Choosing Quiet Plane left the state at `map`. Home returned to the title still labeled Quiet Plane. Play was still required.

Art is catalog parchment, skies, terrain, and the minimap ring. No country outlines.

## Browser life

Chrome, fresh profile, 1280×800, that URL.

| Step | What happened |
|------|----------------|
| Title | `game.state` `title`, `matchAge` 0, bead at the origin |
| World map | Same URL, 0 iframes, six shores, match still frozen |
| Select region | Locked tap on Rimward Marsh did not change the next arena. Quiet Plane stayed selected |
| Home | Title: Stage 1 · Quiet Plane |
| Play | Eight living rows at 1.0% |
| Claim | Share left 1.0% and sealed (recorded life **3.4%**) |
| Death | “You crossed your own line.” / “3.4% of the plane.” You row 0.0%. Tideglass opened. Best 3.4%. Quiet Plane 7% |
| Home | Title again. Stage line kept the 7% credit |

Shots: `/opt/cursor/artifacts/sys5_title.png`, `sys5_map.png`, `sys5_region.png`, `sys5_home.png`, `sys5_play.png`, `sys5_claim.png`, `sys5_death.png`, `sys5_return.png`.

## Requirement table

YES means the player-facing rule is in this tree. NO means it is absent. A blocked row (no server, no payment, no licensed art) is still NO.

Sources: [SYS_AUDIT_1_GAPS.md](SYS_AUDIT_1_GAPS.md), re-scored against `4606331`, the six smokes, and the life above.

### Must-have (GDD §16)

| ID | Requirement | Result |
|----|-------------|--------|
| M1 | 360° movement, always moving | **YES** |
| M2 | Own territory is safety | **YES** |
| M3 | Trail and loop capture | **YES** |
| M4 | Self-trail death | **YES** |
| M5 | Enemy trail cut | **YES** |
| M6 | Territory clears on death | **YES** |
| M7 | Named bots and a leaderboard | **YES** |
| M8 | Percent and best % | **YES** |
| M9 | Run summary and restart | **YES** |
| M10 | At least five cosmetic skins | **YES** |
| M11 | Original art identity | **YES** |
| M12 | Mobile and desktop controls | **YES** |

**12 / 12 YES.**

### Should-have

| ID | Requirement | Result |
|----|-------------|--------|
| SH-STAGE | Stage credit across runs | **YES** |
| SH-REVIVE | One continue per run | **NO** |
| SH-UNLOCK | Skins earned by play | **YES** |
| SH-CROWN | Crown on the leader | **YES** |
| SH-KILLOUT | A cut callout | **YES** |
| SH-KILLCOUNT | A kill count on the HUD and the card | **NO** |
| SH-SETTINGS | Settings screen | **NO** |
| SH-COLOR | Colorblind mode switch | **NO** |
| SH-MAP | A zone map you can open | **YES** |
| SH-HOME | Brand, character, best, stage, Play | **YES** |
| SH-HOME-NAV | Home entries for map, shop, and settings | **NO** |
| SH-OVERVIEW | Death zooms out over the plane | **NO** |
| SH-WINBONUS | 100% clears the active zone, then a celebration | **NO** |

Map, Ink, and How to play are on the title. Shop and Settings are not, so SH-HOME-NAV stays NO. A sealed plane still adds at most 1.0 of stage credit, so a zone whose target is above 1.0 does not clear in one perfect run.

### Could-have and won’t

| ID | Requirement | Result |
|----|-------------|--------|
| CH-SHOP | Local cosmetic shop and soft currency | **NO** |
| CH-IAP | Gems, IAP, battle pass | **NO** |
| CH-POWERS | Powers and upgrades | **NO** |
| CH-EVENTS | Weekly events and team mode | **NO** |
| CH-TRIALS | A list of every best-% goal | **NO** |
| CH-MP | True multiplayer | **NO** |
| CH-REPLAY | Replay or a ghost | **NO** |
| CH-ADS | Ads and rewarded start | **NO** |
| W-OPEN | Open world stays out | **YES** |
| W-LOOT | Loot-box gambling stays out | **YES** |
| W-P2W | Pay-to-win map % stays out | **YES** |

Home shows the next ink only (Emberline after this life). That is not the full Seal-to-Bone list.

### Paper.io-class expectations

| ID | Expectation | Result |
|----|-------------|--------|
| PIO-HOME | Home, then Play, match frozen until then | **YES** |
| PIO-MAP | A map of places with progress | **YES** |
| PIO-SHOP | A shop on the home screen | **NO** |
| PIO-REVIVE | One continue | **NO** |
| PIO-CROWD | About 8–15 rivals | **NO** |
| PIO-KILLS | Cuts visible in the match and on the card | **YES** |
| PIO-ART | Official Paper.io 2 art and music | **NO** |

PIO-MAP is six original shores. Real countries are not in the build, and they should not be.

### Functional rows

| ID | Requirement | Result |
|----|-------------|--------|
| FR-MOVE-01 | Always move while alive | **YES** |
| FR-MOVE-02 | 360° steer, limited turn rate | **YES** |
| FR-MOVE-03 | Mouse, WASD, touch aim | **YES** |
| FR-MOVE-03b | Gamepad | **NO** |
| FR-MOVE-04 | One speed inside and outside | **YES** |
| FR-MOVE-05 | Circular arena, non-lethal rim | **YES** |
| FR-MOVE-06 | Follow camera | **YES** |
| FR-TERR-01 | Grid ownership | **YES** |
| FR-TERR-02 | Start disk | **YES** |
| FR-TERR-03 | Trail outside own ink | **YES** |
| FR-TERR-04 | Close, fill, convert, `+%` | **YES** |
| FR-TERR-05 | Steal and ignore a degenerate loop | **YES** |
| FR-TERR-06 | Death clears the stroke and the ink | **YES** |
| FR-TERR-07 | Percent and a share board | **YES** |
| FR-KILL-01 | A cut credits the cutter | **YES** |
| FR-KILL-02 | Own trail kills after the first seal | **YES** |
| FR-KILL-03 | Bodies do not kill | **YES** |
| FR-KILL-04 | Immune while the stroke is closed | **YES** |
| FR-KILL-05 | Dissolve, burst, fade, then the card | **YES** |
| FR-KILL-06 | Kill counter, plus the callout | **NO** |
| FR-AI-01 | Named bots, no real PvP | **YES** |
| FR-AI-02 | About 8–15 rivals, respawn on open ground | **NO** |
| FR-AI-03 | Expand, cut, and scale with share | **YES** |
| FR-AI-04 | Farmer, hunter, turtle, and reckless | **NO** |
| FR-AI-05 | No teleport cuts; opening fairness holds | **YES** |
| FR-AI-06 | Real multiplayer later | **NO** |
| FLOW-SCREENS | Splash, home, match, continue, summary, meta menus | **NO** |
| FLOW-LOSE | Cut and self-cut. The rim does not kill | **YES** |
| META-CREDIT | Partial share counts toward the zone | **YES** |
| STAGE-FIELDS | Radius, bot count, rewards, and music per zone | **NO** |
| AUDIO-STING | Claim, kill, and death beeps | **YES** |
| AUDIO-REST | Crown motif, UI clicks, music that rises with % | **NO** |
| PERSIST-CORE | Best, stage, skins, equipped | **YES** |
| PERSIST-EXTRA | Currencies, settings, daily streak, player id | **NO** |
| TECH-TICK | Fixed sim tick | **YES** |
| TECH-ORDER | Same-tick mutual cut kills both | **YES** |
| TECH-ANALYTICS | Shipped analytics events | **NO** |
| TECH-GODOT | Playable Godot port | **NO** |
| QA-T01–T09 | Loop, cuts, clear, rim, mutual cut, bot spawn | **YES** |
| QA-T06 | 100% plus the zone-clear bonus | **NO** |
| QA-T10 | Colorblind mode, owners still distinct | **NO** |
| QA-T11 | A long hidden tab does not explode the sim | **YES** |
| QA-T12 | Ad revive cancel | **NO** |

FR-AI-04: the seven bots repeat edge-farmer, small-looper, and opportunistic-cutter. Turtle and reckless are not separate brains. FR-AI-02: respawn on unowned ground is in; the count is 7, so the row is NO. QA-T11 is the frame clamp (`maxFrameTime` 0.2s). This pass did not hide the tab for 30 seconds. QA-T06’s win title is in `smoke_loop.mjs`. The browser life died on a self-cross, and a perfect plane does not clear a zone whose target is above 1.0.

## Track notes

| Track | Report | What landed |
|-------|--------|-------------|
| SYS1 | [SYS_AUDIT_1_GAPS.md](SYS_AUDIT_1_GAPS.md) | Gap list at the title gate. Must-haves already 12/12 |
| SYS2 | [SYS_AUDIT_2_WORLDMAP.md](SYS_AUDIT_2_WORLDMAP.md) | Embedded atlas, stage lock, best % line |
| SYS3 | [SYS_AUDIT_3_FLOW.md](SYS_AUDIT_3_FLOW.md) | Title, map, how to play, ink, win card. Shop and revive left out |
| SYS4 | [SYS_AUDIT_4_PARITY.md](SYS_AUDIT_4_PARITY.md) | 7 bots, kill feed, Last line, next ink. Shop and revive left out |

## How to play the proof

```bash
cd /workspace/inkbound
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. World map, then an open shore, then Home, then Play.
