#!/usr/bin/env bash
# Copy bridge handoff files + scripts into a target project (Santa).
# Usage: install-into-project.sh /absolute/path/to/santa-project
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT/scripts/lib.sh"

target="${1:-}"
[[ -n "$target" ]] || die "usage: $0 /path/to/santa-project"
[[ -d "$target" ]] || die "not a directory: $target"

if command -v realpath >/dev/null 2>&1; then
  target="$(realpath "$target")"
else
  target="$(cd "$target" && pwd)"
fi

ensure_dirs

mkdir -p "$target/scripts"

copy_if_missing_or_bridge() {
  local src="$1" dest="$2"
  if [[ -f "$dest" ]]; then
    # Refresh bridge scripts always; preserve human-edited Active work item handoffs carefully
    if [[ "$(basename "$dest")" == "MINIMAX-HANDOFF.md" ]]; then
      if grep -q '_\\(human: write the one Santa change here\\)_' "$dest" 2>/dev/null || ! grep -q 'Active work item' "$dest"; then
        cp "$src" "$dest"
        info "Updated $dest"
      else
        info "Keeping existing $dest (looks customized)"
      fi
      return 0
    fi
  fi
  cp "$src" "$dest"
  info "Installed $dest"
}

copy_if_missing_or_bridge "$ROOT/AGENTS.md" "$target/AGENTS.md"
copy_if_missing_or_bridge "$ROOT/MINIMAX-HANDOFF.md" "$target/MINIMAX-HANDOFF.md"
copy_if_missing_or_bridge "$ROOT/CURSOR-HANDOFF.md" "$target/CURSOR-HANDOFF.md"

# Always refresh scripts from kit
cp "$ROOT/scripts/lib.sh" "$target/scripts/lib.sh"
cp "$ROOT/scripts/open-in-cursor.sh" "$target/scripts/open-in-cursor.sh"
cp "$ROOT/scripts/queue-handoff.sh" "$target/scripts/queue-handoff.sh"
cp "$ROOT/scripts/bridge.sh" "$target/scripts/bridge.sh"
cp "$ROOT/scripts/install-into-project.sh" "$target/scripts/install-into-project.sh"
cp "$ROOT/scripts/run-santa-bridge.sh" "$target/scripts/run-santa-bridge.sh"
chmod +x "$target/scripts/"*.sh
cp "$ROOT/PROMPT-FOR-MINIMAX.md" "$target/PROMPT-FOR-MINIMAX.md"

# Convenience wrapper at project root
cat >"$target/minimax-cursor.sh" <<'EOF'
#!/usr/bin/env bash
exec "$(cd "$(dirname "$0")" && pwd)/scripts/bridge.sh" "$@"
EOF
chmod +x "$target/minimax-cursor.sh"

# Point default env hint
if [[ ! -f "$target/.env.minimax-bridge.example" ]]; then
  cat >"$target/.env.minimax-bridge.example" <<EOF
# Copy values into your shell before calling Minimax tools:
export SANTA_PROJECT_ROOT="$target"
export CURSOR_BIN="/Applications/Cursor.app/Contents/Resources/app/bin/cursor"
EOF
fi

info ""
info "Installed Minimax ↔ Cursor bridge into:"
info "  $target"
info ""
info "Next (on the machine where Santa + Cursor Desktop live):"
info "  export SANTA_PROJECT_ROOT=\"$target\""
info "  \"$target/minimax-cursor.sh\" doctor"
info "  \"$target/minimax-cursor.sh\" open --project \"$target\""
