#!/bin/sh
# Follow-up runs behind the main 75: the L=50 floor, the work Mac alone, and
# the other day profiles. Each group runs in N sandboxed shards.
set -eu
SIM=$(cd "$(dirname "$0")" && pwd -P)
N=${SHARDS:-8}
group() {
  tag=$1; shift
  i=0
  while [ "$i" -lt "$N" ]; do
    "$SIM/run.sh" twomac.py run --shard "$i/$N" "$@" > "$SIM/results/probe-$tag-$i.log" 2>&1 &
    i=$((i + 1))
  done
  wait
  cat "$SIM"/results/probe-"$tag"-*.log
}
mkdir -p "$SIM/results"
group floor --lines 50 --no-status-quo
group alone --lines 60 --demands 2 --pm-idle --no-status-quo
group fri --profile peakFri --lines 50,60,70,80
group flat --profile flat --lines 50,60,70,80
