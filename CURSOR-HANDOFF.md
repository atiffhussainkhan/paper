# CURSOR-HANDOFF

**Status:** `awaiting-human`  
**From:** Minimax (or Cursor Cloud setup agent)  
**Project:** Santa  

## Summary

Bridge kit installed. Cursor Desktop is used to **open** files/folders — not to run a headless agent CLI.

## What to review

1. Confirm `AGENTS.md` workflow matches how you want Minimax to collaborate.
2. Fill **Active work item** in `MINIMAX-HANDOFF.md` with the one Santa change you want next.
3. Tell Minimax to continue, or paste this handoff into a Cursor Cloud Agent chat yourself.

## Patch

None yet — infrastructure only. When Minimax finishes an Active work item, it will replace this section with a real diff and set status to `awaiting-cursor`.

## How to return a result to Minimax

```bash
./scripts/bridge.sh return --project "$SANTA_PROJECT_ROOT" --note "approved" --patch /path/to/result.patch
```

Artifacts land in `~/.minimax/cursor-bridge/inbox/`.

## Verification checklist (for later code changes)

- [ ] Diff matches the Active work item only
- [ ] Project gates run
- [ ] Real browser / visual check if UI touched
- [ ] Status updated in `MINIMAX-HANDOFF.md`
