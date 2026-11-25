import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const settings = path.join(repositoryRoot, "dot_claude", "modify_settings.json.tmpl");
const removedPlugin = "code-review@claude-plugins-official";
const temporaryDirectories: string[] = [];

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

async function merge(live: unknown, [os, arch, machineType]: readonly string[]) {
    const rendered = run([
        "chezmoi",
        "execute-template",
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--override-data",
        JSON.stringify({
            machineType,
            chezmoi: { os, arch, homeDir: "/home/test", destDir: "/home/test" },
        }),
        "--file",
        settings,
    ]);
    expect(rendered.exitCode, rendered.stderr).toBe(0);
    const directory = await mkdtemp(path.join(tmpdir(), "claude-settings-plugins-"));
    temporaryDirectories.push(directory);
    const script = path.join(directory, "modify_settings.sh");
    await writeFile(script, rendered.stdout, { mode: 0o755 });
    const result = run(["/bin/sh", script], JSON.stringify(live));
    expect(result.exitCode, result.stderr).toBe(0);
    return JSON.parse(result.stdout) as { enabledPlugins: Record<string, boolean> };
}

const machines = [
    ["darwin", "arm64", "personal"],
    ["darwin", "amd64", "work"],
    ["linux", "amd64", "personal"],
] as const;

test.each(machines)(
    "a fresh %s/%s/%s file never enables the removed plugin",
    async (...machine) => {
        const { enabledPlugins } = await merge({}, machine);
        expect(Object.keys(enabledPlugins).length).toBeGreaterThan(0);
        expect(enabledPlugins).not.toHaveProperty(removedPlugin);
    },
);

test.each(machines)(
    "a live %s/%s/%s file loses the removed plugin's key and keeps the others",
    async (...machine) => {
        const live = {
            enabledPlugins: {
                [removedPlugin]: true,
                "other@elsewhere": true,
                "superpowers@superpowers-marketplace": false,
            },
        };
        const { enabledPlugins } = await merge(live, machine);
        expect(enabledPlugins).not.toHaveProperty(removedPlugin);
        expect(enabledPlugins["other@elsewhere"]).toBe(true);
        expect(enabledPlugins).toHaveProperty("superpowers@superpowers-marketplace");
    },
);
