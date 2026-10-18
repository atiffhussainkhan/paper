export class Arena {
  constructor(radius) {
    this.radius = radius;
  }

  contains(x, y, inset = 0) {
    const r = this.radius - inset;
    return x * x + y * y <= r * r;
  }

  clampPoint(point, inset = 0) {
    const limit = this.radius - inset;
    const length = Math.hypot(point.x, point.y);
    if (length <= limit || length === 0) return { x: point.x, y: point.y };
    const scale = limit / length;
    return { x: point.x * scale, y: point.y * scale };
  }

  // Remove outward velocity at the rim. A direct impact receives a stable
  // tangent so an always-moving entity cannot become pinned against the wall.
  slide(position, velocity, dt, inset, rimSign = 1) {
    const next = {
      x: position.x + velocity.x * dt,
      y: position.y + velocity.y * dt,
    };
    const limit = this.radius - inset;
    if (next.x * next.x + next.y * next.y <= limit * limit) {
      return { position: next, velocity, hitRim: false, rimSign };
    }

    const sourceLength = Math.hypot(position.x, position.y);
    const normal = sourceLength > 0
      ? { x: position.x / sourceLength, y: position.y / sourceLength }
      : { x: next.x / Math.hypot(next.x, next.y), y: next.y / Math.hypot(next.x, next.y) };
    const tangent = { x: -normal.y, y: normal.x };
    const speed = Math.hypot(velocity.x, velocity.y);
    let tangentSpeed = velocity.x * tangent.x + velocity.y * tangent.y;
    if (Math.abs(tangentSpeed) < speed * 0.18) tangentSpeed = speed * rimSign;
    rimSign = Math.sign(tangentSpeed) || rimSign;

    const edge = {
      x: normal.x * Math.min(sourceLength, limit),
      y: normal.y * Math.min(sourceLength, limit),
    };
    const slid = this.clampPoint({
      x: edge.x + tangent.x * tangentSpeed * dt,
      y: edge.y + tangent.y * tangentSpeed * dt,
    }, inset);

    return {
      position: slid,
      velocity: { x: tangent.x * tangentSpeed, y: tangent.y * tangentSpeed },
      hitRim: true,
      rimSign,
    };
  }

  randomPoint(random = Math.random, inset = 0) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * (this.radius - inset);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }
}
