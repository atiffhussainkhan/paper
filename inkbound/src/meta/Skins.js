// Cosmetic player inks. Skins only recolor the player's bead, trail and
// territory; they never change gameplay. Hues stay clear of the bot inks
// (Tide, Ochre, Moss, Bramble, Soot, Lichen, Mulberry) so the plane stays readable.
//
// Unlock rule (Phase 1): a skin is unlocked once the profile's best share of
// the plane reaches its `unlockPct`. Unlocks are persisted and never revoked.
//   dry  = owned territory    wet  = open trail / bead body    core = bead centre

// `patternImageId` / `beadImageId` resolve through assets/IMAGE_INDEX.json
// (sourced from github.com/atiffhussainkhan/Image). Colors remain the tint.
export const SKINS = Object.freeze([
  { id: "seal", name: "Seal", blurb: "The stamped vermilion.", dry: "#d9452b", wet: "#ff6a4a", core: "#d9452b", unlockPct: 0, patternImageId: "skin-splat-01", beadImageId: "char-plate-princess", orbImageId: "char-bead-red", pickerImageId: "skin-paint-circle" },
  { id: "tideglass", name: "Tideglass", blurb: "Cold blue, clear as a lens.", dry: "#4a7fb5", wet: "#86b9ea", core: "#2f5c8a", unlockPct: 2, patternImageId: "skin-splat-05", beadImageId: "char-plate-knight", orbImageId: "char-bead-blue", pickerImageId: "skin-paint-circle" },
  { id: "emberline", name: "Emberline", blurb: "Coal-rose, still hot at the edge.", dry: "#c2506a", wet: "#f58ca2", core: "#8f2f47", unlockPct: 5, patternImageId: "skin-splat-10", beadImageId: "char-plate-dragon", orbImageId: "char-bead-red-alt", pickerImageId: "skin-paint-splat" },
  { id: "nightquarry", name: "Nightquarry", blurb: "Cut slate, pale where struck.", dry: "#6c7684", wet: "#b8c3d0", core: "#3c444f", unlockPct: 10, patternImageId: "skin-splat-16", beadImageId: "char-toon-robot", orbImageId: "char-bead-blue-alt", pickerImageId: "skin-paint-circle" },
  { id: "bone", name: "Bone", blurb: "Dry, quiet, hard to cut from the dark.", dry: "#cfc6b0", wet: "#f2ead6", core: "#8f897c", unlockPct: 20, patternImageId: "skin-splat-22", beadImageId: "char-toon-male-person", orbImageId: "char-shape-circle", pickerImageId: "skin-paint-drips" },
]);

export const DEFAULT_SKIN_ID = SKINS[0].id;

export function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}

export function isSkinUnlocked(skin, bestPct) {
  return bestPct >= skin.unlockPct;
}

// Merge newly earned skins into the profile. Returns the skins unlocked by
// this call (empty when nothing changed).
export function syncUnlocks(profile) {
  const best = profile.get("bestPct", 0);
  const unlocked = profile.get("unlockedSkinIds", [DEFAULT_SKIN_ID]);
  const earned = SKINS.filter(
    (skin) => !unlocked.includes(skin.id) && isSkinUnlocked(skin, best),
  );
  if (earned.length) {
    profile.set("unlockedSkinIds", [...unlocked, ...earned.map((skin) => skin.id)]);
  }
  return earned;
}

// The equipped skin, falling back to the default if it is unknown or locked.
export function equippedSkin(profile) {
  const skin = getSkin(profile.get("equippedSkinId"));
  const unlocked = profile.get("unlockedSkinIds", [DEFAULT_SKIN_ID]);
  return unlocked.includes(skin.id) ? skin : SKINS[0];
}

export function equipSkin(profile, id) {
  const skin = getSkin(id);
  if (skin.id !== id) return false;
  if (!profile.get("unlockedSkinIds", []).includes(skin.id)) return false;
  profile.set("equippedSkinId", skin.id);
  return true;
}

// Record a finished run. `share` is 0..1. Returns what changed so the UI can
// say "New best" or announce unlocks.
// The next locked figure, scored the same way unlocks are: best % of the plane.
// There is no price. A finished set says so instead of inventing a shop.
export function nextInkChallenge(bestPct) {
  const best = Number(bestPct) || 0;
  const next = SKINS.find((skin) => skin.unlockPct > best);
  if (!next) {
    return {
      done: true,
      name: "All inks open",
      gate: "Every figure on this set is earned.",
      remain: "",
    };
  }
  const remain = Math.max(0, Math.round((next.unlockPct - best) * 10) / 10);
  return {
    done: false,
    name: next.name,
    gate: `Reach ${next.unlockPct.toFixed(1)}% of the plane.`,
    remain: `${remain.toFixed(1)}% to go`,
  };
}

export function recordRun(profile, share) {
  const pct = Math.round(Math.max(0, Math.min(1, share || 0)) * 1000) / 10;
  const previousBest = profile.get("bestPct", 0);
  const isNewBest = pct > previousBest;
  if (isNewBest) profile.set("bestPct", pct);
  const unlockedNow = syncUnlocks(profile);
  return { pct, previousBest, bestPct: Math.max(pct, previousBest), isNewBest, unlockedNow };
}
