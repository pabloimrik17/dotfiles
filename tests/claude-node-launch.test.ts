import { afterEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const shim = path.resolve(import.meta.dir, "..", "dot_local", "bin", "shims", "executable_claude");
const temporaryDirectories: string[] = [];

interface ShimHarness {
    root: string;
    home: string;
    worktree: string;
    capture: string;
    pathCapture: string;
    stateRoot: string;
    nvmDir: string;
    env: NodeJS.ProcessEnv;
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    );
});

async function setup(): Promise<ShimHarness> {
    const root = await mkdtemp(path.join(tmpdir(), "claude-shim-test-"));
    temporaryDirectories.push(root);
    const home = path.join(root, "home");
    const worktree = path.join(root, "worktree");
    const realBin = path.join(home, ".local", "bin");
    const stateRoot = path.join(root, "state", "ghd-aoe");
    const nvmDir = path.join(root, "nvm");
    const capture = path.join(root, "args.bin");
    const pathCapture = path.join(root, "path.txt");
    await Promise.all([
        mkdir(realBin, { recursive: true }),
        mkdir(worktree, { recursive: true }),
        mkdir(path.join(stateRoot, "reviews"), { recursive: true }),
        mkdir(nvmDir, { recursive: true }),
    ]);
    const realClaude = path.join(realBin, "claude");
    await writeFile(
        realClaude,
        [
            "#!/bin/sh",
            ': > "$CAPTURE"',
            'for argument in "$@"; do',
            '  printf "%s\\0" "$argument" >>"$CAPTURE"',
            "done",
            'printf "%s" "$PATH" >"$PATH_CAPTURE"',
            'exit "$CLAUDE_EXIT_CODE"',
            "",
        ].join("\n"),
    );
    await chmod(realClaude, 0o755);
    return {
        root,
        home,
        worktree,
        capture,
        pathCapture,
        stateRoot,
        nvmDir,
        env: {
            ...process.env,
            HOME: home,
            NVM_DIR: nvmDir,
            GHD_AOE_STATE_HOME: stateRoot,
            CAPTURE: capture,
            PATH_CAPTURE: pathCapture,
            CLAUDE_EXIT_CODE: "0",
            AOE_PROFILE: "",
            AOE_INSTANCE_ID: "",
        },
    };
}

async function marker(
    harness: ShimHarness,
    values: {
        profile?: string;
        instanceId?: string;
        worktree?: string;
        reviewRef?: string;
        launchState?: string;
    } = {},
): Promise<void> {
    const instanceId = values.instanceId || "session-1";
    await writeFile(
        path.join(harness.stateRoot, "reviews", instanceId + ".json"),
        JSON.stringify({
            version: 1,
            profile: values.profile || "main",
            instanceId,
            worktree: values.worktree || (await realpath(harness.worktree)),
            reviewRef: values.reviewRef || "owner/repo#123",
            launchState: values.launchState || "started",
        }),
    );
}

async function runShim(
    harness: ShimHarness,
    args: string[],
    env: NodeJS.ProcessEnv = harness.env,
): Promise<{ exitCode: number; stderr: string; args: string[]; delegatedPath?: string }> {
    const child = Bun.spawn(["/bin/sh", shim, ...args], {
        cwd: harness.worktree,
        env,
        stdout: "pipe",
        stderr: "pipe",
    });
    const [exitCode, stderr] = await Promise.all([
        child.exited,
        new Response(child.stderr).text(),
        new Response(child.stdout).text(),
    ]);
    let captured: string[] = [];
    if (await Bun.file(harness.capture).exists()) {
        const bytes = new Uint8Array(await Bun.file(harness.capture).arrayBuffer());
        captured = new TextDecoder()
            .decode(bytes)
            .split("\0")
            .filter((value) => value !== "");
    }
    return {
        exitCode,
        stderr,
        args: captured,
        delegatedPath: (await Bun.file(harness.pathCapture).exists())
            ? await readFile(harness.pathCapture, "utf8")
            : undefined,
    };
}

describe("Claude launch shim", () => {
    test("preserves unmanaged arguments and real Claude exit status", async () => {
        const harness = await setup();
        const result = await runShim(
            harness,
            ["plain", "argument with spaces", "quote'argument", "--resume", "conversation"],
            { ...harness.env, CLAUDE_EXIT_CODE: "23" },
        );
        expect(result.exitCode).toBe(23);
        expect(result.args).toEqual([
            "plain",
            "argument with spaces",
            "quote'argument",
            "--resume",
            "conversation",
        ]);
    });

    test("keeps bootstrap on a genuine first managed launch", async () => {
        const harness = await setup();
        await marker(harness, { launchState: "registered" });
        const args = [
            "/review-team",
            "owner/repo#123",
            "--session-id",
            "00000000-0000-4000-8000-000000000001",
        ];
        const result = await runShim(harness, args, {
            ...harness.env,
            AOE_PROFILE: "main",
            AOE_INSTANCE_ID: "session-1",
        });
        expect(result.exitCode).toBe(0);
        expect(result.args).toEqual(args);
    });

    test("removes only the separate bootstrap pair on resume", async () => {
        const harness = await setup();
        await marker(harness);
        const result = await runShim(
            harness,
            [
                "/review-team",
                "owner/repo#123",
                "--resume",
                "conversation",
                "--name",
                "argument with spaces",
                "quote'argument",
            ],
            { ...harness.env, AOE_PROFILE: "main", AOE_INSTANCE_ID: "session-1" },
        );
        expect(result.exitCode).toBe(0);
        expect(result.args).toEqual([
            "--resume",
            "conversation",
            "--name",
            "argument with spaces",
            "quote'argument",
        ]);
    });

    test("removes the combined bootstrap argument on resume", async () => {
        const harness = await setup();
        await marker(harness);
        const result = await runShim(
            harness,
            ["/review-team owner/repo#123", "--resume", "conversation", "other"],
            { ...harness.env, AOE_PROFILE: "main", AOE_INSTANCE_ID: "session-1" },
        );
        expect(result.args).toEqual(["--resume", "conversation", "other"]);
    });

    test("leaves mismatched profile and worktree launches untouched", async () => {
        const harness = await setup();
        await marker(harness);
        const args = ["/review-team", "owner/repo#123", "--resume", "conversation"];
        const wrongProfile = await runShim(harness, args, {
            ...harness.env,
            AOE_PROFILE: "other",
            AOE_INSTANCE_ID: "session-1",
        });
        expect(wrongProfile.args).toEqual(args);

        await marker(harness, { worktree: path.join(harness.root, "other") });
        const wrongWorktree = await runShim(harness, args, {
            ...harness.env,
            AOE_PROFILE: "main",
            AOE_INSTANCE_ID: "session-1",
        });
        expect(wrongWorktree.args).toEqual(args);
    });

    test("rejects a fresh session for a previously started review", async () => {
        const harness = await setup();
        await marker(harness);
        const result = await runShim(
            harness,
            ["/review-team", "owner/repo#123", "--session-id", "fresh"],
            { ...harness.env, AOE_PROFILE: "main", AOE_INSTANCE_ID: "session-1" },
        );
        expect(result.exitCode).toBe(65);
        expect(result.stderr).toContain("AoE supplied a fresh session");
        expect(await Bun.file(harness.capture).exists()).toBe(false);
    });

    test("keeps non-Node PATH and activates an installed project Node", async () => {
        const harness = await setup();
        const ambient = harness.env.PATH!;
        const nonNode = await runShim(harness, ["plain"]);
        expect(nonNode.delegatedPath).toBe(ambient);

        await writeFile(path.join(harness.worktree, ".nvmrc"), "20\n");
        const nodeBin = path.join(harness.nvmDir, "versions", "node", "v20.12.0", "bin");
        await mkdir(nodeBin, { recursive: true });
        const nodeProject = await runShim(harness, ["plain"]);
        expect(nodeProject.delegatedPath?.startsWith(nodeBin + path.delimiter)).toBe(true);
    });
});
