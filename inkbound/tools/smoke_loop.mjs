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
if (!game.playerClaimed || !game.lastCapture?.firstClaim) {
  console.error("FAIL: first claim was not marked", game.playerClaimed, game.lastCapture);
  process.exit(1);
}
console.log("PASS: scripted claim loop increased territory");

const { TerritoryGrid } = await import("../src/sim/TerritoryGrid.js");
const { Trail } = await import("../src/sim/Trail.js");
const { captureLoop } = await import("../src/sim/Capture.js");

function assertCounts(grid, label) {
  let sum = 0;
  for (let index = 0; index < grid.counts.length; index += 1) sum += grid.counts[index];
  if (sum !== grid.insideCount) {
    console.error("FAIL: owner counts drifted", label, sum, grid.insideCount);
    process.exit(1);
  }
}

function assertInsideArena(grid, ownerId, label) {
  for (let index = 0; index < grid.cells.length; index += 1) {
    if (grid.cells[index] !== ownerId) continue;
    const col = index % grid.size;
    const row = Math.floor(index / grid.size);
    const center = grid.cellCenter(col, row);
    if (center.x * center.x + center.y * center.y > grid.radius * grid.radius + 1) {
      console.error("FAIL: capture leaked outside the arena", label);
      process.exit(1);
    }
  }
}

const pocket = new TerritoryGrid(CONFIG.arenaRadius, CONFIG.gridSize, 4);
pocket.setDisk(1, 0, 0, CONFIG.startTerritoryRadius);
pocket.setDisk(2, 200, 90, 36);
pocket.setDisk(2, -520, 0, 40);
const pocketTrail = new Trail(CONFIG.trailWidth, CONFIG.trailSampleSpacing);
pocketTrail.begin({ x: 70, y: -30 });
pocketTrail.add({ x: 300, y: -30 }, true);
pocketTrail.add({ x: 300, y: 210 }, true);
pocketTrail.add({ x: 70, y: 210 }, true);
pocketTrail.add({ x: 70, y: 30 }, true);
const pocketChanged = captureLoop(pocket, 1, pocketTrail);
if (pocketChanged <= 0 || pocket.ownerAt(200, 90) !== 1 || pocket.ownerAt(-400, 0) !== 0 || pocket.ownerAt(-520, 0) !== 2) {
  console.error("FAIL: small loop did not steal only the enclosed ink", {
    pocketChanged,
    enclosed: pocket.ownerAt(200, 90),
    west: pocket.ownerAt(-400, 0),
    spared: pocket.ownerAt(-520, 0),
    share: pocket.share(1),
  });
  process.exit(1);
}
if (pocket.share(1) > 0.2) {
  console.error("FAIL: small loop swallowed the plane", pocket.share(1));
  process.exit(1);
}
assertCounts(pocket, "pocket");
assertInsideArena(pocket, 1, "pocket");
console.log("PASS: small loop fills inside and steals enclosed ink", pocket.share(1).toFixed(4));

const sweep = new TerritoryGrid(CONFIG.arenaRadius, CONFIG.gridSize, 4);
sweep.setDisk(1, 0, 0, CONFIG.startTerritoryRadius);
const sweepTrail = new Trail(CONFIG.trailWidth, CONFIG.trailSampleSpacing, CONFIG.maxTrailPoints);
const sweepRadius = 980;
sweepTrail.begin({ x: 100, y: -12 });
const sweepSteps = 100;
for (let step = 0; step <= sweepSteps; step += 1) {
  const angle = -0.2 + (step / sweepSteps) * (Math.PI * 2 - 0.45);
  sweepTrail.add({
    x: Math.cos(angle) * sweepRadius,
    y: Math.sin(angle) * sweepRadius,
  }, true);
}
sweepTrail.add({ x: 100, y: 12 }, true);
const sweepChanged = captureLoop(sweep, 1, sweepTrail);
const sweepShare = sweep.share(1);
if (
  sweepChanged <= 0
  || sweepShare < 0.5
  || sweep.ownerAt(0, 400) !== 1
  || sweep.ownerAt(1150, 0) === 1
) {
  console.error("FAIL: majority circuit did not claim its interior", {
    sweepChanged,
    sweepShare,
    interior: sweep.ownerAt(0, 400),
    rim: sweep.ownerAt(1150, 0),
  });
  process.exit(1);
}
assertCounts(sweep, "sweep");
assertInsideArena(sweep, 1, "sweep");
console.log("PASS: majority circuit claims the inside of the stroke", sweepShare.toFixed(4));

const { Entity } = await import("../src/sim/Entity.js");
const { updateInkContact } = await import("../src/sim/Movement.js");
const pokeGrid = new TerritoryGrid(CONFIG.arenaRadius, CONFIG.gridSize, 4);
pokeGrid.setDisk(1, 0, 0, CONFIG.startTerritoryRadius);
const pokeShare = pokeGrid.share(1);
let probeX = null;
for (let x = 0; x < 200; x += 1) {
  if (!pokeGrid.isOwnedBy(1, x, 0)) {
    probeX = x;
    break;
  }
}
const pokeEntity = new Entity(
  { id: 1, name: "You", color: "#d9452b", wetColor: "#ff6a4a" },
  { x: probeX, y: 0 },
  0,
  CONFIG.playerSpeed,
  CONFIG,
);
pokeEntity.previousPosition = { x: probeX - 8, y: 0 };
const pokeRadius = CONFIG.bodyRadius * CONFIG.firstClaimContactScale;
updateInkContact(pokeEntity, pokeGrid, pokeRadius);
if (!pokeEntity.outsideOwnTerritory || pokeEntity.clearedHome || pokeEntity.capturePending) {
  console.error("FAIL: leaving the disk did not open an uncommitted stroke", {
    outside: pokeEntity.outsideOwnTerritory,
    cleared: pokeEntity.clearedHome,
    pending: pokeEntity.capturePending,
    probeX,
  });
  process.exit(1);
}
pokeEntity.previousPosition = { ...pokeEntity.position };
pokeEntity.position = { x: 0, y: 0 };
updateInkContact(pokeEntity, pokeGrid, pokeRadius);
if (
  pokeEntity.outsideOwnTerritory
  || pokeEntity.trail.active
  || pokeEntity.capturePending
  || pokeGrid.share(1) > pokeShare + 0.0000001
) {
  console.error("FAIL: edge poke committed a claim", {
    outside: pokeEntity.outsideOwnTerritory,
    trail: pokeEntity.trail.points.length,
    pending: pokeEntity.capturePending,
    share: pokeGrid.share(1),
  });
  process.exit(1);
}
console.log("PASS: grazing home does not commit a stroke");

heading = 0;
const runner = new Game({ headingFor() { return heading; } }, colors, CONFIG, () => 0.15);
let previous = { ...runner.player.position };
for (let tick = 0; tick < 520; tick += 1) {
  runner.tick(dt);
  if (!runner.player.alive) {
    console.error("FAIL: rim run died", runner.player.deathReason, "tick", tick);
    process.exit(1);
  }
  const step = Math.hypot(
    runner.player.position.x - previous.x,
    runner.player.position.y - previous.y,
  );
  if (step < 0.2) {
    console.error("FAIL: avatar stopped", step, runner.player.position);
    process.exit(1);
  }
  previous = { ...runner.player.position };
}
const rimDistance = Math.hypot(runner.player.position.x, runner.player.position.y);
if (rimDistance < CONFIG.arenaRadius - CONFIG.bodyRadius - 40) {
  console.error("FAIL: straight run did not reach the rim", rimDistance);
  process.exit(1);
}
console.log("PASS: always-move rim slide", rimDistance.toFixed(1));

const winner = new Game({ headingFor() { return 0; } }, colors, CONFIG, () => 0.3);
const winGrid = winner.grid;
winGrid.counts.fill(0);
let sealed = 0;
for (let index = 0; index < winGrid.cells.length; index += 1) {
  if (winGrid.cells[index] < 0) continue;
  winGrid.cells[index] = 1;
  sealed += 1;
}
winGrid.counts[1] = sealed;
for (const bot of winner.bots) bot.markDead("plane sealed", winner.player);
winner.tick(dt);
if (winner.state !== "over" || winner.outcome?.type !== "win") {
  console.error("FAIL: full plane did not win", winner.state, winner.outcome);
  process.exit(1);
}
if (winner.bots.some((bot) => winGrid.counts[bot.id] > 0)) {
  console.error("FAIL: bot respawned onto a sealed plane");
  process.exit(1);
}
for (let extra = 0; extra < 8; extra += 1) winner.tick(dt);
if (winner.state !== "over" || winner.bots.some((bot) => bot.alive || winGrid.counts[bot.id] > 0)) {
  console.error("FAIL: win did not stay sealed", winner.state, winner.bots.map((bot) => bot.alive));
  process.exit(1);
}
console.log("PASS: sealed plane wins and does not respawn bots");

const full = new TerritoryGrid(CONFIG.arenaRadius, CONFIG.gridSize, 4);
full.setDisk(1, 0, 0, CONFIG.startTerritoryRadius);
const fullTrail = new Trail(CONFIG.trailWidth, CONFIG.trailSampleSpacing, CONFIG.maxTrailPoints);
const rimR = CONFIG.arenaRadius - CONFIG.bodyRadius;
fullTrail.begin({ x: 130, y: -6 });
for (let step = 0; step <= 240; step += 1) {
  const angle = (step / 240) * Math.PI * 2;
  fullTrail.add({ x: Math.cos(angle) * rimR, y: Math.sin(angle) * rimR }, true);
}
fullTrail.add({ x: 130, y: 6 }, true);
captureLoop(full, 1, fullTrail);
if (full.share(1) < CONFIG.winShare) {
  console.error("FAIL: closed rim circuit did not reach a win share", full.share(1));
  process.exit(1);
}
assertCounts(full, "full");
assertInsideArena(full, 1, "full");
console.log("PASS: closed rim circuit is a 100% win", full.share(1).toFixed(4));

const doomed = new Game({ headingFor() { return 0.4; } }, colors, CONFIG, () => 0.25);
doomed.player.markDead("You crossed your own line.");
doomed.bots[0].markDead("down");
const livingAfterDeath = () => doomed.bots.filter((bot) => bot.alive).length;
const expectedLiving = livingAfterDeath();
doomed.tick(dt);
doomed.tick(dt);
if (
  doomed.state !== "over"
  || doomed.outcome?.type !== "death"
  || livingAfterDeath() !== expectedLiving
  || doomed.bots[0].alive
  || doomed.grid.counts[doomed.bots[0].id] > 0
) {
  console.error("FAIL: game over respawned a bot", {
    state: doomed.state,
    outcome: doomed.outcome,
    living: livingAfterDeath(),
    expectedLiving,
  });
  process.exit(1);
}
console.log("PASS: game over does not respawn bots");

let hookHeading = 0;
const hook = new Game({ headingFor() { return hookHeading; } }, colors, CONFIG, () => 0.33);
const hookStart = hook.grid.share(hook.player.id);
for (let tick = 0; tick < 100 && hook.player.alive; tick += 1) {
  hookHeading = 0.05;
  hook.tick(dt);
}
for (let tick = 0; tick < 36 && hook.player.alive; tick += 1) {
  hookHeading = -Math.PI / 2;
  hook.tick(dt);
}
for (let tick = 0; tick < 80 && hook.player.alive && !hook.playerClaimed; tick += 1) {
  hookHeading = Math.atan2(-hook.player.position.y, 70 - hook.player.position.x);
  hook.tick(dt);
}
for (let tick = 0; tick < 240 && hook.player.alive && !hook.playerClaimed; tick += 1) {
  hookHeading = Math.atan2(-hook.player.position.y, -hook.player.position.x);
  hook.tick(dt);
}
if (!hook.player.alive || !hook.playerClaimed || hook.grid.share(hook.player.id) <= hookStart + 0.0005) {
  console.error("FAIL: pointer hook did not seal the first claim", {
    alive: hook.player.alive,
    reason: hook.player.deathReason,
    claimed: hook.playerClaimed,
    share: hook.grid.share(hook.player.id),
  });
  process.exit(1);
}
console.log("PASS: sharp hook seals the first claim", hook.grid.share(hook.player.id).toFixed(4));

const noseGrid = new TerritoryGrid(CONFIG.arenaRadius, CONFIG.gridSize, 4);
noseGrid.setDisk(1, 0, 0, CONFIG.startTerritoryRadius);
const noseEntity = new Entity(
  { id: 1, name: "You", color: "#d9452b", wetColor: "#ff6a4a" },
  { x: 168, y: 0 },
  Math.PI,
  CONFIG.playerSpeed,
  CONFIG,
);
noseEntity.outsideOwnTerritory = true;
noseEntity.clearedHome = true;
noseEntity.trail.begin({ x: 140, y: -70 });
noseEntity.trail.add({ x: 168, y: 0 }, true);
noseEntity.previousPosition = { x: 176, y: 0 };
const noseShare = noseGrid.share(1);
updateInkContact(
  noseEntity,
  noseGrid,
  CONFIG.bodyRadius * CONFIG.firstClaimContactScale,
  CONFIG.firstClaimNose,
);
if (!noseEntity.capturePending || noseEntity.outsideOwnTerritory || noseGrid.share(1) !== noseShare) {
  console.error("FAIL: nose did not arm a first-claim seal", {
    pending: noseEntity.capturePending,
    outside: noseEntity.outsideOwnTerritory,
    centerOwned: noseGrid.isOwnedBy(1, 168, 0),
  });
  process.exit(1);
}
if (noseGrid.bodyTouchesOwner(1, 168, 0, CONFIG.bodyRadius * CONFIG.firstClaimContactScale)) {
  console.error("FAIL: nose test center already overlapped ink");
  process.exit(1);
}
console.log("PASS: first-claim nose seals before the center overlaps ink");

for (const rimHeading of [0, 0.8, 2.1, -1.4, Math.PI * 0.5]) {
  let rimAim = rimHeading;
  const rimGame = new Game({ headingFor() { return rimAim; } }, colors, CONFIG, () => 0.18);
  let previous = { ...rimGame.player.position };
  for (let tick = 0; tick < 480; tick += 1) {
    rimGame.tick(dt);
    if (!rimGame.player.alive) {
      console.error("FAIL: rim heading died", rimHeading, rimGame.player.deathReason);
      process.exit(1);
    }
    const step = Math.hypot(
      rimGame.player.position.x - previous.x,
      rimGame.player.position.y - previous.y,
    );
    if (step < 0.2) {
      console.error("FAIL: rim heading stalled", rimHeading, step);
      process.exit(1);
    }
    const radius = Math.hypot(rimGame.player.position.x, rimGame.player.position.y);
    if (radius > CONFIG.arenaRadius - CONFIG.bodyRadius + 0.5) {
      console.error("FAIL: rim heading left the arena", rimHeading, radius);
      process.exit(1);
    }
    previous = { ...rimGame.player.position };
  }
}
console.log("PASS: rim slide stays alive from several headings");
