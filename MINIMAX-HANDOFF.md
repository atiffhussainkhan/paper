# MINIMAX-HANDOFF — Santa's Visit

**Status:** `awaiting-minimax`  
**Project:** https://github.com/atiffhussainkhan/santas-visit  
**Single copy:** this workspace IS the Santa project (plus bridge under `scripts/`)

## Task (done by Cursor — integrate locally)

Cursor fixed seating + rendering. Minimax should:

1. Replace your local `~/Documents/Mini AI/santas-visit/` with **this one copy** (do not keep a parallel tree).
2. Delete any leftover `santa-photo.js` if still present locally.
3. Run `bash tools/run_all.sh` — expect `SUITE: PASS`.
4. Open `index.html` (or `python3 -m http.server`), click **Use a sample room**, then **Play the visit**.
5. Confirm: Santa sits on the **sofa**, treats stay on the **table**, he never sits on the table.
6. Report status `integrated` / `done` once verified.

## Active work item

- [x] Fix `anchers` typo (blocked Santa render)
- [x] Keep seated poses on sofa; table is treats only
- [x] Better light match + friendlier Santa draw
- [x] One character module (`santa.js` only)

## Out of scope

- Hosting / DPIA review / iPhone MediaRecorder (still in RESUME.md)
- Inventing a second Santa renderer

## Files changed

- `engine.js`, `santa.js`, `index.html`, `README.md`, `RESUME.md`, `assets/santa/README.md`
- Removed: `santa-photo.js` (folded into `santa.js`)
