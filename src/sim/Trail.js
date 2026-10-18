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

  // Number of leading segments that lie wholly older than `graceLength` of arc
  // behind `head`. Arc length, not sample count, defines grace: samples are
  // spaced at least `sampleSpacing` apart but the last one can lag the body,
  // and a forced closing sample can be arbitrarily close to its predecessor.
  // The lag is clamped to one spacing so a saturated trail (maxPoints reached,
  // head far ahead of the last sample) cannot make adjacent segments look old.
  olderSegmentCount(graceLength, head) {
    const count = this.points.length;
    if (count < 2) return 0;
    const tail = this.points[count - 1];
    let behind = Math.min(Math.hypot(head.x - tail.x, head.y - tail.y), this.sampleSpacing);
    for (let index = count - 2; index >= 0; index -= 1) {
      if (behind >= graceLength) return index + 1;
      const a = this.points[index];
      const b = this.points[index + 1];
      behind += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return 0;
  }

  collidesPoint(point, extraRadius = 0, startSegment = 0, endSegment = this.points.length - 1) {
    return this.collidesSegment(point, point, extraRadius, startSegment, endSegment);
  }

  // Swept test: true when the segment from -> to passes within half the stroke
  // width plus `extraRadius` of any segment in [startSegment, endSegment).
  // Sweeping the per-tick motion keeps contact order-independent of speed.
  collidesSegment(from, to, extraRadius = 0, startSegment = 0, endSegment = this.points.length - 1) {
    const radiusSq = (this.width * 0.5 + extraRadius) ** 2;
    const finalSegment = Math.min(endSegment, this.points.length - 1);
    for (let index = Math.max(0, startSegment); index < finalSegment; index += 1) {
      if (Trail.segmentDistanceSquared(from, to, this.points[index], this.points[index + 1]) <= radiusSq) {
        return true;
      }
    }
    return false;
  }

  static segmentDistanceSquared(p, q, a, b) {
    const pqX = q.x - p.x;
    const pqY = q.y - p.y;
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const d1 = pqX * (a.y - p.y) - pqY * (a.x - p.x);
    const d2 = pqX * (b.y - p.y) - pqY * (b.x - p.x);
    const d3 = abX * (p.y - a.y) - abY * (p.x - a.x);
    const d4 = abX * (q.y - a.y) - abY * (q.x - a.x);
    // Proper crossing; touching and collinear cases fall out of the endpoint distances.
    if (d1 * d2 < 0 && d3 * d4 < 0) return 0;
    return Math.min(
      Trail.distanceToSegmentSquared(p, a, b),
      Trail.distanceToSegmentSquared(q, a, b),
      Trail.distanceToSegmentSquared(a, p, q),
      Trail.distanceToSegmentSquared(b, p, q),
    );
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
