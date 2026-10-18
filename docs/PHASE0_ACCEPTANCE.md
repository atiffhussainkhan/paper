# Inkbound — Phase 0 acceptance checklist

Phase 0 is accepted only when every box below is ticked **in a real browser**, served over
HTTP (`python3 -m http.server 8080` from `inkbound/`). Passing unit tests or a clean console
on load doesn't count on its own. Each item names what to do and what you should see.

Record the result for each item as **pass**, **fail**, or **not run**. Mark an item "not run"
if nobody actually performed it, and never tick a box that wasn't run.

- **Browser / OS:**
- **Commit:**
- **Tester:**
- **Date:**

## 0. Boot

- [ ] **Loads clean.** Open `http://localhost:8080/`. The arena renders within 2 s, and the
      console shows no errors or 404s (fonts falling back while offline is fine).
- [ ] **Full-bleed.** The canvas fills the viewport with no scrollbars. Resizing the window
      re-fits the canvas without stretching the image or blurring it on HiDPI screens.
- [ ] **Brand.** The tab title is "Inkbound". No player-facing text, alt text, or meta tag
      mentions any other game.

## 1. Always move (360° steering)

- [ ] **Never stops.** Without touching any input, the player avatar keeps moving from
      spawn. It never comes to a standstill at any point during a match.
- [ ] **Pointer steering.** Moving the mouse (or dragging on touch) turns the heading smoothly
      toward the pointer through the full 360°. You never see 4- or 8-way snapping.
- [ ] **Keyboard steering.** WASD / arrow keys bias the heading, and a combination such as
      `W`+`D` steers diagonally.
- [ ] **Non-lethal rim.** Steer straight into the arena edge. The avatar slides along the rim
      and survives. It never stops dead or gets stuck, and it never leaves the circle.

## 2. Territory and trail

- [ ] **Starting ground.** The player spawns on a small disk of their own ink (dry `--ink-player`).
- [ ] **Trail starts outside.** As soon as the avatar leaves its own territory, a trail
      (wet `--ink-player-wet`) is drawn behind it.
- [ ] **No trail at home.** While the avatar is moving inside its own territory, no trail
      is emitted.
- [ ] **Trail is visually distinct.** You can tell an open trail from owned ground at a glance
      by shape and brightness, not only by hue.

## 3. Loop fill (capture)

- [ ] **Simple loop.** Leave home, draw a rough arc, and re-enter your territory. The area
      enclosed by the trail and your existing territory fills with your ink, and the trail
      disappears.
- [ ] **Concave / long loop.** Draw a large U-shaped loop. The whole enclosed region fills,
      and nothing leaks outside the loop.
- [ ] **Rim-clipped loop.** Make a loop that runs along the arena rim. The fill stays inside
      the circle and doesn't bleed past the edge.
- [ ] **Steal.** Enclose part of a bot's territory. The enclosed cells become yours, and the
      bot's % drops by the same amount.

## 4. Kills

- [ ] **Self-trail kill.** Leave home and cross your own open trail (not the last few samples
      just behind your head). You die, and the overlay names the cause ("You crossed your
      own line.").
- [ ] **No false self-kill.** Turning sharply (tight curve) without actually crossing your
      older trail does **not** kill you. This exercises the `selfGracePts` grace window.
- [ ] **You cut a bot.** Drive across a bot's open trail. That bot dies, and its trail and
      territory are cleared from the plane.
- [ ] **A bot cuts you.** Let a bot cross your open trail. You die, and the overlay names
      the bot by its ink (for example, "Tide cut your line.").
- [ ] **Safe when home.** A bot crossing the spot where you *were*, after your loop has already
      closed, doesn't kill you. Only open trails are vulnerable.

## 5. Bots (3)

- [ ] **Exactly 3.** At match start there are 3 bots, each in its own ink (Tide, Ochre, Moss),
      and none of them uses vermilion.
- [ ] **They play.** Each bot leaves its territory, draws loops, and visibly gains %. None of
      them sits still or orbits forever.
- [ ] **They can die.** Bots die from self-cuts and from your cuts.
- [ ] **Count maintained.** After a bot dies, a replacement spawns on unowned ground, never
      on or overlapping owned territory, so there are 3 living bots again.

## 6. HUD

- [ ] **% readout.** The large readout shows the player's share of the arena plane (cells
      inside the circle only) to one decimal place. It updates within a frame of a capture.
- [ ] **% is correct.** Right after spawn, the readout matches the start-disk area divided by
      the arena area (within ±0.5 percentage points of the value in `src/config.js`).
- [ ] **Leaderboard.** It lists the player plus 3 bots, sorted by %, with a swatch in each
      entity's ink. The player's row is highlighted, and dead rows dim until they respawn.
- [ ] **Readable.** The HUD is legible over both empty plane and every ink color, at a 375 px
      wide viewport as well as on desktop.
- [ ] **Doesn't block input.** Steering with the pointer still works when the pointer is over
      the HUD readouts.

## 7. Death and restart (no revive)

- [ ] **Death summary.** When the player dies, the simulation stops for the player and an
      overlay appears with the cause and the final %. No revive or continue option is offered.
- [ ] **Restart.** Clicking or tapping **Restart** starts a fresh match: new spawn, a fresh
      start disk, 3 fresh bots, a reset %, and no leftover trails or territory.
- [ ] **Repeatable.** Ten restarts in a row cause no slowdown, duplicate bots, duplicate
      event listeners (for example, steering that becomes doubled), or console errors.
- [ ] **Win.** Reaching 100% (lower the target temporarily in `src/config.js` to test it)
      shows the win overlay ("The plane is yours.") with a working **Restart**.

## 8. Stability

- [ ] **Five-minute soak.** Let a match run with bots for 5 minutes. The frame rate holds
      steady (no visible degradation), and memory doesn't climb unbounded in DevTools.
- [ ] **Tab switch.** Switching tabs away and back for 30 s doesn't cause a huge
      simulation jump, teleporting, or a crash.

## Out of scope (must NOT appear)

- [ ] No revive, shop, skins, powers, ads, events, stages, or networking UI or code paths.
