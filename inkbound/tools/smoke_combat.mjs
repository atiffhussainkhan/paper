import { CONFIG } from "../src/config.js";
import { Trail } from "../src/sim/Trail.js";
import {
  botDifficultyCurve,
  playerSafeFromBots,
  resolveCombat,
} from "../src/sim/Combat.js";

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

// Bot crossing player trail during the guaranteed opening must NOT kill the
// player, even if their territory share is already high.
const player = entity(1, "You", true, 0, 0);
player.trail.begin({ x: -40, y: 0 });
for (let x = -32; x <= 80; x += 8) player.trail.add({ x, y: 0 }, true);

const bot = entity(2, "Moss", false, 20, -30);
bot.previousPosition = { x: 20, y: -30 };
bot.position = { x: 20, y: 30 };

resolveCombat([player, bot], CONFIG, 9.99, 0.5);
if (!player.alive) {
  console.error("FAIL: player died during guaranteed opening:", player.deathReason);
  process.exit(1);
}
console.log("PASS: opening safety blocks bot cut");

// A struggling player gets the configured low-share safety extension.
resolveCombat([player, bot], CONFIG, 12, 0);
if (!player.alive || !playerSafeFromBots(12, 0, CONFIG)) {
  console.error("FAIL: low-share safety extension did not hold");
  process.exit(1);
}
console.log("PASS: low-share safety extension blocks bot cut");

// Once adaptive grace expires, the same cut kills.
resolveCombat([player, bot], CONFIG, 16, 0);
if (player.alive) {
  console.error("FAIL: player should die after grace");
  process.exit(1);
}
console.log("PASS: bot cut works after grace");

// Age and share should continuously increase each aggression output, with no
// jump at the ten-second opening boundary.
const openingCurve = botDifficultyCurve(10, 0.2, CONFIG);
const midCurve = botDifficultyCurve(45, 0.08, CONFIG);
const lateCurve = botDifficultyCurve(100, 0.2, CONFIG);
if (
  openingCurve.aggression !== 0
  || !(midCurve.aggression > openingCurve.aggression)
  || !(lateCurve.aggression > midCurve.aggression)
  || !(lateCurve.cutterRange > midCurve.cutterRange)
  || !(lateCurve.maxOutTime > midCurve.maxOutTime)
  || !(lateCurve.speed > midCurve.speed)
) {
  console.error("FAIL: bot difficulty curve is not monotonic", {
    openingCurve,
    midCurve,
    lateCurve,
  });
  process.exit(1);
}
console.log("PASS: bot aggression outputs ramp with age and share");

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

// During self-forgiveness, a short curved stroke must not suicide the player.
const p3 = entity(1, "You", true, 40, 40);
p3.trail.begin({ x: 0, y: 0 });
for (let i = 1; i <= 12; i += 1) {
  const t = i / 12;
  p3.trail.add({
    x: 60 * Math.sin(t * Math.PI),
    y: 60 * (1 - Math.cos(t * Math.PI)),
  }, true);
}
p3.previousPosition = { x: 55, y: 50 };
p3.position = { x: 40, y: 40 };
resolveCombat([p3], CONFIG, 2);
if (!p3.alive) {
  console.error("FAIL: self-forgiveness should protect early short curves:", p3.deathReason);
  process.exit(1);
}
console.log("PASS: early self-forgiveness protects short curves");

console.log("All smoke combat checks passed.");
