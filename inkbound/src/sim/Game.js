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
    if (!point || !this.grid.isDiskUnowned(
      point.x,
      point.y,
      this.config.startTerritoryRadius,
    )) {
      point = this.findBotSpawn();
    }
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

  findBotSpawn() {
    const inset = this.config.startTerritoryRadius + this.config.bodyRadius;
    for (let attempt = 0; attempt < this.config.botRespawnAttempts; attempt += 1) {
      const point = this.arena.randomPoint(this.random, inset);
      if (!this.grid.isDiskUnowned(
        point.x,
        point.y,
        this.config.startTerritoryRadius,
      )) continue;
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

    // 5. Resolve cuts. Combat only marks deaths; cleanup happens below.
    resolveCombat(this.entities, this.config);

    // 6. Survivors seal loops when they re-enter their own dry ink.
    for (const entity of this.entities) {
      if (!entity.alive || !entity.capturePending) continue;
      captureLoop(this.grid, entity.id, entity.trail);
      entity.trail.clear();
      entity.capturePending = false;
    }

    // 7. Apply deaths by erasing both wet and dry ink.
    for (const entity of this.entities) {
      if (entity.alive || entity._deathApplied) continue;
      if (entity.isPlayer) {
        this.finalShare = this.grid.share(entity.id);
        this.state = "over";
        this.outcome = { type: "death", title: entity.deathReason };
      }
      entity.trail.clear();
      this.grid.clearOwner(entity.id);
      entity._deathApplied = true;
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
