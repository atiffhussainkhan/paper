#!/usr/bin/env bash
# One-shot entrypoint for Minimax on the Santa project.
# Usage:
#   SANTA_PROJECT_ROOT=/path/to/santa ./scripts/run-santa-bridge.sh
#   ./scripts/run-santa-bridge.sh /path/to/santa
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT/scripts/lib.sh"

project="${1:-${SANTA_PROJECT_ROOT:-}}"
if [[ -z "$project" ]]; then
  cat <<EOF
error: set SANTA_PROJECT_ROOT or pass the Santa project path.

Example:
  export SANTA_PROJECT_ROOT="\$HOME/Projects/santa"
  $0

Or:
  $0 /absolute/path/to/santa
EOF
  exit 1
fi

[[ -d "$project" ]] || die "Santa project not found: $project"

"$ROOT/scripts/install-into-project.sh" "$project"
"$ROOT/scripts/bridge.sh" doctor
"$ROOT/scripts/bridge.sh" open --project "$project"

info ""
info "Santa bridge ready."
info "Fill Active work item in: $project/MINIMAX-HANDOFF.md"
info "Then Minimax implements and runs:"
info "  $project/minimax-cursor.sh review --project \"$project\""
