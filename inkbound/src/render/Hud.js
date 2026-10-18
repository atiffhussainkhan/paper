export class Hud {
  constructor(root, onRestart) {
    this.root = root;
    this.onRestart = onRestart;
    this.percent = root.querySelector('[data-hud="percent"]');
    this.board = root.querySelector('[data-hud="board"]');
    this.hint = root.querySelector('[data-hud="hint"]');
    this.overlay = root.querySelector('[data-hud="overlay"]');
    this.overlayTitle = root.querySelector('[data-hud="overlay-title"]');
    this.overlayStats = root.querySelector('[data-hud="overlay-stats"]');
    this.restart = root.querySelector('[data-hud="restart"]');
    this.best = root.querySelector('[data-hud="best"]');
    this.overlayBest = root.querySelector('[data-hud="overlay-best"]');
    this.skinsRoot = root.querySelector('[data-hud="skins"]');
    this.lastBestText = "";
    this.runSummary = null;

    this.rows = new Map();
    this.lastPercentText = "";
    this.lastOrderKey = "";
    this.initialPlayerCells = null;
    this.playerVenturedOut = false;
    this.hasClaimed = false;
    this.overlayVisible = false;
    this.lastRestartAt = -Infinity;

    this.handleRestartEvent = (event) => {
      if (event) {
        event.stopPropagation();
        if (event.type === "touchend" && event.cancelable) {
          event.preventDefault();
        }
      }
      const now = performance.now();
      if (now - this.lastRestartAt < 80) return;
      this.lastRestartAt = now;
      if (typeof this.onRestart === "function") {
        this.onRestart();
      }
    };

    this.stopPointerPropagation = (event) => {
      event.stopPropagation();
    };

    this.handleOverlayKeyDown = (event) => {
      if (!this.overlayVisible) return;
      if (event.target?.closest?.('[data-hud="skins"]')) return;
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        this.handleRestartEvent(event);
      }
    };

    if (this.restart) {
      this.restart.addEventListener("pointerdown", this.stopPointerPropagation);
      this.restart.addEventListener("touchstart", this.stopPointerPropagation, { passive: true });
      this.restart.addEventListener("click", this.handleRestartEvent);
      this.restart.addEventListener("touchend", this.handleRestartEvent, { passive: false });
    }
    window.addEventListener("keydown", this.handleOverlayKeyDown);
  }

  setBest(bestPct) {
    const text = `${bestPct.toFixed(1)}%`;
    if (this.best && text !== this.lastBestText) this.best.textContent = text;
    this.lastBestText = text;
  }

  // Result of the finished run (see recordRun in meta/Skins.js); shown on the overlay.
  setRunSummary(summary) {
    this.runSummary = summary;
    this.renderRunSummary();
  }

  renderRunSummary() {
    if (!this.overlayBest) return;
    const summary = this.runSummary;
    if (!summary) {
      this.overlayBest.textContent = "";
      return;
    }
    const parts = [summary.isNewBest ? "New best." : `Best ${summary.bestPct.toFixed(1)}%.`];
    if (summary.unlockedNow?.length) {
      parts.push(`${summary.unlockedNow.map((skin) => skin.name).join(", ")} unlocked.`);
    }
    this.overlayBest.textContent = parts.join(" ");
  }

  reset() {
    this.runSummary = null;
    this.renderRunSummary();
    this.lastPercentText = "";
    this.lastOrderKey = "";
    this.initialPlayerCells = null;
    this.playerVenturedOut = false;
    this.hasClaimed = false;
    this.overlayVisible = false;
    if (this.hint) {
      this.hint.classList.remove("is-faded");
    }
    if (this.overlay) {
      this.overlay.hidden = true;
      this.overlay.classList.remove("hud-overlay--win");
    }
  }

  ensureRow(entity) {
    if (this.rows.has(entity.id)) {
      const cached = this.rows.get(entity.id);
      const tokenValue = entity.dryToken ? `var(${entity.dryToken})` : entity.color;
      if (cached.tokenValue !== tokenValue) {
        cached.row.style.setProperty("--row-ink", tokenValue);
        cached.tokenValue = tokenValue;
      }
      if (cached.name !== entity.name) {
        cached.nameEl.textContent = entity.name;
        cached.name = entity.name;
      }
      return cached;
    }

    const row = document.createElement("li");
    row.className = "hud-board__row";
    row.innerHTML = [
      '<span class="hud-board__swatch" aria-hidden="true"></span>',
      '<span class="hud-board__name"></span>',
      '<span class="hud-board__pct"></span>',
    ].join("");

    const nameEl = row.querySelector(".hud-board__name");
    const pctEl = row.querySelector(".hud-board__pct");
    nameEl.textContent = entity.name;
    const tokenValue = entity.dryToken ? `var(${entity.dryToken})` : entity.color;
    row.style.setProperty("--row-ink", tokenValue);

    const entry = {
      row,
      nameEl,
      pctEl,
      name: entity.name,
      tokenValue,
      lastPct: "",
    };
    this.rows.set(entity.id, entry);
    return entry;
  }

  render(game) {
    const player = game.player;
    const playerId = player.id;
    const currentCells = game.grid.counts[playerId] ?? 0;

    if (this.initialPlayerCells === null && game.state === "playing") {
      this.initialPlayerCells = currentCells;
    }

    if (game.state === "playing" && player.alive && !this.hasClaimed) {
      if (this.initialPlayerCells !== null && currentCells > this.initialPlayerCells) {
        this.hasClaimed = true;
        if (this.hint) this.hint.classList.add("is-faded");
      }
    }

    const rawShare = game.state === "over"
      ? game.finalShare
      : game.grid.share(playerId);
    const displayedShare = Math.max(0, Math.min(1, rawShare || 0));
    const pctFormatted = (displayedShare * 100).toFixed(1);

    if (pctFormatted !== this.lastPercentText && this.percent) {
      this.percent.innerHTML = `${pctFormatted}<small>%</small>`;
      this.lastPercentText = pctFormatted;
    }

    const ranking = game.entities
      .map((entity) => ({
        entity,
        share: entity.alive ? Math.max(0, Math.min(1, game.grid.share(entity.id))) : 0,
      }))
      .sort((a, b) => b.share - a.share || a.entity.id - b.entity.id);

    const orderKey = ranking.map((item) => item.entity.id).join(",");
    const orderChanged = orderKey !== this.lastOrderKey;

    for (const { entity, share } of ranking) {
      const entry = this.ensureRow(entity);
      entry.row.classList.toggle("is-self", Boolean(entity.isPlayer));
      entry.row.classList.toggle("is-dead", !entity.alive);

      const rowPct = `${(share * 100).toFixed(1)}%`;
      if (rowPct !== entry.lastPct) {
        entry.pctEl.textContent = rowPct;
        entry.lastPct = rowPct;
      }

      if (orderChanged && this.board) {
        this.board.appendChild(entry.row);
      }
    }
    this.lastOrderKey = orderKey;

    if (game.state === "over") {
      if (!this.overlayVisible && this.overlay) {
        this.overlayVisible = true;
        this.overlay.hidden = false;
        const won = game.outcome?.type === "win";
        this.overlay.classList.toggle("hud-overlay--win", won);
        if (this.overlayTitle) {
          this.overlayTitle.textContent = game.outcome?.title
            || (won ? "The plane is yours." : "You crossed your own line.");
        }
        if (this.overlayStats) {
          this.overlayStats.textContent = `${(Math.max(0, game.finalShare || 0) * 100).toFixed(1)}% of the plane.`;
        }
        this.renderRunSummary();
        if (this.restart && typeof this.restart.focus === "function") {
          this.restart.focus({ preventScroll: true });
        }
      }
    } else if (this.overlayVisible && this.overlay) {
      this.overlayVisible = false;
      this.overlay.hidden = true;
      this.overlay.classList.remove("hud-overlay--win");
    }
  }

  destroy() {
    if (this.restart) {
      this.restart.removeEventListener("pointerdown", this.stopPointerPropagation);
      this.restart.removeEventListener("touchstart", this.stopPointerPropagation);
      this.restart.removeEventListener("click", this.handleRestartEvent);
      this.restart.removeEventListener("touchend", this.handleRestartEvent);
    }
    window.removeEventListener("keydown", this.handleOverlayKeyDown);
  }
}
