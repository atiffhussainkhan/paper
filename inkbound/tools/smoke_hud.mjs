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
assert.match(hud, /data-hud="best"/);
assert.equal(/paper\.io/i.test(html + css + hud), false);

console.log("PASS: Best / Stage HUD hooks and contrast styles present");
