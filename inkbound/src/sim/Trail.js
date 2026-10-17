export class Trail {
  constructor(width, sampleSpacing, maxPoints = 5000) {
    this.width = width;
    this.sampleSpacing = sampleSpacing;
    this.maxPoints = maxPoints;
    this.points = [];
  }

  get active() {
    return this.points.length > 1;
  }

  clear() {
    this.points.length = 0;
  }

  begin(point) {
    this.points.length = 0;
    this.points.push({ x: point.x, y: point.y });
  }

  add(point, force = false) {
    if (!this.points.length) {
      this.begin(point);
      return;
    }
    const last = this.points[this.points.length - 1];
    const dx = point.x - last.x;
    const dy = point.y - last.y;
    const distance = Math.hypot(dx, dy);
    if (!force && distance < this.sampleSpacing) return;

    const samples = Math.max(1, Math.floor(distance / this.sampleSpacing));
    for (let step = 1; step <= samples && this.points.length < this.maxPoints; step += 1) {
      const t = step / samples;
      this.points.push({ x: last.x + dx * t, y: last.y + dy * t });
    }
    if (force && this.points.length < this.maxPoints) {
      const tail = this.points[this.points.length - 1];
      if (tail.x !== point.x || tail.y !== point.y) this.points.push({ x: point.x, y: point.y });
    }
  }

  collidesPoint(point, extraRadius = 0, startSegment = 0, endSegment = this.points.length - 1) {
    const radiusSq = (this.width * 0.5 + extraRadius) ** 2;
    const finalSegment = Math.min(endSegment, this.points.length - 1);
    for (let index = Math.max(0, startSegment); index < finalSegment; index += 1) {
      if (Trail.distanceToSegmentSquared(point, this.points[index], this.points[index + 1]) <= radiusSq) {
        return true;
      }
    }
    return false;
  }

  static distanceToSegmentSquared(point, a, b) {
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const lengthSq = abX * abX + abY * abY;
    if (lengthSq === 0) return (point.x - a.x) ** 2 + (point.y - a.y) ** 2;
    const t = Math.max(0, Math.min(1,
      ((point.x - a.x) * abX + (point.y - a.y) * abY) / lengthSq));
    const x = a.x + abX * t;
    const y = a.y + abY * t;
    return (point.x - x) ** 2 + (point.y - y) ** 2;
  }
}
