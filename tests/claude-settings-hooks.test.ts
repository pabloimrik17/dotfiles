import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const settings = path.join(repositoryRoot, "dot_claude", "modify_settings.json.tmpl");
const SENTINEL = "# aoe-hooks";

type Hook = { type: string; command: string; timeout?: number };
type Group = { matcher?: string; hooks: Hook[] };
type Hooks = Record<string, Group[]>;

const rexGroup: Group = {
    hooks: [
        {
            type: "command",
            command:
                "/bin/sh -c 'rex __internal session-start --agent claude --feature-session-naming=false 2>/dev/null || true'",
            timeout: 5,
        },
    ],
};
const foreignHook: Hook = { type: "command", command: "echo foreign" };
const staleAoeGroup: Group = {
    hooks: [{ type: "command", command: "sh -c 'printf old; exit 0 # aoe-hooks'" }],
};

let directory: string;
let script: string;
let managed: Hooks;

function run(command: string[], input?: string) {
    const result = Bun.spawnSync(command, {
        cwd: repositoryRoot,
        stdin: input === undefined ? "ignore" : Buffer.from(input),
        stdout: "pipe",
        stderr: "pipe",
    });
    return {
        exitCode: result.exitCode,
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
    };
}

function merge(live: unknown) {
    const input = typeof live === "string" ? live : JSON.stringify(live);
    const result = run(["/bin/sh", script], input);
    expect(result.exitCode, result.stderr).toBe(0);
    return { text: result.stdout, hooks: JSON.parse(result.stdout).hooks as Hooks };
}

beforeAll(async () => {
    const rendered = run([
        "chezmoi",
        "execute-template",
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--override-data",
        JSON.stringify({
            machineType: "personal",
            chezmoi: { os: "darwin", arch: "arm64", homeDir: "/home/test", destDir: "/home/test" },
        }),
        "--file",
        settings,
    ]);
    expect(rendered.exitCode, rendered.stderr).toBe(0);
    directory = await mkdtemp(path.join(tmpdir(), "claude-hooks-"));
    script = path.join(directory, "modify_settings.sh");
    await writeFile(script, rendered.stdout, { mode: 0o755 });
    managed = merge("{}").hooks;
});

afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
});

describe("hooks.<Event> merge by matcher group", () => {
    test("every managed group is AoE-owned", () => {
        // A managed group without the sentinel would be kept as foreign once
        // its live copy drifts from the template, and then duplicated.
        for (const groups of Object.values(managed)) {
            for (const group of groups) {
                expect(group.hooks.length).toBeGreaterThan(0);
                for (const hook of group.hooks) expect(hook.command).toContain(SENTINEL);
            }
        }
    });

    test("fresh {} gives exactly the managed groups", () => {
        expect(Object.keys(managed).sort()).toEqual(
            [
                "ElicitationResult",
                "Notification",
                "PostToolUse",
                "PreToolUse",
                "SessionStart",
                "Stop",
                "StopFailure",
                "UserPromptSubmit",
            ].sort(),
        );
        expect(managed).not.toHaveProperty("PreCompact");
    });

    test("Rex group in SessionStart survives ahead of the managed group", () => {
        const { hooks } = merge({ hooks: { SessionStart: [rexGroup] } });
        expect(hooks.SessionStart).toEqual([rexGroup, ...managed.SessionStart]);
        expect({ ...hooks, SessionStart: managed.SessionStart }).toEqual(managed);
    });

    test("stale AoE group is replaced, not duplicated", () => {
        const { hooks } = merge({ hooks: { Stop: [staleAoeGroup] } });
        expect(hooks.Stop).toEqual(managed.Stop);
    });

    test("foreign group in another managed event survives", () => {
        const foreign: Group = { matcher: "Bash", hooks: [foreignHook] };
        const { hooks } = merge({ hooks: { PreToolUse: [foreign, ...managed.PreToolUse] } });
        expect(hooks.PreToolUse).toEqual([foreign, ...managed.PreToolUse]);
    });

    test("group mixing an AoE and a foreign command is kept", () => {
        const mixed: Group = { hooks: [...staleAoeGroup.hooks, foreignHook] };
        const { hooks } = merge({ hooks: { Stop: [mixed] } });
        expect(hooks.Stop).toEqual([mixed, ...managed.Stop]);
    });

    test("live copy of a managed group is not duplicated", () => {
        const { hooks } = merge({ hooks: { Notification: managed.Notification } });
        expect(hooks.Notification).toEqual(managed.Notification);
    });

    test("unmanaged event survives untouched", () => {
        const subagent = [{ hooks: [foreignHook] }];
        const { hooks } = merge({ hooks: { SubagentStop: subagent } });
        expect(hooks.SubagentStop).toEqual(subagent);
    });

    const repeatCases: [string, () => string][] = [
        ["fresh", () => "{}"],
        ["Rex", () => JSON.stringify({ hooks: { SessionStart: [rexGroup] } })],
        [
            "Rex after AoE in AoE key order",
            () =>
                JSON.stringify(
                    {
                        hooks: {
                            SessionStart: [
                                {
                                    hooks: [
                                        {
                                            type: "command",
                                            command: managed.SessionStart[0].hooks[0].command,
                                        },
                                    ],
                                },
                                rexGroup,
                            ],
                        },
                    },
                    null,
                    2,
                ) + "\n",
        ],
    ];
    test.each(repeatCases)("%s: output fed back in is byte-identical", (_, live) => {
        const first = merge(live());
        const second = merge(first.text);
        expect(second.text).toBe(first.text);
    });
});
