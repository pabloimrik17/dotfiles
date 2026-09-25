#!/usr/bin/env bun

import {
    DEFAULT_INFERENCE_TIMEOUT_MS,
    fallbackNaming,
    inferNaming,
    runProcess,
} from "../../dot_local/lib/ghd-aoe.ts";

if (process.env.GHD_AOE_RUN_HAIKU_BENCHMARK !== "1") {
    console.error("Set GHD_AOE_RUN_HAIKU_BENCHMARK=1 to run this read-only Haiku benchmark.");
    process.exit(2);
}

const value = (name: string): string | undefined => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
};
const repository = value("--repo");
const prText = value("--pr");
const profile = value("--profile") || process.env.AGENT_OF_EMPIRES_PROFILE || "main";
if (!repository || !prText || !/^[1-9]\d*$/.test(prText)) {
    console.error("Usage: --repo <owner/repo> --pr <number> [--profile <name>]");
    process.exit(2);
}
const prNumber = Number(prText);

const [metadataResult, groupsResult] = await Promise.all([
    runProcess("gh", [
        "pr",
        "view",
        String(prNumber),
        "--repo",
        repository,
        "--json",
        "title,body,headRefName,url",
    ]),
    runProcess("aoe", ["--profile", profile, "group", "list", "--json"]),
]);
if (metadataResult.exitCode !== 0 || groupsResult.exitCode !== 0) {
    console.error("Unable to read benchmark metadata or groups.");
    process.exit(1);
}

const metadata = JSON.parse(metadataResult.stdout) as {
    title: string;
    body: string;
    headRefName: string;
};
const flatten = (entries: Array<{ path: string; children?: unknown[] }>): string[] =>
    entries.flatMap((entry) => [
        entry.path,
        ...flatten((entry.children ?? []) as Array<{ path: string; children?: unknown[] }>),
    ]);
const groups = flatten(
    JSON.parse(groupsResult.stdout) as Array<{ path: string; children?: unknown[] }>,
);
const result = await inferNaming({
    repository,
    groups,
    metadata,
    cwd: process.cwd(),
});
const fallback = fallbackNaming(repository, prNumber, groups, metadata);

console.log(
    JSON.stringify(
        {
            deadlineMs: DEFAULT_INFERENCE_TIMEOUT_MS,
            durationMs: Math.round(result.durationMs),
            completedWithinDeadline:
                !result.timedOut && result.durationMs <= DEFAULT_INFERENCE_TIMEOUT_MS,
            outputValid: Boolean(result.choice),
            timedOut: result.timedOut,
            selected: result.choice ?? fallback,
            usedFallback: !result.choice,
            cleanup: result.timedOut
                ? "inference process group killed at the deadline"
                : "inference process exited",
        },
        null,
        2,
    ),
);
