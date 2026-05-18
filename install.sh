#!/usr/bin/env bash
# Source-checkout entrypoint for OpalSpec on macOS and Linux.
# Mirrors install.ps1 by delegating to the Node CLI. All arguments are
# forwarded verbatim to `bin/opalspec.js`, so the same subcommands and
# flags work as in the npm-installed CLI.
#
# Examples:
#   ./install.sh init --tools codex,claude --yes
#   ./install.sh init --target /path/to/repo --tools claude
#   ./install.sh update --target /path/to/repo
#   ./install.sh add-tool cursor --target /path/to/repo
#   ./install.sh install-codex-prompts
#   ./install.sh doctor --target /path/to/repo

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "OpalSpec requires Node.js 20.19.0 or higher. Install Node from https://nodejs.org/ and try again." >&2
  exit 1
fi

exec node "$SCRIPT_DIR/bin/opalspec.js" "$@"
