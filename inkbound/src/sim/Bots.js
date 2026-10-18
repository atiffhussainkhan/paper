import {
  adaptiveOpeningGraceSeconds,
  botDifficultyCurve,
  openingFairnessScale,
  playerSafeFromBots,
} from "./Combat.js";

const ROLES = ["edge-farmer", "small-looper", "opportunistic-cutter"];

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clampToArena(arena, point, margin) {
  return arena.clampPoint(point, margin);
}

export function roleForBot(entity) {
  if (entity.id === 2 || entity.name === "Tide") return "edge-farmer";
  if (entity.id === 3 || entity.name === "Ochre") return "small-looper";
  if (entity.id === 4 || entity.name === "Moss") return "opportunistic-cutter";
  return ROLES[Math.abs((entity.id || 2) - 2) % ROLES.length];
}

function olderTrailEndSegment(bot, config) {
  const trail = bot.trail;
  if (!trail || trail.points.length < 3) return 0;
  const graceDist = Math.max(
    config.bodyRadius * 3.2,
    (config.selfGracePoints - 2) * config.trailSampleSpacing,
  );
  if (typeof trail.olderSegmentCount === "function") {
    return trail.olderSegmentCount(graceDist, bot.position);
  }
  return Math.max(0, trail.points.length - config.selfGracePoints);
}

function doesSegmentThreatenOwnTrail(bot, from, to, clearance, endSegment) {
  if (endSegment <= 0 || !bot.trail?.active) return false;
  if (typeof bot.trail.collidesSegment === "function") {
    return bot.trail.collidesSegment(from, to, clearance, 0, endSegment);
  }
  const steps = 4;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const sample = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    if (bot.trail.collidesPoint(sample, clearance, 0, endSegment)) return true;
  }
  return false;
}

function isNearPlayerTerritory(point, arena, config, cushion = 1) {
  const game = arena?.game;
  const grid = game?.grid;
  const player = game?.player;
  const pad = (config.startTerritoryRadius + config.bodyRadius * 2.5) * cushion;

  if (grid) {
    const cellRadius = Math.ceil(pad / grid.cellSize);
    const center = grid.worldToCell(point.x, point.y);
    if (!center) return true;
    for (let r = center.row - cellRadius; r <= center.row + cellRadius; r += 1) {
      for (let c = center.col - cellRadius; c <= center.col + cellRadius; c += 1) {
        if (c < 0 || r < 0 || c >= grid.size || r >= grid.size) continue;
        const cellPoint = grid.cellCenter(c, r);
        if ((cellPoint.x - point.x) ** 2 + (cellPoint.y - point.y) ** 2 <= pad * pad) {
          const owner = grid.cells[grid.index(c, r)];
          if (owner === 1) return true;
        }
      }
    }
  }

  const playerPos = player?.alive ? player.position : { x: 0, y: 0 };
  if (Math.hypot(point.x - playerPos.x, point.y - playerPos.y) < config.startTerritoryRadius * 2.2) {
    return true;
  }
  if (player?.alive && player.trail?.active && player.trail.collidesPoint(point, pad)) {
    return true;
  }
  return false;
}

function relocateBotOutOfPlayerTerritory(entity, arena, config, random) {
  const game = arena?.game;
  const grid = game?.grid;
  const inset = config.startTerritoryRadius + config.bodyRadius * 2;
  const maxR = arena.radius - inset;

  const isCandidateValid = (pt) => {
    if (!arena.contains(pt.x, pt.y, inset)) return false;
    if (isNearPlayerTerritory(pt, arena, config)) return false;
    if (grid && !grid.isDiskUnowned(pt.x, pt.y, config.startTerritoryRadius)) return false;
    if (game?.entities) {
      for (const other of game.entities) {
        if (!other.alive || other.id === entity.id) continue;
        if (Math.hypot(other.position.x - pt.x, other.position.y - pt.y) < config.startTerritoryRadius * 2.1) {
          return false;
        }
        if (other.trail?.active && other.trail.collidesPoint(pt, inset)) return false;
      }
    }
    return true;
  };

  if (grid) grid.clearOwner(entity.id);

  let chosen = null;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const radius = (0.38 + 0.58 * Math.sqrt(random())) * maxR;
    const candidate = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    if (isCandidateValid(candidate)) {
      chosen = candidate;
      break;
    }
  }

  if (!chosen) {
    const rings = [0.78, 0.62, 0.86, 0.48];
    const angleSteps = 24;
    for (const ring of rings) {
      for (let i = 0; i < angleSteps; i += 1) {
        const angle = (i / angleSteps) * Math.PI * 2 + (entity.id * 0.7);
        const candidate = { x: Math.cos(angle) * maxR * ring, y: Math.sin(angle) * maxR * ring };
        if (isCandidateValid(candidate)) {
          chosen = candidate;
          break;
        }
      }
      if (chosen) break;
    }
  }

  if (chosen) {
    entity.position = { ...chosen };
    entity.previousPosition = { ...chosen };
  }
  if (grid) {
    grid.setDisk(entity.id, entity.position.x, entity.position.y, config.startTerritoryRadius);
  }
}

function findNearestOwnedPoint(grid, ownerId, fromPoint, fallback) {
  if (!grid || grid.counts[ownerId] <= 0) return fallback;
  if (grid.isOwnedBy(ownerId, fallback.x, fallback.y)) return fallback;

  let bestPoint = fallback;
  let bestDistSq = Infinity;
  for (let row = 0; row < grid.size; row += 2) {
    for (let col = 0; col < grid.size; col += 2) {
      const idx = grid.index(col, row);
      if (grid.cells[idx] !== ownerId) continue;
      const center = grid.cellCenter(col, row);
      const distSq = (center.x - fromPoint.x) ** 2 + (center.y - fromPoint.y) ** 2;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestPoint = center;
      }
    }
  }
  return bestPoint;
}

function loopDistanceScale(brain, config) {
  const opening = brain.openingScale ?? 1;
  const aggression = brain.aggression ?? 0;
  const lateBoost = 1 + Math.max(0, aggression - 0.5) * (config.botLateLoopBoost ?? 0.18);
  return opening * lateBoost;
}

function makeEdgeFarmerLoop(brain, arena, config) {
  const random = brain.random;
  const anchor = brain.safeAnchor;
  const scale = loopDistanceScale(brain, config);
  const rimMargin = config.botEdgeRimMargin ?? config.bodyRadius * 3.4;
  const maxRing = arena.radius - rimMargin;
  const distFromCenter = Math.hypot(anchor.x, anchor.y);
  const radialAngle = distFromCenter > 1
    ? Math.atan2(anchor.y, anchor.x)
    : brain.orbitAngle;

  const outStep = (config.botEdgeOutDistance ?? config.botLoopOutDistance) * scale * (0.88 + random() * 0.24);
  const sweepDist = (config.botEdgeSweepDistance ?? config.botLoopSideDistance * 1.45) * scale * (0.85 + random() * 0.3);
  const outerRadius = Math.min(maxRing, Math.max(distFromCenter + outStep * 0.82, arena.radius * 0.72));
  const rimDir = brain.turnSign;
  const sweepAngle = sweepDist / Math.max(380, outerRadius);

  const outwardAngle = radialAngle + rimDir * 0.14;
  const outward = clampToArena(arena, {
    x: Math.cos(outwardAngle) * outerRadius,
    y: Math.sin(outwardAngle) * outerRadius,
  }, rimMargin);

  const midArcAngle = radialAngle + rimDir * (sweepAngle * 0.58);
  const midArc = clampToArena(arena, {
    x: Math.cos(midArcAngle) * outerRadius,
    y: Math.sin(midArcAngle) * outerRadius,
  }, rimMargin);

  const endArcAngle = radialAngle + rimDir * sweepAngle;
  const innerReturnRadius = Math.max(
    config.startTerritoryRadius * 1.6,
    Math.min(distFromCenter + 45, outerRadius - Math.min(135, outStep * 0.65)),
  );
  const shoulder = clampToArena(arena, {
    x: Math.cos(endArcAngle) * innerReturnRadius,
    y: Math.sin(endArcAngle) * innerReturnRadius,
  }, rimMargin + 14);

  return [outward, midArc, shoulder, { ...anchor }];
}

function makeSmallLooperLoop(brain, arena, config) {
  const random = brain.random;
  const anchor = brain.safeAnchor;
  const scale = loopDistanceScale(brain, config);
  const margin = config.bodyRadius * 3.2;
  const outDist = (config.botSmallLoopOutDistance ?? config.botLoopOutDistance * 0.72) * scale * (0.88 + random() * 0.22);
  const sideDist = (config.botSmallLoopSideDistance ?? config.botLoopSideDistance * 0.74) * scale * (0.88 + random() * 0.22);

  brain.orbitAngle = wrapAngle(brain.orbitAngle + brain.turnSign * (0.82 + random() * 0.38));
  let baseAngle = brain.orbitAngle;

  const testOut = {
    x: anchor.x + Math.cos(baseAngle) * (outDist + margin),
    y: anchor.y + Math.sin(baseAngle) * (outDist + margin),
  };
  const playerCushion = 1 + (1 - scale) * 0.5;
  if (!arena.contains(testOut.x, testOut.y, margin) || isNearPlayerTerritory(testOut, arena, config, playerCushion)) {
    const inwardAngle = Math.atan2(-anchor.y, -anchor.x);
    baseAngle = wrapAngle(inwardAngle + (random() - 0.5) * 1.1);
    brain.orbitAngle = baseAngle;
  }

  const dir = { x: Math.cos(baseAngle), y: Math.sin(baseAngle) };
  const perp = { x: -dir.y * brain.turnSign, y: dir.x * brain.turnSign };

  const outward = clampToArena(arena, {
    x: anchor.x + dir.x * outDist,
    y: anchor.y + dir.y * outDist,
  }, margin);

  const apex = clampToArena(arena, {
    x: anchor.x + dir.x * (outDist * 0.92) + perp.x * sideDist,
    y: anchor.y + dir.y * (outDist * 0.92) + perp.y * sideDist,
  }, margin);

  const shoulder = clampToArena(arena, {
    x: anchor.x + dir.x * (outDist * 0.28) + perp.x * (sideDist * 0.82),
    y: anchor.y + dir.y * (outDist * 0.28) + perp.y * (sideDist * 0.82),
  }, margin);

  return [outward, apex, shoulder, { ...anchor }];
}

function makeOpportunisticCutterLoop(brain, arena, config) {
  const random = brain.random;
  const anchor = brain.safeAnchor;
  const scale = loopDistanceScale(brain, config);
  const margin = config.bodyRadius * 3.2;
  const outDist = (config.botCutterOutDistance ?? config.botLoopOutDistance * 0.94) * scale * (0.86 + random() * 0.26);
  const sideDist = (config.botCutterSideDistance ?? config.botLoopSideDistance * 0.96) * scale * (0.86 + random() * 0.26);

  brain.orbitAngle = wrapAngle(brain.orbitAngle + brain.turnSign * (0.95 + random() * 0.45));
  let baseAngle = brain.orbitAngle;

  const probe = {
    x: anchor.x + Math.cos(baseAngle) * (outDist + margin),
    y: anchor.y + Math.sin(baseAngle) * (outDist + margin),
  };
  const playerCushion = 1 + (1 - scale) * 0.5;
  if (!arena.contains(probe.x, probe.y, margin) || isNearPlayerTerritory(probe, arena, config, playerCushion)) {
    baseAngle = wrapAngle(Math.atan2(-anchor.y, -anchor.x) + (random() - 0.5) * 1.2);
    brain.orbitAngle = baseAngle;
  }

  const dir = { x: Math.cos(baseAngle), y: Math.sin(baseAngle) };
  const perp = { x: -dir.y * brain.turnSign, y: dir.x * brain.turnSign };

  const outward = clampToArena(arena, {
    x: anchor.x + dir.x * outDist,
    y: anchor.y + dir.y * outDist,
  }, margin);

  const corner = clampToArena(arena, {
    x: anchor.x + dir.x * (outDist * 0.88) + perp.x * sideDist,
    y: anchor.y + dir.y * (outDist * 0.88) + perp.y * sideDist,
  }, margin);

  const shoulder = clampToArena(arena, {
    x: anchor.x + dir.x * (outDist * 0.25) + perp.x * (sideDist * 0.78),
    y: anchor.y + dir.y * (outDist * 0.25) + perp.y * (sideDist * 0.78),
  }, margin);

  return [outward, corner, shoulder, { ...anchor }];
}

function makeLoopForRole(brain, arena, config) {
  if (brain.role === "edge-farmer") return makeEdgeFarmerLoop(brain, arena, config);
  if (brain.role === "small-looper") return makeSmallLooperLoop(brain, arena, config);
  return makeOpportunisticCutterLoop(brain, arena, config);
}

function findOpportunisticCutTarget(bot, rivals, arena, config, cutterRange, hunt = null) {
  const maxSelfTrail = config.botCutterMaxSelfTrail ?? 26;
  if (bot.trail.points.length > maxSelfTrail) return null;

  const range = cutterRange ?? config.botCutterRange ?? 265;
  const rangeSq = range * range;
  const margin = config.bodyRadius * 2.4;
  const ownEndSeg = olderTrailEndSegment(bot, config);
  const ownClearance = config.bodyRadius + config.trailWidth * 0.5 + 18;
  const headGrace = (config.enemyHeadGracePoints ?? 4) + 3;
  const aggression = hunt?.aggression ?? 0;
  const huntPlayer = Boolean(
    hunt?.huntPlayer
    && aggression >= (config.botCutterPlayerHuntThreshold ?? 0.42),
  );
  const playerBias = config.botCutterPlayerScoreBias ?? 0.68;

  let bestTarget = null;
  let bestScore = Infinity;

  for (const rival of rivals) {
    if (!rival.alive || rival.id === bot.id || !rival.trail?.active) continue;
    const pts = rival.trail.points;
    const vulnerableCount = pts.length - headGrace;
    if (vulnerableCount < 2) continue;

    for (let i = 1; i < vulnerableCount; i += 2) {
      const pt = pts[i];
      if (!arena.contains(pt.x, pt.y, margin)) continue;
      const distSq = (pt.x - bot.position.x) ** 2 + (pt.y - bot.position.y) ** 2;
      if (distSq > rangeSq) continue;

      const distToRivalHead = Math.hypot(pt.x - rival.position.x, pt.y - rival.position.y);
      if (distToRivalHead < config.bodyRadius * 4.2) continue;

      if (doesSegmentThreatenOwnTrail(bot, bot.position, pt, ownClearance, ownEndSeg)) {
        continue;
      }

      const distFromAnchor = Math.hypot(pt.x - bot.brain.safeAnchor.x, pt.y - bot.brain.safeAnchor.y);
      let score = Math.sqrt(distSq) + distFromAnchor * 0.28;
      if (huntPlayer && rival.isPlayer) {
        score *= playerBias;
      } else if (!rival.isPlayer && huntPlayer) {
        score *= 1.08;
      }
      if (score < bestScore) {
        bestScore = score;
        bestTarget = { x: pt.x, y: pt.y, rivalId: rival.id };
      }
    }
  }

  return bestTarget;
}

function selectSafeHeading(bot, nominalHeading, rivals, arena, config) {
  const brain = bot.brain;
  const player = arena?.game?.player;
  const openingScale = brain.openingScale ?? 1;
  const endSeg = olderTrailEndSegment(bot, config);
  const lookAhead = config.botLookAheadDistance ?? 115;
  const nearDist = lookAhead * 0.45;
  const midDist = lookAhead * 0.85;
  const farDist = lookAhead * 1.25;
  const trailClearance = config.bodyRadius + config.trailWidth * 0.5 + 18;
  const rimInset = brain.role === "edge-farmer" && brain.mode !== "returning"
    ? config.bodyRadius * 1.8
    : config.bodyRadius * 2.8;

  let targetHeading = nominalHeading;
  if (bot.outsideOwnTerritory && bot.trail.points.length > 4) {
    const turnDiff = wrapAngle(nominalHeading - bot.heading);
    if (Math.abs(turnDiff) > Math.PI * 0.68) {
      const preferredSign = brain.turnSign || 1;
      targetHeading = wrapAngle(bot.heading + preferredSign * Math.PI * 0.56);
    }
  }

  const candidateOffsets = [
    0,
    0.26 * brain.turnSign,
    -0.26 * brain.turnSign,
    0.52 * brain.turnSign,
    -0.52 * brain.turnSign,
    0.82 * brain.turnSign,
    -0.82 * brain.turnSign,
    1.15 * brain.turnSign,
    -1.15 * brain.turnSign,
    1.48 * brain.turnSign,
    -1.48 * brain.turnSign,
  ];

  let bestAngle = targetHeading;
  let bestScore = -Infinity;

  for (const offset of candidateOffsets) {
    const angle = wrapAngle(targetHeading + offset);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const p1 = { x: bot.position.x + cos * nearDist, y: bot.position.y + sin * nearDist };
    const p2 = { x: bot.position.x + cos * midDist, y: bot.position.y + sin * midDist };
    const p3 = { x: bot.position.x + cos * farDist, y: bot.position.y + sin * farDist };

    let score = 0;
    const diffFromTarget = Math.abs(wrapAngle(angle - targetHeading));
    const diffFromCurrent = Math.abs(wrapAngle(angle - bot.heading));
    score -= diffFromTarget * 110;
    score -= diffFromCurrent * 28;

    if (bot.outsideOwnTerritory && diffFromCurrent > Math.PI * 0.72) {
      score -= 1400;
    }

    if (endSeg > 0) {
      if (doesSegmentThreatenOwnTrail(bot, bot.position, p1, trailClearance, endSeg)) {
        score -= 12000;
      } else if (doesSegmentThreatenOwnTrail(bot, p1, p2, trailClearance * 0.92, endSeg)) {
        score -= 6000;
      } else if (doesSegmentThreatenOwnTrail(bot, p2, p3, trailClearance * 0.82, endSeg)) {
        score -= 2200;
      }
    }

    if (!arena.contains(p1.x, p1.y, rimInset)) {
      score -= 1800;
    } else if (!arena.contains(p2.x, p2.y, rimInset)) {
      score -= 650;
    }

    if (bot.outsideOwnTerritory) {
      for (const rival of rivals) {
        if (!rival.alive || rival.id === bot.id) continue;
        const headDist1 = Math.hypot(p1.x - rival.position.x, p1.y - rival.position.y);
        if (headDist1 < config.bodyRadius * 4.2) score -= 1600;
        const headDist2 = Math.hypot(p2.x - rival.position.x, p2.y - rival.position.y);
        if (headDist2 < config.bodyRadius * 3.4) score -= 700;
      }
    }

    if (player?.alive && player.isPlayer && openingScale < 1) {
      const avoid = config.startTerritoryRadius * (2.4 + (1 - openingScale) * 1.6);
      for (const sample of [p1, p2, p3]) {
        const dist = Math.hypot(sample.x - player.position.x, sample.y - player.position.y);
        if (dist < avoid) score -= (avoid - dist) * (18 + (1 - openingScale) * 22);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

export function attachBotBrain(entity, arena, config, random = Math.random) {
  if (isNearPlayerTerritory(entity.position, arena, config)) {
    relocateBotOutOfPlayerTerritory(entity, arena, config, random);
  }

  const role = roleForBot(entity);
  const home = { x: entity.position.x, y: entity.position.y };
  const turnSign = entity.id % 2 === 0 ? 1 : -1;
  const outwardFromCenter = Math.atan2(home.y, home.x);
  const initialAngle = role === "edge-farmer"
    ? wrapAngle(outwardFromCenter + turnSign * 0.35)
    : wrapAngle(outwardFromCenter + (random() - 0.5) * 0.9);

  entity.heading = initialAngle;
  entity.desiredHeading = initialAngle;

  entity.brain = {
    role,
    home,
    safeAnchor: { ...home },
    turnSign,
    orbitAngle: initialAngle,
    waypoints: [],
    waypoint: 0,
    age: 0,
    outTime: 0,
    wasOutside: false,
    mode: "looping",
    cutTarget: null,
    openingScale: openingFairnessScale(0, 0, config),
    random,
  };

  entity.brain.waypoints = makeLoopForRole(entity.brain, arena, config);
}

export function updateBotHeadings(bots, arena, config, dt, gameArg = null) {
  const game = gameArg ?? arena?.game;
  const grid = game?.grid;
  const allEntities = game?.entities ?? bots;
  const matchAge = game?.matchAge ?? 0;
  const player = game?.player;
  const playerShare = grid && player ? grid.share(player.id) : 0;
  const difficulty = botDifficultyCurve(matchAge, playerShare, config);
  const huntAllowed = difficulty.aggression > 0
    && !playerSafeFromBots(matchAge, playerShare, config);
  const outTimeBonus = difficulty.maxOutTime - (config.botMaxOutTime ?? 3.1);
  const openingScale = openingFairnessScale(matchAge, playerShare, config);
  const openingGrace = adaptiveOpeningGraceSeconds(playerShare, config);

  for (const bot of bots) {
    if (!bot.alive) continue;
    if (!bot.brain) attachBotBrain(bot, arena, config);
    bot.speed = difficulty.speed * (0.86 + 0.14 * openingScale);

    const brain = bot.brain;
    brain.openingScale = openingScale;
    brain.aggression = difficulty.aggression;
    brain.age += dt;

    if (!bot.outsideOwnTerritory) {
      const pullToHome = 0.18;
      brain.safeAnchor = {
        x: bot.position.x * (1 - pullToHome) + brain.home.x * pullToHome,
        y: bot.position.y * (1 - pullToHome) + brain.home.y * pullToHome,
      };
      if (brain.wasOutside) {
        brain.home = {
          x: brain.home.x * 0.65 + bot.position.x * 0.35,
          y: brain.home.y * 0.65 + bot.position.y * 0.35,
        };
        brain.safeAnchor = { ...bot.position };
        brain.outTime = 0;
        brain.age = 0;
        brain.mode = "looping";
        brain.cutTarget = null;
        if (brain.role === "edge-farmer" && brain.random() < 0.25) {
          brain.turnSign *= -1;
        }
        brain.waypoints = makeLoopForRole(brain, arena, config);
        brain.waypoint = 0;
      }
      brain.wasOutside = false;
      brain.outTime = 0;
    } else {
      brain.wasOutside = true;
      brain.outTime += dt;
      if (grid && !grid.isOwnedBy(bot.id, brain.safeAnchor.x, brain.safeAnchor.y)) {
        brain.safeAnchor = findNearestOwnedPoint(grid, bot.id, bot.position, brain.safeAnchor);
        if (brain.waypoints.length > 0) {
          brain.waypoints[brain.waypoints.length - 1] = { ...brain.safeAnchor };
        }
      }
    }

    const openingOutBonus = matchAge < openingGrace ? (1 - openingScale) * 0.85 : 0;
    const looperUrgency = brain.role === "small-looper" && difficulty.aggression > 0.62
      ? 0.22 * (difficulty.aggression - 0.62)
      : 0;
    const maxOutTime = brain.role === "small-looper"
      ? 2.25 + outTimeBonus * 0.35 + openingOutBonus - looperUrgency
      : brain.role === "edge-farmer"
        ? difficulty.maxOutTime + 0.35 + openingOutBonus * 0.5
        : difficulty.maxOutTime + openingOutBonus * 0.35;
    const maxTrailPts = brain.role === "small-looper"
      ? 28
      : brain.role === "edge-farmer"
        ? (config.botMaxSafeTrailPoints ?? 42) + 6
        : (config.botMaxSafeTrailPoints ?? 42);

    let rivalThreateningTrail = false;
    if (bot.outsideOwnTerritory && bot.trail.points.length > 8) {
      for (const rival of allEntities) {
        if (!rival.alive || rival.id === bot.id) continue;
        if (bot.trail.collidesPoint(rival.position, config.bodyRadius * 6.5)) {
          rivalThreateningTrail = true;
          break;
        }
      }
    }

    if (
      bot.outsideOwnTerritory
      && (brain.outTime > maxOutTime || bot.trail.points.length > maxTrailPts || rivalThreateningTrail)
    ) {
      brain.mode = "returning";
      brain.cutTarget = null;
      brain.waypoint = brain.waypoints.length - 1;
      brain.waypoints[brain.waypoint] = { ...brain.safeAnchor };
    }

    if (
      huntAllowed
      && brain.role === "opportunistic-cutter"
      && brain.mode !== "returning"
    ) {
      const cutTarget = findOpportunisticCutTarget(
        bot,
        allEntities,
        arena,
        config,
        difficulty.cutterRange,
        { aggression: difficulty.aggression, huntPlayer: huntAllowed },
      );
      if (cutTarget) {
        brain.mode = "cutting";
        brain.cutTarget = cutTarget;
      } else if (brain.mode === "cutting") {
        brain.mode = "returning";
        brain.cutTarget = null;
        brain.waypoint = brain.waypoints.length - 1;
        brain.waypoints[brain.waypoint] = { ...brain.safeAnchor };
      }
    } else if (!huntAllowed && brain.mode === "cutting") {
      brain.mode = "looping";
      brain.cutTarget = null;
    }

    let target;
    if (brain.mode === "cutting" && brain.cutTarget) {
      target = brain.cutTarget;
    } else {
      target = brain.waypoints[brain.waypoint] ?? brain.safeAnchor;
      const distance = Math.hypot(target.x - bot.position.x, target.y - bot.position.y);
      const isFinalWaypoint = brain.waypoint >= brain.waypoints.length - 1;

      if (distance < config.botWaypointRadius || (!isFinalWaypoint && brain.age > 2.2)) {
        brain.age = 0;
        if (!isFinalWaypoint) {
          brain.waypoint += 1;
          target = brain.waypoints[brain.waypoint];
        } else if (!bot.outsideOwnTerritory) {
          brain.waypoints = makeLoopForRole(brain, arena, config);
          brain.waypoint = 0;
          target = brain.waypoints[0];
        } else {
          target = brain.safeAnchor;
        }
      }
    }

    const nominalHeading = Math.atan2(target.y - bot.position.y, target.x - bot.position.x);
    bot.desiredHeading = selectSafeHeading(bot, nominalHeading, allEntities, arena, config);
  }
}
