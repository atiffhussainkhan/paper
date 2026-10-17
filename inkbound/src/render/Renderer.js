export class Renderer {
  constructor(canvas, colors, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.colors = colors;
    this.config = config;
    this.width = 1;
    this.height = 1;
    this.camera = { x: 0, y: 0 };
    this.cameraReady = false;
    this.territoryCanvas = document.createElement("canvas");
    this.cachedGrid = null;
    this.cachedVersion = -1;
    this.resize();
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

  resetCamera(position) {
    this.camera.x = position.x;
    this.camera.y = position.y;
    this.cameraReady = false;
    this.cachedGrid = null;
  }

  rebuildTerritory(game) {
    const { grid } = game;
    if (this.cachedGrid === grid && this.cachedVersion === grid.version) return;
    this.cachedGrid = grid;
    this.cachedVersion = grid.version;
    this.territoryCanvas.width = grid.size;
    this.territoryCanvas.height = grid.size;
    const context = this.territoryCanvas.getContext("2d");
    context.clearRect(0, 0, grid.size, grid.size);
    for (const entity of game.entities) {
      context.fillStyle = entity.color;
      context.beginPath();
      for (let index = 0; index < grid.cells.length; index += 1) {
        if (grid.cells[index] !== entity.id) continue;
        const col = index % grid.size;
        const row = Math.floor(index / grid.size);
        context.rect(col, row, 1, 1);
      }
      context.fill();
    }
  }

  render(game, alpha, frameTime) {
    this.resize();
    this.rebuildTerritory(game);
    const player = game.player;
    const playerPosition = this.interpolatedPosition(player, alpha);
    const target = {
      x: playerPosition.x + Math.cos(player.heading) * this.config.cameraLookAhead,
      y: playerPosition.y + Math.sin(player.heading) * this.config.cameraLookAhead,
    };
    if (!this.cameraReady) {
      this.camera = { ...target };
      this.cameraReady = true;
    } else {
      const blend = 1 - Math.exp(-this.config.cameraFollow * frameTime);
      this.camera.x += (target.x - this.camera.x) * blend;
      this.camera.y += (target.y - this.camera.y) * blend;
    }

    const context = this.ctx;
    context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    context.fillStyle = this.colors["--sumi-950"];
    context.fillRect(0, 0, this.width, this.height);

    const scale = this.height / this.config.cameraViewHeight;
    context.save();
    context.translate(this.width * 0.5, this.height * 0.5);
    context.scale(scale, scale);
    context.translate(-this.camera.x, -this.camera.y);

    context.beginPath();
    context.arc(0, 0, game.arena.radius, 0, Math.PI * 2);
    context.fillStyle = this.colors["--sumi-900"];
    context.fill();
    context.save();
    context.clip();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      this.territoryCanvas,
      -game.arena.radius,
      -game.arena.radius,
      game.arena.radius * 2,
      game.arena.radius * 2,
    );

    for (const entity of game.entities) this.drawTrail(context, entity);
    for (const entity of game.entities) {
      if (entity.alive) this.drawEntity(context, entity, alpha);
    }
    context.restore();

    context.beginPath();
    context.arc(0, 0, game.arena.radius, 0, Math.PI * 2);
    context.strokeStyle = this.colors["--sumi-600"];
    context.lineWidth = 5;
    context.stroke();
    context.restore();

    return this.worldToScreen(playerPosition, scale);
  }

  interpolatedPosition(entity, alpha) {
    return {
      x: entity.previousPosition.x + (entity.position.x - entity.previousPosition.x) * alpha,
      y: entity.previousPosition.y + (entity.position.y - entity.previousPosition.y) * alpha,
    };
  }

  worldToScreen(point, scale = this.height / this.config.cameraViewHeight) {
    return {
      x: this.width * 0.5 + (point.x - this.camera.x) * scale,
      y: this.height * 0.5 + (point.y - this.camera.y) * scale,
    };
  }

  drawTrail(context, entity) {
    if (!entity.trail.active) return;
    const points = entity.trail.points;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }
    if (entity.alive && entity.outsideOwnTerritory) {
      context.lineTo(entity.position.x, entity.position.y);
    }
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = entity.wetColor;
    context.lineWidth = entity.trail.width;
    context.stroke();

    context.globalAlpha = 0.34;
    context.strokeStyle = this.colors["--bone-100"];
    context.lineWidth = Math.max(1.5, entity.trail.width * 0.18);
    context.stroke();
    context.globalAlpha = 1;
  }

  drawEntity(context, entity, alpha) {
    const position = this.interpolatedPosition(entity, alpha);
    context.save();
    context.translate(position.x, position.y);
    context.rotate(entity.heading);
    context.beginPath();
    context.arc(0, 0, entity.radius, 0, Math.PI * 2);
    context.fillStyle = entity.wetColor;
    context.fill();
    context.strokeStyle = this.colors["--sumi-950"];
    context.lineWidth = 3;
    context.stroke();

    context.beginPath();
    context.moveTo(entity.radius * 0.28, -entity.radius * 0.3);
    context.lineTo(entity.radius * 1.12, 0);
    context.lineTo(entity.radius * 0.28, entity.radius * 0.3);
    context.fillStyle = entity.wetColor;
    context.fill();
    context.restore();
  }
}
