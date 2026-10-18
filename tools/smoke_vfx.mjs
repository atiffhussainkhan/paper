import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONFIG } from "../src/config.js";
import { Game } from "../src/sim/Game.js";
import { SKINS } from "../src/meta/Skins.js";
import {
  VFX_TIMING,
  Vfx,
  formatCaptureDelta,
  retainUnownedCells,
} from "../src/render/Vfx.js";

const colors = {
  "--sumi-950": "#0b0c0e",
  "--bone-100": "#efe9db",
  "--state-cut": "#ff6a4a",
  "--ink-player": "#d9452b",
  "--ink-player-wet": "#ff6a4a",
  "--ink-bot-1": "#1f9e94",
  "--ink-bot-1-wet": "#3fd1c4",
  "--ink-bot-2": "#c9962e",
  "--ink-bot-2-wet": "#f2bd4f",
  "--ink-bot-3": "#6f9a3c",
  "--ink-bot-3-wet": "#9cc95c",
};

// Headless stand-in so territory ghosts can be built without a browser.
globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: "",
          beginPath() {},
          rect() {},
          fill() {},
          clearRect() {},
        };
      },
    };
  },
};

const ctx = {
  save() {},
  restore() {},
  drawImage() {},
};

function claimUnowned(grid, ownerId, count) {
  let claimed = 0;
  for (let index = 0; index < grid.cells.length && claimed < count; index += 1) {
    if (grid.cells[index] === 0 && grid.setOwnerAtIndex(index, ownerId)) claimed += 1;
  }
  return claimed;
}

assert.equal(formatCaptureDelta(0.012), "+1.2%");
assert.equal(formatCaptureDelta(0.1256), "+12.6%");
assert.equal(formatCaptureDelta(0.00042), "+0.04%");
assert.equal(formatCaptureDelta(0.00001), "+0.01%");
assert.equal(formatCaptureDelta(0), "+0.0%");
assert.match(formatCaptureDelta(0.033), /^\+\d+\.\d+%$/);
assert.deepEqual(retainUnownedCells([0, 1, 2, 3], [1, 0, 2, 0]), [1, 3]);

for (const rel of [
  "../src/render/Vfx.js",
  "../src/render/Renderer.js",
  "../src/render/Hud.js",
  "../src/sim/Game.js",
  "../css/style.css",
]) {
  const text = readFileSync(new URL(rel, import.meta.url), "utf8");
  assert.equal(/paper\.io/i.test(text), false, rel);
}
const rendererSrc = readFileSync(new URL("../src/render/Renderer.js", import.meta.url), "utf8");
const gameSrc = readFileSync(new URL("../src/sim/Game.js", import.meta.url), "utf8");
const hudSrc = readFileSync(new URL("../src/render/Hud.js", import.meta.url), "utf8");
assert.equal(rendererSrc.includes("new Vfx("), true);
assert.equal(rendererSrc.includes("this.vfx.drawUnder("), true);
assert.equal(rendererSrc.includes("this.vfx.drawOver("), true);
assert.equal(gameSrc.includes('emit("capture"'), true);
assert.equal(gameSrc.includes('emit("death"'), true);
assert.equal(gameSrc.includes("drainEvents("), true);
assert.equal(hudSrc.includes('"is-lead"'), true);

// Crown follows share. Equal seals: lowest id. A nudge under the switch
// margin does not move it; a real lead does.
{
  const game = new Game({ headingFor: () => null }, colors, CONFIG, () => 0.42);
  const vfx = new Vfx(colors, CONFIG, () => 0.5);
  vfx.updateCrown(game, 0.016);
  assert.equal(vfx.crown.entityId, game.player.id, "tie crown stays with You");

  const bot = game.bots[0];
  assert.equal(claimUnowned(game.grid, bot.id, 10) >= 10, true);
  vfx.updateCrown(game, 0.016);
  assert.equal(vfx.crown.entityId, game.player.id, "margin holds the crown");

  assert.equal(claimUnowned(game.grid, bot.id, 800) >= 800, true);
  assert.ok(game.grid.share(bot.id) > game.grid.share(game.player.id) + VFX_TIMING.crownSwitchMargin);
  vfx.updateCrown(game, 0.016);
  assert.equal(vfx.crown.entityId, bot.id, "crown moves to the share leader");
}

// Death hook: snapshot trail + cells, then Vfx plays dissolve, burst, fade.
// Reclaimed cells leave the ghost. Respawning the bot does not end the run.
{
  const game = new Game({ headingFor: () => null }, colors, CONFIG, () => 0.42);
  const bot = game.bots[0];
  const wet = bot.wetColor;
  bot.trail.begin({ x: bot.position.x, y: bot.position.y });
  bot.trail.add({ x: bot.position.x + 48, y: bot.position.y }, true);
  bot.markDead(`${bot.name} crossed its own line.`, bot);
  game.tick(1 / CONFIG.simHz);

  assert.equal(game.state, "playing");
  assert.equal(game.bots.filter((entity) => entity.alive).length, CONFIG.botCount);
  assert.ok(CONFIG.botCount >= 6 && CONFIG.botCount <= 8, "arena crowd stays in the 6–8 band");
  assert.equal(new Set(game.bots.map((entity) => entity.role)).size, 3);
  assert.ok(game.killFeed.some((line) => line.text.includes(bot.name)));
  assert.equal(bot.trail.points.length, 0, "sim trail cleared after the death snapshot");

  const vfx = new Vfx(colors, CONFIG, () => 0.25);
  vfx.update(game, 1 / CONFIG.simHz);
  assert.ok(vfx.dissolves.some((item) => item.color === wet && item.points.length >= 2));
  assert.ok(vfx.rings.length >= 1);
  assert.ok(vfx.particles.length >= 1);
  const ghost = vfx.ghosts.find((item) => item.color === bot.color);
  assert.ok(ghost, "territory fade keeps the dead ink");
  assert.ok(ghost.cells.length > 0);

  const stolen = ghost.cells[0];
  game.grid.cells[stolen] = game.player.id;
  vfx.drawGhost(ctx, ghost);
  assert.equal(ghost.cells.includes(stolen), false, "reclaimed cell leaves the fade");
}

// Skinned player death still carries that ink into the burst.
{
  const skin = SKINS.find((entry) => entry.id === "nightquarry");
  const game = new Game({ headingFor: () => null }, colors, CONFIG, () => 0.42, { playerSkin: skin });
  const player = game.player;
  player.trail.begin({ x: 0, y: 0 });
  player.trail.add({ x: 40, y: 0 }, true);
  player.markDead("You crossed your own line.", null);
  game.tick(1 / CONFIG.simHz);
  assert.equal(game.state, "dead");
  assert.equal(game.outcome.title, "You crossed your own line.");

  const vfx = new Vfx(colors, CONFIG, () => 0.5);
  vfx.update(game, 1 / CONFIG.simHz);
  assert.ok(vfx.dissolves.some((item) => item.color === skin.wet));
  assert.equal(vfx.rings.some((ring) => ring.color === colors["--state-cut"]), true);
  assert.ok(vfx.ghosts.some((item) => item.color === skin.dry));

  game.reset();
  vfx.update(game, 1 / CONFIG.simHz);
  assert.equal(vfx.dissolves.length, 0, "new grid clears leftover death juice");
  assert.equal(vfx.ghosts.length, 0);
  assert.equal(vfx.crown.entityId, game.player.id);
}

// Scripted seal: capture event becomes a +X.X% float and nothing else claims it.
{
  let heading = 0;
  const game = new Game({ headingFor: () => heading }, colors, CONFIG, () => 0.42);
  const player = game.player;
  const startShare = game.grid.share(player.id);
  const dt = 1 / CONFIG.simHz;
  heading = 0;
  for (let i = 0; i < 90; i += 1) game.tick(dt);
  for (const target of [Math.PI / 2, Math.PI, -Math.PI / 2, 0]) {
    heading = target;
    for (let i = 0; i < 70; i += 1) game.tick(dt);
  }
  if (!player.alive) {
    console.error("FAIL died during scripted seal", player.deathReason);
    process.exit(1);
  }
  assert.ok(game.grid.share(player.id) > startShare + 0.0005);
  const playerCaptures = game.events.filter((event) => event.type === "capture" && event.isPlayer);
  assert.ok(playerCaptures.length >= 1);
  assert.ok(playerCaptures.every((event) => event.delta > 0 && Number.isFinite(event.position.x)));
  assert.ok(game.lastCapture && game.lastCapture.delta > 0);

  const vfx = new Vfx(colors, CONFIG, () => 0.5);
  vfx.update(game, 0.016);
  assert.equal(vfx.floats.length, playerCaptures.length);
  assert.equal(vfx.floats[0].text, formatCaptureDelta(playerCaptures[0].delta));
  assert.match(vfx.floats[0].text, /^\+\d+\.\d+%$/);

  vfx.update(game, VFX_TIMING.floatDuration);
  assert.equal(vfx.floats.length, 0, "floats expire");
}

// drawCrown must not throw once a leader exists. Catalog spark art evaluates
// crown.age on the first frames; a missing local used to kill the rAF loop.
{
  const vfx = new Vfx(colors, CONFIG, () => 0.5);
  vfx.crown.entityId = 1;
  vfx.crown.age = 0.12;
  const game = {
    entities: [{ id: 1, alive: true, radius: 13, wetColor: colors["--ink-player-wet"] }],
  };
  const ctx = {
    save() {},
    restore() {},
    translate() {},
    scale() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    arc() {},
    stroke() {},
    fill() {},
    drawImage() {},
  };
  vfx.drawCrown(ctx, game, () => ({ x: 10, y: 20 }));
}

// Player kill feedback: catalog slashes + kill pop label.
{
  const vfx = new Vfx(colors, CONFIG, () => 0.33, null);
  vfx.onDeath({
    entityId: 2,
    isPlayer: false,
    victimName: "Tide",
    killedByIsPlayer: true,
    killerPosition: { x: 120, y: -40 },
    position: { x: 130, y: -35 },
    trail: [{ x: 100, y: -30 }, { x: 125, y: -32 }],
    trailWidth: CONFIG.trailWidth,
    color: colors["--ink-bot-1"],
    wetColor: colors["--ink-bot-1-wet"],
    cells: [],
  }, null);
  assert.ok(vfx.killPops.some((pop) => pop.text.includes("Tide")));
  assert.ok(vfx.particles.some((p) => p.sprite === "cutSlash"));
}

console.log("PASS: capture floats, death juice, crown, kill feedback");
