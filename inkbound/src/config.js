// Simulation values are kept in world units and seconds.
export const CONFIG = Object.freeze({
  simHz: 60,
  maxFrameTime: 0.2,
  maxStepsPerFrame: 8,

  arenaRadius: 1200,
  gridSize: 160,
  startTerritoryRadius: 93,

  playerSpeed: 170,
  botSpeed: 145,
  steerRate: Math.PI * 2.25,
  bodyRadius: 13,

  trailWidth: 11,
  trailSampleSpacing: 8,
  maxTrailPoints: 5000,
  selfGracePoints: 13,
  enemyHeadGracePoints: 4,

  botCount: 3,
  botLoopOutDistance: 185,
  botLoopSideDistance: 145,
  botEdgeOutDistance: 210,
  botEdgeSweepDistance: 235,
  botEdgeRimMargin: 44,
  botSmallLoopOutDistance: 132,
  botSmallLoopSideDistance: 108,
  botCutterOutDistance: 175,
  botCutterSideDistance: 142,
  botCutterRange: 265,
  botCutterMaxSelfTrail: 26,
  botMaxOutTime: 3.1,
  botMaxSafeTrailPoints: 42,
  botLookAheadDistance: 115,
  botWaypointRadius: 28,
  botRespawnAttempts: 1200,

  cameraViewHeight: 820,
  cameraMinViewWidth: 700,
  cameraMaxViewSpan: 1360,
  cameraLookAhead: 105,
  cameraLookAheadFollow: 5.5,
  cameraFollow: 7.5,
  planeGridSpacing: 120,

  winShare: 1,
});

export const ENTITY_SPECS = Object.freeze([
  { id: 1, name: "You", dryToken: "--ink-player", wetToken: "--ink-player-wet", role: "player" },
  { id: 2, name: "Tide", dryToken: "--ink-bot-1", wetToken: "--ink-bot-1-wet", role: "edge-farmer" },
  { id: 3, name: "Ochre", dryToken: "--ink-bot-2", wetToken: "--ink-bot-2-wet", role: "small-looper" },
  { id: 4, name: "Moss", dryToken: "--ink-bot-3", wetToken: "--ink-bot-3-wet", role: "opportunistic-cutter" },
]);
