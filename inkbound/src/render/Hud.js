export class Hud {
  constructor(root, onRestart) {
    this.root = root;
    this.percent = root.querySelector('[data-hud="percent"]');
    this.board = root.querySelector('[data-hud="board"]');
    this.hint = root.querySelector('[data-hud="hint"]');
    this.overlay = root.querySelector('[data-hud="overlay"]');
    this.overlayTitle = root.querySelector('[data-hud="overlay-title"]');
    this.overlayStats = root.querySelector('[data-hud="overlay-stats"]');
    this.restart = root.querySelector('[data-hud="restart"]');
    this.rows = new Map();
    this.startedAt = performance.now();
    this.restart.addEventListener("click", onRestart);
  }

  reset() {
    this.startedAt = performance.now();
    this.hint.classList.remove("is-faded");
    this.overlay.hidden = true;
    this.overlay.classList.remove("hud-overlay--win");
  }

  ensureRow(entity) {
    if (this.rows.has(entity.id)) return this.rows.get(entity.id);
    const row = document.createElement("li");
    row.className = "hud-board__row";
    row.innerHTML = [
      '<span class="hud-board__swatch" aria-hidden="true"></span>',
      '<span class="hud-board__name"></span>',
      '<span class="hud-board__pct"></span>',
    ].join("");
    row.querySelector(".hud-board__name").textContent = entity.name;
    row.style.setProperty("--row-ink", entity.color);
    this.rows.set(entity.id, row);
    return row;
  }

  render(game) {
    const displayedShare = game.state === "over"
      ? game.finalShare
      : game.grid.share(game.player.id);
    this.percent.innerHTML = `${(displayedShare * 100).toFixed(1)}<small>%</small>`;

    const ranking = game.entities
      .map((entity) => ({ entity, share: game.grid.share(entity.id) }))
      .sort((a, b) => b.share - a.share || a.entity.id - b.entity.id);
    for (const { entity, share } of ranking) {
      const row = this.ensureRow(entity);
      row.classList.toggle("is-self", entity.isPlayer);
      row.classList.toggle("is-dead", !entity.alive);
      row.querySelector(".hud-board__pct").textContent = `${(share * 100).toFixed(1)}%`;
      this.board.appendChild(row);
    }

    if (performance.now() - this.startedAt > 6000) this.hint.classList.add("is-faded");

    if (game.state === "over") {
      this.overlay.hidden = false;
      const won = game.outcome?.type === "win";
      this.overlay.classList.toggle("hud-overlay--win", won);
      this.overlayTitle.textContent = game.outcome?.title ?? "";
      this.overlayStats.textContent = `${(game.finalShare * 100).toFixed(1)}% of the plane.`;
    } else {
      this.overlay.hidden = true;
    }
  }
}
