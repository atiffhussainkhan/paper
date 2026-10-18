import { Trail } from "./Trail.js";

export class Entity {
  constructor(spec, position, heading, speed, config) {
    this.id = spec.id;
    this.name = spec.name;
    this.role = spec.role ?? null;
    this.isPlayer = spec.id === 1;
    this.color = spec.color;
    this.wetColor = spec.wetColor;
    this.coreColor = spec.coreColor ?? spec.color;
    this.patternImageId = spec.patternImageId ?? null;
    this.beadImageId = spec.beadImageId ?? null;
    this.orbImageId = spec.orbImageId ?? null;
    this.position = { ...position };
    this.previousPosition = { ...position };
    this.heading = heading;
    this.desiredHeading = heading;
    this.speed = speed;
    this.radius = config.bodyRadius;
    this.rimSign = this.id % 2 ? 1 : -1;
    this.trail = new Trail(
      config.trailWidth,
      config.trailSampleSpacing,
      config.maxTrailPoints,
    );
    this.alive = true;
    this.outsideOwnTerritory = false;
    this.clearedHome = false;
    this.capturePending = false;
    this.deathReason = "";
    this.killedBy = null;
    this.deathShare = null;
    this.deathApplied = false;
    this.brain = null;
  }

  markDead(reason, killedBy = null) {
    if (!this.alive) return;
    this.alive = false;
    this.deathReason = reason;
    this.killedBy = killedBy;
  }
}
