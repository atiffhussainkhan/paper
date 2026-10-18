# SYS1 — Full requirements gap closure

**Role:** SYS1 System Analyst  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Tip audited:** `31afde070b1eb418aac8976fbdbe80bc5d7fac67` (title / Play gate)  
**Sources:** `TerritoryIO_Professional_Requirements_GDD.md` v1.0, [RULE_AUDIT_MASTER.md](RULE_AUDIT_MASTER.md), [ACCEPTANCE_MASTER.md](ACCEPTANCE_MASTER.md), [DECISIONS.md](../DECISIONS.md), and the web tree under `inkbound/`  
**Probe this pass:** Node loaded `CONFIG`, `Game`, `STAGES`, `SKINS`, and `PROFILE_DEFAULTS`, then called `holdForTitle()` and `tick`. `index.html` was scanned for Play, shop, revive, settings, map, and kill copy. No new Chrome life. Prior REQ and RULE browser shots are from before this gate (`21cf6b0` and earlier) and are not reused as proof of the title screen.

Scores are only **MATCHED**, **MISSING**, or **BLOCKED**.

## Verdict

The twelve GDD §16 must-haves are still **MATCHED**. The title gate closed the two RULE1 partials (the match no longer starts itself, and the figure strip is no longer on the playfield). The build is still not a Paper.io-class meta game.

What a player can feel is missing, in impact order:

| Rank | Gap | Score | Owner |
|------|-----|-------|-------|
| 1 | Arena crowd is 3 rivals. The genre band is about 8–15. | **MISSING** | **SYS4** |
| 2 | No zone map. Stage credit is a counter, not a place you can see or pick. | **MISSING** | **SYS2** |
| 3 | Death has Restart and Home. No continue. | **MISSING** | **SYS4** |
| 4 | No shop, and nothing earned in a run except best % and stage credit. | **MISSING** | **SYS3** |
| 5 | Home has Play, best, stage text, and ink. It has no Shop, Settings, or map entry. | **MISSING** | **SYS3** (entries) / **SYS2** (map) |
| 6 | No kill count on the HUD or the death card. | **MISSING** | **SYS4** |
| 7 | No settings screen and no colorblind switch. Splat patterns are always on. | **MISSING** | **SYS3** |
| 8 | A sealed plane does not clear a zone whose target is above 1.0, and there is no win celebration beyond the card. | **MISSING** | **SYS2** (clear rule) / **SYS4** (celebration) |

Real online play, Paper.io art, copyrighted countries, ad revive, and a gem store stay **BLOCKED**. They are not assigned.

## What changed at the title gate

`96b2e03` / `9d14947` / `31afde0` landed after the RULE1–RULE5 reports. Those reports still say the first frame is a moving match and that there is no home screen. That is stale.

Checked in this tree:

- Cold load sets `game.state` to `title`. `tick` returns immediately. A one-step probe left `matchAge` at 0.
- Play calls `reset()` and is the cold spawn. Home, on the death card and in the match, returns to the title.
- The figure cast is inside `.title-screen` (`index.html`). It is not a strip on the arena.
- At `max-width: 640px`, `.hud-hint` is `display: block` (`css/style.css`). The old `display: none` phone miss is gone.
- Buttons in the page: Play, Home (in-match menu), Restart, Home (death card). No Shop, Settings, Revive, or map control.

[DECISIONS.md](../DECISIONS.md) still locks 3 bots and “revive skipped.” That lock is why earlier audits scored both as N/A. This pass scores the GDD and the Paper.io-class bar. SYS4 updates that file in the same change as the feature. Do not leave the lock contradicting the build.

Uncommitted edits from other agents were in the working tree while this file was written (a shell draft, a higher `botCount`, a kill-feed hook). They are not in the score. The score is the committed game at `31afde0`.

## How a row was scored

- **MATCHED** — the player-facing rule is in this tree.
- **MISSING** — it is absent, and this static repo can grow it with catalog art and `localStorage`.
- **BLOCKED** — shipping it this pass would fake a server, a payment, an ad network, or someone else’s art.

A wider teaching grace, a 1.0% start disk, and catalog plates instead of a bead-only avatar stay inside MATCHED rows. They are not new work.

## Must-have (GDD §16)

**12 / 12 MATCHED.** Unmatched must-haves: none.

| ID | Requirement | Score | At `31afde0` |
|----|-------------|-------|----------------|
| M1 | 360° or documented 4-dir movement | **MATCHED** | Pointer is a free angle. WASD / arrows are an 8-way bias into `steerRate`. Alive bodies keep moving. |
| M2 | Own territory safety | **MATCHED** | A wet stroke exists only outside owned ink. Combat kills an open stroke. Body against body does not. |
| M3 | Trail + loop capture | **MATCHED** | Re-entry flood-fills, steals enclosed ink, clears the stroke, and raises a `+%` float. |
| M4 | Self-trail death | **MATCHED** | After the first seal, crossing your own stroke kills you. The card says “You crossed your own line.” |
| M5 | Enemy trail cut death | **MATCHED** | A body on another open stroke kills the owner. Same-tick mutual cuts kill both. |
| M6 | Territory clear on death | **MATCHED** | Death clears the stroke and `grid.clearOwner`. The row falls to 0.0%. |
| M7 | Bot opponents + names + leaderboard | **MATCHED** | Tide, Ochre, and Moss are named and listed. The count is not this line. See CROWD. |
| M8 | % score + best % | **MATCHED** | One decimal, live and on the title. `bestPct` survives Restart and reload. |
| M9 | Run summary + restart | **MATCHED** | Cause or “The plane is yours.”, final %, best, stage line, Restart. Home is extra and works. |
| M10 | At least 5 cosmetic skins | **MATCHED** | Seal 0, Tideglass 2, Emberline 5, Nightquarry 10, Bone 20. Best % only. Colors only. |
| M11 | Original art identity | **MATCHED** | Title is Inkbound. Catalog plates only. No Paper.io string in `index.html`. |
| M12 | Mobile + desktop controls | **MATCHED** | Mouse aim, WASD / arrows, touch aim. The phone hint is visible at ≤640px. |

Deviations that do not flip a must-have:

- Start disk is about 1.03% (HUD 1.0%). The GDD reference is ~0.66% / 0.6%. The disk is still a small visible patch. Leave it.
- Self-grace is wider than the GDD’s short origin grace (`playerFirstClaimSelfImmune`, 22s teaching window). After the first seal, a real cross still kills.
- M7’s sentence does not set a population. Three named bots satisfy the must-have and fail the crowd expectation below.

## Should-have (GDD §16 and the screens that feed them)

| ID | Requirement | Score | Owner | Evidence |
|----|-------------|-------|-------|----------|
| SH-STAGE | Stage progression with cumulative credit | **MATCHED** | — | Six zones in `Stages.js`. Run peak is added to `stageCredit`. Quiet Plane target 0.50 through Unsealed Horizon 2.00. HUD bar and title line both read it. |
| SH-REVIVE | Revive / continue, one per run | **MISSING** | **SYS4** | Death card is Restart and Home. `tick` stays frozen in `over`. Nothing sets `alive` back without a new `Entity`. Ad revive is **BLOCKED**, not this row. |
| SH-UNLOCK | Skin unlock challenges | **MATCHED** | — | The shipped challenge is best %. Thresholds 0 / 2 / 5 / 10 / 20. Kill-count and daily vectors are not this row. |
| SH-CROWN | Crown for the leader | **MATCHED** | — | Leader row uses the catalog medal. World crown is in `Vfx` / `smoke_vfx.mjs`. |
| SH-KILLOUT | Kill callout when you cut a rival | **MATCHED** | — | `Vfx.onPlayerKill` raises a short “{name} cut” pop. `smoke_vfx.mjs` covers it. |
| SH-KILLCOUNT | Kill count on the HUD and the summary | **MISSING** | **SYS4** | No kill field on the profile, the HUD, or the card. `index.html` has no kill copy. Coins stay **BLOCKED** with the ad/IAP rows. |
| SH-SETTINGS | Settings screen | **MISSING** | **SYS3** | No settings control. `prefers-reduced-motion` is already honored in CSS. |
| SH-COLOR | Colorblind mode switch | **MISSING** | **SYS3** | Territory already stamps catalog splat patterns, so owners are not color-only. There is no switch. |
| SH-MAP | Zone map the player can open and read | **MISSING** | **SYS2** | Stages swap a background plate and a credit number. There is no map. Copyrighted countries are **BLOCKED**. |
| SH-HOME | Home: brand, character, best, stage, Play | **MATCHED** | — | Title shows Inkbound, the equipped figure, Best, “Stage N · name · pct%”, Play, and the ink picker. |
| SH-HOME-NAV | Home entries for map, shop, settings | **MISSING** | **SYS3** | Those controls are absent. SYS2 builds the map. SYS3 builds the buttons and the shop/settings panels. |
| SH-OVERVIEW | Death / summary can show the whole plane | **MISSING** | **SYS4** | Camera keeps the follow view. The card covers the arena. There is no zoom-out. |
| SH-WINBONUS | 100% clears the active zone, then a short celebration | **MISSING** | **SYS2** clears the zone. **SYS4** plays the beat. | `winShare` 1 already ends the run with “The plane is yours.” Credit added is at most 1.0, so Cinnabar Reach (1.25), Obsidian Shallows (1.50), and Unsealed Horizon (2.00) survive a perfect plane. No 6-second grab. |

## Could-have (GDD §16)

| ID | Requirement | Score | Owner | Why |
|----|-------------|-------|-------|-----|
| CH-SHOP | Local cosmetic shop, soft currency from runs | **MISSING** | **SYS3** | No currency key on `inkbound.profile.v1`. No shop screen. |
| CH-IAP | Premium gems, IAP, battle pass | **BLOCKED** | — | No payment processor in this static tree. Do not invent a gem balance. |
| CH-POWERS | Character powers and upgrades | **MISSING** | — | Not in this wave. Powers rewrite combat. Leave the classic loop alone. |
| CH-EVENTS | Weekly live events and team mode | **BLOCKED** | — | Needs a clock and other humans this repo does not have. Do not fake a global countdown. |
| CH-TRIALS | A local list of the best-% goals you already earn | **MISSING** | **SYS3** | Optional panel on the home shop/settings side. It only restates Seal → Bone. It is not a server event. |
| CH-MP | True multiplayer, matchmaking, accounts | **BLOCKED** | — | No game server. Bots stay the rivals. |
| CH-REPLAY | Replay / share ghost | **MISSING** | — | Not in this wave. |
| CH-ADS | Banners, interstitials, rewarded “start bigger”, ad revive | **BLOCKED** | — | No ad SDK. Do not paint a fake rewarded button. |

## Won’t (GDD §16)

| ID | Requirement | Score | Note |
|----|-------------|-------|------|
| W-OPEN | Open world | **MATCHED** | One circular plane. Correctly absent. |
| W-LOOT | Loot-box gambling | **MATCHED** | No chests. Correctly absent. |
| W-P2W | Pay-to-win map percentage | **MATCHED** | Share is only earned in the arena. Correctly absent. |

## Paper.io-class expectations

These are the rows a player would notice next to that game. They are not a second must-have list, and they are not a license to copy it.

| ID | Expectation | Score | Owner | Honest limit |
|----|-------------|-------|-------|----------------|
| PIO-HOME | Home, then Play, match frozen until then | **MATCHED** | — | Done at this tip. |
| PIO-MAP | A map of zones with progress on each | **MISSING** | **SYS2** | Six original names already exist: Quiet Plane, Rimward Marsh, Sumi Basin, Cinnabar Reach, Obsidian Shallows, Unsealed Horizon. Use those and the catalog plates. Real countries and copyrighted geography are **BLOCKED**. |
| PIO-SHOP | A shop on the home screen | **MISSING** | **SYS3** | Soft currency only, cosmetics only, catalog art only. |
| PIO-REVIVE | One continue after death | **MISSING** | **SYS4** | Free, once per run. The lost ink stays lost. Meta credit is not paid twice. |
| PIO-CROWD | Enough rivals that the plane feels occupied | **MISSING** | **SYS4** | `botCount` is 3. `ENTITY_SPECS` has You, Tide, Ochre, Moss. `initialAngles` has three numbers. A fourth bot would spawn at `NaN`. Tuning baseline in the GDD is 10. The catalog has nine standing figures, so unique plates run out at player + 8 rivals. Target **8** named rivals. A repeated plate with a new ink is allowed if someone pushes toward 10. Fifteen unique characters are **BLOCKED** on art. |
| PIO-KILLS | Kills visible while you play and on the card | **MISSING** | **SYS4** | The slash pop is not a counter. |
| PIO-ART | Official Paper.io 2 characters, logo, UI chrome | **BLOCKED** | — | Do not fetch or redraw that art. Image catalog and Inkbound names only. |

## Functional requirements outside the §16 checkboxes

| ID | GDD | Score | Note |
|----|-----|-------|------|
| FR-MOVE-01 | Always move while alive | **MATCHED** | `playerSpeed` 195. Title and `over` do not tick. |
| FR-MOVE-02 | 360° steer, limited turn rate | **MATCHED** | `steerRate` is `π × 1.72`. |
| FR-MOVE-03 | Mobile swipe-or-stick, desktop mouse + WASD | **MATCHED** | Touch aim and mouse aim are the primaries. A drawn stick is optional in the GDD and is not required. |
| FR-MOVE-03b | Controller left stick | **MISSING** | No gamepad path. Not assigned this wave. |
| FR-MOVE-04 | Speed by surface, powers may change it | **MATCHED** | One speed inside and outside. That matches the GDD’s “often equal.” Power multipliers wait on powers, which are not this wave. |
| FR-MOVE-05 | Circular arena, non-lethal rim | **MATCHED** | Radius 1200. Rim slides. |
| FR-MOVE-06 | Follow camera, look-ahead, limited view | **MATCHED** | `cameraLookAhead` 120. View height 1000 on a 2400-wide plane. |
| FR-TERR-01 | Grid ownership, null = neutral | **MATCHED** | `TerritoryGrid`. Owner 0 is unclaimed. |
| FR-TERR-02 | Start disk in the skin color | **MATCHED** | Radius 120. Skin supplies dry / wet / pattern. |
| FR-TERR-03 | Trail outside own ink, with width | **MATCHED** | `trailWidth` 11. |
| FR-TERR-04 | Close, fill, convert, clear, `+%` | **MATCHED** | `captureLoop`. |
| FR-TERR-05 | Positive area, own-cross = death, enemy paint converts | **MATCHED** | Degenerate loops are ignored. Steal is in `smoke_loop.mjs`. |
| FR-TERR-06 | Trail gone, death VFX, ink fades to neutral | **MATCHED** | Three-phase death in `Vfx`. |
| FR-TERR-07 | Percent, leaderboard by share | **MATCHED** | One decimal. Sort is share, then id. |
| FR-KILL-01 | Cut an open trail, credit the cutter | **MATCHED** | `killedBy` on the entity. The HUD does not tally it. |
| FR-KILL-02 | Own trail kills, short origin grace | **MATCHED** | Grace is longer than the GDD asks. The kill still exists. |
| FR-KILL-03 | Body vs body does not kill | **MATCHED** | No body-body test in `resolveCombat`. |
| FR-KILL-04 | Immune while the stroke is closed | **MATCHED** | No open trail inside owned ink. |
| FR-KILL-05 | Dissolve, burst, fade, then Game Over | **MATCHED** | Steps 1–3 and the card exist. Step 4 (zoom out) and the continue offer are SH-OVERVIEW and SH-REVIVE. |
| FR-KILL-06 | Kill counter, optional coins, callout | **MISSING** | Counter is SH-KILLCOUNT. Coins **BLOCKED**. Callout **MATCHED**. |
| FR-AI-01 | Named bots and a board, not real PvP | **MATCHED** | |
| FR-AI-02 | About 8–15 rivals, respawn on unowned ground only | **MISSING** | **SYS4.** Respawn already refuses owned ground and a sealed plane. The population does not. |
| FR-AI-03 | Survive, expand, cut, scale with player % | **MATCHED** | `botDifficultyCurve` uses age and share. Opening safety stays. |
| FR-AI-04 | Farmer, hunter, turtle, reckless | **MISSING** | **SYS4.** Tide is the farmer, Ochre the small looper, Moss the cutter. Turtle and reckless are absent. |
| FR-AI-05 | No teleport cuts, delayed reactions | **MATCHED** | Keep this when the crowd grows. Opening fairness stays. |
| FR-AI-06 | Real multiplayer later | **BLOCKED** | Same ruleset, no sockets. |
| FLOW-SCREENS | Splash, home, match, continue, summary, meta menus | **MISSING** | Home, match, and summary exist. Continue, shop, settings, and the map do not. Owners above. |
| FLOW-LOSE | Cut, self-cut. Wall death is not the rule. | **MATCHED** | |
| META-CREDIT | Partial share counts toward the zone | **MATCHED** | Peak share, not only the death share. |
| STAGE-FIELDS | Theme, radius, bot count, rewards, music per zone | **MISSING** | **SYS2** for the map and the 100% clear. Radius, bot count, and music do not change per zone today. Do not vary bot count per zone in this wave; SYS4 owns one crowd. |
| AUDIO-STING | Claim, kill, death | **MATCHED** | Three Web Audio beeps in `Sfx.js`. |
| AUDIO-REST | Crown motif, UI clicks, music that rises with % | **MISSING** | Not assigned. No licensed music, and no Paper.io audio. |
| PERSIST-CORE | best, stage index, stage progress, skins, equipped | **MATCHED** | `inkbound.profile.v1`. |
| PERSIST-EXTRA | `player_id`, currencies, settings, `daily_streak` | **MISSING** | **SYS3** adds a soft-currency field and a settings blob. `player_id` and a server streak are **BLOCKED**. |
| TECH-TICK | Fixed sim tick, render aside | **MATCHED** | 60 Hz, `maxFrameTime` 0.2, 8 steps. |
| TECH-ORDER | Same-tick mutual cut | **MATCHED** | Both die. Combat runs before capture. |
| TECH-ANALYTICS | `run_start`, `kill`, `revive`, `iap`, … | **BLOCKED** | No collector. Do not pretend events are shipped. |
| TECH-GODOT | Playable Godot port | **MISSING** | Not a SYS2–SYS5 web task. `godot/` capture is still a stub. The web tree is the game. |
| QA-T01–T09 | Loop, self-cut, enemy cut, clear, rim, mutual cut, bot spawn off fill | **MATCHED** | Covered by `smoke_loop.mjs` and `smoke_combat.mjs` on earlier tips. Not re-run as a browser life this pass. |
| QA-T06 | Reach 100% and the bonus | **MISSING** | The win title is in `smoke_loop.mjs`. The bonus and the zone clear are SH-WINBONUS. |
| QA-T10 | Colorblind mode, owners still distinct | **MISSING** | Patterns exist. The mode switch does not. **SYS3.** |
| QA-T11 | Background / foreground resume | **MATCHED** | The sim clamps a long frame. A 30s tab-switch was not performed this pass. |
| QA-T12 | Ad revive cancel returns home | **BLOCKED** | There is no ad. Home already returns from the death card without one. |

## Owner map

Implement only the rows with your id. Catalog art only. No Paper.io names, logos, or UI copy. No network calls.

### SYS2 — Zone map

Build an original map of the six zones already in `Stages.js`. Open it from home. Show each zone’s name, catalog plate, and credit. A sealed plane (`outcome.type === "win"`) clears the **active** zone immediately, including when `completionTarget` is above 1.0. It does not skip the rest of the atlas.

Do not draw countries, flags, or real coastlines. Do not add bots, a shop, or a continue button.

Likely files: `src/meta/Stages.js`, `src/main.js`, `index.html`, `css/style.css`. If `src/shell/` already holds the map contract, extend that instead of starting a second board.

### SYS3 — Home entries, local shop, settings

Add Shop and Settings on the title, plus a control that opens SYS2’s map. Shop: one soft currency, earned from a finished run, spent on cosmetics you already have art for. No gems, no prices that buy map %. Settings: a colorblind emphasis toggle on top of the splat patterns, a reduced-flash toggle, and mute for the existing beeps. A trials list may restate the five best-% unlocks. It must not show a live-event timer.

Persist new fields on `inkbound.profile.v1` without dropping unknown keys.

Likely files: `index.html`, `css/style.css`, `src/main.js`, `src/meta/Profile.js`, `src/meta/Skins.js`. If `src/shell/` already holds the screen contract, hang Shop and Settings on it.

### SYS4 — Gameplay parity

This is the match, not the menus.

Raise the living rival count to **8**, named, each on its own ink, using standing catalog figures only. Cover farmer, hunter, turtle, and reckless across that roster. Keep Tide, Ochre, and Moss. Respawn only on unowned ground. Keep the opening window in which bots cannot cut the player.

`Game.reset` indexes `initialAngles[index]` and `ENTITY_SPECS[index + 1]`. Both are length 3 today. Extend them or the extra rivals spawn at `NaN` and never respawn. `TerritoryGrid` is constructed with `botCount + 1` owners; ids must stay inside that count array. Add original ink tokens. The phone board has to stay usable at 375px.

One continue per run. The player comes back on a small disk on unowned ground. Their old ink stays cleared. Bots are not reset. A second death in that same run does not offer continue. No ad, no “start bigger.”

Show a kill count in the match and on the card. Keep the existing cut pop. On death, ease the camera out so the lost plane is visible under the card. On a sealed plane, play a short celebration on the card SYS2 uses to clear the zone. Do not add a 6-second currency grab.

Update the revive row and the “3 bots” row in `DECISIONS.md` in the same change.

Likely files: `src/config.js`, `src/sim/Game.js`, `src/sim/Bots.js`, `src/sim/TerritoryGrid.js`, `src/render/Hud.js`, `src/render/Renderer.js`, `index.html`, `css/style.css`, `DECISIONS.md`.

### SYS5 — Integrate, do not invent

SYS5 does not build the map, the shop, the continue, or the crowd. Wait until SYS2, SYS3, and SYS4 have landed, fold them onto one tip, and re-score this table in `docs/SYS_AUDIT_MASTER.md`. A row that is still absent stays **MISSING**. A **BLOCKED** row stays blocked. Do not mark online play or Paper.io art as done.

### Shared files

`index.html`, `css/style.css`, `src/main.js`, `src/render/Hud.js`, and `DECISIONS.md` are touched by more than one owner. Keep edits inside the feature you were given.

### Not in this wave

Powers, replay, gamepad, a music bed, Godot, analytics, accounts, ads, IAP, and real multiplayer. Building any of them is out of scope for SYS2–SYS5.

## Graphics claim (unchanged)

Equal to or better than a flat paper.io-style web clone, using the 58 catalog bitmaps only. Not equal to official Paper.io 2 art. [BRAND.md](BRAND.md) still says the avatar is a bead, while the match draws standing plates. That is a doc drift. It is not a reason to add new art.

## What this audit did not re-prove

Smokes were not re-run. No Chrome session was played through Play → claim → death. The title freeze is a Node probe, not a screenshot. QA T11’s 30-second tab switch was not performed. Treat earlier REQ passes as evidence for the loop, and this file as evidence for what the title-gate tree still lacks.
