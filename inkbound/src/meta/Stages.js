// Stage progression for Inkbound (Track M).
//
// Credit rule:
//   Each run tracks `game.runPeakShare` (highest territory share held by the
//   player during the run) alongside `game.finalShare`. On run end (death or
//   win), `Math.max(game.runPeakShare, game.finalShare)` is added to the
//   active stage's cumulative `stageCredit`. When `stageCredit` reaches or
//   exceeds the stage's `completionTarget`, the stage clears: `stageIndex`
//   advances by 1 and `stageCredit` resets to 0.

export const STAGES = Object.freeze([
  Object.freeze({
    index: 0,
    id: "quiet-plane",
    name: "Quiet Plane",
    completionTarget: 0.5,
  }),
  Object.freeze({
    index: 1,
    id: "rimward-marsh",
    name: "Rimward Marsh",
    completionTarget: 0.75,
  }),
  Object.freeze({
    index: 2,
    id: "sumi-basin",
    name: "Sumi Basin",
    completionTarget: 1.0,
  }),
  Object.freeze({
    index: 3,
    id: "cinnabar-reach",
    name: "Cinnabar Reach",
    completionTarget: 1.25,
  }),
  Object.freeze({
    index: 4,
    id: "obsidian-shallows",
    name: "Obsidian Shallows",
    completionTarget: 1.5,
  }),
  Object.freeze({
    index: 5,
    id: "unsealed-horizon",
    name: "Unsealed Horizon",
    completionTarget: 2.0,
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

  if (typeof profile?.update === "function") {
    profile.update({ stageIndex, stageCredit });
  } else if (profile && typeof profile === "object") {
    profile.stageIndex = stageIndex;
    profile.stageCredit = stageCredit;
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
