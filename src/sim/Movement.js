function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function turnToward(current, target, maxTurn) {
  const difference = wrapAngle(target - current);
  return wrapAngle(current + Math.max(-maxTurn, Math.min(maxTurn, difference)));
}

// Wet stroke vs dry ink.
// - The center has to leave before a stroke starts, and the stroke is anchored
//   on the ink boundary so the loop can seal.
// - A poke that never clears the body is erased. Grazing your own edge does
//   not open a vulnerable line.
// - Once the body has fully left, touching dry ink again seals the loop. The
//   first claim uses a slightly larger contact radius from the caller.
//   `noseDistance` probes ahead along the heading so the first return seals
//   when the bead is aimed at ink, before the center clips the outbound stem.
export function updateInkContact(entity, grid, contactRadius, noseDistance = 0) {
  if (!entity.alive) return;
  entity.capturePending = false;

  const centerHome = grid.isOwnedBy(entity.id, entity.position.x, entity.position.y);
  const bodyHome = centerHome || grid.bodyTouchesOwner(
    entity.id,
    entity.position.x,
    entity.position.y,
    contactRadius,
  );
  const nose = noseDistance > 0
    ? {
      x: entity.position.x + Math.cos(entity.heading) * noseDistance,
      y: entity.position.y + Math.sin(entity.heading) * noseDistance,
    }
    : null;
  const noseHome = Boolean(nose) && grid.bodyTouchesOwner(
    entity.id,
    nose.x,
    nose.y,
    Math.max(contactRadius * 0.45, 0),
  );

  const seal = (anchorFrom) => {
    const anchor = grid.inkBoundaryPoint(
      entity.id,
      anchorFrom,
      entity.position,
      contactRadius,
    );
    entity.trail.add(anchor, true);
    entity.capturePending = true;
    entity.outsideOwnTerritory = false;
    entity.clearedHome = false;
  };

  if (!entity.outsideOwnTerritory) {
    if (!centerHome) {
      const anchor = grid.inkBoundaryPoint(
        entity.id,
        entity.previousPosition,
        entity.position,
        0,
      );
      entity.trail.begin(anchor);
      entity.trail.add(entity.position);
      entity.outsideOwnTerritory = true;
      entity.clearedHome = false;
    }
    return;
  }

  if (!bodyHome) {
    const justCleared = !entity.clearedHome;
    entity.clearedHome = true;
    // The tick that finishes leaving home must not seal on the nose. A return
    // on a later tick, aimed back at the ink, seals before the stem is clipped.
    if (!justCleared && noseHome && entity.trail.active) {
      seal(nose);
      return;
    }
    entity.trail.add(entity.position);
    return;
  }

  if (entity.clearedHome && entity.trail.active) {
    const anchor = grid.inkBoundaryPoint(
      entity.id,
      entity.position,
      entity.previousPosition,
      contactRadius,
    );
    entity.trail.add(anchor, true);
    entity.capturePending = true;
    entity.outsideOwnTerritory = false;
    entity.clearedHome = false;
    return;
  }

  if (centerHome) {
    entity.trail.clear();
    entity.outsideOwnTerritory = false;
    entity.clearedHome = false;
    return;
  }

  // Body still overlaps the exit ink. Keep the stroke, but do not seal yet.
  entity.trail.add(entity.position);
}

export function moveEntity(entity, arena, dt, steerRate) {
  if (!entity.alive) return;
  entity.previousPosition.x = entity.position.x;
  entity.previousPosition.y = entity.position.y;
  entity.heading = turnToward(entity.heading, entity.desiredHeading, steerRate * dt);

  const velocity = {
    x: Math.cos(entity.heading) * entity.speed,
    y: Math.sin(entity.heading) * entity.speed,
  };
  const result = arena.slide(
    entity.position,
    velocity,
    dt,
    entity.radius,
    entity.rimSign,
  );
  entity.position = result.position;
  entity.rimSign = result.rimSign;
  if (result.hitRim && Math.hypot(result.velocity.x, result.velocity.y) > 0.01) {
    entity.heading = Math.atan2(result.velocity.y, result.velocity.x);
  }
}
