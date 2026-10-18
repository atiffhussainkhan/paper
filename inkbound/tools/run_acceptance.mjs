// Single ship gate for the Inkbound web build.
// Runs every smoke and exits non-zero if any smoke fails.
// Usage (from anywhere): node inkbound/tools/run_acceptance.mjs
// Or from inkbound/: node tools/run_acceptance.mjs

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const SMOKES = [
  "tools/smoke_combat.mjs",
  "tools/smoke_loop.mjs",
  "tools/smoke_hud.mjs",
  "tools/smoke_vfx.mjs",
  "tools/smoke_meta.mjs",
  "tools/smoke_images.mjs",
];

const acceptanceDoc = join(root, "docs/FINAL_ACCEPTANCE.md");
if (!existsSync(acceptanceDoc)) {
  console.error("FAIL docs/FINAL_ACCEPTANCE.md is missing");
  process.exit(1);
}

let failed = 0;
const results = [];

for (const rel of SMOKES) {
  const script = join(root, rel);
  if (!existsSync(script)) {
    failed += 1;
    results.push({ rel, code: 127, ms: 0 });
    console.error(`FAIL ${rel} missing`);
    continue;
  }
  const started = Date.now();
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    stdio: "inherit",
  });
  const code = result.status === null ? 1 : result.status;
  const ms = Date.now() - started;
  results.push({ rel, code, ms });
  if (code === 0) {
    console.log(`PASS ${rel} (${ms}ms)`);
  } else {
    failed += 1;
    console.error(`FAIL ${rel} exit ${code} (${ms}ms)`);
  }
}

console.log("");
for (const row of results) {
  console.log(`${row.code === 0 ? "PASS" : "FAIL"}\t${row.rel}\texit ${row.code}\t${row.ms}ms`);
}

if (failed > 0) {
  console.error(`ACCEPTANCE: FAIL ${failed}/${SMOKES.length}`);
  process.exit(1);
}

console.log(`ACCEPTANCE: PASS ${SMOKES.length}/${SMOKES.length}`);
