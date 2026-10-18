import assert from "node:assert/strict";
import { Profile } from "../src/meta/Profile.js";
import {
  SKINS, equippedSkin, equipSkin, recordRun, syncUnlocks,
} from "../src/meta/Skins.js";
import {
  STAGES, getStageStatus, recordStageRun, resolveRunShare,
} from "../src/meta/Stages.js";
import { CONFIG } from "../src/config.js";
import { Game } from "../src/sim/Game.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
}

assert.ok(SKINS.length >= 5, "at least 5 skins");
assert.equal(new Set(SKINS.map((skin) => skin.id)).size, SKINS.length);

const storage = memoryStorage();
let profile = new Profile(storage);
assert.equal(profile.get("bestPct"), 0);
assert.equal(profile.get("ftueClaimDone"), false);
assert.equal(equippedSkin(profile).id, "seal");
assert.equal(equipSkin(profile, "tideglass"), false, "locked skin cannot be equipped");

let result = recordRun(profile, 0.034);
assert.equal(result.isNewBest, true);
assert.equal(result.bestPct, 3.4);
assert.deepEqual(result.unlockedNow.map((skin) => skin.id), ["tideglass"]);

result = recordRun(profile, 0.01);
assert.equal(result.isNewBest, false);
assert.equal(result.bestPct, 3.4);

assert.equal(equipSkin(profile, "tideglass"), true);
profile.set("stageIndex", 2);

profile = new Profile(storage);
assert.equal(profile.get("bestPct"), 3.4);
assert.equal(profile.get("ftueClaimDone"), false);
profile.set("ftueClaimDone", true);
assert.equal(equippedSkin(profile).id, "tideglass");
assert.equal(profile.get("stageIndex"), 2, "foreign fields persist");
profile = new Profile(storage);
assert.equal(profile.get("ftueClaimDone"), true, "ftue persists across reload");

recordRun(profile, 1);
assert.equal(syncUnlocks(profile).length, 0);
assert.equal(profile.get("unlockedSkinIds").length, SKINS.length);

const colors = {
  "--ink-player": "#d9452b", "--ink-player-wet": "#ff6a4a",
  "--ink-bot-1": "#1f9e94", "--ink-bot-1-wet": "#3fd1c4",
  "--ink-bot-2": "#c9962e", "--ink-bot-2-wet": "#f2bd4f",
  "--ink-bot-3": "#6f9a3c", "--ink-bot-3-wet": "#9cc95c",
};
const skin = SKINS.find((entry) => entry.id === "nightquarry");
const game = new Game({ headingFor: () => null }, colors, CONFIG, () => 0.42, { playerSkin: skin });
assert.equal(game.player.color, skin.dry);
assert.equal(game.player.wetColor, skin.wet);
assert.equal(game.bots[0].color, colors["--ink-bot-1"], "bots keep brand inks");
game.playerSkin = SKINS[0];
game.reset();
assert.equal(game.player.color, SKINS[0].dry);

const corrupt = memoryStorage();
corrupt.setItem("inkbound.profile.v1", "{not json");
assert.equal(new Profile(corrupt).get("bestPct"), 0);

assert.ok(STAGES.length >= 4 && STAGES.length <= 6, "4-6 stages defined");
const stageProfile = new Profile(memoryStorage());
assert.equal(getStageStatus(stageProfile).stageName, "Quiet Plane");
assert.equal(resolveRunShare({ runPeakShare: 0.35, finalShare: 0.12 }), 0.35);
const s1 = recordStageRun(stageProfile, 0.3);
assert.equal(s1.cleared, false);
assert.equal(s1.stageIndex, 0);
assert.ok(Math.abs(s1.stageCredit - 0.3) < 1e-6);
const s2 = recordStageRun(stageProfile, 0.25);
assert.equal(s2.cleared, true);
assert.equal(s2.stageIndex, 1);
assert.equal(s2.stageName, "Rimward Marsh");
assert.equal(s2.stageCredit, 0);

console.log("smoke_meta ok");
