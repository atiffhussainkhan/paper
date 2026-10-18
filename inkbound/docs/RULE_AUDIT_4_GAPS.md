# Inkbound — RULE4 full requirements gap audit

**Role:** RULE4 Full Requirements Gap Analyst  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Audited tree:** `b8faf77` (handoff-only commit on `21cf6b0`; sim, HUD, and catalog bytes are the REQ1–REQ5 tree)  
**Smokes this pass:** `node tools/run_acceptance.mjs` from `/workspace/inkbound` → `ACCEPTANCE: PASS 6/6` (exit 0)  
**Sources:** GDD v1.0 §16 Must-have MVP (`TerritoryIO_Professional_Requirements_GDD.md`), [FINAL_ACCEPTANCE.md](FINAL_ACCEPTANCE.md), [ACCEPTANCE_MASTER.md](ACCEPTANCE_MASTER.md), REQ1–REQ5 reports, [GRAPHICS_PICKED.md](GRAPHICS_PICKED.md), [DECISIONS.md](../DECISIONS.md), and the web sim under `src/`

This pass scores only the twelve lines under GDD **§16 Must-have MVP**. Each line is **MATCHED** or **NOT**. Shop, revive, and real multiplayer are not on that list. They are not counted as unmatched must-haves, and they are not treated as present.

## Overall

**12 / 12 must-haves MATCHED. 100%.**  
**Unmatched must-haves: none.**

That percentage is the checklist in §16. It is not a Paper.io 2 completeness score.

**Exact copy of Paper.io 2? No.**

## Must-have matrix

| ID | §16 Must-have | Verdict | What the build actually does |
|----|---------------|---------|------------------------------|
| M1 | 360° or documented 4-dir movement | **MATCHED** | Locked 360° steer. Heading chases a desired angle at `steerRate` (`π × 1.72` rad/s). Pointer is a free angle. WASD / arrows are an 8-way bias into that same continuous heading, not a 4-dir grid. Alive entities always step at `playerSpeed` 195 or bot speed. Rim contact slides; it does not stop the bead. |
| M2 | Own territory safety | **MATCHED** | A wet stroke exists only after the body has left its own ink. Inside the disk, no trail is committed. Combat kills only an open stroke. Body against body does not kill. |
| M3 | Trail + loop capture | **MATCHED** | Re-entering own ink closes the loop, flood-fills the interior, steals enclosed enemy ink, clears the stroke, and shows a `+%` float. Browser sessions moved 1.0% to 3.2–7.8%. Smoke: 0.0103 → 0.0276, pocket steal, majority circuit 0.6715. |
| M4 | Self-trail death | **MATCHED** | After the first seal, crossing your own open stroke kills you. Overlay: "You crossed your own line." Territory drops to 0.0%. Smoke: the same square is forgiven before the first seal and kills after it. |
| M5 | Enemy trail cut death | **MATCHED** | A living body on another entity's open stroke kills the owner and credits the cutter. Same-tick mutual cuts kill both. Smoke: opening safety blocks the bot, then the same geometry kills. Browser lives in REQ1 and REQ4 ended on a self-cut, so that session did not show the enemy line on screen. The rule is in `resolveCombat`. |
| M6 | Territory clear on death | **MATCHED** | Death clears the victim's trail and `grid.clearOwner`. The You row goes to 0.0%. Freed cells are neutral. |
| M7 | Bot opponents + names + leaderboard | **MATCHED** | Three named bots at start: Tide (edge-farmer), Ochre (small-looper), Moss (opportunistic-cutter). The board lists You plus those three, sorted by share, with a living/dead state. Dead bots respawn on unowned ground until the plane is sealed. |
| M8 | % score + best % | **MATCHED** | Live share to one decimal ("of the plane"). Best sits under it and is stored on `inkbound.profile.v1`. A worse later run does not replace it. Restart and a full reload keep it. |
| M9 | Run summary + restart | **MATCHED** | Death or win opens one card: cause or "The plane is yours.", final %, new-best or best line, stage credit line, skin chips, **Restart** only. Restart is a fresh 1.0% disk, three living bots, no leftover stroke. |
| M10 | At least 5 cosmetic skins | **MATCHED** | Five, cosmetics only: Seal 0%, Tideglass 2%, Emberline 5%, Nightquarry 10%, Bone 20%. Unlock is best share. Locked chips stay disabled. Equip changes the player figure, orb, and splat. Bots stay Tide / Ochre / Moss. |
| M11 | Original art identity | **MATCHED** | Player-facing name is Inkbound. No Paper.io string in the document. Bitmaps are the Image-repo catalog (Kenney CC0 and OpenGameArt idle plates), not that game's logo, roster, or UI chrome. See the graphics claim below. It is narrower than this row. |
| M12 | Mobile + desktop controls | **MATCHED** | Desktop: mouse aim, plus WASD / arrows. Phone: touch aim from the bead, proven at 375×812 (REQ4 run 5) including a seal, a death card, and Restart. There is no on-screen stick graphic. The GDD allows absolute swipe-to-aim as the mobile primary. |

## Deviations inside MATCHED rows

These do not flip a row to NOT. They are why "matched" is not "identical."

- **M4 is wider than the GDD's grace.** §6 asks for a very short grace at the trail origin so leaving home is not an instant suicide. Inkbound also makes the player's own line non-lethal until the first seal (`playerFirstClaimSelfImmune`), and for 22 seconds it widens self-grace and shrinks the self-hit radius. After that first seal, a real cross still kills.
- **M7 population is 3, not the example crowd.** §7 says "e.g. 8–15". §17's starting number is 10. [DECISIONS.md](../DECISIONS.md) locks 3. The must-have sentence does not set a count, so the row stays MATCHED. A 10-bot lobby is not in this build. Turtle and Reckless personalities from §7 are not in the roster.
- **Start disk is about 1.0%, not ~0.66%.** Smoke start share is 0.0103. The HUD prints 1.0%. §3 and §17 use ~0.5–0.7% / 0.6% as a reference. That number is not a §16 line.
- **M12 has no gamepad and no drawn virtual stick.** §4 lists a controller stick. §16's line is mobile plus desktop, which the touch and keyboard paths cover.
- **M9 has no kill count.** §13's game-over sketch includes kills. §16's line is summary plus restart. Kills are not on the card or the live HUD.
- **M10 is five skins, unlocked only by best %.** There is no shop, chest, daily, or kill challenge. Powers are not attached.

## Exact copy of Paper.io 2?

**No.**

Inkbound is a local web arena with the territory loop (always move, trail, loop, cut, percent, bots, restart, a few cosmetics). Paper.io 2, as specified in the GDD and as shown on the Voodoo site and the Poki "Play Online" build, is a live-service product around that loop. The following are in that product and **not** in this build:

| Not in Inkbound | Where Paper.io 2 / the GDD puts it |
|-----------------|-------------------------------------|
| Online multiplayer, matchmaking, accounts, real human opponents | Store and Poki "Play Online"; GDD §1 non-goal for MVP, §16 Could-have, §19 Phase 4 |
| A crowd of other players (about 8–15) | GDD §7 example and §17 bot count 10. Inkbound has three scripted bots |
| Shop, gold, gems, dual currency, IAP | Home and meta menus; GDD §11 and §16 Could-have |
| Rewarded "start bigger", banners, interstitials | Poki home ("START x5 bigger"); GDD §11 |
| Revive / continue, including an ad revive and "No, thank you" | Poki game-over heart + Revive; GDD §16 Should-have. Inkbound death card is Restart only |
| Home screen with Play, equipped character, shop, events, settings | GDD §8 and §13. Inkbound boots straight into a moving match |
| Country / world-map conquest and copyrighted geography | Paper.io country progress. Inkbound has six original zone names and local credit |
| Character powers and upgrades | GDD §10 and §16 Could-have |
| Weekly events, team mode, replay / ghost | GDD §11 and §16 Could-have |
| Kill counter and coin HUD | GDD §13 in-run HUD and the Poki death heart |
| Settings, colorblind toggle, remap, reduced flash, handedness | GDD §13 and §16 Should-have. Territory uses catalog splat patterns. There is no mode switch |
| Gamepad | GDD §4 input map |
| Music bed that rises with share, UI clicks, crown motif | GDD §14. Inkbound plays three short Web Audio beeps (claim, kill, death) and no music |
| App Store / Play Store client | Voodoo landing page. This tree is a static web folder |
| Paper.io name, logo, cube roster, or UI copy | GDD legal note and [DECISIONS.md](../DECISIONS.md). The page title is Inkbound |
| Official Paper.io 2 production art | See graphics. This game does not ship that art |
| 6-second reward grab on a 100% clear, and an instant clear of every later stage | GDD §8. A sealed plane ends the run. Stage credit adds at most 1.0. Later targets are 1.25, 1.50, and 2.00 |
| Godot playable port | `godot/` capture still returns 0. The web build is the game |

Also absent, and called out so a GO in [ACCEPTANCE_MASTER.md](ACCEPTANCE_MASTER.md) is not read as a finished live-ops game: no `player_id`, currencies, settings blob, or daily streak (§15); no analytics events (§15); no five-minute soak and no 30-second tab-switch test (QA T11). The sealed-plane win title "The plane is yours." is executed in `smoke_loop.mjs`. The browser sessions died before that overlay opened.

Opening fairness is an Inkbound change, not a Paper.io clone detail: bots cannot cut the player during a 14-second window that lengthens while share is low. Player cuts and self-cuts still resolve.

## Graphics — catalog-only, better-or-equal

**Scope of the claim:** equal to or better than a typical paper.io-style **web clone** that draws a flat disc, a solid trail, and a flat arena color. The comparison uses only files already in `assets/catalog/`.

**Not claimed:** equal to or better than official Paper.io 2 art (bespoke 3D characters, country map, Voodoo UI, shop chrome).

Evidence, re-checked by `smoke_images.mjs` on this tree:

- 58 indexed bitmaps, all on disk, hashes matched: background 7, character 15, skin 8, ui 7, vfx 7, terrain 14.
- Every id is bound. [GRAPHICS_PICKED.md](GRAPHICS_PICKED.md) lists the same 58. Source is the Image repo (Kenney CC0, OpenGameArt idle plates). No generated bitmap is in that set.
- The match draws standing catalog figures on catalog orbs, splat-stamped territory, six distinct stage plates, and catalog HUD and VFX marks.

That is the whole graphics claim. The figures are catalog plates (princess, knight, dragon, Kenney toons), not a commissioned Inkbound cast. [BRAND.md](BRAND.md) still says the avatar is a bead of ink and not a cartoon mascot. The running game draws those standing plates anyway. That is a brand-doc drift. It does not turn the catalog into Paper.io art, and it does not widen the better-or-equal claim.

## What this percentage is not

| Bucket | In this build? | Counts toward the 100%? |
|--------|----------------|-------------------------|
| §16 Must-have (12 lines) | 12 MATCHED | Yes. 12/12 |
| §16 Should-have: stages, skin unlocks, crown | Present (stage credit, best-% unlocks, leader medal) | No |
| §16 Should-have: revive, settings, colorblind mode, kill callout as a browser-proven feed | Revive and settings absent. Patterns exist. Kill slash is in `smoke_vfx.mjs` | No. Not unmatched must-haves |
| §16 Could-have and Won't: powers, shop, events, real multiplayer, replay, open world, loot boxes, pay-to-win map % | Absent, on purpose | No |

## Evidence used

- Code: `src/config.js`, `src/sim/Movement.js`, `src/sim/Combat.js`, `src/sim/Game.js`, `src/sim/Capture.js`, `src/input/Input.js`, `src/meta/Skins.js`, `src/render/Hud.js`, `src/render/Sfx.js`, `index.html`.
- Prior browser sessions, not re-shot in this pass: REQ1 (`req1_*.png`), REQ4 (five full lives including 375×812), FINAL_ACCEPTANCE, REQ2 catalog shots.
- This pass re-ran the six smokes. All exited 0.
