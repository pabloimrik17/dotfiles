import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const settings = path.join(repositoryRoot, "dot_claude", "modify_settings.json.tmpl");
const rule = path.join(repositoryRoot, "dot_claude", "rules", "knowledge-base.md");
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

function render(os = "darwin", arch = "arm64", machineType = "personal") {
    const result = run([
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
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

async function merge(live: unknown, machine?: Parameters<typeof render>) {
    const directory = await mkdtemp(path.join(tmpdir(), "kb-settings-"));
    temporaryDirectories.push(directory);
    const script = path.join(directory, "modify_settings.sh");
    await writeFile(script, render(...(machine ?? [])), { mode: 0o755 });
    const input = typeof live === "string" ? live : JSON.stringify(live);
    const result = run(["/bin/sh", script], input);
    expect(result.exitCode, result.stderr).toBe(0);
    return { text: result.stdout, json: JSON.parse(result.stdout) };
}

const machines: Parameters<typeof render>[] = [
    ["darwin", "arm64", "personal"],
    ["darwin", "arm64", "work"],
    ["linux", "amd64", "personal"],
];

describe("obsidian plugin settings", () => {
    for (const machine of machines) {
        test(`fresh render on ${machine.join("/")}`, async () => {
            const { json } = await merge("{}", machine);
            expect(json.enabledPlugins["obsidian@obsidian-skills"]).toBe(true);
            const marketplace = json.extraKnownMarketplaces["obsidian-skills"];
            expect(marketplace.autoUpdate).toBe(true);
            expect(marketplace.source).toEqual({
                source: "github",
                repo: "obsidianmd/obsidian-skills",
            });
            expect(marketplace.source).not.toHaveProperty("ref");
            expect(json.pluginConfigs["experiments@monolab"].options.knowledge_root).toBe(
                "~/WebstormProjects/knowledge/updates",
            );
        });
    }

    test("unrelated plugins and marketplaces survive", async () => {
        const { json } = await merge({
            enabledPlugins: { "other@elsewhere": true },
            extraKnownMarketplaces: { elsewhere: { source: { source: "github", repo: "a/b" } } },
        });
        expect(json.enabledPlugins["other@elsewhere"]).toBe(true);
        expect(json.extraKnownMarketplaces.elsewhere.source.repo).toBe("a/b");
        expect(json.enabledPlugins["obsidian@obsidian-skills"]).toBe(true);
    });
});

describe("knowledge_root", () => {
    test("other pluginConfigs and sibling options survive", async () => {
        const { json } = await merge({
            pluginConfigs: {
                "other@x": { options: { a: 1 } },
                "experiments@monolab": { options: { keep: "me" }, extra: true },
            },
        });
        expect(json.pluginConfigs["other@x"]).toEqual({ options: { a: 1 } });
        expect(json.pluginConfigs["experiments@monolab"].options.keep).toBe("me");
        expect(json.pluginConfigs["experiments@monolab"].extra).toBe(true);
        expect(json.pluginConfigs["experiments@monolab"].options.knowledge_root).toBe(
            "~/WebstormProjects/knowledge/updates",
        );
    });

    test.each(["", "/somewhere/else"])("live value %p is replaced", async (value) => {
        const { json } = await merge({
            pluginConfigs: { "experiments@monolab": { options: { knowledge_root: value } } },
        });
        expect(json.pluginConfigs["experiments@monolab"].options.knowledge_root).toBe(
            "~/WebstormProjects/knowledge/updates",
        );
    });

    test("output fed back in is byte-identical", async () => {
        const first = await merge("{}");
        const second = await merge(first.text);
        expect(second.text).toBe(first.text);
    });
});

describe("knowledge-base rule", () => {
    test("states location, write policy, conventions and script-owned updates", async () => {
        const text = await readFile(rule, "utf8");
        expect(text).toContain("~/WebstormProjects/knowledge");
        expect(text).toMatch(/only when the person asks/i);
        expect(text).toContain("AGENTS.md");
        expect(text).toMatch(/`updates\/`[^\n]*scripts[^\n]*Never edit/);
    });
});
