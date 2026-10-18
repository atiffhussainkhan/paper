# Inkbound — SYS4 gameplay parity

**Role:** SYS4 System Analyst + Implementer  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Tree scored:** working tree on that branch after the seven-bot roster, the match kill feed, and the home “Next ink challenge” panel. Smokes: `node tools/run_acceptance.mjs` → `ACCEPTANCE: PASS 6/6`.  
**Shots:** `/opt/cursor/artifacts/sys4_home.png`, `sys4_match.png`, `sys4_feed.png`, `sys4_death.png`, `sys4_mobile.png`, `sys4_mobile_home.png`

This is a local web arena. It does not open a socket, matchmake, or present other humans. Nothing in the UI says multiplayer.

## Exact copy of Paper.io 2

**58.8%** (11.75 / 20).

The percentage is the table below. Each row is the player-visible product, scored 0, a fraction, or 1. Rounding the total to a whole number would be 59. The figure used here is the unrounded ratio.

| # | What Paper.io 2 puts in front of a player | Score | What this build does |
|---|------------------------------------------|------:|----------------------|
| 1 | Always moving, free aim | 1.0 | 360° steer, constant speed, non-lethal rim |
| 2 | Trail outside your ink, loop to claim | 1.0 | Browser life sealed 1.0% → 2.6%, then 4.2% on a later hook. Smoke still seals a full plane |
| 3 | Your line and an enemy line can end you. Bodies do not | 1.0 | Death card in Chrome: “You crossed your own line.” Combat smoke still covers an enemy cut |
| 4 | Percent of the map | 1.0 | One decimal, “of the plane” |
| 5 | Leaderboard during the match | 1.0 | Eight rows, portraits, live percents, lead mark. You fell to 0.0% on death and stayed on the board |
| 6 | The death card says who ended the life | 1.0 | Kicker **LAST LINE**, then the sentence in the large italic. Same life: “You crossed your own line.” / “2.9% of the plane.” |
| 7 | Play again from a fresh start | 1.0 | Restart on the card. Prior lives on this branch already returned a 1.0% disk |
| 8 | Cuts announced while you are still playing | 1.0 | Left-side feed. Chrome showed “Mulberry crossed its own line.”, Tide, Bramble, and the player’s own line |
| 9 | A crowd of other inkers (about 8–15; GDD start 10) | 0.6 | **7 bots**, all named, three roles repeating: edge-farmer (Tide, Bramble, Mulberry), small-looper (Ochre, Soot), opportunistic-cutter (Moss, Lichen). Short of 8–15. They are scripts, and the count is `botCount` |
| 10 | Home with Play and the routes around a match | 0.8 | Play, best, stage, next ink, World map, Ink, How to play. Shop and events are absent |
| 11 | Characters earned by playing | 0.7 | Five inks, gates 0 / 2 / 5 / 10 / 20. This Chrome life opened Tideglass at 2.9%. Chests and kill-count challenges are absent |
| 12 | The next unlock is visible before you play | 1.0 | Home panel: “Next ink challenge / Tideglass / Reach 2.0% of the plane. 2.0% to go.” |
| 13 | Shop, gold, gems | 0 | Could-have in the GDD. A price list would be a fake shop. The next-ink panel is the earn surface |
| 14 | Revive / continue | 0 | Should-have in the GDD. [DECISIONS.md](../DECISIONS.md) keeps death → summary → Restart. The card has Restart, Map, and Home |
| 15 | Ads, “start bigger” | 0 | Absent |
| 16 | Online players | 0 | Absent on purpose. Bots only |
| 17 | Character powers | 0 | Cosmetics only |
| 18 | A world map of places you conquer | 0.4 | Six original shores are in the shell (SYS2). Real countries are out. This pass confirmed the World map button on home and Map on the death card, and did not re-walk the atlas |
| 19 | The product’s art and music | 0.25 | Catalog figures, orbs, and splat patterns. Three beeps. No music bed, no official Paper.io art |
| 20 | Settings, accounts, gamepad | 0 | Absent |

**11.75 / 20 = 58.8%.**

A match-only slice (rows 1–9) is **8.6 / 9 = 95.6%** of the territory loop, with the missing slice being the size of the crowd. That slice is not the exact-copy number.

## What changed for this pack

- `botCount` default is **7**. The named roster is Tide, Ochre, Moss, Bramble, Soot, Lichen, Mulberry. `Game.botRoster()` clamps the config to that list, so `botCount: 3` is the Phase 0 ring again. An eighth bot was left off: seven already sit in the 6–8 band, and the catalog has no further figure that is not already the player’s Seal plate.
- Roles stay the three brains. They repeat across the seven names. `Entity.role` is what `roleForBot` reads.
- Spawn angles are even around the existing far ring (`botInitialSpawnRadius` 920), so the opening disk stays a teaching space.
- Sim cost, 20 seconds at 60 Hz, Node, same machine: **0.202 ms/tick at 3 bots, 0.967 ms/tick at 7**. The frame budget is 16.7 ms. Seven bots are about 6% of that budget before drawing. That is why the default moved up.
- Kill feed: the last three cut lines, on a solid panel, during the match. The death card keeps a **Last line** kicker over the sentence that was already the cause of death.
- Leaderboard: eight rows, opaque panel (`rgb(17 19 22 / 0.92)`), scrolls if the viewport is short. Chrome at 1280×800 showed every name without covering the spawn disk. At 375×812 the eight names wrap to two columns and the feed sits under them.
- The character gallery stays on the home screen. In a match, `body[data-mode="playing"]` forces `[data-hud="cast"]` to `display: none`. The match DOM measured that strip at 0×0. It is not on the playfield.
- Home **Next ink challenge** names the next locked ink and the best-% gate. At a fresh profile that is Tideglass at 2.0%. When best reaches 20, the panel says the set is open. There is no price.
- Revive was not added. Shop was not added.

## Browser session (Chrome headless, `http://127.0.0.1:8788/`)

| Shot | What was on screen |
|------|--------------------|
| `sys4_home.png` | Title, Seal, Best 0.0%, Stage 1 · Quiet Plane, next ink Tideglass at 2.0%, Play, World map / Ink / How to play. Page text has no shop, revive, or multiplayer |
| `sys4_match.png` | Spawn disk, 1.0%, eight leaderboard rows (You, Tide, Bramble, Soot, Lichen, Mulberry, Moss, Ochre), all 1.0%. Cast strip `display: none`, title hidden |
| `sys4_feed.png` | Open trail, feed “Mulberry crossed its own line.”, board with Lichen leading at 1.7% and the other six bots named |
| `sys4_death.png` | **LAST LINE** / “You crossed your own line.” / “2.9% of the plane.” / New best, Tideglass unlocked. You row 0.0%. Restart, Map, Home |
| `sys4_mobile.png` | 375×812. Eight names, three feed lines, the bead on the red disk, hint visible, score panel at the bottom. Cast strip hidden |
| `sys4_mobile_home.png` | 375×812 title with the same next-ink line |

One life on that URL: 1.0% → seal 2.6% → later seal 4.2% in an earlier attempt → the recorded death was a self-cross at **2.9%** after the first seal, with the feed and the card both quoting “You crossed your own line.”

## Still absent, so this is not a copy

Online play, accounts, a human crowd, shop, gems, ads, revive, powers, settings, gamepad, a music bed, official art, and copyrighted geography. The bot count is 7, not 10–15.
