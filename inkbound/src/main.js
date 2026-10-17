import { CONFIG, ENTITY_SPECS } from "./config.js";
import { Game } from "./sim/Game.js";
import { Input } from "./input/Input.js";
import { Renderer } from "./render/Renderer.js";
import { Hud } from "./render/Hud.js";

const canvas = document.querySelector("#game");
const hudRoot = document.querySelector("#hud");
const css = getComputedStyle(document.documentElement);
const tokens = [
  "--sumi-950", "--sumi-900", "--sumi-600", "--bone-100",
  ...ENTITY_SPECS.flatMap((spec) => [spec.dryToken, spec.wetToken]),
];
const colors = Object.fromEntries(tokens.map((token) => [
  token,
  css.getPropertyValue(token).trim(),
]));

const input = new Input(canvas);
const game = new Game(input, colors);
const renderer = new Renderer(canvas, colors, CONFIG);
let accumulator = 0;
let previousTime = performance.now();

const restart = () => {
  game.reset();
  renderer.resetCamera(game.player.position);
  hud.reset();
  accumulator = 0;
  previousTime = performance.now();
};
const hud = new Hud(hudRoot, restart);
renderer.resetCamera(game.player.position);

const fixedStep = 1 / CONFIG.simHz;
function frame(now) {
  const frameTime = Math.min(CONFIG.maxFrameTime, Math.max(0, (now - previousTime) / 1000));
  previousTime = now;
  accumulator += frameTime;

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
