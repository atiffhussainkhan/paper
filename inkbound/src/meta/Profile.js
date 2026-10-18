// Persistent player profile. Plain key/value API so other meta systems
// (stages, etc.) can add fields without touching this file:
//
//   const profile = getProfile();
//   profile.get("bestPct");            // read
//   profile.set("stageIndex", 2);      // write + save
//   profile.update({ a: 1, b: 2 });    // write several + save once
//   profile.save();                    // explicit flush
//
// Unknown stored fields are preserved across load/save.

export const PROFILE_KEY = "inkbound.profile.v1";

export const PROFILE_DEFAULTS = Object.freeze({
  bestPct: 0,
  equippedSkinId: "seal",
  unlockedSkinIds: Object.freeze(["seal"]),
  stageIndex: 0,
  stageCredit: 0,
  // Once the player closes a loop and gains territory, the claim hint stays off.
  ftueClaimDone: false,
});

function clonePlain(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Access can throw in sandboxed frames or with storage disabled.
  }
  return null;
}

export class Profile {
  constructor(storage = defaultStorage(), key = PROFILE_KEY) {
    this.storage = storage;
    this.key = key;
    this.data = {};
    this.load();
  }

  load() {
    let stored = null;
    try {
      const raw = this.storage?.getItem(this.key);
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = null;
    }
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) stored = {};
    this.data = { ...clonePlain(PROFILE_DEFAULTS), ...stored };
    this.sanitize();
    return this;
  }

  sanitize() {
    const best = Number(this.data.bestPct);
    this.data.bestPct = Number.isFinite(best) ? Math.min(100, Math.max(0, best)) : 0;
    if (typeof this.data.equippedSkinId !== "string") {
      this.data.equippedSkinId = PROFILE_DEFAULTS.equippedSkinId;
    }
    const unlocked = Array.isArray(this.data.unlockedSkinIds)
      ? this.data.unlockedSkinIds.filter((id) => typeof id === "string")
      : [];
    if (!unlocked.includes(PROFILE_DEFAULTS.equippedSkinId)) {
      unlocked.unshift(PROFILE_DEFAULTS.equippedSkinId);
    }
    this.data.unlockedSkinIds = [...new Set(unlocked)];
    const stageIndex = Number(this.data.stageIndex);
    this.data.stageIndex = Number.isFinite(stageIndex) && stageIndex >= 0
      ? Math.floor(stageIndex)
      : 0;
    const stageCredit = Number(this.data.stageCredit);
    this.data.stageCredit = Number.isFinite(stageCredit) && stageCredit >= 0
      ? stageCredit
      : 0;
    this.data.ftueClaimDone = Boolean(this.data.ftueClaimDone);
  }

  get(key, fallback = undefined) {
    const value = this.data[key];
    return value === undefined ? fallback : clonePlain(value);
  }

  set(key, value) {
    this.data[key] = clonePlain(value);
    return this.save();
  }

  update(patch) {
    for (const [key, value] of Object.entries(patch)) {
      this.data[key] = clonePlain(value);
    }
    return this.save();
  }

  save() {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }
}

let shared = null;

export function getProfile() {
  if (!shared) shared = new Profile();
  return shared;
}
