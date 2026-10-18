import { CONFIG } from "./config.js";
import { Game } from "./sim/Game.js";
import { Input } from "./input/Input.js";
import { Renderer, readBrandTokens } from "./render/Renderer.js";
import { Hud } from "./render/Hud.js";
import { SkinPicker } from "./render/SkinPicker.js";
import { getProfile } from "./meta/Profile.js";
import { equippedSkin, equipSkin, nextInkChallenge, recordRun, syncUnlocks } from "./meta/Skins.js";
import {
  STAGES,
  arenaStageStatus,
  getSelectedStage,
  getSelectedStageIndex,
  getStageStatus,
  nextArenaLabel,
  recordStageRun,
  resolveRunShare,
} from "./meta/Stages.js";
import { catalogAssetUrl, loadImageCatalog } from "./assets/ImageCatalog.js";
import { FLOW_SCREENS, FLOW_STATES } from "./shell/Flow.js";
import { createWorldMap } from "./shell/WorldMap.js";

const canvas = document.querySelector("#game");
const hudRoot = document.querySelector("#hud");
const titleScreen = document.querySelector("[data-screen='title']");
const mapScreen = document.querySelector("[data-screen='map']");
const howtoScreen = document.querySelector("[data-screen='howto']");
const inkScreen = document.querySelector("[data-screen='ink']");
const shells = {
  title: titleScreen,
  map: mapScreen,
  howto: howtoScreen,
  ink: inkScreen,
};
const colors = readBrandTokens(document.documentElement);

function fileUrl(entry) {
  if (!entry?.path) return "";
  return new URL(entry.path, window.location.href).href;
}

async function boot() {
  const catalog = await loadImageCatalog();
  applyUiArt(catalog);

  const input = new Input(canvas);
  const profile = getProfile();
  syncUnlocks(profile);
  const game = new Game(input, colors, CONFIG, Math.random, {
    playerSkin: equippedSkin(profile),
    catalog,
  });
  // Cold load stays on the title. Nothing ticks until Play calls reset().
  game.holdForTitle();
  game.arena.game = game;
  const renderer = new Renderer(canvas, colors, CONFIG, catalog);
  const worldMap = createWorldMap(mapScreen, catalog, {
    onSelect(stage) {
      renderer.setStageArt(stage);
      refreshChrome();
    },
  });
  let accumulator = 0;
  let previousTime = performance.now();
  let runRecorded = false;
  let screen = "title";
  let inkReturn = "title";

  const restart = () => {
    input.reset();
    game.playerSkin = equippedSkin(profile);
    runRecorded = false;
    game.reset();
    game.arena.game = game;
    renderer.setStageArt(getSelectedStage(profile));
    renderer.resetCamera(game.player.position, game.player.heading);
    hud.reset();
    hud.setStage(arenaStageStatus(profile));
    hud.render(game);
    refreshChrome();
    accumulator = 0;
    previousTime = performance.now();
  };

  function hideShells() {
    for (const el of Object.values(shells)) {
      if (el) el.hidden = true;
    }
  }

  function syncMatchHook() {
    if (!hudRoot) return;
    if (screen === "match" && game.state === "playing") hudRoot.dataset.screen = "playing";
    else delete hudRoot.dataset.screen;
  }

  const showShell = (name) => {
    const shellName = shells[name] ? name : "title";
    screen = shellName;
    if (shellName === "ink") game.holdShell(inkReturn === "map" ? "map" : "title");
    else game.holdShell(shellName);
    document.body.dataset.mode = shellName;
    hideShells();
    if (shells[shellName]) shells[shellName].hidden = false;
    hudRoot?.setAttribute("aria-hidden", "true");
    syncMatchHook();
    input.reset();
    hud.reset();
    const stage = getStageStatus(profile);
    hud.setBest(profile.get("bestPct", 0));
    hud.setStage(stage);
    refreshChrome(stage);
    accumulator = 0;
    previousTime = performance.now();
    const focus = {
      title: "[data-title='play']",
      map: "[data-map='play']",
      howto: "[data-howto='play']",
      ink: "[data-ink='play']",
    }[shellName];
    shells[shellName]?.querySelector(focus)?.focus({ preventScroll: true });
  };

  const returnHome = () => {
    const celebrate = hud.runSummary?.unlockedNow?.map((skin) => skin.id) ?? [];
    inkReturn = "title";
    showShell("title");
    overlayPicker?.update(profile);
    homePicker?.update(profile, celebrate);
    inkPicker?.update(profile, celebrate);
  };

  const startMatch = () => {
    screen = "match";
    document.body.dataset.mode = "playing";
    hideShells();
    hudRoot?.setAttribute("aria-hidden", "false");
    syncMatchHook();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    restart();
  };

  const openInk = (from) => {
    inkReturn = from === "map" ? "map" : "title";
    showShell("ink");
  };

  const hud = new Hud(hudRoot, restart, catalog, returnHome);
  hud.bindProfile(profile);
  hud.setBest(profile.get("bestPct", 0));
  const stageStatus = getStageStatus(profile);
  hud.setStage(stageStatus);
  renderer.setStageArt(stageStatus.stage);

  const onEquip = (id) => {
    if (!equipSkin(profile, id)) return;
    homePicker?.update(profile);
    overlayPicker?.update(profile);
    inkPicker?.update(profile);
    refreshChrome(getStageStatus(profile));
  };

  const overlayPicker = hud.skinsRoot
    ? new SkinPicker(hud.skinsRoot, onEquip, catalog)
    : null;
  const homeSkins = titleScreen?.querySelector("[data-title='skins']");
  const homePicker = homeSkins
    ? new SkinPicker(homeSkins, onEquip, catalog)
    : null;
  const inkSkins = inkScreen?.querySelector("[data-ink='skins']");
  const inkPicker = inkSkins
    ? new SkinPicker(inkSkins, onEquip, catalog)
    : null;
  overlayPicker?.update(profile);
  homePicker?.update(profile);
  inkPicker?.update(profile);

  function finishRun() {
    runRecorded = true;
    const summary = recordRun(profile, game.finalShare);
    const frontierBefore = getStageStatus(profile).stageIndex;
    const selectedBefore = getSelectedStageIndex(profile);
    const creditsFrontier = frontierBefore < STAGES.length && selectedBefore === frontierBefore;
    const arenaName = getSelectedStage(profile).name;
    const stageResult = creditsFrontier
      ? recordStageRun(profile, resolveRunShare(game))
      : {
          ...getStageStatus(profile),
          cleared: false,
          message: frontierBefore >= STAGES.length
            ? `${arenaName} replay. Every shore is sealed.`
            : `${arenaName} replay. Frontier stays ${getStageStatus(profile).stageName}.`,
        };
    hud.setBest(summary.bestPct);
    hud.setRunSummary(summary);
    hud.setStageSummary(stageResult);
    const opened = summary.unlockedNow.map((skin) => skin.id);
    overlayPicker?.update(profile, opened);
    homePicker?.update(profile, opened);
    inkPicker?.update(profile, opened);
    refreshChrome();
  }

  function paintFigure(root, skin, prefix) {
    if (!root) return;
    const figure = catalog.getEntry?.(skin.beadImageId);
    const orb = catalog.getEntry?.(skin.orbImageId);
    const figureEl = root.querySelector(`[data-${prefix}='figure']`);
    const orbEl = root.querySelector(`[data-${prefix}='orb']`);
    const nameEl = root.querySelector(`[data-${prefix}='skin-name']`);
    if (figureEl && figure) figureEl.src = fileUrl(figure);
    if (orbEl && orb) orbEl.src = fileUrl(orb);
    if (nameEl) nameEl.textContent = skin.name;
    root.style.setProperty("--title-ink", skin.dry);
    root.style.setProperty("--title-ink-wet", skin.wet);
  }

  function refreshChrome() {
    const frontier = getStageStatus(profile);
    const arena = arenaStageStatus(profile);
    const skin = equippedSkin(profile);
    renderer.setStageArt(arena.stage);
    hud.setStage(arena);
    if (titleScreen) {
      const bestEl = titleScreen.querySelector("[data-title='best']");
      if (bestEl) bestEl.textContent = `${Number(profile.get("bestPct", 0)).toFixed(1)}%`;
      const stageEl = titleScreen.querySelector("[data-title='stage']");
      if (stageEl) stageEl.textContent = nextArenaLabel(profile);
      paintFigure(titleScreen, skin, "title");
      const next = nextInkChallenge(profile.get("bestPct", 0));
      const nextName = titleScreen.querySelector("[data-title='next-name']");
      const nextGate = titleScreen.querySelector("[data-title='next-gate']");
      if (nextName) nextName.textContent = next.name;
      if (nextGate) {
        nextGate.textContent = next.done ? next.gate : `${next.gate} ${next.remain}.`;
      }
      const plateId = catalog.binding?.("stages", arena.stage?.id)
        || catalog.binding?.("fallback", "background");
      const plate = typeof plateId === "string" ? catalog.getEntry?.(plateId) : null;
      if (plate) titleScreen.style.setProperty("--art-title-plate", catalogAssetUrl(plate.path));
    }
    paintFigure(inkScreen, skin, "ink");
    const blurb = inkScreen?.querySelector("[data-ink='blurb']");
    if (blurb) blurb.textContent = skin.blurb;
    const inkNext = inkScreen?.querySelector("[data-ink='next']");
    if (inkNext) {
      const next = nextInkChallenge(profile.get("bestPct", 0));
      inkNext.textContent = next.done ? next.gate : `${next.name}. ${next.gate} ${next.remain}.`;
    }
    const howtoPlate = catalog.getEntry?.(catalog.binding?.("fallback", "background") || "bg-plane-fallback");
    if (howtoPlate && howtoScreen) {
      howtoScreen.style.setProperty("--shell-plate", catalogAssetUrl(howtoPlate.path));
    }
    worldMap.update(frontier);
  }

  function bindClick(el, handler) {
    if (!el || !handler) return;
    el.addEventListener("pointerdown", (event) => event.stopPropagation());
    el.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
  }

  const playFromShell = () => {
    if (screen === "match") return;
    startMatch();
  };

  bindClick(titleScreen?.querySelector("[data-title='play']"), playFromShell);
  bindClick(titleScreen?.querySelector("[data-title='map']"), () => showShell("map"));
  bindClick(titleScreen?.querySelector("[data-title='ink']"), () => openInk("title"));
  bindClick(titleScreen?.querySelector("[data-title='howto']"), () => showShell("howto"));
  bindClick(mapScreen?.querySelector("[data-map='play']"), playFromShell);
  bindClick(hudRoot?.querySelector("[data-hud='map']"), () => showShell("map"));
  bindClick(mapScreen?.querySelector("[data-map='home']"), () => {
    inkReturn = "title";
    showShell("title");
  });
  bindClick(mapScreen?.querySelector("[data-map='ink']"), () => openInk("map"));
  bindClick(howtoScreen?.querySelector("[data-howto='play']"), playFromShell);
  bindClick(howtoScreen?.querySelector("[data-howto='home']"), () => showShell("title"));
  bindClick(inkScreen?.querySelector("[data-ink='play']"), playFromShell);
  bindClick(inkScreen?.querySelector("[data-ink='map']"), () => showShell("map"));
  bindClick(inkScreen?.querySelector("[data-ink='home']"), () => {
    inkReturn = "title";
    showShell("title");
  });

  window.addEventListener("keydown", (event) => {
    if (screen === "map" && event.code === "Escape") {
      event.preventDefault();
      inkReturn = "title";
      showShell("title");
      return;
    }
    if (screen !== "title") return;
    if (event.target?.closest?.("button, a, [data-title='skins']")) return;
    if (event.code !== "Enter" && event.code !== "Space") return;
    event.preventDefault();
    startMatch();
  });

  document.body.dataset.mode = "title";
  hudRoot?.setAttribute("aria-hidden", "true");
  hideShells();
  if (titleScreen) titleScreen.hidden = false;
  refreshChrome(stageStatus);
  titleScreen?.querySelector("[data-title='play']")?.focus({ preventScroll: true });

  window.InkboundFlow = {
    states: FLOW_STATES,
    screens: FLOW_SCREENS,
    get state() { return game.state; },
    get screen() { return screen; },
    show(name) {
      if (name === "playing") {
        playFromShell();
        return;
      }
      if (name === "ink") {
        openInk(game.state === "map" ? "map" : "title");
        return;
      }
      if (name === "title" || name === "map" || name === "howto") {
        if (name === "title") inkReturn = "title";
        showShell(name);
      }
    },
    mountMap(renderer) {
      worldMap.mount(renderer);
    },
    game,
  };

  const fixedStep = 1 / CONFIG.simHz;
  function frame(now) {
    if (screen !== "match") {
      previousTime = now;
      requestAnimationFrame(frame);
      return;
    }
    const frameTime = Math.min(CONFIG.maxFrameTime, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;

    if (game.state === "playing") {
      accumulator += frameTime;
      game.arena.game = game;
      let steps = 0;
      while (accumulator >= fixedStep && steps < CONFIG.maxStepsPerFrame) {
        game.tick(fixedStep);
        accumulator -= fixedStep;
        steps += 1;
      }
      if (steps === CONFIG.maxStepsPerFrame) accumulator = Math.min(accumulator, fixedStep);
    } else {
      accumulator = 0;
    }

    if ((game.state === "dead" || game.state === "won" || game.state === "over") && !runRecorded) {
      finishRun();
    }
    if (game.state === "dead" || game.state === "won") {
      document.body.dataset.mode = game.state;
      syncMatchHook();
    }

    const playerScreen = renderer.render(game, accumulator / fixedStep, frameTime);
    input.setSteeringOrigin(playerScreen.x, playerScreen.y);
    hud.render(game);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function applyUiArt(catalog) {
  catalog.applyCssVars(document.documentElement);
}

boot().catch((err) => {
  console.error("Inkbound failed to load image catalog", err);
  document.documentElement.dataset.imageCatalog = "failed";
});
