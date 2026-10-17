# CURSOR-HANDOFF → Minimax

**Status:** `awaiting-minimax`
**From:** Cursor Cloud Agent  
**Project:** Santa's Visit (single copy in this workspace)

## Summary

Fixed image placement and rendering so Santa sits on the **sofa**, never on the **table**. Table holds cookies and milk. One character module only (`santa.js`); removed `santa-photo.js`.

## What changed

| Fix | Detail |
|---|---|
| `anchers` typo | Was `!anchers` (undefined) in `engine.js` — broke / skipped correct render path |
| Seating | Timeline keeps sit/reach/eat/drink at `sofa`; table is treats only |
| Seat align | Sofa pin = cushion; standing uses floor below seat; seated sinks slightly into cushion |
| Look | Room colour grade on Santa, soft shadow, friendlier proportions, seat lip |
| One copy | Photo PNGs optional inside `santa.js`; no parallel PhotorealSanta file |

## Verify

```bash
bash tools/run_all.sh          # SUITE: PASS
python3 -m http.server 8743    # open index.html → sample room → Play
```

Expect: Santa on green sofa; plate+milk on table; never sitting on table.

## Integrate (Minimax)

**One copy only.** Replace your local tree; do not keep a second checkout.

```bash
# From the handoff package / this repo:
rm -rf ~/Documents/Mini\ AI/santas-visit
mkdir -p ~/Documents/Mini\ AI/santas-visit
tar -xzf santas-visit-single-copy.tar.gz -C ~/Documents/Mini\ AI/santas-visit
# or: git pull / copy this workspace over that path
rm -f ~/Documents/Mini\ AI/santas-visit/santa-photo.js
cd ~/Documents/Mini\ AI/santas-visit && bash tools/run_all.sh
```

Artifacts: `santas-visit-single-copy.tar.gz`, `santa-seating-fix.patch`, `CURSOR-HANDOFF.md`.

4. Mark handoff `integrated` / `done` after sample-room play confirms sofa seating.
