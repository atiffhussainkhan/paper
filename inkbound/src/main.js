import { CONFIG } from "./config.js";
import { Game } from "./sim/Game.js";
import { Input } from "./input/Input.js";
import { Renderer, readBrandTokens } from "./render/Renderer.js";
import { Hud } from "./render/Hud.js";

const canvas = document.querySelector("#game");
const hudRoot = document.querySelector("#hud");
const colors = readBrandTokens(document.documentElement);

const input = new Input(canvas);
const game = new Game(input, colors);
game.arena.game = game;
const renderer = new Renderer(canvas, colors, CONFIG);
let accumulator = 0;
let previousTime = performance.now();

const restart = () => {
  input.reset();
  game.reset();
  game.arena.game = game;
  renderer.resetCamera(game.player.position, game.player.heading);
  hud.reset();
  hud.render(game);
  accumulator = 0;
  previousTime = performance.now();
};

const hud = new Hud(hudRoot, restart);
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

  const playerScreen = renderer.render(game, accumulator / fixedStep, frameTime);
  input.setSteeringOrigin(playerScreen.x, playerScreen.y);
  hud.render(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
