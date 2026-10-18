import { CONFIG } from "../src/config.js";
import { Trail } from "../src/sim/Trail.js";
import { resolveCombat } from "../src/sim/Combat.js";

function entity(id, name, isPlayer, x, y) {
  const e = {
    id,
    name,
    isPlayer,
    position: { x, y },
    previousPosition: { x: x - 4, y },
    radius: CONFIG.bodyRadius,
    alive: true,
    trail: new Trail(CONFIG.trailWidth, CONFIG.trailSampleSpacing, CONFIG.maxTrailPoints),
    markDead(reason, killedBy) {
      this.alive = false;
      this.deathReason = reason;
      this.killedBy = killedBy;
    },
  };
  return e;
}

// Bot crossing player trail during grace must NOT kill player.
const player = entity(1, "You", true, 0, 0);
player.trail.begin({ x: -40, y: 0 });
for (let x = -32; x <= 80; x += 8) player.trail.add({ x, y: 0 }, true);

const bot = entity(2, "Moss", false, 20, -30);
bot.previousPosition = { x: 20, y: -30 };
bot.position = { x: 20, y: 30 };

resolveCombat([player, bot], CONFIG, 3);
if (!player.alive) {
  console.error("FAIL: player died during hunt grace:", player.deathReason);
  process.exit(1);
}
console.log("PASS: hunt grace blocks bot cut");

// After grace, same cut kills.
player.alive = true;
player.deathReason = "";
resolveCombat([player, bot], CONFIG, 30);
if (player.alive) {
  console.error("FAIL: player should die after grace");
  process.exit(1);
}
console.log("PASS: bot cut works after grace");

// Forward motion along own fresh trail should not self-kill.
const p2 = entity(1, "You", true, 0, 0);
p2.trail.begin({ x: 0, y: 0 });
for (let i = 1; i <= 40; i += 1) p2.trail.add({ x: i * 8, y: 0 }, true);
p2.previousPosition = { x: 39 * 8, y: 0 };
p2.position = { x: 40 * 8, y: 0 };
resolveCombat([p2], CONFIG, 0);
if (!p2.alive) {
  console.error("FAIL: false self-kill on straight trail:", p2.deathReason);
  process.exit(1);
}
console.log("PASS: no false self-kill on straight trail");
console.log("All smoke combat checks passed.");
