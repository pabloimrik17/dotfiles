#!/bin/sh
# Every run in N sandboxed shards (default 8), then merge and report.
# Extra arguments go to `twomac.py run`, e.g. --profile peakFri.
set -eu
SIM=$(cd "$(dirname "$0")" && pwd -P)
N=${SHARDS:-8}
mkdir -p "$SIM/results"
i=0
while [ "$i" -lt "$N" ]; do
  "$SIM/run.sh" twomac.py run --shard "$i/$N" "$@" > "$SIM/results/shard-$i.log" 2>&1 &
  i=$((i + 1))
done
wait
cat "$SIM"/results/shard-*.log
"$SIM/run.sh" twomac.py merge
"$SIM/run.sh" report.py
