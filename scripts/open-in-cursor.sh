#!/usr/bin/env bash
# Open any file or folder in Cursor Desktop (or OS fallback).
# Usage: open-in-cursor.sh <path> [more paths...]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT/scripts/lib.sh"

[[ $# -ge 1 ]] || die "usage: $0 <path> [path...]"

ensure_dirs
status=0
for path in "$@"; do
  if ! open_in_cursor "$path"; then
    status=1
  fi
done
exit "$status"
