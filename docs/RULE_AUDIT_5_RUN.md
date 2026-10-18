# Inkbound — RULE5 runnable link and start-to-end session

**Role:** RULE5 Runnable Link + Start-to-End Session Prover  
**Date:** 2026-10-18  
**Branch:** `cursor/inkbound-final-dev-c3dd`  
**Game bytes played:** `21cf6b0867c1`  
**Tree while playing:** `18f1bb13ff94` (that commit and `b8faf77` change only `MINIMAX-HANDOFF.md` and `docs/RULE_AUDIT_4_GAPS.md`; `src/`, `css/`, `index.html`, and `assets/` match `21cf6b0`)  
**Browser:** Chrome 154.0.8037.92, headless, fresh profile (`localStorage` empty; `inkbound.profile.v1` was null on the first frame)  
**Viewport:** 1280×800  

## Verdict

**PASS.** One complete life ran from a cold page load through a claim, a death, and Restart. The page that was played returns HTTP 200 from a static server rooted at `/workspace/inkbound`.

The runnable URL is local:

**`http://127.0.0.1:8765/`**

There is no public host in this proof. [DEPLOY.md](DEPLOY.md) still describes how to publish the `inkbound/` folder. This session did not open a sealed-plane win. The life ended in death, which is a complete session (`winShare` is 1).

## Server

Restarted `python3 -m http.server 8765 --bind 127.0.0.1` with cwd `/workspace/inkbound` (tmux session `inkbound-rule5`).

| Request | Status | Type |
|---------|--------|------|
| `GET /` | **200** | `text/html` (3746 bytes, `index.html`) |
| `GET /src/main.js` | **200** | `text/javascript` |
| `GET /assets/IMAGE_INDEX.json` | **200** | catalog index |

`file://` was not used. The document title on the loaded page is Inkbound. Catalog state was `ready`, count 58. No console error and no response ≥ 400 from `http://127.0.0.1:8765/` during the session.

## One session

Keyboard only (WASD). No play button. Fresh profile.

| Step | What was on screen | HUD |
|------|--------------------|-----|
| Cold start, before any key | Princess on the red start disk, grid map, arena ring, yellow bot ink at the right edge, character strip | **1.0%**, Best **0.0%**, Stage 1 · Quiet Plane **0%**. Rows: You, Tide, Ochre, Moss, each **1.0%** and alive. Hint: "Point to steer. Close the loop to claim." Overlay hidden. |
| Claim | Closed loop fills a larger red block. Capture float drawn on the new ink. | **1.0% → 3.8%**. Hint faded. `ftueClaimDone` stored. Best still 0.0% (best is written when the run ends). Moss 1.7%, Ochre 1.3%, Tide 1.0%. |
| End | Death card | Title **"You crossed your own line."** Stats **"4.0% of the plane."** "New best. Tideglass unlocked." Stage line **"+4.0% toward Quiet Plane (8%)."** You row **0.0%** dead. Best **4.0%**. Restart button on the card. |
| Restart | Fresh red disk, princess centered, no leftover stroke, overlay gone | **1.0%**. Best **4.0%** kept. Stage 1 · Quiet Plane **8%** kept. You, Tide, Ochre, Moss all alive at **1.0%**. Hint stays faded. |

Shots (this session only):

- `/opt/cursor/artifacts/rule5_start.png`
- `/opt/cursor/artifacts/rule5_claim.png`
- `/opt/cursor/artifacts/rule5_end.png`
- `/opt/cursor/artifacts/rule5_restart.png`

Notes: `/opt/cursor/artifacts/rule5_notes.txt`

## What the cold frame does and does not show

The opening camera stays on the player. Tide, Ochre, and Moss are in the match at 1.0% and named on the board before the first key. One bot's yellow ink is already inside the frame. Their spawn radius is 920 world units, so the other start disks sit outside this 1280×800 view. The board is the proof those three are alive at 1.0%, not three sprites standing next to the player.

Steering was live on that first frame. The same life then left the disk, sealed, died, and restarted without a reload.

## Profile after Restart

`inkbound.profile.v1`:

- `bestPct` 4
- `equippedSkinId` `seal`
- `unlockedSkinIds` `seal`, `tideglass`
- `stageIndex` 0
- `stageCredit` about 0.0404
- `ftueClaimDone` true

Nightquarry (10%) and Bone (20%) stayed locked on the death card. Emberline (5%) stayed locked. That matches a 4.0% best.
