#!/bin/sh
# Run a sim script (default harness.py) fully sandboxed under this directory.
set -eu
SIM=$(cd "$(dirname "$0")" && pwd -P)
SCRIPT=${1:-harness.py}
[ $# -gt 0 ] && shift
mkdir -p "$SIM/home/.claude" "$SIM/home/xdg"
exec env -i PATH=/usr/bin:/bin HOME="$SIM/home" XDG_DATA_HOME="$SIM/home/xdg" \
  CLAUDE_CONFIG_DIR="$SIM/home/.claude" TZ=UTC \
  "$SIM/.venv/bin/python" -I "$SIM/$SCRIPT" "$@"
