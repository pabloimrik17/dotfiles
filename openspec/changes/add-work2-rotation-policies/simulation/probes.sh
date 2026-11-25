#!/bin/sh
# Follow-up runs behind the main 75: the L=50 floor, the work Mac alone, the
# other day profiles, and the personal Mac without personal2. Each group runs
# in N sandboxed shards.
set -eu
SIM=$(cd "$(dirname "$0")" && pwd -P)
N=${SHARDS:-8}
group() {
  tag=$1; shift
  pids=""
  i=0
  while [ "$i" -lt "$N" ]; do
    "$SIM/run.sh" twomac.py run --shard "$i/$N" "$@" > "$SIM/results/probe-$tag-$i.log" 2>&1 &
    pids="$pids $!"
    i=$((i + 1))
  done
  rc=0
  for p in $pids; do wait "$p" || rc=1; done
  cat "$SIM"/results/probe-"$tag"-*.log
  [ "$rc" -eq 0 ] || { echo "probe group $tag failed" >&2; exit 1; }
}
mkdir -p "$SIM/results"
group floor --lines 50 --no-status-quo
group alone --lines 60 --demands 2 --pm-idle --no-status-quo
group fri --profile peakFri --lines 50,60,70,80
group flat --profile flat --lines 50,60,70,80
group nop2 --no-p2 --lines 70 --demands 1,1.5 --no-status-quo
group nop2fri --no-p2 --profile peakFri --lines 70 --demands 1,1.5 --no-status-quo
group nop2flat --no-p2 --profile flat --lines 70 --demands 1,1.5 --no-status-quo
