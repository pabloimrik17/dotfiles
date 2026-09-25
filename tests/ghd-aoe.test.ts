import { afterEach, describe, expect, setDefaultTimeout, test } from "bun:test";
import { createHash } from "node:crypto";
import {
    chmod,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    realpath,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
    DEFAULT_COMMAND_TIMEOUT_MS,
    DEFAULT_INFERENCE_TIMEOUT_MS,
    WORKTREE_COMMAND_TIMEOUT_MS,
    fallbackNaming,
    humanizeRepository,
    inferNaming,
    normalizeTitle,
    parseCliArgs,
    runIntegration,
    runProcess,
} from "../dot_local/lib/ghd-aoe.ts";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const helper = path.join(repositoryRoot, "dot_local", "bin", "executable_ghd-aoe");
const benchmark = path.join(import.meta.dir, "benchmarks", "ghd-aoe-haiku.ts");
const fixtureCli = path.join(import.meta.dir, "fixtures", "ghd-aoe-cli.ts");
const temporaryDirectories: string[] = [];
setDefaultTimeout(15_000);

interface FixtureSession {
    id: string;
    title: string;
    path: string;
    group: string;
    profile: string;
    cmdOverride?: string;
    extraArgs?: string;
    agent_session_id?: string | null;
}

interface FixtureState {
    profile: string;
    worktree: string;
    metadata?: { title: string; body: string; headRefName: string; url: string };
    groups: Array<{ name: string; path: string; session_count: number; children: unknown[] }>;
    sessions: FixtureSession[];
    runtime: Array<{ session: string; state: string }>;
    starts?: number;
    legacyLaunches?: number;
    lastLaunchArgs?: string[];
    lastCommandOverride?: string;
    inference: {
        output?: string;
        stderr?: string;
        exitCode?: number;
        delayMs?: number;
        spawnChild?: boolean;
        childPidFile?: string;
    };
    failures: {
        wt?: boolean;
        gh?: boolean;
        add?: boolean;
        addAfterCreate?: boolean;
        start?: boolean;
    };
}

interface Harness {
    root: string;
    repo: string;
    worktree: string;
    fixturePath: string;
    logPath: string;
    bin: string;
    stateRoot: string;
    env: NodeJS.ProcessEnv;
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    );
});

function shellQuote(value: string): string {
    return "'" + value.replaceAll("'", "'\\''") + "'";
}

async function setup(overrides: Partial<FixtureState> = {}): Promise<Harness> {
    const root = await mkdtemp(path.join(tmpdir(), "ghd-aoe-test-"));
    temporaryDirectories.push(root);
    const repo = path.join(root, "repository with 'quote");
    const worktree = path.join(root, 'worktree with "quote"');
    const bin = path.join(root, "bin");
    const home = path.join(root, "home");
    const stateRoot = path.join(root, "state", "ghd-aoe");
    await Promise.all([
        mkdir(repo, { recursive: true }),
        mkdir(worktree, { recursive: true }),
        mkdir(bin, { recursive: true }),
        mkdir(path.join(home, ".local", "bin", "shims"), { recursive: true }),
    ]);
    for (const command of ["aoe", "gh", "wt", "claude"]) {
        const wrapper = path.join(bin, command);
        await writeFile(
            wrapper,
            "#!/bin/sh\nexec bun " + shellQuote(fixtureCli) + " " + shellQuote(command) + ' "$@"\n',
        );
        await chmod(wrapper, 0o755);
    }

    const fixturePath = path.join(root, "fixture.json");
    const logPath = path.join(root, "calls.jsonl");
    const base: FixtureState = {
        profile: "main",
        worktree,
        metadata: {
            title: "feat: Improve API login redirect",
            body: "Keeps authentication state while redirecting.",
            headRefName: "feature/login-redirect",
            url: "https://github.com/owner/dotfiles/pull/123",
        },
        groups: [
            { name: "Dotfiles", path: "Dotfiles", session_count: 0, children: [] },
            { name: "Other", path: "Other", session_count: 0, children: [] },
        ],
        sessions: [],
        runtime: [],
        inference: { output: '{"group":"Dotfiles","title":"Improve API login redirect"}' },
        failures: {},
        ...overrides,
    };
    await writeFile(fixturePath, JSON.stringify(base, null, 2) + "\n");
    const env = {
        ...process.env,
        PATH: bin + path.delimiter + process.env.PATH,
        HOME: home,
        GHD_AOE_STATE_HOME: stateRoot,
        GHD_AOE_CLAUDE_BIN: path.join(bin, "claude"),
        GHD_AOE_CLAUDE_SHIM: path.join(home, ".local", "bin", "shims", "claude"),
        GHD_AOE_FIXTURE: fixturePath,
        GHD_AOE_FIXTURE_LOG: logPath,
    };
    return { root, repo, worktree, fixturePath, logPath, bin, stateRoot, env };
}

async function readFixture(harness: Harness): Promise<FixtureState> {
    return JSON.parse(await readFile(harness.fixturePath, "utf8")) as FixtureState;
}

async function writeFixture(harness: Harness, fixture: FixtureState): Promise<void> {
    await writeFile(harness.fixturePath, JSON.stringify(fixture, null, 2) + "\n");
}

async function calls(
    harness: Harness,
): Promise<Array<{ command: string; args: string[]; cwd: string; thinking?: string }>> {
    try {
        return (await readFile(harness.logPath, "utf8"))
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line));
    } catch {
        return [];
    }
}

async function run(
    harness: Harness,
    modality: "normal" | "review" = "normal",
    extraArgs: string[] = [],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const child = Bun.spawn(
        [
            "bun",
            helper,
            "--repo-path",
            harness.repo,
            "--repo",
            "owner/dotfiles",
            "--pr",
            "123",
            "--mode",
            modality,
            ...extraArgs,
        ],
        { env: harness.env, stdout: "pipe", stderr: "pipe" },
    );
    const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
    ]);
    return { exitCode, stdout, stderr };
}

async function runFixtureCommand(
    harness: Harness,
    command: string,
    args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const child = Bun.spawn([path.join(harness.bin, command), ...args], {
        env: harness.env,
        stdout: "pipe",
        stderr: "pipe",
    });
    const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
    ]);
    return { exitCode, stdout, stderr };
}

describe("CLI contract and isolated handoff", () => {
    test("validates repository, PR, and mode", () => {
        expect(() =>
            parseCliArgs([
                "--repo-path",
                "/tmp/repo",
                "--repo",
                "owner/repo",
                "--pr",
                "12",
                "--mode",
                "review",
            ]),
        ).not.toThrow();
        for (const [repository, pr, mode] of [
            ["bad repo", "12", "review"],
            ["owner/repo", "0", "review"],
            ["owner/repo", "1", "attach"],
        ]) {
            expect(() =>
                parseCliArgs([
                    "--repo-path",
                    "/tmp/repo",
                    "--repo",
                    repository!,
                    "--pr",
                    pr!,
                    "--mode",
                    mode!,
                ]),
            ).toThrow();
        }
    });

    test("expands a leading ~ in the repository path against HOME", async () => {
        const harness = await setup();
        const homeRepo = path.join(harness.env.HOME!, "WebstormProjects", "dotfiles");
        await mkdir(homeRepo, { recursive: true });
        const result = await runIntegration(
            {
                repoPath: "~/WebstormProjects/dotfiles",
                repository: "owner/dotfiles",
                prNumber: 123,
                modality: "normal",
            },
            { env: harness.env },
        );

        expect(result.action).toBe("queued");
        expect((await calls(harness)).find((call) => call.command === "wt")?.args).toEqual([
            "-C",
            await realpath(homeRepo),
            "switch",
            "pr:123",
            "-x",
            "pwd",
            "--",
            "-P",
        ]);
    });

    test("reproduces the legacy repeated launch defect in the AoE fixture", async () => {
        const harness = await setup();
        const arguments_ = [
            "--profile",
            "main",
            "add",
            harness.worktree,
            "--title",
            "review owner/dotfiles#123",
            "--group",
            "reviews/dotfiles",
            "-l",
        ];
        expect((await runFixtureCommand(harness, "aoe", arguments_)).exitCode).toBe(0);
        expect((await runFixtureCommand(harness, "aoe", arguments_)).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        expect(fixture.sessions).toHaveLength(1);
        expect(fixture.legacyLaunches).toBe(1);
    });

    test("passes quoted paths and hostile PR prose only as argv data", async () => {
        const harness = await setup();
        const fixture = await readFixture(harness);
        const sentinel = path.join(harness.root, "should-not-exist");
        fixture.metadata!.title = "fix don't $(touch " + sentinel + ")\ncrash";
        fixture.metadata!.body = 'Body with "quotes", semicolons; and commands.';
        fixture.metadata!.headRefName = "feature/quoted branch";
        await writeFixture(harness, fixture);
        expect((await run(harness)).exitCode).toBe(0);
        expect(await Bun.file(sentinel).exists()).toBe(false);
        const recorded = await calls(harness);
        expect(recorded.find((call) => call.command === "wt")?.args).toEqual([
            "-C",
            await realpath(harness.repo),
            "switch",
            "pr:123",
            "-x",
            "pwd",
            "--",
            "-P",
        ]);
        const prompt = recorded.find((call) => call.command === "claude")?.args.at(-1);
        const promptInput = JSON.parse(prompt!.split("\n").at(-1)!) as {
            pullRequest: { title: string; body: string; headBranch: string };
        };
        expect(promptInput.pullRequest).toEqual({
            title: fixture.metadata!.title,
            body: fixture.metadata!.body,
            headBranch: fixture.metadata!.headRefName,
        });
    });

    test("does not register after Worktrunk failure", async () => {
        const harness = await setup({ failures: { wt: true } });
        const result = await run(harness);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("Worktree preparation failed");
        expect(
            (await calls(harness)).some(
                (call) => call.command === "aoe" && call.args.includes("add"),
            ),
        ).toBe(false);
    });

    test("bounds infrastructure commands separately from Haiku inference", async () => {
        const harness = await setup();
        const observed: Array<{ command: string; timeoutMs?: number }> = [];
        const result = await runIntegration(
            {
                repoPath: harness.repo,
                repository: "owner/dotfiles",
                prNumber: 123,
                modality: "normal",
            },
            {
                env: harness.env,
                runner: async (command, args, options) => {
                    observed.push({ command, timeoutMs: options?.timeoutMs });
                    return await runProcess(command, args, options);
                },
            },
        );

        expect(result.action).toBe("queued");
        expect(observed.find((call) => call.command === "wt")?.timeoutMs).toBe(
            WORKTREE_COMMAND_TIMEOUT_MS,
        );
        for (const call of observed.filter(
            (candidate) => candidate.command === "aoe" || candidate.command === "gh",
        )) {
            expect(call.timeoutMs).toBe(DEFAULT_COMMAND_TIMEOUT_MS);
        }
        expect(
            observed.find((call) => call.command === harness.env.GHD_AOE_CLAUDE_BIN)?.timeoutMs,
        ).toBe(DEFAULT_INFERENCE_TIMEOUT_MS);
    });
});

describe("group and title selection", () => {
    test("uses one constrained metadata-only Haiku invocation", async () => {
        const harness = await setup();
        expect((await run(harness)).exitCode).toBe(0);
        const inferenceCalls = (await calls(harness)).filter((call) => call.command === "claude");
        expect(inferenceCalls).toHaveLength(1);
        const invocation = inferenceCalls[0]!;
        for (const argument of [
            "-p",
            "haiku",
            "--safe-mode",
            "--no-session-persistence",
            "--disable-slash-commands",
            "--strict-mcp-config",
        ]) {
            expect(invocation.args).toContain(argument);
        }
        expect(
            invocation.args.slice(
                invocation.args.indexOf("--tools"),
                invocation.args.indexOf("--tools") + 2,
            ),
        ).toEqual(["--tools", ""]);
        expect(invocation.thinking).toBe("0");
        expect(invocation.args.at(-1)).toContain("owner/dotfiles");
        expect(invocation.args.at(-1)).not.toContain("THIS_IS_A_DIFF");
    });

    test("normalizes fences, humanized groups, prefixes, acronyms, and word count", async () => {
        expect(humanizeRepository("owner/my-cool-project")).toBe("My cool project");
        expect(normalizeTitle("fix API login redirect")).toBe("Fix api login redirect");
        expect(normalizeTitle("Review - ADD TUICR CODE REVIEW TOOL")).toBe("Add tuicr code review");

        const fence = String.fromCharCode(96).repeat(3);
        const harness = await setup({
            groups: [{ name: "Other", path: "Other", session_count: 0, children: [] }],
            metadata: {
                title: "Add the best project title",
                body: "",
                headRefName: "feature/title",
                url: "https://github.com/owner/my-cool-project/pull/123",
            },
            inference: {
                output:
                    fence +
                    'json\n{"group":"My Cool Project","title":"Review - ADD TUICR CODE REVIEW TOOL"}\n' +
                    fence,
            },
        });
        expect((await run(harness, "normal", ["--repo", "owner/my-cool-project"])).exitCode).toBe(
            0,
        );
        expect((await readFixture(harness)).sessions[0]).toMatchObject({
            group: "My cool project",
            title: "Add tuicr code review",
        });
    });

    test("falls back deterministically for failures and unusable source titles", () => {
        expect(
            fallbackNaming(
                "owner/daily-agentic-task-force",
                123,
                ["Other", "Daily agentic task force"],
                { title: "fix(parser)!: handle quoted input safely", body: "", headRefName: "fix" },
            ),
        ).toEqual({ group: "Daily agentic task force", baseTitle: "Handle quoted input safely" });
        expect(
            fallbackNaming("owner/my-cool-project", 123, ["Other"], {
                title: "修正する",
                body: "",
                headRefName: "fix",
            }),
        ).toEqual({ group: "My cool project", baseTitle: "Pull request 123" });
        expect(fallbackNaming("owner/my-cool-project", 123, ["Other"])).toEqual({
            group: "My cool project",
            baseTitle: "Pull request 123",
        });
    });

    test("uses fallback without inference when GitHub metadata is unavailable", async () => {
        const harness = await setup({ metadata: undefined, failures: { gh: true } });
        expect((await run(harness, "review")).exitCode).toBe(0);
        expect((await readFixture(harness)).sessions[0]?.title).toBe("Review - Pull request 123");
        expect((await calls(harness)).filter((call) => call.command === "claude")).toHaveLength(0);
    });

    test("uses deterministic fallback for malformed output and model failure", async () => {
        const malformed = await setup({ inference: { output: "not-json" } });
        const malformedResult = await run(malformed);
        expect(malformedResult.exitCode).toBe(0);
        expect(malformedResult.stderr).toContain("output was invalid");
        expect((await readFixture(malformed)).sessions[0]?.title).toBe(
            "Improve api login redirect",
        );

        const failed = await setup({
            inference: { exitCode: 7, stderr: "error: unknown option --safe-mode" },
        });
        const failedResult = await run(failed);
        expect(failedResult.exitCode).toBe(0);
        expect(failedResult.stderr).toContain("Haiku naming failed");
        expect(failedResult.stderr).toContain("error: unknown option --safe-mode");
        expect((await readFixture(failed)).sessions[0]?.title).toBe("Improve api login redirect");
    });

    test("keeps hosted identity stable across a temporary metadata failure", async () => {
        const harness = await setup();
        const fixture = await readFixture(harness);
        fixture.metadata!.url = "https://git.example/owner/dotfiles/pull/123";
        await writeFixture(harness, fixture);
        expect((await run(harness)).exitCode).toBe(0);
        const persisted = await readFixture(harness);
        persisted.metadata = undefined;
        persisted.failures.gh = true;
        await writeFixture(harness, persisted);
        expect((await run(harness)).exitCode).toBe(0);
        const recorded = await calls(harness);
        expect(recorded.filter((call) => call.command === "claude")).toHaveLength(1);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("add")),
        ).toHaveLength(1);
    });

    test("kills the inference process group at the deadline", async () => {
        const harness = await setup();
        const childPidFile = path.join(harness.root, "inference-child.pid");
        const fixture = await readFixture(harness);
        fixture.inference = { spawnChild: true, childPidFile };
        await writeFixture(harness, fixture);
        expect(DEFAULT_INFERENCE_TIMEOUT_MS).toBe(10_000);
        const result = await inferNaming({
            repository: "owner/dotfiles",
            groups: ["Dotfiles"],
            metadata: fixture.metadata!,
            cwd: harness.worktree,
            env: harness.env,
            timeoutMs: 500,
        });
        expect(result.timedOut).toBe(true);
        expect(result.durationMs).toBeLessThan(900);
        const childPid = Number(await readFile(childPidFile, "utf8"));
        const alive = (): boolean => {
            try {
                process.kill(childPid, 0);
                return true;
            } catch {
                return false;
            }
        };
        const deadline = Date.now() + 2_000;
        while (alive() && Date.now() < deadline) await Bun.sleep(25);
        expect(alive()).toBe(false);
    });
});

describe("durable identity, reuse, and recovery", () => {
    test("persists a private association and repeats normal mode without work", async () => {
        const harness = await setup();
        const first = await run(harness);
        const second = await run(harness);
        expect(first.exitCode).toBe(0);
        expect(second.exitCode).toBe(0);
        expect(second.stdout.split("\t")[0]).toBe(first.stdout.split("\t")[0]);
        const recorded = await calls(harness);
        expect(recorded.filter((call) => call.command === "claude")).toHaveLength(1);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("add")),
        ).toHaveLength(1);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("start")),
        ).toHaveLength(0);

        const recordFiles = await readdir(path.join(harness.stateRoot, "records"));
        expect(recordFiles).toHaveLength(1);
        const recordPath = path.join(harness.stateRoot, "records", recordFiles[0]!);
        expect((await stat(recordPath)).mode & 0o777).toBe(0o600);
        const contents = await readFile(recordPath, "utf8");
        expect(contents).not.toContain("Keeps authentication state");
        expect(contents).not.toContain("feature/login-redirect");
    });

    test("isolates state by profile and full repository identity", async () => {
        const harness = await setup();
        expect((await run(harness)).exitCode).toBe(0);
        expect((await run(harness, "normal", ["--profile", "secondary"])).exitCode).toBe(0);
        const otherWorktree = path.join(harness.root, "other-repository-worktree");
        await mkdir(otherWorktree);
        const fixture = await readFixture(harness);
        fixture.worktree = otherWorktree;
        fixture.metadata!.url = "https://github.com/owner/other-repo/pull/123";
        await writeFixture(harness, fixture);
        expect((await run(harness, "normal", ["--repo", "owner/other-repo"])).exitCode).toBe(0);
        expect(await readdir(path.join(harness.stateRoot, "records"))).toHaveLength(3);
        expect(
            new Set((await readFixture(harness)).sessions.map((session) => session.profile)),
        ).toEqual(new Set(["main", "secondary"]));
    });

    test("shares naming across normal then review with separate IDs", async () => {
        const harness = await setup();
        expect((await run(harness, "normal")).exitCode).toBe(0);
        expect((await run(harness, "review")).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        expect(fixture.sessions.map((session) => session.title)).toEqual([
            "Improve api login redirect",
            "Review - Improve api login redirect",
        ]);
        expect(new Set(fixture.sessions.map((session) => session.id)).size).toBe(2);
        expect((await calls(harness)).filter((call) => call.command === "claude")).toHaveLength(1);
    });

    test("shares naming across review then normal with separate IDs", async () => {
        const harness = await setup();
        expect((await run(harness, "review")).exitCode).toBe(0);
        expect((await run(harness, "normal")).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        expect(fixture.sessions.map((session) => session.title)).toEqual([
            "Review - Improve api login redirect",
            "Improve api login redirect",
        ]);
        expect((await calls(harness)).filter((call) => call.command === "claude")).toHaveLength(1);
    });

    test("serializes simultaneous creation", async () => {
        const harness = await setup({
            inference: {
                output: '{"group":"Dotfiles","title":"Concurrent session"}',
                delayMs: 100,
            },
        });
        const [first, second] = await Promise.all([run(harness), run(harness)]);
        expect(first.exitCode).toBe(0);
        expect(second.exitCode).toBe(0);
        expect((await readFixture(harness)).sessions).toHaveLength(1);
        const recorded = await calls(harness);
        expect(recorded.filter((call) => call.command === "claude")).toHaveLength(1);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("add")),
        ).toHaveLength(1);
    });

    test("reclaims only a nonce-owned lock from a dead process", async () => {
        const harness = await setup();
        const key = createHash("sha256")
            .update(JSON.stringify(["main", "github.com/owner/dotfiles", 123]))
            .digest("hex");
        const locks = path.join(harness.stateRoot, "locks");
        await mkdir(locks, { recursive: true });
        await writeFile(
            path.join(locks, key + ".lock"),
            JSON.stringify({ pid: 2_147_483_647, nonce: "abandoned" }) + "\n",
        );
        expect((await run(harness)).exitCode).toBe(0);
        expect(await readdir(locks)).toEqual([]);
    });

    test("recovers an interrupted registration from its pending intent", async () => {
        const harness = await setup({ failures: { addAfterCreate: true } });
        expect((await run(harness)).exitCode).toBe(1);
        expect((await run(harness)).exitCode).toBe(0);
        expect((await readFixture(harness)).sessions).toHaveLength(1);
        expect(
            (await calls(harness)).filter(
                (call) => call.command === "aoe" && call.args.includes("add"),
            ),
        ).toHaveLength(1);
    });

    test("recovers one exact legacy session and preserves display metadata", async () => {
        const harness = await setup();
        const fixture = await readFixture(harness);
        fixture.sessions.push({
            id: "legacy-1",
            title: "pr owner/dotfiles#123",
            path: harness.worktree,
            group: "Legacy group",
            profile: "main",
            agent_session_id: null,
        });
        await writeFixture(harness, fixture);
        const result = await run(harness);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("legacy-1");
        expect(result.stdout).toContain("Legacy group/pr owner/dotfiles#123");
        const recorded = await calls(harness);
        expect(recorded.filter((call) => call.command === "claude")).toHaveLength(0);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("add")),
        ).toHaveLength(0);
    });

    test("refuses ambiguous legacy recovery", async () => {
        const harness = await setup();
        const fixture = await readFixture(harness);
        for (const id of ["legacy-1", "legacy-2"]) {
            fixture.sessions.push({
                id,
                title: "pr owner/dotfiles#123",
                path: harness.worktree,
                group: "Legacy",
                profile: "main",
                agent_session_id: null,
            });
        }
        await writeFixture(harness, fixture);
        const result = await run(harness);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ambiguous");
        expect((await readFixture(harness)).sessions).toHaveLength(2);
    });

    test("does not adopt a matching title from another worktree", async () => {
        const harness = await setup();
        const elsewhere = path.join(harness.root, "elsewhere");
        await mkdir(elsewhere);
        const fixture = await readFixture(harness);
        fixture.sessions.push({
            id: "unrelated",
            title: "Improve api login redirect",
            path: elsewhere,
            group: "Dotfiles",
            profile: "main",
        });
        await writeFixture(harness, fixture);
        expect((await run(harness)).exitCode).toBe(0);
        expect((await readFixture(harness)).sessions).toHaveLength(2);
    });

    test("rejects an unassociated same-title collision in the selected worktree", async () => {
        const harness = await setup();
        const fixture = await readFixture(harness);
        fixture.sessions.push({
            id: "other-pr",
            title: "Improve api login redirect",
            path: harness.worktree,
            group: "Dotfiles",
            profile: "main",
        });
        await writeFixture(harness, fixture);
        const result = await run(harness);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("display-name collision");
        expect(
            (await calls(harness)).filter(
                (call) => call.command === "aoe" && call.args.includes("add"),
            ),
        ).toHaveLength(0);
    });

    test("replaces a stale stored ID without repeating naming inference", async () => {
        const harness = await setup();
        expect((await run(harness)).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        fixture.sessions = [];
        await writeFixture(harness, fixture);
        expect((await run(harness)).exitCode).toBe(0);
        const recorded = await calls(harness);
        expect(recorded.filter((call) => call.command === "claude")).toHaveLength(1);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("add")),
        ).toHaveLength(2);
    });

    test("preserves manual title and group changes on ID reuse", async () => {
        const harness = await setup();
        expect((await run(harness)).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        fixture.sessions[0]!.title = "My manual name";
        fixture.sessions[0]!.group = "My manual group";
        await writeFixture(harness, fixture);
        const repeated = await run(harness);
        expect(repeated.exitCode).toBe(0);
        expect(repeated.stdout).toContain("My manual group/My manual name");
        expect(
            (await calls(harness)).filter(
                (call) => call.command === "aoe" && call.args.includes("add"),
            ),
        ).toHaveLength(1);
    });
});

describe("review lifecycle", () => {
    test("registers before starting through the installed shim", async () => {
        const harness = await setup();
        expect((await run(harness, "review")).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        expect(fixture.starts).toBe(1);
        expect(fixture.lastLaunchArgs).toEqual([
            "/review-team",
            "owner/dotfiles#123",
            "--session-id",
            "00000000-0000-4000-8000-000000000001",
        ]);
        expect(fixture.lastCommandOverride).toBe(harness.env.GHD_AOE_CLAUDE_SHIM);
        const addCall = (await calls(harness)).find(
            (call) => call.command === "aoe" && call.args.includes("add"),
        );
        expect(addCall?.args).not.toContain("--trust-hooks");
        expect(addCall?.args).not.toContain("-l");
        expect(addCall?.args).not.toContain("--launch");
        const markerFiles = await readdir(path.join(harness.stateRoot, "reviews"));
        expect(markerFiles).toEqual(["session-1.json"]);
        expect(
            (await stat(path.join(harness.stateRoot, "reviews", markerFiles[0]!))).mode & 0o777,
        ).toBe(0o600);
    });

    test("leaves a running review alone and resumes a stopped conversation", async () => {
        const harness = await setup();
        expect((await run(harness, "review")).exitCode).toBe(0);
        expect((await run(harness, "review")).exitCode).toBe(0);
        let fixture = await readFixture(harness);
        expect(fixture.starts).toBe(1);

        fixture.runtime = [];
        await writeFixture(harness, fixture);
        expect((await run(harness, "review")).exitCode).toBe(0);
        fixture = await readFixture(harness);
        expect(fixture.starts).toBe(2);
        expect(fixture.lastLaunchArgs).toEqual([
            "/review-team",
            "owner/dotfiles#123",
            "--resume",
            "00000000-0000-4000-8000-000000000001",
        ]);
        expect(
            (await calls(harness)).filter(
                (call) => call.command === "aoe" && call.args.includes("add"),
            ),
        ).toHaveLength(1);
    });

    test("rejects a fresh replacement after conversation loss", async () => {
        const harness = await setup();
        expect((await run(harness, "review")).exitCode).toBe(0);
        const fixture = await readFixture(harness);
        fixture.runtime = [];
        fixture.sessions[0]!.agent_session_id = null;
        await writeFixture(harness, fixture);
        const retry = await run(harness, "review");
        expect(retry.exitCode).toBe(1);
        expect(retry.stderr).toContain("recorded conversation is missing");
        expect((await readFixture(harness)).starts).toBe(1);
    });

    test("retains a registered association after startup failure", async () => {
        const harness = await setup({ failures: { start: true } });
        const failed = await run(harness, "review");
        expect(failed.exitCode).toBe(1);
        expect(failed.stderr).toContain("AoE review launch failed");
        const fixture = await readFixture(harness);
        fixture.failures.start = false;
        await writeFixture(harness, fixture);
        expect((await run(harness, "review")).exitCode).toBe(0);
        const recorded = await calls(harness);
        expect(
            recorded.filter((call) => call.command === "aoe" && call.args.includes("add")),
        ).toHaveLength(1);
        expect(recorded.filter((call) => call.command === "claude")).toHaveLength(1);
    });
});

describe("opt-in Haiku benchmark", () => {
    test("reports startup-inclusive validity and never creates a session", async () => {
        const harness = await setup();
        const child = Bun.spawn(
            ["bun", benchmark, "--repo", "owner/dotfiles", "--pr", "123", "--profile", "main"],
            {
                env: { ...harness.env, GHD_AOE_RUN_HAIKU_BENCHMARK: "1" },
                stdout: "pipe",
                stderr: "pipe",
            },
        );
        const [exitCode, stdout] = await Promise.all([
            child.exited,
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
        ]);
        expect(exitCode).toBe(0);
        expect(JSON.parse(stdout)).toMatchObject({
            deadlineMs: 10_000,
            completedWithinDeadline: true,
            outputValid: true,
            timedOut: false,
            usedFallback: false,
            cleanup: "inference process exited",
        });
        expect(
            (await calls(harness)).some(
                (call) => call.command === "aoe" && call.args.includes("add"),
            ),
        ).toBe(false);
    });
});

describe("gh-dash integration", () => {
    test("renders queue and background-review bindings without attachment or hook trust", async () => {
        const config = await readFile(
            path.join(repositoryRoot, "dot_config", "gh-dash", "config.yml"),
            "utf8",
        );
        expect(config).toContain(
            'ghd-aoe --repo-path "{{.RepoPath}}" --repo "{{.RepoName}}" --pr "{{.PrNumber}}" --mode normal',
        );
        expect(config).toContain(
            'ghd-aoe --repo-path "{{.RepoPath}}" --repo "{{.RepoName}}" --pr "{{.PrNumber}}" --mode review',
        );
        expect(config).not.toContain("{{.Title}}");
        expect(config).not.toContain("--trust-hooks");
        expect(config).not.toContain("tmux split-window -h 'ghd-aoe");
    });

    test("documents naming, timeout fallback, and review reuse", async () => {
        const manual = await readFile(path.join(repositoryRoot, "docs", "manual.html"), "utf8");
        const renderedText = manual.replace(/\s+/g, " ");
        expect(renderedText).toContain("Haiku selects");
        expect(renderedText).toContain("10-second timeout");
        expect(renderedText).toContain("Review - &lt;title&gt;");
        expect(renderedText).toContain("without repeating");
    });
});
