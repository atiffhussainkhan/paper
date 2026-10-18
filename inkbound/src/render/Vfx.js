// Presentation-only juice. Consumes Game events (capture, death) and draws in
// world space; it never mutates the simulation.
//
// Death plays in three staggered phases. The sim erases a dead ink's trail and
// territory on the death tick; Vfx keeps snapshots so the plane can let go of
// them on the schedule below instead of popping.
export const VFX_TIMING = Object.freeze({
  // Phase 1.5: longer / taller floats so the first claim +% is unmistakable.
  floatDuration: 1.75,
  floatRise: 78,
  floatStackGap: 34,

  // Phase 1: the wet stroke beads apart and evaporates.
  dissolveDuration: 0.5,
  // Phase 2: ink bursts from the death point.
  burstDelay: 0.12,
  burstRingDuration: 0.55,
  // Phase 3: the dead ink's dry territory fades from the plane.
  territoryFadeDelay: 0.3,
  territoryFadeDuration: 0.85,

  crownPopDuration: 0.3,
  // A challenger must lead by this much share before the crown moves.
  crownSwitchMargin: 0.002,
});

const MAX_PARTICLES = 700;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeOutBack = (t) => {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};
const clamp01 = (t) => Math.max(0, Math.min(1, t));

// Share delta → "+X.X%". Sub-tenth seals keep two decimals so a one-cell
// claim does not read as +0.00%.
export function formatCaptureDelta(delta) {
  const pct = Math.max(0, delta) * 100;
  if (!(pct > 0)) return "+0.0%";
  if (pct < 0.1) {
    const fine = pct.toFixed(2);
    return `+${fine === "0.00" ? "0.01" : fine}%`;
  }
  return `+${pct.toFixed(1)}%`;
}

// Indices from a death snapshot whose cells are still unowned. Reclaimed ink
// belongs to the new seal, so the fade must let those cells go.
export function retainUnownedCells(cells, owners) {
  const kept = [];
  for (let i = 0; i < cells.length; i += 1) {
    const index = cells[i];
    if (owners[index] === 0) kept.push(index);
  }
  return kept;
}

export class Vfx {
  constructor(colors, config, random = Math.random) {
    this.colors = colors;
    this.config = config;
    this.random = random;
    this.reset();
  }

  reset() {
    this.game = null;
    this.grid = null;
    this.particles = [];
    this.floats = [];
    this.dissolves = [];
    this.rings = [];
    this.ghosts = [];
    this.crown = { entityId: null, age: 0 };
  }

  update(game, dt) {
    if (this.game !== game || this.grid !== game.grid) {
      this.reset();
      this.game = game;
      this.grid = game.grid;
    }
    const events = typeof game.drainEvents === "function" ? game.drainEvents() : [];
    for (const event of events) {
      if (event.type === "capture") this.onCapture(event);
      else if (event.type === "death") this.onDeath(event, game.grid);
    }

    this.updateCrown(game, dt);

    for (const item of this.floats) item.age += dt;
    for (const item of this.dissolves) item.age += dt;
    for (const item of this.rings) item.age += dt;
    for (const item of this.ghosts) item.age += dt;
    for (const p of this.particles) {
      p.age += dt;
      if (p.age < 0) continue;
      const damping = Math.exp(-p.drag * dt);
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    this.floats = this.floats.filter((f) => f.age < VFX_TIMING.floatDuration);
    this.dissolves = this.dissolves.filter((d) => d.age < VFX_TIMING.dissolveDuration);
    this.rings = this.rings.filter((r) => r.age < r.duration);
    this.ghosts = this.ghosts.filter((g) => (
      g.age < VFX_TIMING.territoryFadeDelay + VFX_TIMING.territoryFadeDuration
    ));
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  onCapture(event) {
    if (!event.isPlayer || !(event.delta > 0)) return;
    this.floats.push({
      entityId: event.entityId,
      text: formatCaptureDelta(event.delta),
      anchor: { ...event.position },
      stack: this.floats.length,
      age: 0,
    });
  }

  onDeath(event, grid) {
    const { position, wetColor } = event;

    // Phase 1 — trail dissolve.
    if (event.trail.length > 1) {
      this.dissolves.push({
        points: event.trail,
        head: { ...position },
        width: event.trailWidth,
        color: wetColor,
        age: 0,
      });
      const beadCount = Math.min(90, Math.ceil(event.trail.length / 3));
      const stride = event.trail.length / beadCount;
      for (let i = 0; i < beadCount; i += 1) {
        const point = event.trail[Math.floor(i * stride)];
        const angle = this.random() * Math.PI * 2;
        const speed = 10 + this.random() * 34;
        this.spawnParticle({
          x: point.x,
          y: point.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: event.trailWidth * (0.22 + this.random() * 0.22),
          life: 0.35 + this.random() * 0.35,
          delay: (i / beadCount) * 0.12,
          drag: 3.5,
          color: wetColor,
        });
      }
    }

    // Phase 2 — burst at the death point.
    const bodyR = this.config.bodyRadius ?? 13;
    const ringColor = event.isPlayer ? this.colors["--state-cut"] ?? wetColor : wetColor;
    this.rings.push({
      x: position.x,
      y: position.y,
      from: bodyR * 1.1,
      to: bodyR * (event.isPlayer ? 6.2 : 4.6),
      width: event.isPlayer ? 5 : 3.5,
      color: ringColor,
      delay: VFX_TIMING.burstDelay,
      duration: VFX_TIMING.burstDelay + VFX_TIMING.burstRingDuration,
      age: 0,
      splat: event.color,
    });
    const dropCount = event.isPlayer ? 30 : 20;
    for (let i = 0; i < dropCount; i += 1) {
      const angle = (i / dropCount) * Math.PI * 2 + (this.random() - 0.5) * 0.5;
      const speed = 110 + this.random() * (event.isPlayer ? 260 : 190);
      this.spawnParticle({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.2 + this.random() * 3.6,
        life: 0.45 + this.random() * 0.4,
        delay: VFX_TIMING.burstDelay,
        drag: 5.2,
        color: this.random() < 0.7 ? wetColor : event.color,
        streak: true,
      });
    }

    // Phase 3 — territory fade.
    if (grid && event.cells && event.cells.length > 0) {
      const ghost = this.buildGhost(grid, event.cells, event.color);
      if (ghost) this.ghosts.push(ghost);
    }
  }

  spawnParticle({ delay = 0, ...rest }) {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push({ ...rest, age: -delay });
  }

  paintGhostCells(ghost) {
    const { canvas, cells, color, grid } = ghost;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!cells.length) return;
    const size = grid.size;
    context.fillStyle = color;
    context.beginPath();
    for (let i = 0; i < cells.length; i += 1) {
      const index = cells[i];
      context.rect(index % size, (index / size) | 0, 1, 1);
    }
    context.fill();
  }

  // Drop cells a living ink has sealed since the death snapshot, and repaint
  // only when the set actually shrinks.
  syncGhost(ghost) {
    const kept = retainUnownedCells(ghost.cells, ghost.grid.cells);
    if (kept.length === ghost.cells.length) return;
    ghost.cells = kept;
    this.paintGhostCells(ghost);
  }

  buildGhost(grid, cells, color) {
    if (typeof document === "undefined") return null;
    const owned = retainUnownedCells(cells, grid.cells);
    if (!owned.length) return null;
    const canvas = document.createElement("canvas");
    canvas.width = grid.size;
    canvas.height = grid.size;
    const ghost = {
      canvas,
      radius: grid.radius,
      age: 0,
      color,
      cells: owned,
      grid,
    };
    this.paintGhostCells(ghost);
    return ghost;
  }

  updateCrown(game, dt) {
    const crown = this.crown;
    crown.age += dt;
    let best = null;
    let bestShare = 0;
    let currentShare = -1;
    for (const entity of game.entities) {
      if (!entity.alive) continue;
      const share = game.grid.share(entity.id);
      if (entity.id === crown.entityId) currentShare = share;
      if (share > bestShare || (share === bestShare && best && entity.id < best.id)) {
        best = entity;
        bestShare = share;
      }
    }
    if (!best || bestShare <= 0) {
      crown.entityId = null;
      return;
    }
    const holderGone = currentShare < 0;
    if (
      best.id !== crown.entityId
      && (holderGone || bestShare > currentShare + VFX_TIMING.crownSwitchMargin)
    ) {
      crown.entityId = best.id;
      crown.age = 0;
    }
  }

  // Under entities and live trails, inside the arena clip.
  drawUnder(context) {
    for (const ghost of this.ghosts) this.drawGhost(context, ghost);
    for (const dissolve of this.dissolves) this.drawDissolve(context, dissolve);
  }

  // Above entities. `positionOf(entity)` returns the interpolated position.
  drawOver(context, game, positionOf) {
    for (const ring of this.rings) this.drawRing(context, ring);
    this.drawParticles(context);
    this.drawCrown(context, game, positionOf);
    this.drawFloats(context, game, positionOf);
  }

  drawGhost(context, ghost) {
    const fadeT = clamp01(
      (ghost.age - VFX_TIMING.territoryFadeDelay) / VFX_TIMING.territoryFadeDuration,
    );
    const alpha = 1 - easeOutCubic(fadeT);
    if (alpha <= 0) return;
    if (ghost.grid) this.syncGhost(ghost);
    if (!ghost.cells.length) return;
    context.save();
    context.globalAlpha = alpha;
    context.imageSmoothingEnabled = true;
    context.drawImage(ghost.canvas, -ghost.radius, -ghost.radius, ghost.radius * 2, ghost.radius * 2);
    context.restore();
  }

  drawDissolve(context, dissolve) {
    const t = clamp01(dissolve.age / VFX_TIMING.dissolveDuration);
    const alpha = (1 - t) ** 1.6;
    if (alpha <= 0.01) return;
    const { points } = dissolve;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
    context.lineTo(dissolve.head.x, dissolve.head.y);
    // Dash length shrinks while gaps open: the stroke beads up and breaks.
    const dash = Math.max(0.5, dissolve.width * 1.6 * (1 - t));
    const gap = dissolve.width * (0.2 + 2.4 * t);
    context.setLineDash([dash, gap]);
    context.globalAlpha = alpha;
    context.strokeStyle = dissolve.color;
    context.lineWidth = dissolve.width * (1 - 0.55 * t);
    context.stroke();
    context.restore();
  }

  drawRing(context, ring) {
    const local = ring.age - ring.delay;
    if (local < 0) return;
    const t = clamp01(local / (ring.duration - ring.delay));
    const eased = easeOutCubic(t);
    context.save();
    if (t < 0.4) {
      context.beginPath();
      context.arc(ring.x, ring.y, ring.from * (1.2 + eased * 0.8), 0, Math.PI * 2);
      context.globalAlpha = 0.75 * (1 - t / 0.4);
      context.fillStyle = ring.splat;
      context.fill();
    }
    context.beginPath();
    context.arc(ring.x, ring.y, ring.from + (ring.to - ring.from) * eased, 0, Math.PI * 2);
    context.globalAlpha = 0.9 * (1 - t);
    context.strokeStyle = ring.color;
    context.lineWidth = ring.width * (1 - t) + 0.8;
    context.stroke();
    context.restore();
  }

  drawParticles(context) {
    context.save();
    context.lineCap = "round";
    for (const p of this.particles) {
      if (p.age < 0) continue;
      const t = clamp01(p.age / p.life);
      const radius = p.radius * (1 - t * 0.7);
      context.globalAlpha = 1 - t * t;
      if (p.streak) {
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
        context.strokeStyle = p.color;
        context.lineWidth = radius * 2;
        context.stroke();
      } else {
        context.beginPath();
        context.arc(p.x, p.y, radius, 0, Math.PI * 2);
        context.fillStyle = p.color;
        context.fill();
      }
    }
    context.restore();
  }

  drawCrown(context, game, positionOf) {
    if (this.crown.entityId === null) return;
    const entity = game.entities.find((e) => e.id === this.crown.entityId && e.alive);
    if (!entity) return;
    const position = positionOf(entity);
    const pop = easeOutBack(clamp01(this.crown.age / VFX_TIMING.crownPopDuration));
    const bob = Math.sin(this.crown.age * 3.2) * 1.4;
    const r = entity.radius;
    const w = 11;
    const h = 9;

    context.save();
    context.translate(position.x, position.y - r - 15 + bob);
    context.scale(pop, pop);

    // Three-point seal crown: base band plus peaks, outlined so it reads on
    // any ink or on the bare plane.
    context.beginPath();
    context.moveTo(-w, 3);
    context.lineTo(-w, -h * 0.35);
    context.lineTo(-w * 0.5, -h * 0.05);
    context.lineTo(0, -h);
    context.lineTo(w * 0.5, -h * 0.05);
    context.lineTo(w, -h * 0.35);
    context.lineTo(w, 3);
    context.closePath();
    context.lineJoin = "round";
    context.lineWidth = 3.2;
    context.strokeStyle = this.colors["--sumi-950"];
    context.stroke();
    context.fillStyle = this.colors["--bone-100"];
    context.fill();

    context.beginPath();
    context.arc(0, -0.6, 2.4, 0, Math.PI * 2);
    context.fillStyle = entity.wetColor;
    context.fill();

    context.restore();
  }

  drawFloats(context, game, positionOf) {
    if (!this.floats.length) return;
    context.save();
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    context.font = "italic 44px 'Instrument Serif', Georgia, serif";
    context.lineJoin = "round";
    for (const item of this.floats) {
      const entity = game.entities.find((e) => e.id === item.entityId);
      if (entity?.alive) item.anchor = positionOf(entity);
      const t = clamp01(item.age / VFX_TIMING.floatDuration);
      const rise = easeOutCubic(t) * VFX_TIMING.floatRise;
      const fadeIn = clamp01(item.age / 0.1);
      const fadeOut = 1 - clamp01((t - 0.55) / 0.45);
      // First claim pops harder so the +% reads as the reward beat.
      const isLeadFloat = item.stack === 0;
      const pop = easeOutBack(clamp01(item.age / (isLeadFloat ? 0.28 : 0.2)));
      const scale = (isLeadFloat ? 0.78 : 0.85) + (isLeadFloat ? 0.32 : 0.15) * pop;
      const x = item.anchor.x;
      const y = item.anchor.y - 40 - rise - item.stack * VFX_TIMING.floatStackGap;
      const wet = entity?.wetColor
        || this.colors["--ink-player-wet"]
        || this.colors["--bone-100"];

      context.save();
      context.translate(x, y);
      context.scale(scale, scale);
      context.globalAlpha = fadeIn * fadeOut;
      // Thick sumi halo then wet fill — claim +% must pop off any plane ink.
      context.lineWidth = isLeadFloat ? 9 : 7;
      context.strokeStyle = this.colors["--sumi-950"];
      context.strokeText(item.text, 0, 0);
      context.fillStyle = wet;
      context.fillText(item.text, 0, 0);
      context.restore();
    }
    context.restore();
  }
}
