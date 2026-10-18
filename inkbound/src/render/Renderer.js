import { Vfx } from "./Vfx.js";

export const BRAND_TOKENS = Object.freeze([
  "--sumi-950",
  "--sumi-900",
  "--sumi-800",
  "--sumi-700",
  "--sumi-600",
  "--bone-100",
  "--bone-300",
  "--bone-500",
  "--ink-player",
  "--ink-player-wet",
  "--ink-bot-1",
  "--ink-bot-1-wet",
  "--ink-bot-2",
  "--ink-bot-2-wet",
  "--ink-bot-3",
  "--ink-bot-3-wet",
  "--state-cut",
  "--state-win",
  "--focus-ring",
]);

export function readBrandTokens(root = document.documentElement) {
  const css = getComputedStyle(root);
  const map = {};
  for (const token of BRAND_TOKENS) {
    const val = css.getPropertyValue(token).trim();
    if (val) map[token] = val;
  }
  return map;
}

export class Renderer {
  constructor(canvas, colors, config, catalog = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.colors = { ...readBrandTokens(), ...colors };
    this.config = config;
    this.catalog = catalog;
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.camera = { x: 0, y: 0 };
    this.lookAhead = { x: 0, y: 0 };
    this.cameraReady = false;
    this.territoryCanvas = document.createElement("canvas");
    this.territoryScale = 4;
    this.cachedGrid = null;
    this.cachedVersion = -1;
    this.patternCache = new Map();
    this.stageImageId = null;
    this.terrainImageId = null;
    this.vfx = new Vfx(this.colors, config, Math.random, catalog);
    this.resize();
  }

  setCatalog(catalog) {
    this.catalog = catalog;
    this.vfx.setCatalog?.(catalog);
    this.patternCache.clear();
    this.cachedVersion = -1;
  }

  setStageArt(stage) {
    this.stageImageId = stage?.backgroundImageId || null;
    this.terrainImageId = stage?.terrainImageId || null;
    this.cachedVersion = -1;
  }

  catalogImage(id) {
    return id && this.catalog ? this.catalog.get(id) : null;
  }

  patternFor(entity) {
    const id = entity.patternImageId;
    if (!id || !this.catalog) return null;
    const key = `${id}|${entity.color}`;
    if (this.patternCache.has(key)) return this.patternCache.get(key);
    const img = this.catalog.get(id);
    if (!img) return null;
    const tile = document.createElement("canvas");
    const size = 64;
    tile.width = size;
    tile.height = size;
    const tctx = tile.getContext("2d");
    tctx.fillStyle = entity.color;
    tctx.fillRect(0, 0, size, size);
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(img, 0, 0, size, size);
    tctx.globalCompositeOperation = "source-atop";
    tctx.globalAlpha = 0.55;
    tctx.fillStyle = entity.color;
    tctx.fillRect(0, 0, size, size);
    const pattern = this.territoryCanvas.getContext("2d").createPattern(tile, "repeat");
    this.patternCache.set(key, pattern);
    return pattern;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.width = rect.width || 1;
    this.height = rect.height || 1;
    this.dpr = dpr;
  }

  resetCamera(position, heading = -0.2) {
    this.lookAhead.x = Math.cos(heading) * this.config.cameraLookAhead;
    this.lookAhead.y = Math.sin(heading) * this.config.cameraLookAhead;
    this.camera.x = position.x + this.lookAhead.x;
    this.camera.y = position.y + this.lookAhead.y;
    this.cameraReady = true;
    this.cachedGrid = null;
    this.cachedVersion = -1;
    this.vfx.reset();
  }

  computeScale() {
    const viewH = this.config.cameraViewHeight ?? 820;
    const minViewW = this.config.cameraMinViewWidth ?? 700;
    const maxSpan = this.config.cameraMaxViewSpan ?? 1360;
    const fitScale = Math.min(this.width / minViewW, this.height / viewH);
    const maxSpanScale = Math.max(this.width, this.height) / maxSpan;
    return Math.max(fitScale, maxSpanScale);
  }

  rebuildTerritory(game) {
    const { grid } = game;
    if (this.cachedGrid === grid && this.cachedVersion === grid.version) return;
    this.cachedGrid = grid;
    this.cachedVersion = grid.version;

    const scale = this.territoryScale;
    const size = grid.size;
    const canvasSize = size * scale;
    if (this.territoryCanvas.width !== canvasSize || this.territoryCanvas.height !== canvasSize) {
      this.territoryCanvas.width = canvasSize;
      this.territoryCanvas.height = canvasSize;
    }

    const context = this.territoryCanvas.getContext("2d");
    context.clearRect(0, 0, canvasSize, canvasSize);

    const cells = grid.cells;
    for (const entity of game.entities) {
      const id = entity.id;
      if (grid.counts[id] <= 0) continue;

      // 1. Dark pressed-seal outer edge along boundary cells
      context.beginPath();
      const outerR = scale * 0.78;
      for (let row = 0; row < size; row += 1) {
        const rowOffset = row * size;
        for (let col = 0; col < size; col += 1) {
          const idx = rowOffset + col;
          if (cells[idx] !== id) continue;
          const topDiff = row === 0 || cells[idx - size] !== id;
          const bottomDiff = row === size - 1 || cells[idx + size] !== id;
          const leftDiff = col === 0 || cells[idx - 1] !== id;
          const rightDiff = col === size - 1 || cells[idx + 1] !== id;
          if (topDiff || bottomDiff || leftDiff || rightDiff) {
            const cx = (col + 0.5) * scale;
            const cy = (row + 0.5) * scale;
            context.moveTo(cx + outerR, cy);
            context.arc(cx, cy, outerR, 0, Math.PI * 2);
          }
        }
      }
      context.save();
      context.globalAlpha = 0.45;
      context.fillStyle = this.colors["--sumi-950"];
      context.fill();
      context.restore();

      // 2. Matte dry ink fill (scanline runs + rounded boundary seals).
      // Prefer indexed skin pattern when the catalog has one.
      const pattern = this.patternFor(entity);
      context.fillStyle = pattern || entity.color;
      context.beginPath();
      const sealR = scale * 0.66;
      for (let row = 0; row < size; row += 1) {
        const rowOffset = row * size;
        let runStart = -1;
        for (let col = 0; col <= size; col += 1) {
          const owned = col < size && cells[rowOffset + col] === id;
          if (owned && runStart < 0) {
            runStart = col;
          } else if (!owned && runStart >= 0) {
            context.rect(
              runStart * scale,
              row * scale,
              (col - runStart) * scale,
              scale,
            );
            runStart = -1;
          }
          if (owned) {
            const idx = rowOffset + col;
            const topDiff = row === 0 || cells[idx - size] !== id;
            const bottomDiff = row === size - 1 || cells[idx + size] !== id;
            const leftDiff = col === 0 || cells[idx - 1] !== id;
            const rightDiff = col === size - 1 || cells[idx + 1] !== id;
            if (topDiff || bottomDiff || leftDiff || rightDiff) {
              const cx = (col + 0.5) * scale;
              const cy = (row + 0.5) * scale;
              context.moveTo(cx + sealR, cy);
              context.arc(cx, cy, sealR, 0, Math.PI * 2);
            }
          }
        }
      }
      context.fill();
    }
  }

  render(game, alpha, frameTime) {
    if (game.arena) game.arena.game = game;
    this.resize();
    this.rebuildTerritory(game);

    const player = game.player;
    const playerPosition = this.interpolatedPosition(player, alpha);
    const lookGain = player.alive ? this.config.cameraLookAhead : 0;
    const desiredLookX = Math.cos(player.heading) * lookGain;
    const desiredLookY = Math.sin(player.heading) * lookGain;

    if (!this.cameraReady) {
      this.lookAhead.x = desiredLookX;
      this.lookAhead.y = desiredLookY;
      this.camera.x = playerPosition.x + desiredLookX;
      this.camera.y = playerPosition.y + desiredLookY;
      this.cameraReady = true;
    } else {
      const lookBlend = 1 - Math.exp(-(this.config.cameraLookAheadFollow ?? 5.5) * frameTime);
      this.lookAhead.x += (desiredLookX - this.lookAhead.x) * lookBlend;
      this.lookAhead.y += (desiredLookY - this.lookAhead.y) * lookBlend;

      const rawTargetX = playerPosition.x + this.lookAhead.x;
      const rawTargetY = playerPosition.y + this.lookAhead.y;
      const maxCamRadius = game.arena.radius * 0.92;
      const rawLen = Math.hypot(rawTargetX, rawTargetY);
      const clampedScale = rawLen > maxCamRadius ? maxCamRadius / rawLen : 1;
      const targetX = rawTargetX * clampedScale;
      const targetY = rawTargetY * clampedScale;

      const camBlend = 1 - Math.exp(-this.config.cameraFollow * frameTime);
      this.camera.x += (targetX - this.camera.x) * camBlend;
      this.camera.y += (targetY - this.camera.y) * camBlend;
    }

    this.vfx.update(game, frameTime);

    const context = this.ctx;
    context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    context.fillStyle = this.colors["--sumi-950"];
    context.fillRect(0, 0, this.width, this.height);

    const scale = this.computeScale();
    context.save();
    context.translate(this.width * 0.5, this.height * 0.5);
    context.scale(scale, scale);
    context.translate(-this.camera.x, -this.camera.y);

    const radius = game.arena.radius;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fillStyle = this.colors["--sumi-900"];
    context.fill();

    context.save();
    context.clip();

    this.drawStageBackground(context, radius);
    this.drawPlaneGrid(context, radius);

    context.imageSmoothingEnabled = true;
    context.drawImage(
      this.territoryCanvas,
      -radius,
      -radius,
      radius * 2,
      radius * 2,
    );

    this.vfx.drawUnder(context);

    for (const entity of game.entities) {
      this.drawTrail(context, entity, alpha);
    }
    for (const entity of game.entities) {
      if (entity.alive) this.drawEntity(context, entity, alpha);
    }
    context.restore();

    this.drawArenaRim(context, radius);
    this.vfx.drawOver(context, game, (entity) => this.interpolatedPosition(entity, alpha));
    context.restore();

    return this.worldToScreen(playerPosition, scale);
  }

  drawStageBackground(context, radius) {
    const bg = this.catalogImage(this.stageImageId)
      || this.catalogImage("bg-plane-fallback");
    const terrain = this.catalogImage(this.terrainImageId);
    const diameter = radius * 2;
    if (bg) {
      context.save();
      context.globalAlpha = 0.92;
      context.drawImage(bg, -radius, -radius, diameter, diameter);
      context.restore();
    }
    if (terrain) {
      context.save();
      context.globalAlpha = 0.18;
      const tile = Math.max(96, radius * 0.22);
      for (let y = -radius; y < radius; y += tile) {
        for (let x = -radius; x < radius; x += tile) {
          context.drawImage(terrain, x, y, tile, tile);
        }
      }
      context.restore();
    }
    // Keep sumi wash so brand contrast holds over bright stage art.
    context.save();
    context.globalAlpha = bg ? 0.28 : 0;
    context.fillStyle = this.colors["--sumi-950"];
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  drawPlaneGrid(context, radius) {
    const spacing = this.config.planeGridSpacing ?? 120;
    context.save();
    context.strokeStyle = this.colors["--sumi-700"];
    context.lineWidth = 1;
    context.globalAlpha = 0.55;
    context.beginPath();
    for (let pos = -radius + spacing; pos < radius; pos += spacing) {
      context.moveTo(pos, -radius);
      context.lineTo(pos, radius);
      context.moveTo(-radius, pos);
      context.lineTo(radius, pos);
    }
    context.stroke();

    context.globalAlpha = 0.42;
    context.beginPath();
    context.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    context.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  drawArenaRim(context, radius) {
    context.save();

    // Outer recessed frame
    context.beginPath();
    context.arc(0, 0, radius + 7, 0, Math.PI * 2);
    context.strokeStyle = this.colors["--sumi-800"];
    context.lineWidth = 12;
    context.stroke();

    // Inner non-lethal slide guide track
    context.save();
    context.beginPath();
    context.arc(0, 0, radius - this.config.bodyRadius * 2, 0, Math.PI * 2);
    context.setLineDash([10, 12]);
    context.strokeStyle = this.colors["--sumi-700"];
    context.lineWidth = 1.5;
    context.globalAlpha = 0.85;
    context.stroke();
    context.restore();

    // Primary stone rim stroke
    context.beginPath();
    context.arc(0, 0, radius + 2.5, 0, Math.PI * 2);
    context.strokeStyle = this.colors["--sumi-600"];
    context.lineWidth = 6.5;
    context.stroke();

    // Radial tick marks along the rim so tangential rim-sliding reads clearly
    const tickCount = 72;
    context.beginPath();
    for (let i = 0; i < tickCount; i += 1) {
      const angle = (i / tickCount) * Math.PI * 2;
      const major = i % 6 === 0;
      const innerR = major ? radius - 3 : radius;
      const outerR = major ? radius + 9 : radius + 6;
      context.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      context.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    }
    context.strokeStyle = this.colors["--bone-500"];
    context.lineWidth = 1.5;
    context.globalAlpha = 0.42;
    context.stroke();

    // Crisp inner boundary highlight hairline
    context.beginPath();
    context.arc(0, 0, radius - 0.5, 0, Math.PI * 2);
    context.strokeStyle = this.colors["--bone-300"];
    context.lineWidth = 1.75;
    context.globalAlpha = 0.62;
    context.stroke();

    context.restore();
  }

  interpolatedPosition(entity, alpha) {
    return {
      x: entity.previousPosition.x + (entity.position.x - entity.previousPosition.x) * alpha,
      y: entity.previousPosition.y + (entity.position.y - entity.previousPosition.y) * alpha,
    };
  }

  worldToScreen(point, scale = this.computeScale()) {
    return {
      x: this.width * 0.5 + (point.x - this.camera.x) * scale,
      y: this.height * 0.5 + (point.y - this.camera.y) * scale,
    };
  }

  drawTrail(context, entity, alpha = 1) {
    if (!entity.trail.active) return;
    const points = entity.trail.points;
    const head = this.interpolatedPosition(entity, alpha);

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    const tracePath = () => {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        context.lineTo(points[index].x, points[index].y);
      }
      if (entity.alive && entity.outsideOwnTerritory) {
        context.lineTo(head.x, head.y);
      }
    };

    // 1. Dark separation trough so wet strokes never blend into dry fills
    tracePath();
    context.globalAlpha = 0.72;
    context.strokeStyle = this.colors["--sumi-950"];
    context.lineWidth = entity.trail.width + 5;
    context.stroke();

    // 2. Full-saturation wet ink body
    tracePath();
    context.globalAlpha = 1;
    context.strokeStyle = entity.wetColor;
    context.lineWidth = entity.trail.width;
    context.stroke();

    // 3. Origin bead at exit point
    context.beginPath();
    context.arc(points[0].x, points[0].y, entity.trail.width * 0.58, 0, Math.PI * 2);
    context.fillStyle = entity.wetColor;
    context.fill();

    // 4. Glossy wet center spine (brightness + shape contrast vs flat matte fill)
    tracePath();
    context.globalAlpha = 0.45;
    context.strokeStyle = this.colors["--bone-100"];
    context.lineWidth = Math.max(1.8, entity.trail.width * 0.25);
    context.stroke();

    // 5. Subtle calligraphic wet bead dashes along the spine
    context.save();
    tracePath();
    context.setLineDash([7, 11]);
    context.globalAlpha = 0.36;
    context.strokeStyle = this.colors["--bone-100"];
    context.lineWidth = Math.max(1.4, entity.trail.width * 0.16);
    context.stroke();
    context.restore();

    context.restore();
  }

  drawEntity(context, entity, alpha) {
    const position = this.interpolatedPosition(entity, alpha);
    const r = entity.radius;

    context.save();
    context.translate(position.x, position.y);
    context.rotate(entity.heading);

    // Contact shadow
    context.beginPath();
    context.arc(0, 0, r + 2.5, 0, Math.PI * 2);
    context.fillStyle = this.colors["--sumi-950"];
    context.globalAlpha = 0.75;
    context.fill();
    context.globalAlpha = 1;

    // Forward calligraphic nib / directional point
    context.beginPath();
    context.moveTo(r * 0.22, -r * 0.52);
    context.lineTo(r * 1.28, 0);
    context.lineTo(r * 0.22, r * 0.52);
    context.closePath();
    context.fillStyle = entity.wetColor;
    context.fill();
    context.strokeStyle = this.colors["--sumi-950"];
    context.lineWidth = 2.2;
    context.stroke();

    // Main ink bead body — indexed character art when available, else fill.
    const bead = this.catalogImage(entity.beadImageId);
    if (bead) {
      context.save();
      context.beginPath();
      context.arc(0, 0, r, 0, Math.PI * 2);
      context.clip();
      context.drawImage(bead, -r, -r, r * 2, r * 2);
      context.globalCompositeOperation = "source-atop";
      context.globalAlpha = 0.55;
      context.fillStyle = entity.wetColor;
      context.fillRect(-r, -r, r * 2, r * 2);
      context.restore();
      context.beginPath();
      context.arc(0, 0, r, 0, Math.PI * 2);
      context.strokeStyle = this.colors["--sumi-950"];
      context.lineWidth = 3;
      context.stroke();
    } else {
      context.beginPath();
      context.arc(0, 0, r, 0, Math.PI * 2);
      context.fillStyle = entity.wetColor;
      context.fill();
      context.strokeStyle = this.colors["--sumi-950"];
      context.lineWidth = 3;
      context.stroke();
    }

    // Inner core (dry tone ring inside wet bead)
    context.beginPath();
    context.arc(-r * 0.1, 0, r * 0.48, 0, Math.PI * 2);
    context.fillStyle = entity.coreColor ?? entity.color;
    context.fill();

    // Liquid surface-tension crescent sheen along leading edge
    context.beginPath();
    context.arc(0, 0, r * 0.64, -Math.PI * 0.36, Math.PI * 0.36);
    context.strokeStyle = this.colors["--bone-100"];
    context.lineWidth = Math.max(1.8, r * 0.16);
    context.lineCap = "round";
    context.globalAlpha = 0.6;
    context.stroke();

    context.restore();
  }
}
