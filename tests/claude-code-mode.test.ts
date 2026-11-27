import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const settings = path.join(repositoryRoot, "dot_claude", "modify_settings.json.tmpl");
const temporaryDirectories: string[] = [];
const CODE_MODE = "CLAUDE_CODE_EXPERIMENTAL_CODE_MODE";
const AGENT_TEAMS = "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS";

afterEach(async () => {
    await Promise.all(
        temporaryDirectories.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
});

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

type MachineType = "personal" | "work" | undefined;

function render(machineType: MachineType) {
    const data: Record<string, unknown> = {
        chezmoi: { os: "darwin", arch: "arm64", homeDir: "/home/test", destDir: "/home/test" },
    };
    if (machineType !== undefined) data.machineType = machineType;
    const result = run([
        "chezmoi",
        "execute-template",
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--override-data",
        JSON.stringify(data),
        "--file",
        settings,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

async function merge(machineType: MachineType, live: unknown = {}) {
    const directory = await mkdtemp(path.join(tmpdir(), "code-mode-"));
    temporaryDirectories.push(directory);
    const script = path.join(directory, "modify_settings.sh");
    await writeFile(script, render(machineType), { mode: 0o755 });
    const input = typeof live === "string" ? live : JSON.stringify(live);
    const result = run(["/bin/sh", script], input);
    expect(result.exitCode, result.stderr).toBe(0);
    return { text: result.stdout, json: JSON.parse(result.stdout) };
}

describe("Code Mode env key", () => {
    test("personal gets Code Mode and keeps agent teams", async () => {
        const { json } = await merge("personal");
        expect(json.env[CODE_MODE]).toBe("1");
        expect(json.env[AGENT_TEAMS]).toBe("1");
    });

    test.each<MachineType>(["work", undefined])("%p gets no Code Mode key", async (type) => {
        const { json } = await merge(type);
        expect(json.env).not.toHaveProperty(CODE_MODE);
        expect(json.env[AGENT_TEAMS]).toBe("1");
    });

    test.each<MachineType>(["work", undefined])(
        "hand-added key is removed on %p, other env keys survive",
        async (type) => {
            const { json } = await merge(type, { env: { [CODE_MODE]: "1", KEEP_ME: "yes" } });
            expect(json.env).not.toHaveProperty(CODE_MODE);
            expect(json.env.KEEP_ME).toBe("yes");
            expect(json.env[AGENT_TEAMS]).toBe("1");
        },
    );

    test("unmanaged env key survives on personal", async () => {
        const { json } = await merge("personal", { env: { KEEP_ME: "yes" } });
        expect(json.env.KEEP_ME).toBe("yes");
        expect(json.env[CODE_MODE]).toBe("1");
        expect(json.env[AGENT_TEAMS]).toBe("1");
    });

    test.each<MachineType>(["personal", "work"])(
        "output fed back in is byte-identical on %p",
        async (type) => {
            const first = await merge(type);
            const second = await merge(type, first.text);
            expect(second.text).toBe(first.text);
        },
    );
});
