import { catalogAssetUrl } from "../assets/ImageCatalog.js";

export class Hud {
  constructor(root, onRestart, catalog = null) {
    this.root = root;
    this.onRestart = onRestart;
    this.catalog = catalog;
    this.profile = null;
    this.percent = root.querySelector('[data-hud="percent"]');
    this.board = root.querySelector('[data-hud="board"]');
    this.hint = root.querySelector('[data-hud="hint"]');
    this.overlay = root.querySelector('[data-hud="overlay"]');
    this.overlayTitle = root.querySelector('[data-hud="overlay-title"]');
    this.overlayStats = root.querySelector('[data-hud="overlay-stats"]');
    this.restart = root.querySelector('[data-hud="restart"]');
    this.best = root.querySelector('[data-hud="best"]');
    this.overlayBest = root.querySelector('[data-hud="overlay-best"]');
    this.overlayUnlocks = root.querySelector('[data-hud="overlay-unlocks"]');
    this.skinsRoot = root.querySelector('[data-hud="skins"]');
    this.stageName = root.querySelector('[data-hud="stage-name"]');
    this.stagePct = root.querySelector('[data-hud="stage-pct"]');
    this.stageBar = root.querySelector('[data-hud="stage-bar"]');
    this.stageFill = root.querySelector('[data-hud="stage-fill"]');
    this.overlayStage = root.querySelector('[data-hud="overlay-stage"]');
    this.cast = root.querySelector('[data-hud="cast"]');
    this.lastBestText = "";
    this.runSummary = null;
    this.stageSummary = null;

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
    this.mountCast();
  }

  mountCast() {
    const root = this.cast;
    if (!root || !this.catalog) return;
    const plates = [...this.catalog.category("character")].sort((a, b) => {
      const af = a.tags?.includes("figure") ? 0 : 1;
      const bf = b.tags?.includes("figure") ? 0 : 1;
      return af - bf || a.id.localeCompare(b.id);
    });
    root.replaceChildren();
    for (const entry of plates) {
      const item = document.createElement("figure");
      item.className = "hud-cast__plate";
      if (entry.tags?.includes("figure")) item.classList.add("is-figure");
      item.dataset.image = entry.id;
      const img = document.createElement("img");
      img.alt = "";
      img.src = new URL(entry.path, window.location.href).href;
      const caption = document.createElement("figcaption");
      caption.textContent = entry.label || entry.id;
      item.append(img, caption);
      root.appendChild(item);
    }
  }

  bindProfile(profile) {
    this.profile = profile;
    this.applyFtueState();
  }

  applyFtueState() {
    if (!this.hint || !this.profile) return;
    if (this.profile.get("ftueClaimDone", false)) {
      this.hasClaimed = true;
      this.hint.classList.add("is-faded");
    }
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
      this.renderUnlockCelebration([]);
      if (this.overlay) {
        this.overlay.classList.remove("hud-overlay--new-best", "hud-overlay--has-unlocks");
      }
      return;
    }
    const parts = [summary.isNewBest ? "New best." : `Best ${summary.bestPct.toFixed(1)}%.`];
    if (summary.unlockedNow?.length) {
      parts.push(`${summary.unlockedNow.map((skin) => skin.name).join(", ")} unlocked.`);
    }
    this.overlayBest.textContent = parts.join(" ");
    if (this.overlay) {
      this.overlay.classList.toggle("hud-overlay--new-best", Boolean(summary.isNewBest));
      this.overlay.classList.toggle(
        "hud-overlay--has-unlocks",
        Boolean(summary.unlockedNow?.length),
      );
    }
    this.renderUnlockCelebration(summary.unlockedNow || []);
  }

  renderUnlockCelebration(unlockedNow) {
    const root = this.overlayUnlocks;
    if (!root) return;
    if (!unlockedNow.length) {
      root.hidden = true;
      root.replaceChildren();
      return;
    }
    root.hidden = false;
    root.replaceChildren();
    const label = document.createElement("p");
    label.className = "hud-overlay__unlocks-label";
    label.textContent = unlockedNow.length === 1 ? "Ink opened" : "Inks opened";
    root.appendChild(label);
    const list = document.createElement("div");
    list.className = "hud-overlay__unlocks-list";
    list.setAttribute("role", "list");
    for (const skin of unlockedNow) {
      const item = document.createElement("div");
      item.className = "hud-unlock";
      item.setAttribute("role", "listitem");
      item.style.setProperty("--unlock-dry", skin.dry);
      item.style.setProperty("--unlock-wet", skin.wet);
      const pickerId = skin.pickerImageId || skin.patternImageId;
      const entry = this.catalog?.getEntry?.(pickerId);
      if (entry) {
        item.style.setProperty("--unlock-skin-art", catalogAssetUrl(entry.path));
        item.classList.add("has-art");
      }
      item.innerHTML = [
        '<span class="hud-unlock__burst" aria-hidden="true"></span>',
        '<span class="hud-unlock__spark" aria-hidden="true"></span>',
        '<span class="hud-unlock__bead" aria-hidden="true"></span>',
        '<span class="hud-unlock__name"></span>',
      ].join("");
      item.querySelector(".hud-unlock__name").textContent = skin.name;
      list.appendChild(item);
    }
    root.appendChild(list);
  }

  setStage(stageStatus) {
    if (!stageStatus) return;
    const label = `Stage ${stageStatus.stageNumber ?? (stageStatus.stageIndex ?? 0) + 1} · ${stageStatus.stageName ?? stageStatus.stage?.name ?? ""}`;
    if (this.stageName) this.stageName.textContent = label;
    const pct = Math.max(0, Math.min(100, Math.round(stageStatus.progressPct ?? (stageStatus.progress ?? 0) * 100)));
    if (this.stagePct) this.stagePct.textContent = `${pct}%`;
    if (this.stageBar) this.stageBar.setAttribute("aria-valuenow", String(pct));
    if (this.stageFill) this.stageFill.style.width = `${pct}%`;
  }

  setStageSummary(stageResult) {
    this.stageSummary = stageResult;
    this.renderStageSummary();
  }

  renderStageSummary() {
    if (!this.overlayStage) return;
    if (!this.stageSummary) {
      this.overlayStage.textContent = "";
      this.overlayStage.classList.remove("is-cleared");
      return;
    }
    this.overlayStage.textContent = this.stageSummary.message || "";
    this.overlayStage.classList.toggle("is-cleared", Boolean(this.stageSummary.cleared));
  }

  reset() {
    this.runSummary = null;
    this.stageSummary = null;
    this.renderRunSummary();
    this.renderStageSummary();
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
      this.overlay.classList.remove(
        "hud-overlay--win",
        "hud-overlay--new-best",
        "hud-overlay--has-unlocks",
      );
    }
    if (this.overlayUnlocks) {
      this.overlayUnlocks.hidden = true;
      this.overlayUnlocks.replaceChildren();
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
      this.applyRowArt(cached, entity);
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
      artId: "",
    };
    this.applyRowArt(entry, entity);
    this.rows.set(entity.id, entry);
    return entry;
  }

  applyRowArt(entry, entity) {
    const beadId = entity.beadImageId || "";
    if (entry.artId === beadId) return;
    entry.artId = beadId;
    const image = this.catalog?.getEntry?.(beadId);
    if (image) {
      entry.row.style.setProperty("--row-art", catalogAssetUrl(image.path));
      entry.row.classList.add("has-bead");
    } else {
      entry.row.style.removeProperty("--row-art");
      entry.row.classList.remove("has-bead");
    }
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
        if (this.profile && !this.profile.get("ftueClaimDone", false)) {
          this.profile.set("ftueClaimDone", true);
        }
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

    for (let index = 0; index < ranking.length; index += 1) {
      const { entity, share } = ranking[index];
      const entry = this.ensureRow(entity);
      entry.row.classList.toggle("is-self", Boolean(entity.isPlayer));
      entry.row.classList.toggle("is-dead", !entity.alive);
      entry.row.classList.toggle("is-lead", index === 0 && entity.alive && share > 0);

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
        this.renderStageSummary();
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
