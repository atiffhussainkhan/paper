# MINIMAX-HANDOFF — Santa project

**Status:** `awaiting-minimax`  
**Project:** Santa (local Minimax workspace — set `SANTA_PROJECT_ROOT` or pass `--project`)  
**Owner:** Human + Minimax implementer + Cursor reviewer  

## Task (concrete — do not invent beyond this)

1. **Install this bridge into the Santa project** (if not already present):
   - Run from this repo: `./scripts/install-into-project.sh "$SANTA_PROJECT_ROOT"`
   - Or copy `AGENTS.md`, this file, and `scripts/` into the Santa root.
2. **Unblock the Cursor CLI myth:**
   - Do **not** call `cursor --help` looking for an agent subcommand.
   - Use `./scripts/open-in-cursor.sh` / `./scripts/bridge.sh` only.
3. **Open Santa in Cursor** so review surfaces exist:
   ```bash
   export SANTA_PROJECT_ROOT="/absolute/path/to/your/santa-project"
   ./scripts/bridge.sh open --project "$SANTA_PROJECT_ROOT"
   ```
4. **If Santa already has known unfinished work** (e.g. items in `docs/RESUME.md`, `docs/DEVELOPMENT-PLAN.md`, or a prior “anchers” / render bug):
   - Pick the **first unfinished, named bug or feature** from those docs.
   - Put that single item into the **Active work item** section below before coding.
   - Implement only that item, then queue Cursor review.
5. **If no unfinished item is documented**, stop after installing the bridge and opening Cursor. Ask the human to fill **Active work item**. Do not invent a feature.

## Active work item

> Fill one bullet before Minimax writes game code. Example:  
> `Fix anchers typo / missing asset path that breaks [scene name].`

- [ ] _(human: write the one Santa change here)_

## Out of scope

- Fake Cursor agent invocations
- Crossroad-hopper work unless the human renames this handoff
- Broad refactors, new engines, or “while I’m here” polish

## Done when

- [ ] `AGENTS.md` and this handoff exist in the Santa project root
- [ ] `./scripts/bridge.sh doctor` reports Cursor open capability OK (or clear macOS path)
- [ ] Santa folder (or `CURSOR-HANDOFF.md`) opens in Cursor Desktop via the bridge
- [ ] If an Active work item was filled: code change + gates + visual check + `CURSOR-HANDOFF.md` queued with status `awaiting-cursor`

## Notes for Minimax

Your previous refusal was correct about `cursor-agent` missing. That is already accounted for here. Proceed with install → open → (optional) single Active work item → handoff. Do not re-litigate the missing agent binary.
