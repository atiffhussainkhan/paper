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

export function resolveCombat(entities, config) {
  const living = entities.filter((entity) => entity.alive);
  const deaths = new Map();
  const selfGrace = graceLength(config.selfGracePoints, config);
  const enemyGrace = graceLength(config.enemyHeadGracePoints, config);

  for (const entity of living) {
    const trail = entity.trail;
    const endSegment = trail.olderSegmentCount(selfGrace, entity.position);
    if (endSegment > 0
      && trail.collidesSegment(
        entity.previousPosition,
        entity.position,
        entity.radius,
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
