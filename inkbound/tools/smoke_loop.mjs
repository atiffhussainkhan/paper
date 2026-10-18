import { CONFIG } from "../src/config.js";
import { Game } from "../src/sim/Game.js";

const colors = {
  "--ink-player": "#d9452b",
  "--ink-player-wet": "#ff6a4a",
  "--ink-bot-1": "#1f9e94",
  "--ink-bot-1-wet": "#3fd1c4",
  "--ink-bot-2": "#c9962e",
  "--ink-bot-2-wet": "#f2bd4f",
  "--ink-bot-3": "#6f9a3c",
  "--ink-bot-3-wet": "#9cc95c",
};

let heading = 0;
const input = {
  headingFor(current) {
    return heading;
  },
};

const game = new Game(input, colors, CONFIG, () => 0.42);
const player = game.player;
const startShare = game.grid.share(player.id);
console.log("start share", startShare.toFixed(4), "bots", game.bots.length);

const dt = 1 / CONFIG.simHz;
// Phase A: go east out of base
heading = 0;
for (let i = 0; i < 90; i += 1) {
  game.tick(dt);
  if (!player.alive) {
    console.error("FAIL died going out at tick", i, player.deathReason, "age", game.matchAge);
    process.exit(1);
  }
}
console.log("after egress share", game.grid.share(player.id).toFixed(4), "trail", player.trail.points.length, "outside", player.outsideOwnTerritory);

// Phase B: gentle left turn (north then west then south) to close a loop
const turns = [Math.PI / 2, Math.PI, -Math.PI / 2, 0];
for (const target of turns) {
  heading = target;
  for (let i = 0; i < 70; i += 1) {
    game.tick(dt);
    if (!player.alive) {
      console.error("FAIL died during turn", target, "tick", i, player.deathReason, "age", game.matchAge.toFixed(2));
      process.exit(1);
    }
  }
}

const endShare = game.grid.share(player.id);
console.log("end share", endShare.toFixed(4), "outside", player.outsideOwnTerritory, "state", game.state);
if (endShare <= startShare + 0.0005) {
  console.error("FAIL: share did not increase", startShare, endShare);
  process.exit(1);
}
console.log("PASS: scripted claim loop increased territory");
