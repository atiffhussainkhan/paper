// Combat resolution (tick step 5). Pure decision pass: it only marks deaths and
// never mutates trails or territory, so step 6 (capture) sees a consistent
// world and step 7 owns all cleanup.
//
// Edge cases, all decided on the tick's final positions + swept motion:
// - Resolution is simultaneous. Death in this pass does not stop a body from
//   cutting in this same pass, so a mutual cut kills both owners and results do
//   not depend on entity order. Only attribution (`killedBy`) uses list order.
// - Bodies never kill bodies. Only a body touching another entity's wet stroke
//   kills that stroke's owner; the attacker is unharmed.
// - Contact radius = attacker body radius + half the stroke width.
// - Grace is measured in arc length behind the stroke's head, not sample count.
//   Self grace keeps a turning body from hitting its own tail. Enemy grace
//   keeps a head-on approach (bodies touching) from reading as a cut.
// - An entity that closes a loop this tick is still vulnerable until step 6, so
//   a cut landing on the same tick beats the capture (combat precedes capture).
// - Only entities alive at the start of the pass participate. Dead entities
//   have no trail or body here, which prevents ghost collisions.
function graceLength(points, config) {
  return points * config.trailSampleSpacing;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function shareProgress(playerShare, config) {
  const start = config.botDifficultyShareStart ?? 0;
  const full = Math.max(start + Number.EPSILON, config.botDifficultyShareFull ?? 0.2);
  return clamp01((Math.max(0, playerShare) - start) / (full - start));
}

export function botDifficultyCurve(matchAge, playerShare, config) {
  const openingSafety = config.botOpeningSafetySeconds ?? 10;
  const rampSeconds = Math.max(1, config.botDifficultyRampSeconds ?? 70);
  const age = clamp01((Math.max(0, matchAge) - openingSafety) / rampSeconds);
  const share = shareProgress(playerShare, config);
  const ageWeight = config.botDifficultyAgeWeight ?? 0.65;
  const shareWeight = config.botDifficultyShareWeight ?? 0.35;
  const aggression = clamp01(
    (ageWeight * age + shareWeight * share) * Math.sqrt(age),
  );

  const minRange = config.botCutterMinRange ?? config.botCutterRange;
  const maxRange = Math.max(minRange, config.botCutterRange ?? minRange);
  return {
    aggression,
    cutterRange: minRange + (maxRange - minRange) * aggression,
    maxOutTime: (config.botMaxOutTime ?? 3.1)
      + (config.botMaxOutTimeBonus ?? 0) * aggression,
    speed: config.botSpeed + (config.botSpeedBonus ?? 0) * aggression,
  };
}

export function playerSafeFromBots(matchAge, playerShare, config) {
  const openingSafety = config.botOpeningSafetySeconds ?? 10;
  const lowShareBonus = config.botLowShareSafetyBonusSeconds ?? 0;
  const adaptiveGrace = openingSafety
    + lowShareBonus * (1 - shareProgress(playerShare, config));
  return matchAge < adaptiveGrace;
}

export function playerSelfForgivenessActive(matchAge, config) {
  return matchAge < (config.playerSelfForgivenessSeconds ?? 0);
}

function trailArcLength(trail) {
  if (!trail?.points || trail.points.length < 2) return 0;
  let length = 0;
  for (let i = 1; i < trail.points.length; i += 1) {
    const a = trail.points[i - 1];
    const b = trail.points[i];
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return length;
}

export function resolveCombat(
  entities,
  config,
  matchAge = Infinity,
  playerShare = 0,
) {
  const living = entities.filter((entity) => entity.alive);
  const deaths = new Map();
  const baseSelfGrace = graceLength(config.selfGracePoints, config);
  const enemyGrace = graceLength(config.enemyHeadGracePoints, config);
  // Bots cannot cut the player during the guaranteed opening safety period.
  // Players below the configured share curve receive a small adaptive bonus.
  // Self-cuts and player-vs-bot cuts still resolve normally.
  const playerIsSafeFromBots = playerSafeFromBots(matchAge, playerShare, config);
  const forgiveness = playerSelfForgivenessActive(matchAge, config);

  // Self-cut uses a tighter radius than enemy cuts so normal turning along a
  // fresh stroke does not register as suicide. Early match gives the player
  // extra arc grace and a smaller hit radius so the first claim is learnable.
  const baseSelfRadiusScale = config.selfCollisionRadiusScale ?? 0.45;
  for (const entity of living) {
    const trail = entity.trail;
    let selfGrace = baseSelfGrace;
    let selfRadiusScale = baseSelfRadiusScale;
    if (entity.isPlayer && forgiveness) {
      selfGrace *= config.playerSelfForgivenessGraceScale ?? 1.75;
      selfRadiusScale = Math.min(
        selfRadiusScale,
        config.playerSelfForgivenessRadiusScale ?? 0.2,
      );
      const minLen = config.playerSelfMinTrailLength ?? 0;
      if (minLen > 0 && trailArcLength(trail) < minLen) continue;
    }
    const endSegment = trail.olderSegmentCount(selfGrace, entity.position);
    if (endSegment > 0
      && trail.collidesSegment(
        entity.previousPosition,
        entity.position,
        entity.radius * selfRadiusScale,
        0,
        endSegment,
      )) {
      deaths.set(entity, {
        reason: entity.isPlayer
          ? "You crossed your own line."
          : `${entity.name} crossed its own line.`,
        killedBy: entity,
      });
    }
  }

  for (const owner of living) {
    if (!owner.trail.active || deaths.has(owner)) continue;
    const endSegment = owner.trail.olderSegmentCount(enemyGrace, owner.position);
    if (endSegment <= 0) continue;
    for (const attacker of living) {
      if (attacker === owner) continue;
      if (playerIsSafeFromBots && owner.isPlayer && !attacker.isPlayer) continue;
      if (owner.trail.collidesSegment(
        attacker.previousPosition,
        attacker.position,
        attacker.radius,
        0,
        endSegment,
      )) {
        deaths.set(owner, {
          reason: owner.isPlayer
            ? `${attacker.name} cut your line.`
            : `${attacker.name} cut ${owner.name}'s line.`,
          killedBy: attacker,
        });
        break;
      }
    }
  }

  const resolved = [];
  for (const [entity, death] of deaths) {
    entity.markDead(death.reason, death.killedBy);
    resolved.push({ entity, ...death });
  }
  return resolved;
}
