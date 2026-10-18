# SYS3 — Full game flow

**Status:** `done`  
**Verdict:** **PASS** — the shell is a game, and the match stays frozen off the plane.  
**Runnable URL:** `http://127.0.0.1:8765/` (cwd `/workspace/inkbound`, `python3 -m http.server 8765 --bind 127.0.0.1`)  
**Branch:** `cursor/inkbound-final-dev-c3dd`

Cold load is the title. Play is the only way into a ticking match. Home, the world map, how to play, and the ink picker do not advance `matchAge` or move beads. A life ends on `dead` or `won`, then Restart / Play again, Map, or Home.

## Flow

```text
title ──Play──────────────► playing ──cut──► dead ──Restart──► playing
  │                            │               ├── Map ──► map
  │                            │               └── Home ─► title
  │                            └── seal ─► won ──Play again──► playing
  │                                         ├── Map ──► map
  │                                         └── Home ─► title
  ├── World map ─► map ──Play──► playing
  │                 ├── Ink ─► ink   (game.state stays "map")
  │                 └── Home ─► title
  ├── Ink ─► ink             (game.state stays "title" when opened from home)
  │           ├── Play ──► playing
  │           ├── World map ─► map
  │           └── Home ─► title
  └── How to play ─► howto ──Play──► playing
                       └── Home ─► title
```

Enter or Space on the title, when focus is not on a button or the ink chips, also starts the match.

## Hooks

| Hook | Values |
|------|--------|
| `game.state` | `title` \| `map` \| `howto` \| `playing` \| `dead` \| `won` |
| `data-screen` | `title` \| `map` \| `howto` \| `ink` \| `playing` \| `dead` \| `won` |
| `document.body.dataset.mode` | same as the visible screen, including `ink` |
| `window.InkboundFlow.state` | live `game.state` |
| `window.InkboundFlow.screen` | visible screen |
| `window.InkboundFlow.show(name)` | `title`, `map`, `howto`, `ink`, or `playing` |
| `window.InkboundFlow.mountMap(fn)` | SYS2 replaces the plane board |

`ink` is a screen, not a sim state. While the picker is up, `game.state` stays `title` or `map`, so the match stays frozen. Treat the map as showing only when `[data-screen="map"]` is not hidden, or when `InkboundFlow.screen === "map"`.

End cards set `data-screen` on the overlay: `dead` or `won`. `#hud` carries `data-screen="playing"` only during a live match.

### SYS2 map mount

The shell owns the page chrome. SYS2 owns the board.

- Section: `[data-screen="map"]`. `game.state` is `map` while that section is the screen.
- Board: `[data-map="board"][data-map-hook="sys2"]`.
- Leave `[data-map="play"]`, `[data-map="home"]`, and `[data-map="ink"]` in place.
- Replace the board with `InkboundFlow.mountMap(function (board, status, catalog) { ... })`. Pass `null` to restore the shell painter.
- `status` is the stage status from `getStageStatus` (`stageIndex`, `stageName`, `progressPct`, `stage`).

The default board paints the six stage plates from catalog backgrounds and terrain (`catalog.stageLayers`). It does not invent a level select. Play always cold-spawns the current plane. Sealed plates wear the catalog stage medal. Ahead plates stay shut.

## Tick gate

`Game.tick` returns immediately unless `state === "playing"`. The frame loop also returns before the accumulator while the view is not the match, and it does not step the sim on `dead` or `won`.

Checked in Chrome on the local server:

| Screen | `game.state` | After a wait |
|--------|----------------|--------------|
| Title, cold | `title` | position `0`, `matchAge` `0`, trail length `0` |
| World map | `map` | same position, same age |
| Ink opened from the map | `map`, screen `ink` | same position, same age |
| How to play | `howto` | same position, same age |
| Play | `playing` | age `0.433`, bead moved |
| Home from the match | `title` | frozen again |
| Death card | `dead` | frozen; title "You crossed your own line."; Restart and Home |
| Win card | `won` | frozen; "The plane is yours."; Play again and Home |
| Map from the win card | `map` | frozen |

`node tools/run_acceptance.mjs`: **PASS 6/6**. `smoke_meta` holds `map` and `howto` and asserts they do not move the bead. `smoke_loop` expects `won` / `dead` instead of `over`.

## Screens

Art is catalog only: stage plates, terrain marks, the brand seal, the stage medal, and the existing skin figures. No generated bitmaps.

- **Title.** Play gate still holds. Routes: World map, Ink, How to play. The compact ink picker and the figure strip stay on the home screen and off the playfield.
- **World map.** Six planes. Current plane reads Now. Sealed planes read Sealed. The rest read Shut.
- **How to play.** Steer, wet line, close the loop, self-cut, enemy cut, rim, and the seal. Play and Home.
- **Ink.** Equipped figure, blurb, the next earn line, and the same picker. Play, World map, Home.
- **Win.** Kicker "Sealed", title "The plane is yours.", line "Every cell on the plane carries your ink.", catalog medal, Play again, Map, Home. The card stays bone-topped when a seal also opens inks (`border-top-color` `rgb(239, 233, 219)`).

## Shots

`/opt/cursor/artifacts/sys3_title.png`  
`/opt/cursor/artifacts/sys3_map.png`  
`/opt/cursor/artifacts/sys3_howto.png`  
`/opt/cursor/artifacts/sys3_ink.png`  
`/opt/cursor/artifacts/sys3_play.png`  
`/opt/cursor/artifacts/sys3_death.png`  
`/opt/cursor/artifacts/sys3_win.png`  
`/opt/cursor/artifacts/sys3_title_mobile.png`  
`/opt/cursor/artifacts/sys3_map_mobile.png`  
`/opt/cursor/artifacts/sys3_howto_mobile.png`

Desktop is 1280×800. Phone shots are 375×812. Play, the map actions, and the how-to actions sit inside that phone viewport.

## Out of scope

The Godot stub still ends a life on `over`. This pass does not port the shell there. Online play, a shop, and a revive are not part of this screen flow.
