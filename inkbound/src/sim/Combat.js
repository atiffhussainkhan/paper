export function resolveCombat(entities, config) {
  const living = entities.filter((entity) => entity.alive);
  const deaths = new Map();

  for (const entity of living) {
    const endSegment = entity.trail.points.length - config.selfGracePoints - 1;
    if (endSegment > 0
      && entity.trail.collidesPoint(entity.position, entity.radius, 0, endSegment)) {
      deaths.set(entity, {
        reason: entity.isPlayer
          ? "You crossed your own line."
          : `${entity.name} crossed its own line.`,
        killedBy: entity,
      });
    }
  }

  // Bodies are harmless to each other. Only a body touching an older portion
  // of another entity's wet stroke kills that stroke's owner.
  for (const owner of living) {
    if (!owner.trail.active || deaths.has(owner)) continue;
    const endSegment = owner.trail.points.length - config.enemyHeadGracePoints - 1;
    if (endSegment <= 0) continue;
    for (const attacker of living) {
      if (attacker === owner) continue;
      if (owner.trail.collidesPoint(attacker.position, attacker.radius, 0, endSegment)) {
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

  for (const [entity, death] of deaths) entity.markDead(death.reason, death.killedBy);
  return deaths.size;
}
