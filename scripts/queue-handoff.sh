#!/usr/bin/env bash
# Package CURSOR-HANDOFF.md (+ optional patch) into the Minimax bridge queue.
# Usage:
#   queue-handoff.sh --project /path/to/santa [--status awaiting-cursor] [--patch file.patch] [--open]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT/scripts/lib.sh"

project=""
status_label="awaiting-cursor"
patch_file=""
do_open=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) project="${2:-}"; shift 2 ;;
    --project=*) project="${1#*=}"; shift ;;
    --status) status_label="${2:-}"; shift 2 ;;
    --status=*) status_label="${1#*=}"; shift ;;
    --patch) patch_file="${2:-}"; shift 2 ;;
    --patch=*) patch_file="${1#*=}"; shift ;;
    --open) do_open=1; shift ;;
    -h|--help)
      cat <<EOF
Usage: $0 --project <dir> [--status awaiting-cursor] [--patch file.patch] [--open]

Writes a timestamped package under ~/.minimax/cursor-bridge/queue/
and updates CURSOR-HANDOFF.md status line when present.
EOF
      exit 0
      ;;
    *) die "unknown arg: $1" ;;
  esac
done

project="$(project_root_from_args --project "${project:-${SANTA_PROJECT_ROOT:-$(pwd)}}")"
ensure_dirs
require_handoff_files "$project"

handoff="$project/CURSOR-HANDOFF.md"
if [[ ! -f "$handoff" ]]; then
  cp "$ROOT/CURSOR-HANDOFF.md" "$handoff"
fi

# Bump status line if present
if grep -q '^\*\*Status:\*\*' "$handoff"; then
  tmp="$(mktemp)"
  sed -E "s|^\\*\\*Status:\\*\\*.*|**Status:** \`$status_label\`|" "$handoff" >"$tmp"
  mv "$tmp" "$handoff"
fi

id="$(timestamp)-$(basename "$project")"
dest="$QUEUE_DIR/$id"
mkdir -p "$dest"

cp "$handoff" "$dest/CURSOR-HANDOFF.md"
cp "$project/MINIMAX-HANDOFF.md" "$dest/MINIMAX-HANDOFF.md"
cp "$project/AGENTS.md" "$dest/AGENTS.md"

if [[ -n "$patch_file" ]]; then
  [[ -f "$patch_file" ]] || die "patch not found: $patch_file"
  cp "$patch_file" "$dest/change.patch"
elif git -C "$project" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$project" diff >"$dest/change.patch" || true
  git -C "$project" diff --cached >>"$dest/change.patch" || true
fi

cat >"$dest/meta.json" <<EOF
{
  "id": "$id",
  "project": "$project",
  "status": "$status_label",
  "createdAt": "$(timestamp)",
  "hasPatch": $([ -s "$dest/change.patch" ] && echo true || echo false)
}
EOF

ln -sfn "$dest" "$OUTBOX_DIR/latest"
info "Queued handoff: $dest"
info "Status: $status_label"

if [[ "$do_open" -eq 1 ]]; then
  open_in_cursor "$handoff"
  open_in_cursor "$project"
fi
