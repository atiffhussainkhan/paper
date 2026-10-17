import { CONFIG, ENTITY_SPECS } from "../config.js";
import { Arena } from "./Arena.js";
import { TerritoryGrid } from "./TerritoryGrid.js";
import { Entity } from "./Entity.js";
import { moveEntity } from "./Movement.js";
import { resolveCombat } from "./Combat.js";
import { captureLoop } from "./Capture.js";
import { attachBotBrain, updateBotHeadings } from "./Bots.js";

export class Game {
  constructor(input, colors, config = CONFIG, random = Math.random) {
    this.input = input;
    this.colors = colors;
    this.config = config;
    this.random = random;
    this.reset();
  }

  reset() {
    this.arena = new Arena(this.config.arenaRadius);
    this.grid = new TerritoryGrid(
      this.config.arenaRadius,
      this.config.gridSize,
      this.config.botCount + 1,
    );
    this.entities = [];
    this.state = "playing";
    this.outcome = null;
    this.finalShare = 0;

    const player = this.createEntity(ENTITY_SPECS[0], { x: 0, y: 0 }, -0.2);
    this.grid.setDisk(player.id, 0, 0, this.config.startTerritoryRadius);
    this.entities.push(player);

    const initialAngles = [-Math.PI * 0.72, -Math.PI * 0.05, Math.PI * 0.62];
    for (let index = 0; index < this.config.botCount; index += 1) {
      const angle = initialAngles[index];
      const point = { x: Math.cos(angle) * 610, y: Math.sin(angle) * 610 };
      this.spawnBot(ENTITY_SPECS[index + 1], point);
    }
  }

  createEntity(spec, position, heading) {
    const entitySpec = {
      ...spec,
      color: this.colors[spec.dryToken],
      wetColor: this.colors[spec.wetToken],
    };
    return new Entity(
      entitySpec,
      position,
      heading,
      spec.id === 1 ? this.config.playerSpeed : this.config.botSpeed,
      this.config,
    );
  }

  spawnBot(spec, preferredPoint = null) {
    let point = preferredPoint;
    if (!point || !this.isSpawnClear(point)) point = this.findBotSpawn();
    if (!point) return null;

    const heading = Math.atan2(point.y, point.x);
    const bot = this.createEntity(spec, point, heading);
    this.grid.setDisk(bot.id, point.x, point.y, this.config.startTerritoryRadius);
    attachBotBrain(bot, this.arena, this.config, this.random);
    const existing = this.entities.findIndex((entity) => entity.id === bot.id);
    if (existing >= 0) this.entities[existing] = bot;
    else this.entities.push(bot);
    return bot;
  }

  // A spawn disk must be unowned and must not sit on any live wet stroke: a
  // fresh body overlapping someone's trail would count as an instant cut.
  isSpawnClear(point) {
    if (!this.grid.isDiskUnowned(point.x, point.y, this.config.startTerritoryRadius)) {
      return false;
    }
    const clearance = this.config.startTerritoryRadius + this.config.bodyRadius;
    return this.entities.every((entity) => (
      !entity.alive || !entity.trail.collidesPoint(point, clearance)
    ));
  }

  findBotSpawn() {
    const inset = this.config.startTerritoryRadius + this.config.bodyRadius;
    for (let attempt = 0; attempt < this.config.botRespawnAttempts; attempt += 1) {
      const point = this.arena.randomPoint(this.random, inset);
      if (!this.isSpawnClear(point)) continue;
      const separated = this.entities
        .filter((entity) => entity.alive)
        .every((entity) => Math.hypot(
          entity.position.x - point.x,
          entity.position.y - point.y,
        ) > this.config.startTerritoryRadius * 2.2);
      if (separated) return point;
    }
    return null;
  }

  get player() {
    return this.entities.find((entity) => entity.isPlayer);
  }

  get bots() {
    return this.entities.filter((entity) => !entity.isPlayer);
  }

  // Record each fresh casualty's share at the moment of death, before later
  // steps (capture, erase) change the grid.
  snapshotDeathShares() {
    for (const entity of this.entities) {
      if (!entity.alive && entity.deathShare === null) {
        entity.deathShare = this.grid.share(entity.id);
      }
    }
  }

  tick(dt) {
    if (this.state !== "playing") return;
    const player = this.player;

    // 1. Read input and update the player's target heading.
    if (player.alive) {
      const inputHeading = this.input.headingFor(player.heading);
      if (inputHeading !== null) player.desiredHeading = inputHeading;
    }

    // 2. Update bot target headings.
    updateBotHeadings(this.bots, this.arena, this.config, dt);

    // 3. Move every living entity, including rim sliding.
    for (const entity of this.entities) {
      moveEntity(entity, this.arena, dt, this.config.steerRate);
    }

    // 4. Emit wet trail samples only while outside one's own fill.
    for (const entity of this.entities) {
      if (!entity.alive) continue;
      const inside = this.grid.isOwnedBy(
        entity.id,
        entity.position.x,
        entity.position.y,
      );
      entity.capturePending = false;
      if (!inside) {
        if (!entity.outsideOwnTerritory) entity.trail.begin(entity.previousPosition);
        entity.trail.add(entity.position);
        entity.outsideOwnTerritory = true;
      } else if (entity.outsideOwnTerritory && entity.trail.active) {
        entity.trail.add(entity.position, true);
        entity.capturePending = true;
        entity.outsideOwnTerritory = false;
      }
    }

    // 5. Resolve cuts. Combat only marks deaths; cleanup happens in step 7.
    resolveCombat(this.entities, this.config);
    this.snapshotDeathShares();

    // 6. Survivors seal loops when they re-enter their own dry ink. Combat has
    // already run, so a cut on the same tick denies the capture (dead owners
    // are skipped). A capture that leaves another living entity with no ink at
    // all swallows it; that is checked once every capture has landed so the
    // outcome does not depend on entity order.
    const swallowed = new Map();
    for (const entity of this.entities) {
      if (!entity.alive || !entity.capturePending) continue;
      const changed = captureLoop(this.grid, entity.id, entity.trail);
      entity.trail.clear();
      entity.capturePending = false;
      if (!changed) continue;
      for (const other of this.entities) {
        if (other !== entity && other.alive && this.grid.counts[other.id] === 0) {
          swallowed.set(other, entity);
        }
      }
    }
    for (const [victim, captor] of swallowed) {
      if (this.grid.counts[victim.id] !== 0) continue;
      victim.markDead(
        victim.isPlayer
          ? `${captor.name} swallowed your ink.`
          : `${captor.name} swallowed ${victim.name}'s ink.`,
        captor,
      );
    }
    this.snapshotDeathShares();

    // 7. Apply deaths by erasing both wet and dry ink. Runs once per entity.
    for (const entity of this.entities) {
      if (entity.alive || entity.deathApplied) continue;
      if (entity.isPlayer) {
        this.finalShare = entity.deathShare ?? this.grid.share(entity.id);
        this.state = "over";
        this.outcome = { type: "death", title: entity.deathReason };
      }
      entity.trail.clear();
      entity.outsideOwnTerritory = false;
      entity.capturePending = false;
      this.grid.clearOwner(entity.id);
      entity.deathApplied = true;
    }

    // 8. Replace dead inks on wholly unowned ground to maintain three bots.
    for (const spec of ENTITY_SPECS.slice(1, this.config.botCount + 1)) {
      const bot = this.entities.find((entity) => entity.id === spec.id);
      if (!bot || !bot.alive) this.spawnBot(spec);
    }

    // 9. A complete plane ends the match and offers a fresh restart.
    if (player.alive && this.grid.share(player.id) >= this.config.winShare) {
      this.finalShare = this.grid.share(player.id);
      this.state = "over";
      this.outcome = { type: "win", title: "The plane is yours." };
    }
  }
}
