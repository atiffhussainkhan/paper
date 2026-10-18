import { CONFIG } from "./config.js";
import { Game } from "./sim/Game.js";
import { Input } from "./input/Input.js";
import { Renderer, readBrandTokens } from "./render/Renderer.js";
import { Hud } from "./render/Hud.js";
import { SkinPicker } from "./render/SkinPicker.js";
import { getProfile } from "./meta/Profile.js";
import { equippedSkin, equipSkin, recordRun, syncUnlocks } from "./meta/Skins.js";
import { getStageStatus, recordStageRun, resolveRunShare } from "./meta/Stages.js";

const canvas = document.querySelector("#game");
const hudRoot = document.querySelector("#hud");
const colors = readBrandTokens(document.documentElement);

const input = new Input(canvas);
const profile = getProfile();
syncUnlocks(profile);
const game = new Game(input, colors, CONFIG, Math.random, { playerSkin: equippedSkin(profile) });
game.arena.game = game;
const renderer = new Renderer(canvas, colors, CONFIG);
let accumulator = 0;
let previousTime = performance.now();
let runRecorded = false;

const restart = () => {
  input.reset();
  game.playerSkin = equippedSkin(profile);
  runRecorded = false;
  game.reset();
  game.arena.game = game;
  renderer.resetCamera(game.player.position, game.player.heading);
  hud.reset();
  hud.setStage(getStageStatus(profile));
  hud.render(game);
  accumulator = 0;
  previousTime = performance.now();
};

const hud = new Hud(hudRoot, restart);
hud.setBest(profile.get("bestPct", 0));
hud.setStage(getStageStatus(profile));
const skinPicker = hud.skinsRoot
  ? new SkinPicker(hud.skinsRoot, (id) => {
    if (equipSkin(profile, id)) skinPicker.update(profile);
  })
  : null;
skinPicker?.update(profile);

function finishRun() {
  runRecorded = true;
  const summary = recordRun(profile, game.finalShare);
  const stageResult = recordStageRun(profile, resolveRunShare(game));
  hud.setBest(summary.bestPct);
  hud.setRunSummary(summary);
  hud.setStage(stageResult);
  hud.setStageSummary(stageResult);
  skinPicker?.update(profile);
}
renderer.resetCamera(game.player.position, game.player.heading);
hud.render(game);

const fixedStep = 1 / CONFIG.simHz;
function frame(now) {
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
