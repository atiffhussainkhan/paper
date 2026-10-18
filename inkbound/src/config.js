// Simulation values are kept in world units and seconds.
// Tuned after Phase 0 playtest: bots were over-aggressive at spawn.
export const CONFIG = Object.freeze({
  simHz: 60,
  maxFrameTime: 0.2,
  maxStepsPerFrame: 8,

  arenaRadius: 1200,
  gridSize: 160,
  // ~1.0% start disk — enough room for a first teaching loop.
  startTerritoryRadius: 120,

  playerSpeed: 200,
  botSpeed: 125,
  // Slightly softer turns reduce accidental self-cuts for pointer steering.
  steerRate: Math.PI * 1.85,
  bodyRadius: 13,

  trailWidth: 11,
  trailSampleSpacing: 8,
  maxTrailPoints: 5000,
  selfGracePoints: 22,
  selfCollisionRadiusScale: 0.45,
  enemyHeadGracePoints: 4,

  botCount: 3,
  botInitialSpawnRadius: 920,
  botMinPlayerSeparation: 520,
  botLoopOutDistance: 185,
  botLoopSideDistance: 145,
  botEdgeOutDistance: 210,
  botEdgeSweepDistance: 235,
  botEdgeRimMargin: 44,
  botSmallLoopOutDistance: 150,
  botSmallLoopSideDistance: 120,
  botCutterOutDistance: 175,
  botCutterSideDistance: 142,
  botCutterRange: 200,
  botCutterMaxSelfTrail: 18,
  botMaxOutTime: 3.1,
  botMaxSafeTrailPoints: 42,
  botLookAheadDistance: 115,
  botWaypointRadius: 28,
  botRespawnAttempts: 1200,
  // Teaching window: bots cannot cut the player; Moss won't hunt yet.
  botHuntGraceSeconds: 20,

  cameraViewHeight: 1000,
  cameraMinViewWidth: 720,
  cameraMaxViewSpan: 1400,
  cameraLookAhead: 120,
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
