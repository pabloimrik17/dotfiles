import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const settings = path.join(repositoryRoot, "dot_claude", "modify_settings.json.tmpl");

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

function render() {
    const result = run([
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
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

function merge(live: string) {
    const result = run(["/bin/sh", writeScript()], live);
    expect(result.exitCode, result.stderr).toBe(0);
    return JSON.parse(result.stdout);
}

let scratch: string | undefined;
function writeScript() {
    if (!scratch) {
        scratch = mkdtempSync(path.join(tmpdir(), "agents-md-"));
        writeFileSync(path.join(scratch, "modify.sh"), render(), { mode: 0o700 });
    }
    return path.join(scratch, "modify.sh");
}

afterAll(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
});

const KEY = "cc-plugin-agents-md@builtin";

describe("AGENTS.md instruction files setting", () => {
    test("a missing pluginConfigs is created", () => {
        const out = merge('{"theme":"dark"}\n');
        expect(out.pluginConfigs[KEY]).toEqual({
            options: { instructionFiles: "claude-md-and-agents-md" },
        });
        expect(out.theme).toBe("dark");
    });

    test("other plugin entries and sibling options survive", () => {
        const out = merge(
            JSON.stringify({
                pluginConfigs: {
                    "other@market": { options: { a: 1 } },
                    [KEY]: { options: { instructionFiles: "claude-md-or-agents-md", extra: true } },
                },
            }),
        );
        expect(out.pluginConfigs["other@market"]).toEqual({ options: { a: 1 } });
        expect(out.pluginConfigs[KEY].options).toEqual({
            instructionFiles: "claude-md-and-agents-md",
            extra: true,
        });
    });

    test("an empty live file gets the key and a second merge is stable", () => {
        const first = run(["/bin/sh", writeScript()], "");
        expect(first.exitCode, first.stderr).toBe(0);
        expect(JSON.parse(first.stdout).pluginConfigs[KEY].options.instructionFiles).toBe(
            "claude-md-and-agents-md",
        );
        const second = run(["/bin/sh", writeScript()], first.stdout);
        expect(second.stdout).toBe(first.stdout);
    });
});
