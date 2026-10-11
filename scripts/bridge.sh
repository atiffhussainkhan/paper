#!/usr/bin/env bash
# Minimax ↔ Cursor bridge — honest about Cursor Desktop capabilities.
#
# Commands:
#   doctor                         Check cursor binary + bridge dirs
#   open --project <dir>           Open project (+ handoffs) in Cursor
#   review --project <dir>         Queue handoff and open in Cursor
#   return --project <dir> ...     Drop a Cursor result into inbox
#   status                         Show latest queue/inbox packages
#
# This script NEVER calls `cursor agent` / `cursor-agent`. Those do not exist
# on Cursor Desktop 3.x file-launcher CLIs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT/scripts/lib.sh"

usage() {
  cat <<EOF
Minimax ↔ Cursor bridge

Usage:
  $0 doctor
  $0 open   --project <dir>
  $0 review --project <dir> [--patch file.patch]
  $0 return --project <dir> --note "text" [--patch file.patch]
  $0 status

Environment:
  SANTA_PROJECT_ROOT   Default --project path
  CURSOR_BIN           Override cursor binary
  MINIMAX_BRIDGE_HOME  Default: ~/.minimax/cursor-bridge
EOF
}

cmd_doctor() {
  ensure_dirs
  info "Bridge home: $BRIDGE_HOME"
  info "Queue:  $QUEUE_DIR"
  info "Inbox:  $INBOX_DIR"
  info "Outbox: $OUTBOX_DIR"

  if bin="$(resolve_cursor_bin)"; then
    info "Cursor binary: $bin"
    info "Cursor help (launcher only — expected):"
    "$bin" --help 2>&1 | head -n 20 || true
    if "$bin" --help 2>&1 | grep -Eiq 'agent'; then
      info "Note: help text mentions agent — still prefer this bridge over inventing flags."
    else
      info "OK: no agent subcommand (matches Cursor 3.x desktop launcher). Bridge uses open-paths only."
    fi
  else
    info "WARN: cursor binary not found. open/review will use OS open/xdg-open fallbacks."
    info "On the Mac where Minimax runs Santa, install Cursor or set CURSOR_BIN to:"
    info "  /Applications/Cursor.app/Contents/Resources/app/bin/cursor"
  fi

  # Prove we do not depend on missing binaries
  if command -v cursor-agent >/dev/null 2>&1; then
    info "cursor-agent found on PATH (unusual). Bridge still uses file open + queue."
  else
    info "OK: cursor-agent not present — expected. Do not block on it."
  fi

  info "Doctor complete."
}

cmd_open() {
  local project
  project="$(project_root_from_args "$@")"
  ensure_dirs

  if [[ ! -d "$project" ]]; then
    die "project directory missing: $project (set SANTA_PROJECT_ROOT or --project)"
  fi

  # Install handoff files if missing so Minimax never hits "AGENTS.md doesn't exist"
  if [[ ! -f "$project/AGENTS.md" || ! -f "$project/MINIMAX-HANDOFF.md" ]]; then
    info "Handoff files missing in project — installing from bridge kit..."
    "$ROOT/scripts/install-into-project.sh" "$project"
  fi

  open_in_cursor "$project"
  [[ -f "$project/MINIMAX-HANDOFF.md" ]] && open_in_cursor "$project/MINIMAX-HANDOFF.md"
  [[ -f "$project/CURSOR-HANDOFF.md" ]] && open_in_cursor "$project/CURSOR-HANDOFF.md"
  [[ -f "$project/AGENTS.md" ]] && open_in_cursor "$project/AGENTS.md"
  info "Opened Santa/project surfaces in Cursor (or OS fallback)."
}

cmd_review() {
  local project="" patch=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project) project="${2:-}"; shift 2 ;;
      --project=*) project="${1#*=}"; shift ;;
      --patch) patch="${2:-}"; shift 2 ;;
      --patch=*) patch="${1#*=}"; shift ;;
      *) shift ;;
    esac
  done
  project="$(project_root_from_args --project "${project:-${SANTA_PROJECT_ROOT:-$(pwd)}}")"

  if [[ ! -f "$project/AGENTS.md" ]]; then
    "$ROOT/scripts/install-into-project.sh" "$project"
  fi

  local args=(--project "$project" --status awaiting-cursor --open)
  [[ -n "$patch" ]] && args+=(--patch "$patch")
  "$ROOT/scripts/queue-handoff.sh" "${args[@]}"
  info "Label for Minimax report: Awaiting Cursor review"
}

cmd_return() {
  local project="" note="" patch=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project) project="${2:-}"; shift 2 ;;
      --project=*) project="${1#*=}"; shift ;;
      --note) note="${2:-}"; shift 2 ;;
      --note=*) note="${1#*=}"; shift ;;
      --patch) patch="${2:-}"; shift 2 ;;
      --patch=*) patch="${1#*=}"; shift ;;
      *) shift ;;
    esac
  done
  [[ -n "$note" ]] || die "--note is required"
  project="$(project_root_from_args --project "${project:-${SANTA_PROJECT_ROOT:-$(pwd)}}")"
  ensure_dirs

  local id="$(timestamp)-return-$(basename "$project")"
  local dest="$INBOX_DIR/$id"
  mkdir -p "$dest"
  printf '%s\n' "$note" >"$dest/note.txt"
  echo "$project" >"$dest/project.txt"
  if [[ -n "$patch" ]]; then
    [[ -f "$patch" ]] || die "patch not found: $patch"
    cp "$patch" "$dest/result.patch"
  fi
  cat >"$dest/meta.json" <<EOF
{
  "id": "$id",
  "project": "$project",
  "status": "integrated",
  "note": $(printf '%s' "$note" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo "\"$note\""),
  "createdAt": "$(timestamp)"
}
EOF
  ln -sfn "$dest" "$INBOX_DIR/latest"
  info "Cursor result stored: $dest"
  info "Minimax should integrate from ~/.minimax/cursor-bridge/inbox/latest"
}

cmd_status() {
  ensure_dirs
  info "== Outbox (Minimax → Cursor) =="
  if [[ -e "$OUTBOX_DIR/latest" ]]; then
    ls -la "$OUTBOX_DIR/latest"
    [[ -f "$OUTBOX_DIR/latest/meta.json" ]] && cat "$OUTBOX_DIR/latest/meta.json"
  else
    info "(empty)"
  fi
  info ""
  info "== Inbox (Cursor → Minimax) =="
  if [[ -e "$INBOX_DIR/latest" ]]; then
    ls -la "$INBOX_DIR/latest"
    [[ -f "$INBOX_DIR/latest/meta.json" ]] && cat "$INBOX_DIR/latest/meta.json"
  else
    info "(empty)"
  fi
  info ""
  info "Queue packages:"
  ls -1 "$QUEUE_DIR" 2>/dev/null | tail -n 10 || info "(none)"
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    doctor) cmd_doctor "$@" ;;
    open) cmd_open "$@" ;;
    review) cmd_review "$@" ;;
    return) cmd_return "$@" ;;
    status) cmd_status "$@" ;;
    -h|--help|help|"") usage ;;
    *) die "unknown command: $cmd (try: doctor|open|review|return|status)" ;;
  esac
}

main "$@"
