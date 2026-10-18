// Shell contract for Inkbound screens.
//
// Sim states (game.state). Tick runs only while "playing".
//   title | map | howto | playing | dead | won
//
// Visible screens (data-screen / InkboundFlow.screen).
//   The ink picker is a shell view, not a sim state: while it is up,
//   game.state stays "title" or "map" so the match stays frozen.
//   title | map | howto | ink | playing | dead | won
//
// SYS2 world map: mount into [data-map="board"] via InkboundFlow.mountMap.
// The shell keeps [data-map="play"], [data-map="home"], and [data-map="ink"].

export const FLOW_STATES = Object.freeze([
  "title",
  "map",
  "howto",
  "playing",
  "dead",
  "won",
]);

export const FLOW_SCREENS = Object.freeze([
  "title",
  "map",
  "howto",
  "ink",
  "playing",
  "dead",
  "won",
]);

export const SHELL_STATES = Object.freeze(["title", "map", "howto"]);

export function isShellState(state) {
  return state === "title" || state === "map" || state === "howto";
}

export function isSimFrozen(state) {
  return state !== "playing";
}
