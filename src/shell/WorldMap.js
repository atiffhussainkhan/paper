import { catalogAssetUrl } from "../assets/ImageCatalog.js";
import { getProfile } from "../meta/Profile.js";
import {
  STAGES,
  getSelectedStage,
  getSelectedStageIndex,
  getStageStatus,
  regionConquest,
  selectStage,
} from "../meta/Stages.js";

// Atlas of the six Inkbound shores. Bitmaps come only from IMAGE_INDEX.
// A shore click selects the next arena. It does not start a match.

function cssUrl(catalog, id) {
  if (!id) return "none";
  const entry = catalog?.getEntry?.(id);
  return entry ? catalogAssetUrl(entry.path) : "none";
}

function skyPosition(catalog, id) {
  const image = catalog?.get?.(id);
  const width = image?.naturalWidth || image?.width || 0;
  const height = image?.naturalHeight || image?.height || 0;
  if (width > 0 && height > 0 && width / height >= 1.7) return "center 42%";
  return "center";
}

export function createWorldMap(root, catalog, hooks = {}) {
  const board = root?.querySelector("[data-map='board']") ?? null;
  const statusEl = root?.querySelector("[data-map='status']") ?? null;
  const detailEl = root?.querySelector("[data-map='detail']") ?? null;
  let renderer = null;
  let latest = null;
  let focusIndex = null;
  let pendingFocus = null;

  function profile() {
    return hooks.profile?.() ?? getProfile();
  }

  function paintChrome(current) {
    const best = Number(current.get("bestPct", 0));
    const bestText = `${(Number.isFinite(best) ? best : 0).toFixed(1)}%`;
    const frontier = getStageStatus(current);
    if (statusEl) {
      if (frontier.stageIndex >= STAGES.length) {
        statusEl.textContent = `Every shore sealed · Best ${bestText}`;
      } else {
        const pct = Math.max(0, Math.min(100, Math.round(frontier.progressPct ?? 0)));
        statusEl.textContent = `Frontier · ${frontier.stageName} · ${pct}% · Best ${bestText}`;
      }
    }
    const vellum = catalog?.binding?.("fallback", "background") || "bg-plane-fallback";
    const entry = catalog?.getEntry?.(vellum);
    if (entry && root) root.style.setProperty("--shell-plate", catalogAssetUrl(entry.path));
    if (board) {
      board.classList.add("is-atlas");
      board.setAttribute("role", "group");
      board.style.setProperty("--art-map-vellum", cssUrl(catalog, vellum));
      board.style.setProperty(
        "--art-map-compass",
        cssUrl(catalog, catalog?.binding?.("ui", "iconCircle") || "ui-icon-circle"),
      );
      board.style.setProperty(
        "--art-map-grain",
        cssUrl(catalog, catalog?.binding?.("terrain", "planeGrain") || "terrain-abstract-01"),
      );
    }
  }

  function describe(current) {
    if (!detailEl) return;
    const viewed = regionConquest(current, focusIndex ?? getSelectedStageIndex(current));
    const selected = regionConquest(current, getSelectedStageIndex(current));
    if (!viewed || !selected) return;
    const best = selected.bestPct.toFixed(1);
    if (viewed.locked) {
      const prev = STAGES[viewed.index - 1];
      detailEl.textContent = `${viewed.stage.name} is locked. Seal ${prev?.name ?? "the shore before it"} to open it. Next arena stays ${selected.stage.name}. Your best claim is ${best}%.`;
      return;
    }
    if (viewed.sealed) {
      detailEl.textContent = `${viewed.stage.name} is sealed. Conquest 100%. Next arena: ${selected.stage.name}. Your best claim is ${best}%. Play starts the match.`;
      return;
    }
    const target = Math.round(viewed.completionTarget * 100);
    detailEl.textContent = `${viewed.stage.name} is the open shore. Conquest ${viewed.fillPct}% toward ${target}% across runs. Your best claim is ${best}%. Choosing a shore does not start the match.`;
  }

  function paintAtlas(current) {
    if (!board) return;
    const selectedIndex = getSelectedStageIndex(current);
    board.replaceChildren();

    const compass = document.createElement("div");
    compass.className = "map-compass";
    compass.setAttribute("aria-hidden", "true");
    board.appendChild(compass);

    STAGES.forEach((stage, index) => {
      const region = regionConquest(current, index);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `shore shore--${stage.id}`;
      button.dataset.shore = stage.id;
      button.dataset.mapStage = stage.id;
      if (region.locked) button.classList.add("is-locked");
      if (region.sealed) button.classList.add("is-sealed");
      if (region.active) button.classList.add("is-frontier");
      if (index === selectedIndex) button.classList.add("is-selected");
      button.setAttribute("aria-pressed", index === selectedIndex ? "true" : "false");
      button.setAttribute("aria-disabled", region.locked ? "true" : "false");
      const word = region.locked ? "locked" : region.sealed ? "sealed" : `${region.fillPct} percent conquest`;
      button.setAttribute(
        "aria-label",
        `${stage.name}, ${word}${index === selectedIndex ? ", next arena" : ""}`,
      );

      const layers = catalog?.stageLayers?.(stage.id) || {};
      const plateId = layers.background || stage.backgroundImageId;
      button.style.setProperty("--shore-plate", cssUrl(catalog, plateId));
      button.style.setProperty("--shore-terrain", cssUrl(catalog, layers.terrain || stage.terrainImageId));
      button.style.setProperty("--shore-accent", cssUrl(catalog, layers.accent));
      button.style.setProperty("--shore-pos", skyPosition(catalog, plateId));
      button.style.setProperty("--shore-fill", `${region.fillPct}%`);

      const plate = document.createElement("span");
      plate.className = "shore__plate";
      plate.setAttribute("aria-hidden", "true");
      const terrain = document.createElement("span");
      terrain.className = "shore__terrain";
      terrain.setAttribute("aria-hidden", "true");
      const accent = document.createElement("span");
      accent.className = "shore__accent";
      accent.setAttribute("aria-hidden", "true");
      const ink = document.createElement("span");
      ink.className = "shore__ink";
      ink.setAttribute("aria-hidden", "true");
      const medal = document.createElement("span");
      medal.className = "shore__medal";
      medal.setAttribute("aria-hidden", "true");
      const copy = document.createElement("span");
      copy.className = "shore__copy";
      const lock = document.createElement("span");
      lock.className = "shore__lock";
      lock.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "shore__name";
      name.textContent = stage.name;
      const meta = document.createElement("span");
      meta.className = "shore__meta";
      if (region.locked) meta.textContent = "Locked";
      else if (region.sealed) meta.textContent = "Sealed";
      else meta.textContent = `${region.fillPct}%`;
      copy.append(lock, name, meta);
      button.append(plate, terrain, accent, ink, medal, copy);
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        choose(index);
      });
      board.appendChild(button);
    });

    if (pendingFocus) {
      const id = pendingFocus;
      pendingFocus = null;
      board.querySelector(`[data-shore="${id}"]`)?.focus({ preventScroll: true });
    }
  }

  function paint(status) {
    const current = profile();
    latest = status || getStageStatus(current);
    paintChrome(current);
    describe(current);
    if (typeof renderer === "function") renderer(board, latest, catalog);
    else paintAtlas(current);
  }

  function choose(index) {
    const current = profile();
    const region = regionConquest(current, index);
    if (!region) return;
    focusIndex = index;
    pendingFocus = region.stage.id;
    if (region.unlocked && selectStage(current, index)) {
      const stage = getSelectedStage(current);
      if (typeof hooks.onSelect === "function") {
        hooks.onSelect(stage, region);
        return;
      }
    }
    paint(latest);
  }

  return {
    update(status) {
      paint(status);
    },
    mount(next) {
      renderer = typeof next === "function" ? next : null;
      if (latest) this.update(latest);
    },
  };
}
