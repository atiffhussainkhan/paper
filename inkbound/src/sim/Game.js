import { CONFIG, ENTITY_SPECS } from "../config.js";
import { Arena } from "./Arena.js";
import { TerritoryGrid } from "./TerritoryGrid.js";
import { Entity } from "./Entity.js";
import { moveEntity, updateInkContact } from "./Movement.js";
import { resolveCombat } from "./Combat.js";
import { captureLoop } from "./Capture.js";
import { attachBotBrain, updateBotHeadings } from "./Bots.js";
import { botBeadId, botPatternId } from "../assets/ImageCatalog.js";

export class Game {
  constructor(input, colors, config = CONFIG, random = Math.random, options = {}) {
    this.input = input;
    this.playerSkin = options.playerSkin ?? null;
    this.catalog = options.catalog ?? null;
    this.colors = colors;
    this.config = config;
    this.random = random;
    this.reset();
  }

  reset() {
    this.arena = new Arena(this.config.arenaRadius);
    this.arena.game = this;
    this.grid = new TerritoryGrid(
      this.config.arenaRadius,
      this.config.gridSize,
      this.config.botCount + 1,
    );
    this.entities = [];
    this.state = "playing";
    this.outcome = null;
    this.finalShare = 0;
    this.runPeakShare = 0;
    this.playerClaimed = false;
    this.matchAge = 0;
    this.events = [];
    this.lastCapture = null;

    const player = this.createEntity(ENTITY_SPECS[0], { x: 0, y: 0 }, -0.2);
    this.grid.setDisk(player.id, 0, 0, this.config.startTerritoryRadius);
    this.runPeakShare = this.grid.share(player.id);
    this.entities.push(player);

    const spawnR = this.config.botInitialSpawnRadius ?? this.config.arenaRadius * 0.75;
    const initialAngles = [-Math.PI * 0.72, -Math.PI * 0.05, Math.PI * 0.62];
    for (let index = 0; index < this.config.botCount; index += 1) {
      const angle = initialAngles[index];
      const point = { x: Math.cos(angle) * spawnR, y: Math.sin(angle) * spawnR };
      this.spawnBot(ENTITY_SPECS[index + 1], point);
    }
  }

  createEntity(spec, position, heading) {
    const isPlayer = spec.role === "player";
    const skin = isPlayer ? this.playerSkin : null;
    const entitySpec = {
      ...spec,
      color: skin?.dry ?? this.colors[spec.dryToken],
      wetColor: skin?.wet ?? this.colors[spec.wetToken],
      coreColor: skin?.core,
      patternImageId: skin?.patternImageId ?? (isPlayer ? null : botPatternId(this.catalog, spec.id)),
      beadImageId: skin?.beadImageId ?? (isPlayer ? null : botBeadId(this.catalog, spec.id)),
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
    const player = this.player;
    const minPlayerSep = this.config.botMinPlayerSeparation
      ?? this.config.startTerritoryRadius * 4;
    for (let attempt = 0; attempt < this.config.botRespawnAttempts; attempt += 1) {
      const point = this.arena.randomPoint(this.random, inset);
      if (!this.isSpawnClear(point)) continue;
      if (
        player?.alive
        && Math.hypot(point.x - player.position.x, point.y - player.position.y) < minPlayerSep
      ) {
        continue;
      }
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

  // Presentation-only event queue. Headless runs never drain it, so it is
  // capped to stay bounded.
  emit(type, data) {
    this.events.push({ type, matchAge: this.matchAge, ...data });
    if (this.events.length > 256) this.events.splice(0, this.events.length - 256);
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  ownedCellIndices(ownerId) {
    const indices = new Int32Array(Math.max(0, this.grid.counts[ownerId]));
    const { cells } = this.grid;
    let cursor = 0;
    for (let index = 0; index < cells.length && cursor < indices.length; index += 1) {
      if (cells[index] === ownerId) indices[cursor++] = index;
    }
    return indices;
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
    this.matchAge = (this.matchAge ?? 0) + dt;

    // 1. Read input and update the player's target heading.
    if (player?.alive) {
      const inputHeading = this.input.headingFor(player.heading);
      if (inputHeading !== null) player.desiredHeading = inputHeading;
    }

    // 2. Update bot target headings.
    updateBotHeadings(this.bots, this.arena, this.config, dt, this);

    // 3. Move every living entity, including rim sliding.
    for (const entity of this.entities) {
      moveEntity(entity, this.arena, dt, this.config.steerRate);
    }

    // 4. Emit wet trail samples only while outside one's own fill.
    //    The center must leave before a stroke starts. A body that never
    //    clears the ink does not commit a line. Once it has cleared, overlapping
    //    dry ink seals the loop — the first claim uses a slightly wider bead.
    for (const entity of this.entities) {
      if (!entity.alive) continue;
      const contactRadius = entity.isPlayer && !this.playerClaimed
        ? entity.radius * (this.config.firstClaimContactScale ?? 1.28)
        : entity.radius;
      updateInkContact(entity, this.grid, contactRadius);
    }

    // 5. Resolve cuts. Combat only marks deaths; cleanup happens in step 7.
    resolveCombat(
      this.entities,
      this.config,
      this.matchAge,
      this.grid.share(player.id),
    );
    this.snapshotDeathShares();

    // 6. Survivors seal loops when they re-enter their own dry ink. Combat has
    // already run, so a cut on the same tick denies the capture (dead owners
    // are skipped). A capture that leaves another living entity with no ink at
    // all swallows it; that is checked once every capture has landed so the
    // outcome does not depend on entity order.
    const swallowed = new Map();
    for (const entity of this.entities) {
      if (!entity.alive || !entity.capturePending) continue;
      const cellsBefore = this.grid.counts[entity.id];
      const changed = captureLoop(this.grid, entity.id, entity.trail);
      entity.trail.clear();
      entity.capturePending = false;
      if (!changed) continue;
      const gained = this.grid.counts[entity.id] - cellsBefore;
      if (gained > 0) {
        const firstClaim = Boolean(entity.isPlayer && !this.playerClaimed);
        if (entity.isPlayer) this.playerClaimed = true;
        this.lastCapture = {
          entityId: entity.id,
          isPlayer: entity.isPlayer,
          firstClaim,
          delta: gained / this.grid.insideCount,
          share: this.grid.share(entity.id),
          position: { ...entity.position },
          matchAge: this.matchAge,
        };
        this.emit("capture", this.lastCapture);
      }
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

    if (player?.alive) {
      this.runPeakShare = Math.max(this.runPeakShare ?? 0, this.grid.share(player.id));
    }

    // 7. Apply deaths by erasing both wet and dry ink. Runs once per entity.
    for (const entity of this.entities) {
      if (entity.alive || entity.deathApplied) continue;
      if (entity.isPlayer) {
        this.finalShare = entity.deathShare ?? this.grid.share(entity.id);
        this.runPeakShare = Math.max(this.runPeakShare ?? 0, this.finalShare);
        this.state = "over";
        this.outcome = { type: "death", title: entity.deathReason };
      }
      this.emit("death", {
        entityId: entity.id,
        isPlayer: entity.isPlayer,
        killedById: entity.killedBy?.id ?? null,
        position: { ...entity.position },
        trail: entity.trail.points.map((point) => ({ x: point.x, y: point.y })),
        trailWidth: entity.trail.width,
        color: entity.color,
        wetColor: entity.wetColor,
        cells: this.ownedCellIndices(entity.id),
      });
      entity.trail.clear();
      entity.outsideOwnTerritory = false;
      entity.clearedHome = false;
      entity.capturePending = false;
      this.grid.clearOwner(entity.id);
      entity.deathApplied = true;
    }

    // 8. Replace dead inks on wholly unowned ground to maintain three bots.
    //    A sealed plane has nowhere legal to spawn; a same-tick disk would
    //    steal the win.
    const planeSealed = Boolean(player?.alive)
      && this.grid.share(player.id) >= this.config.winShare;
    if (!planeSealed && this.state === "playing") {
      for (const spec of ENTITY_SPECS.slice(1, this.config.botCount + 1)) {
        const bot = this.entities.find((entity) => entity.id === spec.id);
        if (!bot || !bot.alive) this.spawnBot(spec);
      }
    }

    // 9. A complete plane ends the match and offers a fresh restart.
    if (player.alive && this.grid.share(player.id) >= this.config.winShare) {
      this.finalShare = this.grid.share(player.id);
      this.runPeakShare = Math.max(this.runPeakShare ?? 0, this.finalShare);
      this.state = "over";
      this.outcome = { type: "win", title: "The plane is yours." };
    }
  }
}
