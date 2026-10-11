# Agent rules — Minimax ↔ Cursor (Santa / local projects)

This repo defines the **honest** collaboration path. Read this before writing code.

## Hard truths (do not invent workarounds)

1. **Cursor Desktop CLI is not an agent runner.** On Cursor 3.x the `cursor` binary opens files/folders and supports `--diff` / `--merge` / `--goto` / `--add`. It has **no** `agent` subcommand and cannot take a prompt and return a review.
2. **Do not simulate a Cursor review.** Do not pass off a second Minimax pass as a Cursor review.
3. **Do not invent product features** in a working game (Santa, crossroad-hopper, etc.) unless `MINIMAX-HANDOFF.md` names a concrete task.

## Roles

| Role | Does | Does not |
|------|------|----------|
| **Minimax** | Inspect relevant files, implement the named task, run project gates, write `CURSOR-HANDOFF.md` + patch, queue it, open handoff in Cursor | Fake Cursor agent calls; invent scope |
| **Cursor (human or Cloud Agent)** | Review handoff, apply/fix patch, leave result in the bridge queue | Silent drive-by edits without updating handoff status |
| **Bridge scripts** | Open paths in Cursor Desktop, queue/dequeue handoffs under `~/.minimax/cursor-bridge/` | Pretend headless `cursor-agent` exists |

## Required files in a target project

Copy or symlink these into the project root (Santa, etc.):

- `AGENTS.md` — this file (or a project-local copy that keeps the same rules)
- `MINIMAX-HANDOFF.md` — **the task** Minimax must execute (must exist and name work)
- `CURSOR-HANDOFF.md` — produced by Minimax when ready for Cursor review

If `MINIMAX-HANDOFF.md` is missing or has an empty **Task** section, Minimax must stop and ask for a task. That is not optional.

## Workflow (canonical)

```text
1. Human (or Cursor) fills MINIMAX-HANDOFF.md Task section
2. Minimax implements ONLY that task
3. Minimax runs project gates + real browser/visual check when UI is involved
4. Minimax writes CURSOR-HANDOFF.md + patch via:
     ./scripts/queue-handoff.sh --project /path/to/santa --status awaiting-cursor
5. Bridge opens CURSOR-HANDOFF.md (and optionally the project folder) in Cursor Desktop
6. Cursor reviews; writes result into ~/.minimax/cursor-bridge/inbox/ (or updates status)
7. Minimax integrates returned patch and verifies — label status integrated / done
```

Status labels (use exactly):

- `awaiting-minimax` — task defined, Minimax should work
- `awaiting-cursor` — handoff + patch ready; Cursor must review
- `awaiting-human` — blocked on a decision or missing secret
- `integrated` — Cursor result applied
- `done` — verified complete

## Opening things in Cursor (this works today)

```bash
# Open project folder
./scripts/open-in-cursor.sh /path/to/santa-project

# Open a specific handoff
./scripts/open-in-cursor.sh /path/to/santa-project/CURSOR-HANDOFF.md

# Full bridge: queue + open
./scripts/bridge.sh review --project /path/to/santa-project
```

If `cursor` is not on `PATH`, the scripts look for:

- `/Applications/Cursor.app/Contents/Resources/app/bin/cursor` (macOS)
- `%LOCALAPPDATA%\Programs\cursor\resources\app\bin\cursor.cmd` (Windows)
- `cursor` on PATH (Linux / Cloud)

## Gates are not enough

Prior Santa / hopper sessions found silent runtime bugs that unit gates missed. For game/UI work:

- Prefer a real browser or app window check
- Look at renders, not only exit codes
- Call out any gate that has never actually executed

## What Minimax must refuse

- Steps that require `cursor agent`, `cursor-agent`, or any headless Cursor agent binary that is not present
- Claiming “Cursor reviewed” without a returned artifact in the bridge queue
- Expanding scope beyond the Task section in `MINIMAX-HANDOFF.md`
