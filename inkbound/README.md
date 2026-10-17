# Inkbound

Steer a bead of living ink across a pale circular plane. Leave your ground, draw a line, and
close the loop to make everything inside it yours. A rival who crosses your open line cuts it,
and so do you if you cross your own.

Inkbound is an original browser .io game. This repository is the **Phase 0 prototype**: one
player against three bots in a Web Canvas build with no dependencies.

## Run it

The game is plain ES modules, so you don't need a build step. You do need to serve it over
HTTP, because most browsers (Chrome, Edge, Safari) block `<script type="module">` from
`file://` URLs. If you double-click `index.html` you'll most likely get a blank screen and a
CORS error in the console.

From the `inkbound/` folder, run either of these:

```bash
# Python 3 (preinstalled on macOS / most Linux)
python3 -m http.server 8080

# or Node, if you prefer
npx --yes serve -l 8080 .
```

Then open <http://localhost:8080/>.

Firefox can sometimes load modules from `file://` when `security.fileuri.strict_origin_policy`
is relaxed, but that isn't a supported way to run the game.

## Controls

| Input | Action |
|-------|--------|
| Mouse / touch | Point where you want to go. Your ink turns smoothly toward the pointer (360°). |
| `W` `A` `S` `D` / arrow keys | Bias your heading in that direction (combine for diagonals). |
| Restart button | After a death or a win, click or tap **Restart** to begin a new match. |

You **never stop moving**. You can only choose where to go, not whether to go. The arena rim
doesn't hurt you: run into it and you slide along the edge.

## How a round works

1. You spawn on a small disk of your own ink.
2. Leave it, and you start drawing a **trail**. While a trail is open, you're vulnerable.
3. Get back onto your own ink, and the loop closes: everything you enclosed becomes yours.
4. If anyone (you included) crosses an open trail, that trail's owner is **cut** and their
   ink is wiped from the plane.
5. The HUD shows how much of the plane you hold. Reach 100% to win the round.

## Phase 0 scope

**In scope**

- An always-moving avatar with 360° continuous steering
- Owned territory plus a vulnerable trail
- Closing a loop flood-fills the enclosed area
- Self-trail kill and enemy trail-cut kill
- 3 simple bots (no networking, no real multiplayer)
- Territory % HUD, leaderboard, and Restart
- A circular arena with non-lethal walls

**Out of scope for Phase 0:** revive, shop, skins, powers, ads, events, stages, and real PvP.

The acceptance checklist is in [`docs/PHASE0_ACCEPTANCE.md`](docs/PHASE0_ACCEPTANCE.md).

## Project layout

```text
inkbound/
├── index.html            Shell: canvas#game + #hud root, loads src/main.js
├── css/style.css         Brand tokens, layout, HUD styling
├── src/
│   ├── main.js           Boot + requestAnimationFrame loop
│   ├── config.js         Tunables (change only via playtest notes)
│   ├── sim/              Arena, territory, trail, capture, combat, bots, game state
│   ├── render/           Canvas renderer + DOM HUD
│   └── input/            Pointer / keyboard → heading
├── assets/               Static assets
├── docs/
│   ├── ARCHITECTURE.md   Module ownership + locked tick order
│   ├── BRAND.md          Name, fantasy, color tokens, tone
│   └── PHASE0_ACCEPTANCE.md
└── DECISIONS.md          Locked product decisions
```

## Brand

**Inkbound** is original IP. Player-facing copy, art, names, and skins must not reference or
imitate any other territory game. See [`docs/BRAND.md`](docs/BRAND.md) for the palette, type,
and voice.
