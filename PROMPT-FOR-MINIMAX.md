# Paste this into Minimax (Santa session)

You previously blocked on three things. They are resolved by the Minimax↔Cursor bridge kit. Do **not** re-block on them.

## Resolved blockers

1. **Cursor CLI has no agent subcommand** — expected on Cursor 3.24.x. Do **not** look for `cursor-agent`. Use the bridge:
   ```bash
   export SANTA_PROJECT_ROOT="/absolute/path/to/santa"
   export CURSOR_BIN="/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
   ./scripts/run-santa-bridge.sh "$SANTA_PROJECT_ROOT"
   # or, after install into Santa:
   "$SANTA_PROJECT_ROOT/minimax-cursor.sh" open --project "$SANTA_PROJECT_ROOT"
   ```
   That opens the project and handoff files in Cursor Desktop via `cursor <path>`.

2. **`AGENTS.md` / `MINIMAX-HANDOFF.md` missing** — install them:
   ```bash
   ./scripts/install-into-project.sh "$SANTA_PROJECT_ROOT"
   ```

3. **No task** — read `MINIMAX-HANDOFF.md` **Active work item**.  
   - If filled → implement only that item, then:
     ```bash
     "$SANTA_PROJECT_ROOT/minimax-cursor.sh" review --project "$SANTA_PROJECT_ROOT"
     ```
     Report status: **Awaiting Cursor review**.  
   - If empty → install + open Cursor, then ask the human to fill Active work item. Do not invent a Santa feature.

## Forbidden

- Calling `cursor agent` / inventing headless Cursor agent APIs
- Simulating a Cursor review
- Working on crossroad-hopper unless the handoff says so

## Required first commands

```bash
export SANTA_PROJECT_ROOT="/absolute/path/to/your/santa-project"
# From the bridge kit checkout:
./scripts/run-santa-bridge.sh "$SANTA_PROJECT_ROOT"
```

Then continue per `AGENTS.md` in the Santa root.
