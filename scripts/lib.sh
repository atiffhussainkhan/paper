#!/usr/bin/env bash
# Shared helpers for Minimax ↔ Cursor bridge.
set -euo pipefail

BRIDGE_HOME="${MINIMAX_BRIDGE_HOME:-$HOME/.minimax/cursor-bridge}"
QUEUE_DIR="$BRIDGE_HOME/queue"
INBOX_DIR="$BRIDGE_HOME/inbox"
OUTBOX_DIR="$BRIDGE_HOME/outbox"
LOG_DIR="$BRIDGE_HOME/logs"

die() {
  echo "error: $*" >&2
  exit 1
}

info() {
  echo "$*"
}

ensure_dirs() {
  mkdir -p "$QUEUE_DIR" "$INBOX_DIR" "$OUTBOX_DIR" "$LOG_DIR"
}

timestamp() {
  date -u +"%Y%m%dT%H%M%SZ"
}

resolve_cursor_bin() {
  if [[ -n "${CURSOR_BIN:-}" && -x "$CURSOR_BIN" ]]; then
    echo "$CURSOR_BIN"
    return 0
  fi
  if command -v cursor >/dev/null 2>&1; then
    command -v cursor
    return 0
  fi
  local candidates=(
    "/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
    "$HOME/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
    "/mnt/c/Users/$USER/AppData/Local/Programs/cursor/resources/app/bin/cursor"
  )
  local c
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

open_in_cursor() {
  local target="$1"
  [[ -e "$target" ]] || die "path does not exist: $target"

  local bin=""
  if bin="$(resolve_cursor_bin)"; then
    info "Opening in Cursor: $target"
    # Desktop CLI: open path(s). No agent subcommand — by design.
    "$bin" "$target" >/dev/null 2>&1 &
    return 0
  fi

  # Fallbacks that still "open something" for the human.
  local os
  os="$(uname -s 2>/dev/null || echo unknown)"
  if [[ "$os" == "Darwin" ]] && command -v open >/dev/null 2>&1; then
    info "cursor binary not found; using macOS open: $target"
    open "$target"
    return 0
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    info "cursor binary not found; using xdg-open: $target"
    # Prefer opening the file itself; for directories, open as file URI.
    xdg-open "$target" >/dev/null 2>&1 &
    return 0
  fi
  if [[ "$os" == "Linux" ]] && command -v gio >/dev/null 2>&1; then
    info "cursor binary not found; using gio open: $target"
    gio open "$target" >/dev/null 2>&1 &
    return 0
  fi

  # Last resort: print paths so Minimax/human can paste into Cursor manually.
  info "WARN: no cursor/xdg-open available. Open these paths in Cursor manually:"
  info "  $target"
  return 0
}

project_root_from_args() {
  local project="${SANTA_PROJECT_ROOT:-${PROJECT_ROOT:-}}"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project)
        project="${2:-}"
        shift 2
        ;;
      --project=*)
        project="${1#*=}"
        shift
        ;;
      *)
        shift
        ;;
    esac
  done
  if [[ -z "$project" ]]; then
    project="$(pwd)"
  fi
  # Resolve to absolute when possible
  if command -v realpath >/dev/null 2>&1; then
    realpath "$project"
  else
    (cd "$project" && pwd)
  fi
}

require_handoff_files() {
  local project="$1"
  [[ -f "$project/AGENTS.md" ]] || die "missing $project/AGENTS.md — run scripts/install-into-project.sh"
  [[ -f "$project/MINIMAX-HANDOFF.md" ]] || die "missing $project/MINIMAX-HANDOFF.md — run scripts/install-into-project.sh"
}
