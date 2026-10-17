function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function turnToward(current, target, maxTurn) {
  const difference = wrapAngle(target - current);
  return wrapAngle(current + Math.max(-maxTurn, Math.min(maxTurn, difference)));
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
