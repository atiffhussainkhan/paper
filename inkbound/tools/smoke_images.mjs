import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKINS } from "../src/meta/Skins.js";
import { STAGES } from "../src/meta/Stages.js";

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

for (const img of index.images) {
  assert.ok(img.id && img.path && img.category, `entry incomplete: ${img.id}`);
  assert.ok(existsSync(join(root, img.path)), `missing file for ${img.id}: ${img.path}`);
  assert.ok(img.upstream?.pack_id, `missing upstream provenance for ${img.id}`);
  assert.notEqual(img.upstream?.license, undefined);
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

for (const [role, id] of Object.entries(index.bindings.ui)) {
  assert.ok(byId.has(id), `ui binding ${role} -> ${id} missing`);
}
for (const [role, id] of Object.entries(index.bindings.vfx)) {
  assert.ok(byId.has(id), `vfx binding ${role} -> ${id} missing`);
}

// No Paper.io naming in catalog
const blob = JSON.stringify(index).toLowerCase();
assert.equal(blob.includes("paper.io"), false);
assert.equal(blob.includes("paperio"), false);

console.log("smoke_images: ok", index.total, "images", counts);
