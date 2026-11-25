#!/bin/sh
# Every run in N sandboxed shards (default 8), then merge and report.
# Extra arguments go to `twomac.py run`, e.g. --profile peakFri.
set -eu
SIM=$(cd "$(dirname "$0")" && pwd -P)
N=${SHARDS:-8}
profile=peakTue
prev=""
for a in "$@"; do
  [ "$prev" = "--profile" ] && profile=$a
  prev=$a
done
mkdir -p "$SIM/results"
pids=""
i=0
while [ "$i" -lt "$N" ]; do
  "$SIM/run.sh" twomac.py run --shard "$i/$N" "$@" > "$SIM/results/shard-$i.log" 2>&1 &
  pids="$pids $!"
  i=$((i + 1))
done
rc=0
for p in $pids; do wait "$p" || rc=1; done
cat "$SIM"/results/shard-*.log
[ "$rc" -eq 0 ] || { echo "a shard failed; not merging" >&2; exit 1; }
"$SIM/run.sh" twomac.py merge
"$SIM/run.sh" report.py "$profile"
