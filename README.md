# Minimax ↔ Cursor bridge (Santa)

Fixes the blockers Minimax correctly reported:

1. **Cursor Desktop CLI cannot run agents** — this kit never calls `cursor agent` / `cursor-agent`.
2. **Missing `AGENTS.md` / `MINIMAX-HANDOFF.md`** — both ship here and install into Santa.
3. **No task defined** — `MINIMAX-HANDOFF.md` has an **Active work item** section you must fill before game code changes.
4. **Still opens Cursor** — uses the real launcher: `cursor <path>` (files/folders).

## Quick start (on your Mac, where Santa + Minimax run)

```bash
# 1) Clone or copy this kit, then install into Santa:
./scripts/install-into-project.sh /absolute/path/to/santa-project

# 2) Point at Santa and verify:
export SANTA_PROJECT_ROOT="/absolute/path/to/santa-project"
export CURSOR_BIN="/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
cd "$SANTA_PROJECT_ROOT"
./minimax-cursor.sh doctor

# 3) Open Santa + handoffs in Cursor Desktop:
./minimax-cursor.sh open --project "$SANTA_PROJECT_ROOT"
```

That last command is what Minimax should run instead of inventing `cursor agent`.

## What Minimax should do now

1. Read `AGENTS.md` and `MINIMAX-HANDOFF.md` in the Santa root.
2. Run `./minimax-cursor.sh open` so Cursor shows the project.
3. If **Active work item** is filled → implement only that →  
   `./minimax-cursor.sh review --project "$SANTA_PROJECT_ROOT"`  
   and report **Awaiting Cursor review**.
4. If Active work item is empty → stop and ask you to fill it (do not invent features).

## Bridge layout

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Rules both agents must follow |
| `MINIMAX-HANDOFF.md` | The task for Minimax |
| `CURSOR-HANDOFF.md` | Package for Cursor review |
| `scripts/bridge.sh` | `doctor` / `open` / `review` / `return` / `status` |
| `~/.minimax/cursor-bridge/queue/` | Outgoing handoff packages |
| `~/.minimax/cursor-bridge/inbox/` | Cursor results for Minimax |

## Returning a Cursor review to Minimax

```bash
./minimax-cursor.sh return --project "$SANTA_PROJECT_ROOT" \
  --note "approved with nits" \
  --patch /path/to/result.patch
```

## Why Minimax’s earlier stop was half-right

- Right: no headless Cursor agent binary on Cursor 3.24.x desktop CLI.
- Fixed here: workflow uses **open paths + handoff queue**, which that CLI *does* support.
- Right: missing handoff files and missing task — both are provided; you still must name the Santa change in **Active work item**.
