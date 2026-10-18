import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "css/style.css"), "utf8");
const hud = readFileSync(join(root, "src/render/Hud.js"), "utf8");

assert.match(html, /data-hud="best"/);
assert.match(html, /data-hud="stage-name"/);
assert.match(html, /Quiet Plane/);
assert.match(html, /data-hud="stage-bar"/);
assert.match(html, /data-hud="stage-fill"/);
assert.match(html, /data-hud="overlay-unlocks"/);
assert.match(html, /data-mode="title"/);
assert.match(html, /data-screen="title"/);
assert.match(html, /data-title="play"/);
assert.match(html, />Play</);
assert.match(html, /data-title="best"/);
assert.match(html, /data-title="stage"/);
assert.match(html, /data-title="skins"/);
assert.match(html, /data-title="figure"/);
assert.match(html, /data-title="orb"/);
assert.match(html, /data-hud="home"/);
assert.match(html, /data-hud="menu"/);
assert.match(html, /Point to steer\. Close the loop to claim\./);
assert.match(html, /data-title="next"/);
assert.match(html, /Next ink challenge/);
assert.match(html, /data-hud="feed"/);
assert.match(html, /data-hud="overlay-kicker"/);
assert.match(html, /data-screen="map"/);
assert.match(html, /data-screen="howto"/);
assert.match(html, /data-screen="ink"/);
assert.match(html, /data-map="board"/);
assert.match(html, /data-map-hook="sys2"/);
assert.match(html, /data-title="map"/);
assert.match(html, /data-title="howto"/);
assert.match(html, /How to play/);
assert.match(html, /data-hud="overlay-line"/);
assert.match(html, /data-hud="overlay-medal"/);
assert.equal(/shop|revive|multiplayer/i.test(html), false);

const titleBlock = html.slice(html.indexOf('data-screen="title"'), html.indexOf('id="hud"'));
const hudBlock = html.slice(html.indexOf('id="hud"'));
assert.match(titleBlock, /data-hud="cast"/, "figure strip lives on the title");
assert.equal(hudBlock.includes('data-hud="cast"'), false, "cast strip must not cover the match");

assert.match(css, /\.hud-percent__best/);
assert.match(css, /\.hud-stage__track/);
assert.match(css, /--ink-player-wet/);
// Score cluster must sit in a readable panel (Phase 1.5).
assert.match(css, /\.hud-percent\s*\{[^}]*backdrop-filter/s);
assert.match(css, /\.hud-percent__best\s*\{[^}]*font-size:\s*15px/s);
assert.match(css, /\.hud-stage__name\s*\{[^}]*color:\s*var\(--bone-100\)/s);
assert.match(css, /\.hud-stage__track\s*\{[^}]*height:\s*10px/s);
assert.match(css, /\.hud-percent__best \[data-hud="best"\]\s*\{[^}]*color:\s*var\(--bone-100\)/s);

assert.match(hud, /setBest\(/);
assert.match(hud, /setStage\(/);
assert.match(hud, /renderUnlockCelebration/);
assert.match(hud, /ftueClaimDone/);
assert.match(hud, /reset\(\) \{[\s\S]*?applyFtueState\(\);\s*\}/);
assert.match(hud, /data-hud="best"/);
assert.match(hud, /Last line/);
assert.match(hud, /renderFeed/);
assert.match(css, /body\[data-mode="playing"\] \.hud-cast/);
assert.match(css, /\.title-next/);
assert.match(css, /\.hud-feed/);
assert.match(css, /\.hud-overlay__kicker/);
assert.match(css, /\.hud-board\s*\{[^}]*background:\s*rgb\(17 19 22 \/ 0\.92\)/s);
assert.match(css, /\.hud-overlay__unlocks/);
assert.match(css, /--art-unlock-burst/);
assert.match(css, /\.title-screen/);
assert.match(css, /\.shell-screen/);
assert.match(css, /\.map-plate/);
assert.match(css, /\.btn-play/);
assert.match(css, /--art-title-plate/);
assert.match(css, /--art-brand-seal/);
assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.hud-hint \{[^}]*font-size:\s*15px/);
assert.equal(
  /@media \(max-width: 640px\) \{[\s\S]*?\.hud-hint \{[^}]*display:\s*none/.test(css),
  false,
  "mobile match hint stays visible",
);
assert.equal(/paper\.io/i.test(html + css + hud), false);

const main = readFileSync(join(root, "src/main.js"), "utf8");
const gameSrc = readFileSync(join(root, "src/sim/Game.js"), "utf8");
assert.match(main, /holdForTitle\(/);
assert.match(main, /holdShell\(/);
assert.match(main, /screen !== "match"/);
assert.match(html, /data-screen="map"/);
assert.match(html, /data-title="map"/);
assert.match(html, /data-map="board"/);
assert.match(html, /data-hud="map"/);
assert.match(css, /\.map-board\.is-atlas/);
assert.match(css, /\.shore--quiet-plane/);
const worldMap = readFileSync(join(root, "src/shell/WorldMap.js"), "utf8");
assert.match(worldMap, /selectStage\(/);
assert.match(worldMap, /catalogAssetUrl/);
assert.equal(/startMatch|game\.reset\(/.test(worldMap), false, "the atlas does not start a match");
assert.match(main, /game\.state === "playing"/);
assert.match(hud, /Play again/);
assert.match(gameSrc, /holdForTitle\(\) \{[\s\S]*?this\.state = "title";/);
assert.match(gameSrc, /this\.state = "dead"/);
assert.match(gameSrc, /this\.state = "won"/);
const frame = main.slice(main.indexOf("function frame"));
const holdAt = main.indexOf("game.holdForTitle()");
const loopAt = main.lastIndexOf("requestAnimationFrame(frame)");
assert.ok(holdAt >= 0 && loopAt > holdAt, "title hold is armed before the loop starts");
assert.match(frame, /if \(screen !== "match"\) \{[\s\S]*?return;\s*\}/);

console.log("PASS: Best / Stage HUD hooks and contrast styles present");
