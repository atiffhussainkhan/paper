// Treat owned cells plus the open stroke as a wall, then preserve the largest
// remaining region. Every smaller component is enclosed by that wall.
export function captureLoop(grid, ownerId, trail) {
  if (!trail.active) return 0;

  const total = grid.cells.length;
  const barrier = new Uint8Array(total);
  const trailCells = new Uint8Array(total);
  for (let index = 0; index < total; index += 1) {
    if (grid.cells[index] === ownerId) barrier[index] = 1;
  }

  const cellRadius = Math.max(1, Math.ceil((trail.width * 0.5) / grid.cellSize));
  const markPoint = (point) => {
    const center = grid.worldToCell(point.x, point.y);
    if (!center) return;
    for (let row = center.row - cellRadius; row <= center.row + cellRadius; row += 1) {
      for (let col = center.col - cellRadius; col <= center.col + cellRadius; col += 1) {
        if (col < 0 || row < 0 || col >= grid.size || row >= grid.size) continue;
        const index = grid.index(col, row);
        if (grid.cells[index] < 0) continue;
        barrier[index] = 1;
        trailCells[index] = 1;
      }
    }
  };

  for (let index = 0; index < trail.points.length - 1; index += 1) {
    const a = trail.points[index];
    const b = trail.points[index + 1];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(distance / (grid.cellSize * 0.35)));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      markPoint({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }

  const labels = new Int16Array(total);
  labels.fill(-1);
  const queue = new Int32Array(total);
  const componentSizes = [];
  let component = 0;

  for (let start = 0; start < total; start += 1) {
    if (grid.cells[start] < 0 || barrier[start] || labels[start] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = component;
    let size = 0;

    while (head < tail) {
      const current = queue[head++];
      size += 1;
      const col = current % grid.size;
      const row = Math.floor(current / grid.size);
      const neighbors = [
        col > 0 ? current - 1 : -1,
        col + 1 < grid.size ? current + 1 : -1,
        row > 0 ? current - grid.size : -1,
        row + 1 < grid.size ? current + grid.size : -1,
      ];
      for (const next of neighbors) {
        if (next >= 0 && grid.cells[next] >= 0 && !barrier[next] && labels[next] === -1) {
          labels[next] = component;
          queue[tail++] = next;
        }
      }
    }
    componentSizes.push(size);
    component += 1;
  }

  let outsideComponent = -1;
  let outsideSize = -1;
  for (let index = 0; index < componentSizes.length; index += 1) {
    if (componentSizes[index] > outsideSize) {
      outsideSize = componentSizes[index];
      outsideComponent = index;
    }
  }

  let changed = 0;
  for (let index = 0; index < total; index += 1) {
    const enclosed = labels[index] >= 0 && labels[index] !== outsideComponent;
    if ((enclosed || trailCells[index]) && grid.setOwnerAtIndex(index, ownerId)) changed += 1;
  }
  if (changed) grid.version += 1;
  return changed;
}
