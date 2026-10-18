// Loop close. The wet stroke plus the shortest path back through the owner's
// own ink is the sealed polygon. Cells in its interior are claimed — including
// a circuit that wraps most of the plane. "Largest leftover region" is not the
// exterior: a rim run is supposed to take the inside of the stroke.
//
// If the two ends of the stroke are not connected through own ink, fall back
// to the smaller-pocket rule so a broken seal still claims an obvious loop.

function isLeft(a, b, x, y) {
  return (b.x - a.x) * (y - a.y) - (x - a.x) * (b.y - a.y);
}

function windingInside(x, y, poly) {
  let winding = 0;
  for (let index = 0, count = poly.length; index < count; index += 1) {
    const a = poly[index];
    const b = poly[(index + 1) % count];
    if (a.y <= y) {
      if (b.y > y && isLeft(a, b, x, y) > 0) winding += 1;
    } else if (b.y <= y && isLeft(a, b, x, y) < 0) winding -= 1;
  }
  return winding !== 0;
}

function nearestOwnedIndex(grid, ownerId, point, maxRadius) {
  const center = grid.worldToCell(point.x, point.y);
  if (!center) return -1;
  let best = -1;
  let bestDist = Infinity;
  for (let radius = 0; radius <= maxRadius; radius += 1) {
    const row0 = Math.max(0, center.row - radius);
    const row1 = Math.min(grid.size - 1, center.row + radius);
    const col0 = Math.max(0, center.col - radius);
    const col1 = Math.min(grid.size - 1, center.col + radius);
    for (let row = row0; row <= row1; row += 1) {
      for (let col = col0; col <= col1; col += 1) {
        if (radius > 0 && Math.max(Math.abs(row - center.row), Math.abs(col - center.col)) !== radius) {
          continue;
        }
        const index = grid.index(col, row);
        if (grid.cells[index] !== ownerId) continue;
        const cell = grid.cellCenter(col, row);
        const dist = (cell.x - point.x) ** 2 + (cell.y - point.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      }
    }
    if (best !== -1) return best;
  }
  return -1;
}

// Shortest cell-center path that stays on ownerId, fromIndex → toIndex.
function pathThroughInk(grid, ownerId, fromIndex, toIndex) {
  if (fromIndex < 0 || toIndex < 0) return null;
  const from = grid.coords(fromIndex);
  if (fromIndex === toIndex) return [grid.cellCenter(from.col, from.row)];

  const total = grid.cells.length;
  const parent = new Int32Array(total);
  parent.fill(-1);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  queue[tail++] = fromIndex;
  parent[fromIndex] = fromIndex;

  let found = false;
  while (head < tail) {
    const current = queue[head++];
    if (current === toIndex) {
      found = true;
      break;
    }
    const col = current % grid.size;
    const row = (current / grid.size) | 0;
    const neighbors = [
      col > 0 ? current - 1 : -1,
      col + 1 < grid.size ? current + 1 : -1,
      row > 0 ? current - grid.size : -1,
      row + 1 < grid.size ? current + grid.size : -1,
    ];
    for (const next of neighbors) {
      if (next >= 0 && parent[next] === -1 && grid.cells[next] === ownerId) {
        parent[next] = current;
        queue[tail++] = next;
      }
    }
  }
  if (!found) return null;

  const reversed = [];
  let cursor = toIndex;
  let steps = 0;
  while (steps <= total) {
    const col = cursor % grid.size;
    const row = (cursor / grid.size) | 0;
    reversed.push(grid.cellCenter(col, row));
    if (cursor === fromIndex) break;
    const next = parent[cursor];
    if (next < 0 || (next === cursor && cursor !== fromIndex)) return null;
    cursor = next;
    steps += 1;
  }
  reversed.reverse();
  return reversed;
}

function componentMajorityInside(grid, labels, componentId, componentSize, poly) {
  const samples = Math.min(17, componentSize);
  const stride = Math.max(1, Math.floor(componentSize / samples));
  let seen = 0;
  let inside = 0;
  let tested = 0;
  for (let index = 0; index < labels.length; index += 1) {
    if (labels[index] !== componentId) continue;
    if (seen % stride === 0) {
      const col = index % grid.size;
      const row = (index / grid.size) | 0;
      const center = grid.cellCenter(col, row);
      if (windingInside(center.x, center.y, poly)) inside += 1;
      tested += 1;
    }
    seen += 1;
  }
  return tested > 0 && inside * 2 > tested;
}

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

  const stampSegment = (a, b) => {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(distance / (grid.cellSize * 0.35)));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      markPoint({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  };

  for (let index = 0; index < trail.points.length - 1; index += 1) {
    stampSegment(trail.points[index], trail.points[index + 1]);
  }

  // Bridge each end onto dry ink so a bead that seals on contact still closes
  // the wall. Search far enough to cover the body plus one cell.
  const bridgeRadius = Math.max(8, Math.ceil((trail.width + grid.cellSize) / grid.cellSize) + 2);
  const leave = nearestOwnedIndex(grid, ownerId, trail.points[0], bridgeRadius);
  const back = nearestOwnedIndex(
    grid,
    ownerId,
    trail.points[trail.points.length - 1],
    bridgeRadius,
  );
  if (leave >= 0) {
    const { col, row } = grid.coords(leave);
    stampSegment(trail.points[0], grid.cellCenter(col, row));
  }
  if (back >= 0) {
    const { col, row } = grid.coords(back);
    stampSegment(trail.points[trail.points.length - 1], grid.cellCenter(col, row));
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
      const row = (current / grid.size) | 0;
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

  // Stroke runs leave → return. Close it return → leave through own ink so
  // the implicit last-to-first edge stays on the bead, not across the plane.
  const closure = pathThroughInk(grid, ownerId, back, leave);
  let outsideComponent = -1;
  const enclosed = new Uint8Array(componentSizes.length);
  if (closure && closure.length) {
    const poly = trail.points.concat(closure);
    for (let index = 0; index < componentSizes.length; index += 1) {
      enclosed[index] = componentMajorityInside(
        grid,
        labels,
        index,
        componentSizes[index],
        poly,
      ) ? 1 : 0;
    }
  } else {
    let outsideSize = -1;
    for (let index = 0; index < componentSizes.length; index += 1) {
      if (componentSizes[index] > outsideSize) {
        outsideSize = componentSizes[index];
        outsideComponent = index;
      }
    }
  }

  let changed = 0;
  for (let index = 0; index < total; index += 1) {
    const label = labels[index];
    const inPocket = closure
      ? label >= 0 && enclosed[label] === 1
      : label >= 0 && label !== outsideComponent;
    if ((inPocket || trailCells[index]) && grid.setOwnerAtIndex(index, ownerId)) changed += 1;
  }
  if (changed) grid.version += 1;
  return changed;
}
