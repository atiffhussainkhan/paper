// Stage progression for Inkbound (Track M).
//
// Credit rule:
//   Each run tracks `game.runPeakShare` (highest territory share held by the
//   player during the run) alongside `game.finalShare`. On run end (death or
//   win), `Math.max(game.runPeakShare, game.finalShare)` is added to the
//   active stage's cumulative `stageCredit`. When `stageCredit` reaches or
//   exceeds the stage's `completionTarget`, the stage clears: `stageIndex`
//   advances by 1 and `stageCredit` resets to 0.

// `backgroundImageId` resolves through assets/IMAGE_INDEX.json
// (sourced from github.com/atiffhussainkhan/Image).
export const STAGES = Object.freeze([
  Object.freeze({
    index: 0,
    id: "quiet-plane",
    name: "Quiet Plane",
    completionTarget: 0.5,
    backgroundImageId: "bg-quiet-plane",
    terrainImageId: "terrain-grass",
  }),
  Object.freeze({
    index: 1,
    id: "rimward-marsh",
    name: "Rimward Marsh",
    completionTarget: 0.75,
    backgroundImageId: "bg-rimward-marsh",
    terrainImageId: "terrain-foliage-01",
  }),
  Object.freeze({
    index: 2,
    id: "sumi-basin",
    name: "Sumi Basin",
    completionTarget: 1.0,
    backgroundImageId: "bg-sumi-basin",
    terrainImageId: "terrain-abstract-01",
  }),
  Object.freeze({
    index: 3,
    id: "cinnabar-reach",
    name: "Cinnabar Reach",
    completionTarget: 1.25,
    backgroundImageId: "bg-cinnabar-reach",
    terrainImageId: "terrain-pixel-01",
  }),
  Object.freeze({
    index: 4,
    id: "obsidian-shallows",
    name: "Obsidian Shallows",
    completionTarget: 1.5,
    backgroundImageId: "bg-obsidian-shallows",
    terrainImageId: "terrain-abstract-02",
  }),
  Object.freeze({
    index: 5,
    id: "unsealed-horizon",
    name: "Unsealed Horizon",
    completionTarget: 2.0,
    backgroundImageId: "bg-unsealed-horizon",
    terrainImageId: "terrain-pixel-02",
  }),
]);

export function getStage(stageIndex = 0) {
  const safeIndex = Number.isFinite(stageIndex) && stageIndex >= 0
    ? Math.floor(stageIndex)
    : 0;
  return STAGES[Math.min(safeIndex, STAGES.length - 1)];
}

export function getStageStatus(profile) {
  const rawIndex = Number(profile?.get?.("stageIndex", 0) ?? profile?.stageIndex ?? 0);
  const stageIndex = Number.isFinite(rawIndex) && rawIndex >= 0 ? Math.floor(rawIndex) : 0;
  const rawCredit = Number(profile?.get?.("stageCredit", 0) ?? profile?.stageCredit ?? 0);
  const stageCredit = Number.isFinite(rawCredit) && rawCredit >= 0 ? rawCredit : 0;
  const stage = getStage(stageIndex);
  const target = stage.completionTarget;
  const progress = target > 0 ? Math.max(0, Math.min(1, stageCredit / target)) : 1;

  return {
    stageIndex,
    stageNumber: stageIndex + 1,
    stage,
    stageName: stage.name,
    stageCredit,
    completionTarget: target,
    progress,
    progressPct: progress * 100,
  };
}

export function resolveRunShare(game) {
  const peak = Number(game?.runPeakShare ?? 0);
  const final = Number(game?.finalShare ?? 0);
  const best = Math.max(
    Number.isFinite(peak) ? peak : 0,
    Number.isFinite(final) ? final : 0,
  );
  return Math.max(0, Math.min(1, best));
}

export function recordStageRun(profile, runShare) {
  const creditedShare = Math.max(0, Math.min(1, Number(runShare) || 0));
  const before = getStageStatus(profile);
  const nextCredit = before.stageCredit + creditedShare;

  let stageIndex = before.stageIndex;
  let stageCredit = nextCredit;
  let cleared = false;
  const clearedStage = before.stage;

  if (nextCredit >= before.completionTarget) {
    cleared = true;
    stageIndex = before.stageIndex + 1;
    stageCredit = 0;
  }

  const patch = { stageIndex, stageCredit };
  if (cleared) {
    const selectedRaw = Number(
      profile?.get?.("selectedStageIndex", before.stageIndex)
      ?? profile?.selectedStageIndex
      ?? before.stageIndex,
    );
    const selected = Number.isFinite(selectedRaw) ? Math.floor(selectedRaw) : before.stageIndex;
    // Follow the campaign when the next arena was the shore that just sealed.
    if (selected === before.stageIndex) {
      patch.selectedStageIndex = Math.min(stageIndex, STAGES.length - 1);
    }
  }

  if (typeof profile?.update === "function") {
    profile.update(patch);
  } else if (profile && typeof profile === "object") {
    profile.stageIndex = stageIndex;
    profile.stageCredit = stageCredit;
    if (patch.selectedStageIndex != null) profile.selectedStageIndex = patch.selectedStageIndex;
  }

  const after = getStageStatus(profile);
  const message = cleared
    ? `${clearedStage.name} sealed. Next: ${after.stageName}.`
    : `+${(creditedShare * 100).toFixed(1)}% toward ${after.stageName} (${Math.round(after.progressPct)}%).`;

  return {
    creditedShare,
    cleared,
    clearedStage: cleared ? clearedStage : null,
    stageIndex: after.stageIndex,
    stageNumber: after.stageNumber,
    stage: after.stage,
    stageName: after.stageName,
    stageCredit: after.stageCredit,
    completionTarget: after.completionTarget,
    progress: after.progress,
    progressPct: after.progressPct,
    message,
  };
}

export function isStageUnlocked(profile, index) {
  const i = Math.floor(Number(index));
  if (!Number.isFinite(i) || i < 0 || i >= STAGES.length) return false;
  return i <= getStageStatus(profile).stageIndex;
}

// Conquest for one shore. Sealed shores are full. The frontier fills from
// stage credit. bestPct is the player's record, shown beside that fill.
export function regionConquest(profile, index) {
  const i = Math.floor(Number(index));
  const stage = STAGES[i];
  if (!stage) return null;
  const status = getStageStatus(profile);
  const bestRaw = Number(profile?.get?.("bestPct", 0) ?? profile?.bestPct ?? 0);
  const bestPct = Number.isFinite(bestRaw) ? Math.min(100, Math.max(0, bestRaw)) : 0;
  const frontier = status.stageIndex;
  const unlocked = i <= frontier;
  const sealed = unlocked && (i < frontier || frontier >= STAGES.length);
  const active = unlocked && !sealed && i === frontier;
  const fill = sealed ? 1 : active ? status.progress : 0;
  return {
    index: i,
    stage,
    unlocked,
    sealed,
    active,
    locked: !unlocked,
    fill,
    fillPct: Math.round(fill * 100),
    stageCredit: active ? status.stageCredit : sealed ? stage.completionTarget : 0,
    completionTarget: stage.completionTarget,
    bestPct,
    frontier,
  };
}

export function getSelectedStageIndex(profile) {
  const frontier = getStageStatus(profile).stageIndex;
  const maxSelectable = Math.min(Math.max(frontier, 0), STAGES.length - 1);
  const raw = Number(profile?.get?.("selectedStageIndex", NaN) ?? profile?.selectedStageIndex);
  if (!Number.isFinite(raw)) return maxSelectable;
  const idx = Math.floor(raw);
  if (!isStageUnlocked(profile, idx)) return maxSelectable;
  return idx;
}

export function getSelectedStage(profile) {
  return STAGES[getSelectedStageIndex(profile)];
}

export function selectStage(profile, index) {
  const i = Math.floor(Number(index));
  if (!isStageUnlocked(profile, i)) return false;
  if (typeof profile?.update === "function") profile.update({ selectedStageIndex: i });
  else if (profile && typeof profile === "object") profile.selectedStageIndex = i;
  return true;
}

export function nextArenaLabel(profile) {
  const region = regionConquest(profile, getSelectedStageIndex(profile));
  const mark = region.sealed ? "sealed" : `${region.fillPct}%`;
  return `Stage ${region.index + 1} · ${region.stage.name} · ${mark}`;
}

// HUD / title view of the shore the next match will use.
export function arenaStageStatus(profile) {
  const selected = getSelectedStageIndex(profile);
  const region = regionConquest(profile, selected);
  const frontier = getStageStatus(profile);
  return {
    ...frontier,
    stageIndex: selected,
    stageNumber: selected + 1,
    stage: region.stage,
    stageName: region.stage.name,
    stageCredit: region.stageCredit,
    completionTarget: region.completionTarget,
    progress: region.fill,
    progressPct: region.fillPct,
    frontierIndex: frontier.stageIndex,
    frontierName: frontier.stageName,
  };
}
