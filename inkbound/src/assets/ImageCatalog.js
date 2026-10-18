// Loads Inkbound's IMAGE_INDEX.json and preloads catalog bitmaps.
// All game art should resolve through this module — never AI-generate bitmaps.

const INDEX_URL = new URL("../../assets/IMAGE_INDEX.json", import.meta.url).href;

export class ImageCatalog {
  constructor() {
    this.index = null;
    this.byId = new Map();
    this.byCategory = new Map();
    this.images = new Map();
    this.ready = false;
    this.failed = new Set();
  }

  async load() {
    const response = await fetch(INDEX_URL);
    if (!response.ok) {
      throw new Error(`IMAGE_INDEX fetch failed: ${response.status}`);
    }
    this.index = await response.json();
    this.byId.clear();
    this.byCategory.clear();
    for (const entry of this.index.images || []) {
      this.byId.set(entry.id, entry);
      const list = this.byCategory.get(entry.category) || [];
      list.push(entry);
      this.byCategory.set(entry.category, list);
    }
    await this.preloadAll();
    this.ready = true;
    return this;
  }

  async preloadAll() {
    const loads = [];
    for (const entry of this.byId.values()) {
      loads.push(this.loadImage(entry.id));
    }
    await Promise.all(loads);
  }

  loadImage(id) {
    if (this.images.has(id)) return Promise.resolve(this.images.get(id));
    if (this.failed.has(id)) return Promise.resolve(null);
    const entry = this.byId.get(id);
    if (!entry) {
      this.failed.add(id);
      return Promise.resolve(null);
    }
    const url = new URL(`../../${entry.path}`, import.meta.url).href;
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        this.images.set(id, img);
        resolve(img);
      };
      img.onerror = () => {
        this.failed.add(id);
        resolve(null);
      };
      img.src = url;
    });
  }

  getEntry(id) {
    return this.byId.get(id) || null;
  }

  get(id) {
    return this.images.get(id) || null;
  }

  has(id) {
    return this.images.has(id);
  }

  category(name) {
    return this.byCategory.get(name) || [];
  }

  binding(...path) {
    let node = this.index?.bindings;
    for (const key of path) {
      if (node == null) return null;
      node = node[key];
    }
    return typeof node === "string" ? node : node ?? null;
  }

  getBound(id) {
    return this.get(id);
  }

  counts() {
    return { ...(this.index?.counts || {}), total: this.index?.total || 0 };
  }
}

let singleton = null;

export async function loadImageCatalog() {
  if (!singleton) {
    singleton = new ImageCatalog();
    await singleton.load();
  }
  return singleton;
}

export function getImageCatalog() {
  return singleton;
}
