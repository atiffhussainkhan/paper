// Loads Inkbound's IMAGE_INDEX.json and preloads catalog bitmaps.
// All game art should resolve through this module — never AI-generate bitmaps.

const INDEX_URL = new URL("../../assets/IMAGE_INDEX.json", import.meta.url).href;

// Used when a match boots before the catalog finishes, and by headless smokes.
// Keep these identical to bindings.characters in IMAGE_INDEX.json.
export const BOT_BEAD_FALLBACK = Object.freeze({
  2: "char-bead-blue",
  3: "char-bead-blue-alt",
  4: "char-shape-squircle",
});

export const BOT_PATTERN_FALLBACK = Object.freeze({
  2: "skin-paint-circle",
  3: "skin-paint-splat",
  4: "skin-paint-drips",
});

// CSS custom properties fed by catalog ids. Paths are resolved to absolute
// URLs so they stay correct when style.css lives in css/.
export const CSS_IMAGE_VARS = Object.freeze({
  "--art-brand-seal": ["ui", "brandSeal"],
  "--art-restart": ["ui", "restart"],
  "--art-hud-jewel": ["ui", "hudJewel"],
  "--art-equipped": ["ui", "equippedCheck"],
  "--art-leader-medal": ["ui", "leaderMedal"],
  "--art-stage-medal": ["ui", "stageMedal"],
  "--art-icon-circle": ["ui", "iconCircle"],
  "--art-plane-grain": ["terrain", "planeGrain"],
  "--art-floor": ["terrain", "floor"],
});

export function catalogAssetUrl(assetPath) {
  if (!assetPath) return "none";
  if (typeof window !== "undefined" && window.location) {
    return `url("${new URL(assetPath, window.location.href).href}")`;
  }
  return `url("${assetPath}")`;
}

export function botBeadId(catalog, entityId) {
  const bound = catalog?.binding?.("characters", "botBeads", String(entityId));
  if (typeof bound === "string") return bound;
  return BOT_BEAD_FALLBACK[entityId]
    || catalog?.binding?.("characters", "botBead")
    || "char-bead-blue";
}

export function botPatternId(catalog, entityId) {
  const bound = catalog?.binding?.("characters", "botPatterns", String(entityId));
  if (typeof bound === "string") return bound;
  return BOT_PATTERN_FALLBACK[entityId] || null;
}

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

  boundImage(...path) {
    const id = this.binding(...path);
    return typeof id === "string" ? this.get(id) : null;
  }

  stageLayers(stageId) {
    return {
      background: this.binding("stages", stageId),
      terrain: this.binding("stageTerrain", stageId),
      accent: this.binding("stageAccent", stageId),
      grain: this.binding("stageGrain", stageId) || this.binding("terrain", "planeGrain"),
      fallbackBackground: this.binding("fallback", "background"),
      fallbackTerrain: this.binding("fallback", "terrain"),
    };
  }

  applyCssVars(root = typeof document !== "undefined" ? document.documentElement : null) {
    if (!root?.style) return;
    for (const [cssVar, path] of Object.entries(CSS_IMAGE_VARS)) {
      const id = this.binding(...path);
      const entry = typeof id === "string" ? this.getEntry(id) : null;
      if (entry) root.style.setProperty(cssVar, catalogAssetUrl(entry.path));
    }
    root.dataset.imageCatalog = "ready";
    root.dataset.imageCatalogCount = String(this.counts().total || 0);
  }

  // Every catalog id that a binding leaf points at, plus ids no binding names.
  coverage() {
    const referenced = new Set();
    const walk = (node) => {
      if (typeof node === "string") {
        referenced.add(node);
        return;
      }
      if (node && typeof node === "object") {
        for (const value of Object.values(node)) walk(value);
      }
    };
    walk(this.index?.bindings);
    const unbound = [];
    for (const id of this.byId.keys()) {
      if (!referenced.has(id)) unbound.push(id);
    }
    return { referenced: referenced.size, unbound };
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
