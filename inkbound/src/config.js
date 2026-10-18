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

  playerSpeed: 195,
  botSpeed: 125,
  // Responsive 360° chase. A half-turn still fits inside self-trail grace,
  // so a deliberate hook is not a suicide and a flick can still come home.
  steerRate: Math.PI * 1.72,
  // First return only: the bead seals when it overlaps ink, a little early.
  // The nose reaches ahead of the center so a closing hook seals on the
  // ink it is aiming at, before that hook can clip the outbound stem.
  firstClaimContactScale: 1.65,
  firstClaimNose: 48,
  // Until the first seal lands, the player's own line cannot kill them.
  // A pointer square's closing side often crosses the outbound stem.
  playerFirstClaimSelfImmune: true,
  bodyRadius: 13,

  trailWidth: 11,
  trailSampleSpacing: 8,
  maxTrailPoints: 5000,
  selfGracePoints: 30,
  selfCollisionRadiusScale: 0.3,
  // Early-match teaching: extra self-trail forgiveness until this age.
  playerSelfForgivenessSeconds: 22,
  playerSelfForgivenessGraceScale: 1.85,
  playerSelfForgivenessRadiusScale: 0.18,
  // Ignore tiny accidental loops until the wet stroke is this long (world units).
  playerSelfMinTrailLength: 220,
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
  // Bot difficulty curve:
  // age = clamp((matchAge - openingSafety) / rampSeconds, 0..1)
  // share = clamp((playerShare - shareStart) / (shareFull - shareStart), 0..1)
  // aggression = (ageWeight * age + shareWeight * share) * sqrt(age)
  // The sqrt(age) gate keeps the curve continuous at the end of opening safety,
  // even if a fast player has already claimed a large share.
  // Phase 1.5: longer teaching window so bots don't spoil the first claim.
  botOpeningSafetySeconds: 14,
  botLowShareSafetyBonusSeconds: 8,
  botDifficultyRampSeconds: 85,
  botDifficultyShareStart: 0.015,
  botDifficultyShareFull: 0.2,
  botDifficultyAgeWeight: 0.65,
  botDifficultyShareWeight: 0.35,
  botCutterMinRange: 90,
  botCutterRange: 200,
  botCutterMaxSelfTrail: 18,
  // Late match: Moss biases toward cutting the player once aggression crosses this.
  botCutterPlayerHuntThreshold: 0.42,
  botCutterPlayerScoreBias: 0.68,
  // Edge / looper loops grow slightly with aggression so late-game stays lively.
  botLateLoopBoost: 0.18,
  botMaxOutTime: 3.1,
  botMaxOutTimeBonus: 0.45,
  botSpeedBonus: 12,
  botMaxSafeTrailPoints: 42,
  botLookAheadDistance: 115,
  botWaypointRadius: 28,
  botRespawnAttempts: 1200,

  cameraViewHeight: 1000,
  cameraMinViewWidth: 720,
  cameraMaxViewSpan: 1400,
  cameraLookAhead: 120,
  cameraLookAheadFollow: 5.5,
  cameraFollow: 7.5,
  // While a stroke is open, pull the view back so home and the head share
  // the frame. At home the view stays on cameraViewHeight.
  cameraTrailPadding: 280,
  cameraTrailZoomMinSpan: 96,
  cameraZoomFollow: 2.6,
  cameraHomePull: 0.46,
  cameraHomePullFollow: 3.4,
  cameraHomePullMax: 640,
  // First open stroke: keep the bead near the pointer origin. A large
  // look-ahead slides the sprite under a still cursor and hooks the line
  // back across itself. Zoom enough to show the start disk and the head.
  cameraFirstClaimLookAhead: 36,
  cameraFirstClaimLookAheadFollow: 8,
  cameraFirstClaimPadding: 460,
  cameraFirstClaimPull: 0.72,
  cameraFirstClaimPullFollow: 4.2,
  cameraFirstClaimPullMax: 380,
  cameraFirstClaimZoomFollow: 3.4,
  planeGridSpacing: 120,

  // Fraction of the plane (0..1) that ends the match. 1 seals the whole disc.
  winShare: 1,
});

export const ENTITY_SPECS = Object.freeze([
  { id: 1, name: "You", dryToken: "--ink-player", wetToken: "--ink-player-wet", role: "player" },
  { id: 2, name: "Tide", dryToken: "--ink-bot-1", wetToken: "--ink-bot-1-wet", role: "edge-farmer" },
  { id: 3, name: "Ochre", dryToken: "--ink-bot-2", wetToken: "--ink-bot-2-wet", role: "small-looper" },
  { id: 4, name: "Moss", dryToken: "--ink-bot-3", wetToken: "--ink-bot-3-wet", role: "opportunistic-cutter" },
]);
