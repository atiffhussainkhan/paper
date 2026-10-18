import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKINS } from "../src/meta/Skins.js";
import { STAGES } from "../src/meta/Stages.js";
import { BOT_BEAD_FALLBACK, BOT_PATTERN_FALLBACK, CSS_IMAGE_VARS } from "../src/assets/ImageCatalog.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(root, "assets/IMAGE_INDEX.json");
assert.ok(existsSync(indexPath), "IMAGE_INDEX.json must exist");

const index = JSON.parse(readFileSync(indexPath, "utf8"));
assert.equal(index.schema_version, "1.0");
assert.ok(index.total >= 40, `expected curated catalog, got ${index.total}`);
assert.equal(index.source_of_truth?.repository, "https://github.com/atiffhussainkhan/Image");
assert.ok(existsSync(join(root, "assets/upstream/MASTER_ASSET_INDEX.json")), "upstream master index mirrored");

const byId = new Map(index.images.map((img) => [img.id, img]));
assert.equal(byId.size, index.images.length, "image ids unique");

const hashToSource = new Map();
for (const img of index.images) {
  assert.ok(img.id && img.path && img.category, `entry incomplete: ${img.id}`);
  const filePath = join(root, img.path);
  assert.ok(existsSync(filePath), `missing file for ${img.id}: ${img.path}`);
  assert.ok(img.upstream?.pack_id, `missing upstream provenance for ${img.id}`);
  assert.notEqual(img.upstream?.license, undefined);
  const digest = createHash("sha256").update(readFileSync(filePath)).digest("hex").slice(0, 16);
  assert.equal(digest, img.sha256_16, `${img.id} sha256_16 does not match file bytes`);
  const source = img.upstream?.source_path;
  assert.ok(source, `missing upstream source_path for ${img.id}`);
  const prior = hashToSource.get(digest);
  if (prior) {
    assert.equal(prior, source, `${img.id} reuses bytes from a different source (${prior} vs ${source})`);
  } else {
    hashToSource.set(digest, source);
  }
}

const counts = index.counts;
for (const cat of ["background", "character", "skin", "ui", "vfx", "terrain"]) {
  assert.ok((counts[cat] || 0) >= 4, `${cat} needs at least 4 indexed images`);
}

for (const stage of STAGES) {
  assert.ok(byId.has(stage.backgroundImageId), `stage ${stage.id} background missing from index`);
  assert.ok(byId.has(stage.terrainImageId), `stage ${stage.id} terrain missing from index`);
}

for (const skin of SKINS) {
  assert.ok(byId.has(skin.patternImageId), `skin ${skin.id} pattern missing`);
  assert.ok(byId.has(skin.beadImageId), `skin ${skin.id} bead missing`);
  assert.ok(byId.has(skin.pickerImageId), `skin ${skin.id} picker missing`);
}

function bindingLeaves(node, path, out) {
  if (typeof node === "string") {
    out.push([path.join("."), node]);
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      bindingLeaves(value, path.concat(key), out);
    }
  }
}

const leaves = [];
bindingLeaves(index.bindings, [], leaves);
const referenced = new Set();
for (const [path, id] of leaves) {
  assert.equal(typeof id, "string", `binding ${path} must be a catalog id`);
  assert.ok(byId.has(id), `binding ${path} -> ${id} missing`);
  referenced.add(id);
}
for (const img of index.images) {
  assert.ok(referenced.has(img.id), `unbound catalog image ${img.id}`);
}

for (const stage of STAGES) {
  assert.equal(index.bindings.stages[stage.id], stage.backgroundImageId, stage.id);
  assert.equal(index.bindings.stageTerrain[stage.id], stage.terrainImageId, `${stage.id} terrain`);
  assert.ok(byId.has(index.bindings.stageAccent[stage.id]), `${stage.id} accent`);
  assert.ok(byId.has(index.bindings.stageGrain[stage.id]), `${stage.id} grain`);
}

for (const skin of SKINS) {
  const bound = index.bindings.skins[skin.id];
  assert.ok(bound, `skin binding missing for ${skin.id}`);
  assert.equal(bound.pattern, skin.patternImageId);
  assert.equal(bound.bead, skin.beadImageId);
  assert.equal(bound.picker, skin.pickerImageId);
}

for (const role of ["brandSeal", "restart", "leaderMedal", "stageMedal", "hudJewel", "equippedCheck", "iconCircle"]) {
  assert.ok(byId.has(index.bindings.ui[role]), `ui.${role}`);
}
for (const role of ["dissolve", "fade", "burstRing", "claimSpark", "floatSpark", "deathBurst", "cutSlash"]) {
  assert.ok(byId.has(index.bindings.vfx[role]), `vfx.${role}`);
}
assert.equal(index.bindings.fallback.background, "bg-plane-fallback");
assert.ok(byId.has(index.bindings.characters.defaultBead));
assert.ok(byId.has(index.bindings.characters.botBead));
assert.ok(byId.has(index.bindings.characters.shapeAccent));
for (const id of ["2", "3", "4"]) {
  assert.equal(index.bindings.characters.botBeads[id], BOT_BEAD_FALLBACK[id]);
  assert.equal(index.bindings.characters.botPatterns[id], BOT_PATTERN_FALLBACK[id]);
  assert.ok(byId.has(index.bindings.characters.botBeads[id]));
  assert.ok(byId.has(index.bindings.characters.botPatterns[id]));
}

const css = readFileSync(join(root, "css/style.css"), "utf8");
for (const cssVar of Object.keys(CSS_IMAGE_VARS)) {
  assert.ok(css.includes(cssVar), `style.css missing ${cssVar}`);
}
assert.equal(css.includes("feTurbulence"), false, "page grain must be a catalog image");
assert.equal(css.includes("data:image/svg"), false, "page must not invent svg bitmaps");

const rendererSrc = readFileSync(join(root, "src/render/Renderer.js"), "utf8");
assert.ok(rendererSrc.includes("stageLayers"), "renderer resolves stage layers from the catalog");
assert.equal(rendererSrc.includes("bg-plane-fallback"), false, "fallback background id must come from bindings");

// No Paper.io naming in catalog
const blob = JSON.stringify(index).toLowerCase();
assert.equal(blob.includes("paper.io"), false);
assert.equal(blob.includes("paperio"), false);

console.log("smoke_images: ok", index.total, "images", counts);
