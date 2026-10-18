import { CONFIG } from "./config.js";
import { Game } from "./sim/Game.js";
import { Input } from "./input/Input.js";
import { Renderer, readBrandTokens } from "./render/Renderer.js";
import { Hud } from "./render/Hud.js";
import { SkinPicker } from "./render/SkinPicker.js";
import { getProfile } from "./meta/Profile.js";
import { equippedSkin, equipSkin, recordRun, syncUnlocks } from "./meta/Skins.js";
import { getStageStatus, recordStageRun, resolveRunShare } from "./meta/Stages.js";
import { catalogAssetUrl, loadImageCatalog } from "./assets/ImageCatalog.js";

const canvas = document.querySelector("#game");
const hudRoot = document.querySelector("#hud");
const titleScreen = document.querySelector("[data-screen='title']");
const colors = readBrandTokens(document.documentElement);

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
  let accumulator = 0;
  let previousTime = performance.now();
  let runRecorded = false;
  let screen = "title";

  const restart = () => {
    input.reset();
    game.playerSkin = equippedSkin(profile);
    runRecorded = false;
    game.reset();
    game.arena.game = game;
    const stage = getStageStatus(profile);
    renderer.setStageArt(stage.stage);
    renderer.resetCamera(game.player.position, game.player.heading);
    hud.reset();
    hud.setStage(stage);
    hud.render(game);
    refreshTitle(stage);
    accumulator = 0;
    previousTime = performance.now();
  };

  const returnHome = () => {
    const celebrate = hud.runSummary?.unlockedNow?.map((skin) => skin.id) ?? [];
    screen = "title";
    document.body.dataset.mode = "title";
    hudRoot?.setAttribute("aria-hidden", "true");
    if (titleScreen) titleScreen.hidden = false;
    input.reset();
    game.holdForTitle();
    hud.reset();
    const stage = getStageStatus(profile);
    hud.setBest(profile.get("bestPct", 0));
    hud.setStage(stage);
    refreshTitle(stage);
    overlayPicker?.update(profile);
    homePicker?.update(profile, celebrate);
    titleScreen?.querySelector("[data-title='play']")?.focus({ preventScroll: true });
    accumulator = 0;
    previousTime = performance.now();
  };

  const startMatch = () => {
    screen = "match";
    document.body.dataset.mode = "playing";
    hudRoot?.setAttribute("aria-hidden", "false");
    if (titleScreen) titleScreen.hidden = true;
    restart();
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
    refreshTitle(getStageStatus(profile));
  };

  const overlayPicker = hud.skinsRoot
    ? new SkinPicker(hud.skinsRoot, onEquip, catalog)
    : null;
  const homeSkins = titleScreen?.querySelector("[data-title='skins']");
  const homePicker = homeSkins
    ? new SkinPicker(homeSkins, onEquip, catalog)
    : null;
  overlayPicker?.update(profile);
  homePicker?.update(profile);

  function finishRun() {
    runRecorded = true;
    const summary = recordRun(profile, game.finalShare);
    const stageResult = recordStageRun(profile, resolveRunShare(game));
    hud.setBest(summary.bestPct);
    hud.setRunSummary(summary);
    hud.setStage(stageResult);
    hud.setStageSummary(stageResult);
    renderer.setStageArt(stageResult.stage);
    const opened = summary.unlockedNow.map((skin) => skin.id);
    overlayPicker?.update(profile, opened);
    refreshTitle(stageResult);
  }

  function refreshTitle(stageStatus) {
    if (!titleScreen) return;
    const stage = stageStatus || getStageStatus(profile);
    const skin = equippedSkin(profile);
    const bestEl = titleScreen.querySelector("[data-title='best']");
    if (bestEl) bestEl.textContent = `${Number(profile.get("bestPct", 0)).toFixed(1)}%`;
    const stageEl = titleScreen.querySelector("[data-title='stage']");
    if (stageEl) {
      const pct = Math.max(0, Math.min(100, Math.round(stage.progressPct ?? (stage.progress ?? 0) * 100)));
      const number = stage.stageNumber ?? (stage.stageIndex ?? 0) + 1;
      const name = stage.stageName ?? stage.stage?.name ?? "";
      stageEl.textContent = `Stage ${number} · ${name} · ${pct}%`;
    }
    const figure = catalog.getEntry?.(skin.beadImageId);
    const orb = catalog.getEntry?.(skin.orbImageId);
    const figureEl = titleScreen.querySelector("[data-title='figure']");
    const orbEl = titleScreen.querySelector("[data-title='orb']");
    const nameEl = titleScreen.querySelector("[data-title='skin-name']");
    if (figureEl && figure) figureEl.src = new URL(figure.path, window.location.href).href;
    if (orbEl && orb) orbEl.src = new URL(orb.path, window.location.href).href;
    if (nameEl) nameEl.textContent = skin.name;
    titleScreen.style.setProperty("--title-ink", skin.dry);
    titleScreen.style.setProperty("--title-ink-wet", skin.wet);
    const plateId = catalog.binding?.("stages", stage.stage?.id)
      || catalog.binding?.("fallback", "background");
    const plate = typeof plateId === "string" ? catalog.getEntry?.(plateId) : null;
    if (plate) titleScreen.style.setProperty("--art-title-plate", catalogAssetUrl(plate.path));
  }

  const playButton = titleScreen?.querySelector("[data-title='play']");
  const onPlay = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (screen === "match") return;
    startMatch();
  };
  playButton?.addEventListener("pointerdown", (event) => event.stopPropagation());
  playButton?.addEventListener("click", onPlay);

  window.addEventListener("keydown", (event) => {
    if (screen !== "title") return;
    if (event.target?.closest?.("[data-title='skins']")) return;
    if (event.code !== "Enter" && event.code !== "Space") return;
    if (event.target?.closest?.("[data-title='play']")) return;
    event.preventDefault();
    startMatch();
  });

  document.body.dataset.mode = "title";
  hudRoot?.setAttribute("aria-hidden", "true");
  if (titleScreen) titleScreen.hidden = false;
  refreshTitle(stageStatus);
  playButton?.focus({ preventScroll: true });

  const fixedStep = 1 / CONFIG.simHz;
  function frame(now) {
    if (screen !== "match") {
      previousTime = now;
      requestAnimationFrame(frame);
      return;
    }
    const frameTime = Math.min(CONFIG.maxFrameTime, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;
    accumulator += frameTime;

    game.arena.game = game;
    let steps = 0;
    while (accumulator >= fixedStep && steps < CONFIG.maxStepsPerFrame) {
      game.tick(fixedStep);
      accumulator -= fixedStep;
      steps += 1;
    }
    if (steps === CONFIG.maxStepsPerFrame) accumulator = Math.min(accumulator, fixedStep);

    if (game.state === "over" && !runRecorded) finishRun();

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
