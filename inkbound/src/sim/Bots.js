function makeLoop(home, arena, config, random) {
  const base = Math.atan2(home.y, home.x) + (random() - 0.5) * 1.15;
  const direction = { x: Math.cos(base), y: Math.sin(base) };
  const sideSign = random() < 0.5 ? -1 : 1;
  const perpendicular = { x: -direction.y * sideSign, y: direction.x * sideSign };
  const outward = arena.clampPoint({
    x: home.x + direction.x * config.botLoopOutDistance,
    y: home.y + direction.y * config.botLoopOutDistance,
  }, config.bodyRadius * 2);
  const side = arena.clampPoint({
    x: outward.x + perpendicular.x * config.botLoopSideDistance,
    y: outward.y + perpendicular.y * config.botLoopSideDistance,
  }, config.bodyRadius * 2);
  return [outward, side, { ...home }];
}

export function attachBotBrain(entity, arena, config, random = Math.random) {
  const home = { ...entity.position };
  entity.brain = {
    home,
    waypoints: makeLoop(home, arena, config, random),
    waypoint: 0,
    age: 0,
    random,
  };
}

export function updateBotHeadings(bots, arena, config, dt) {
  for (const bot of bots) {
    if (!bot.alive || !bot.brain) continue;
    const brain = bot.brain;
    brain.age += dt;
    let target = brain.waypoints[brain.waypoint];
    const distance = Math.hypot(target.x - bot.position.x, target.y - bot.position.y);

    if (distance < config.botWaypointRadius || brain.age > 4) {
      brain.waypoint += 1;
      brain.age = 0;
      if (brain.waypoint >= brain.waypoints.length) {
        brain.waypoints = makeLoop(brain.home, arena, config, brain.random);
        brain.waypoint = 0;
      }
      target = brain.waypoints[brain.waypoint];
    }
    bot.desiredHeading = Math.atan2(
      target.y - bot.position.y,
      target.x - bot.position.x,
    );
  }
}
