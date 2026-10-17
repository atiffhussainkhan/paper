export class TerritoryGrid {
  constructor(arenaRadius, size, maxOwners = 4) {
    this.radius = arenaRadius;
    this.size = size;
    this.cellSize = (arenaRadius * 2) / size;
    this.cells = new Int16Array(size * size);
    this.counts = new Int32Array(maxOwners + 1);
    this.insideCount = 0;
    this.version = 1;

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const { x, y } = this.cellCenter(col, row);
        const index = this.index(col, row);
        if (x * x + y * y <= arenaRadius * arenaRadius) {
          this.cells[index] = 0;
          this.insideCount += 1;
          this.counts[0] += 1;
        } else {
          this.cells[index] = -1;
        }
      }
    }
  }

  index(col, row) {
    return row * this.size + col;
  }

  coords(index) {
    return { col: index % this.size, row: Math.floor(index / this.size) };
  }

  cellCenter(col, row) {
    return {
      x: -this.radius + (col + 0.5) * this.cellSize,
      y: -this.radius + (row + 0.5) * this.cellSize,
    };
  }

  worldToCell(x, y) {
    const col = Math.floor((x + this.radius) / this.cellSize);
    const row = Math.floor((y + this.radius) / this.cellSize);
    if (col < 0 || row < 0 || col >= this.size || row >= this.size) return null;
    return { col, row, index: this.index(col, row) };
  }

  ownerAt(x, y) {
    const cell = this.worldToCell(x, y);
    return cell ? this.cells[cell.index] : -1;
  }

  isOwnedBy(ownerId, x, y) {
    return this.ownerAt(x, y) === ownerId;
  }

  setOwnerAtIndex(index, ownerId) {
    const previous = this.cells[index];
    if (previous < 0 || previous === ownerId) return false;
    this.counts[previous] -= 1;
    this.counts[ownerId] += 1;
    this.cells[index] = ownerId;
    return true;
  }

  setDisk(ownerId, x, y, radius) {
    const min = this.worldToCell(x - radius, y - radius) ?? { col: 0, row: 0 };
    const max = this.worldToCell(x + radius, y + radius) ?? {
      col: this.size - 1,
      row: this.size - 1,
    };
    let changed = 0;
    const radiusSq = radius * radius;
    for (let row = Math.max(0, min.row); row <= Math.min(this.size - 1, max.row); row += 1) {
      for (let col = Math.max(0, min.col); col <= Math.min(this.size - 1, max.col); col += 1) {
        const center = this.cellCenter(col, row);
        if ((center.x - x) ** 2 + (center.y - y) ** 2 <= radiusSq
          && this.setOwnerAtIndex(this.index(col, row), ownerId)) {
          changed += 1;
        }
      }
    }
    if (changed) this.version += 1;
    return changed;
  }

  isDiskUnowned(x, y, radius) {
    const cellRadius = Math.ceil(radius / this.cellSize);
    const center = this.worldToCell(x, y);
    if (!center) return false;
    for (let row = center.row - cellRadius; row <= center.row + cellRadius; row += 1) {
      for (let col = center.col - cellRadius; col <= center.col + cellRadius; col += 1) {
        if (col < 0 || row < 0 || col >= this.size || row >= this.size) return false;
        const point = this.cellCenter(col, row);
        if ((point.x - x) ** 2 + (point.y - y) ** 2 <= radius * radius
          && this.cells[this.index(col, row)] !== 0) {
          return false;
        }
      }
    }
    return true;
  }

  clearOwner(ownerId) {
    let changed = 0;
    for (let index = 0; index < this.cells.length; index += 1) {
      if (this.cells[index] === ownerId) {
        this.cells[index] = 0;
        changed += 1;
      }
    }
    if (changed) {
      this.counts[ownerId] = 0;
      this.counts[0] += changed;
      this.version += 1;
    }
    return changed;
  }

  share(ownerId) {
    return this.insideCount ? this.counts[ownerId] / this.insideCount : 0;
  }

  forEachInside(callback) {
    for (let index = 0; index < this.cells.length; index += 1) {
      if (this.cells[index] >= 0) callback(this.cells[index], index);
    }
  }
}
