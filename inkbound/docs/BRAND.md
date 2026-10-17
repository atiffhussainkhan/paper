# Inkbound — Brand

## Name

**Inkbound**. It's one word with a capital *I*. Don't write "InkBound", "Ink Bound", or
"INKBOUND" in body copy. (All caps is fine as a typographic treatment of the wordmark, never
as the spelling.)

*Bound* means two things here: ink that's **bound** to the plane it touches, and a player who
is **bound** to their line until they close it.

## Fantasy

You are a drop of ink on a fresh, unmarked plane. Ink wants to spread. Each time you leave
your mark and come home, the plane remembers the shape you drew and fills it with your color.
Other inks want the same plane. Your open line is a wet stroke, and anyone who crosses it
smears you away.

The core feeling is **calligraphic risk**: you commit to a long, beautiful stroke, knowing it's
exposed until the moment you close it.

Lean into:

- **Stroke and seal.** Trails are brush strokes. Claimed land is a pressed seal.
- **Wet vs. dry.** An open trail is wet (glossy and vulnerable). Owned ground is dry (matte and
  safe).
- **Quiet plane, loud ink.** The arena is calm and dark. Color belongs only to players.

Avoid:

- Paper, folding, origami, notebook, or crayon motifs. These read as imitation of an existing
  territory game.
- Neon or cyber "glow" styling, and purple-to-blue AI gradients.
- Cartoon mascots. The avatar is a bead of ink, not a character.

## Color tokens

The canonical tokens live in `css/style.css` under `:root`. The canvas renderer should read
them at boot so that DOM and canvas never drift:

```js
const css = getComputedStyle(document.documentElement);
const playerInk = css.getPropertyValue('--ink-player').trim();
```

### Surface (the plane)

| Token | Hex | Use |
|-------|-----|-----|
| `--sumi-950` | `#0b0c0e` | Page background and the void outside the arena |
| `--sumi-900` | `#111316` | Arena plane (unclaimed) |
| `--sumi-800` | `#181b1f` | Raised HUD surfaces |
| `--sumi-700` | `#23272c` | Grid hairlines, dividers |
| `--sumi-600` | `#353a41` | Arena rim stroke |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `--bone-100` | `#efe9db` | Primary text, % readout |
| `--bone-300` | `#c9c2b2` | Secondary text |
| `--bone-500` | `#8f897c` | Hints, labels, captions |

### Inks (one per entity)

Each ink has a **dry** value (owned territory, rendered at full opacity) and a **wet** value
(the open trail, a brighter tone of the same hue). Hues are spaced around the wheel and chosen
for separation on dark backgrounds, including for common color-vision deficiencies. Shape
(trail vs. fill) always carries meaning too, so color is never the only signal.

| Entity | Dry token | Dry hex | Wet token | Wet hex |
|--------|-----------|---------|-----------|---------|
| Player — Vermilion | `--ink-player` | `#d9452b` | `--ink-player-wet` | `#ff6a4a` |
| Bot 1 — Tide | `--ink-bot-1` | `#1f9e94` | `--ink-bot-1-wet` | `#3fd1c4` |
| Bot 2 — Ochre | `--ink-bot-2` | `#c9962e` | `--ink-bot-2-wet` | `#f2bd4f` |
| Bot 3 — Moss | `--ink-bot-3` | `#6f9a3c` | `--ink-bot-3-wet` | `#9cc95c` |

Vermilion is the player's color. It's the color of a stamped seal, and it is also the single
accent color in the UI (the Restart button, the "you" row on the leaderboard). Bots must never
be assigned vermilion.

### State

| Token | Hex | Use |
|-------|-----|-----|
| `--state-cut` | `#ff6a4a` | Death/cut flash (same hue as player wet: a cut is a smear) |
| `--state-win` | `#efe9db` | Win banner text on dark |
| `--focus-ring` | `#f2bd4f` | Keyboard focus outline (ochre, visible on all surfaces) |

## Typography

| Role | Family | Notes |
|------|--------|-------|
| Display | **Instrument Serif** (italic) | Wordmark, big % readout, result titles. Calligraphic contrast. |
| UI | **IBM Plex Sans Condensed** | Leaderboard names, buttons, hints. Narrow enough to stay out of the way. |
| Numerals | **IBM Plex Mono** | Percentages in tables, so digits don't jitter as values change. |

All three load from Google Fonts with system fallbacks, so the game still reads cleanly
offline.

## Voice and tone

The voice is terse, calm, and a little literary. The game speaks the way a calligraphy master
would: few words, never cute.

| Moment | Say | Don't say |
|--------|-----|-----------|
| Title | **Inkbound** | "Inkbound.io — the best territory game!" |
| HUD label | *of the plane* | "Territory Captured!!!" |
| Death (self-cut) | **You crossed your own line.** | "Oops! You died lol" |
| Death (cut by bot) | **Tide cut your line.** | "KILLED BY BOT #2" |
| Win | **The plane is yours.** | "VICTORY ROYALE" |
| Restart | **Restart** | "Try again?? 🙏" |
| Hint | *Point to steer. Close the loop to claim.* | "Tap tap tap to win!" |

Rules:

- Use sentence case everywhere except the wordmark.
- Use no emoji or exclamation marks in system copy.
- Name bots by their ink (Tide, Ochre, Moss), not "Bot 1". Bots aren't people, so don't give
  them fake usernames.
- Don't reference any other game in player-facing text, metadata, or alt text. That includes
  "Paper.io", "paper", "like X", and "X-style".

## Wordmark

For now, set "Inkbound" in Instrument Serif Italic in `--bone-100`, with no glyph
substitutions or effects. A small vermilion seal square (`.brand__seal`) may sit to the left
as a mark. A dedicated logo is deferred past Phase 0.
