import { afterEach, expect, test } from "bun:test";
import {
    chmod,
    copyFile,
    mkdir,
    mkdtemp,
    readFile,
    rm,
    symlink,
    writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const cleanupTemplate = path.join(
    repositoryRoot,
    "run_once_after_remove-superwhisper-agent-plugins.sh.tmpl",
);
const fakeAgent = path.join(repositoryRoot, "tests", "fixtures", "fake-agent-cli.sh");
const temporaryDirectories: string[] = [];

const PLUGIN = "superwhisper@superwhisper";
const MARKETPLACE = "superwhisper";
const OPENCODE_PACKAGE = "@superwhisper/opencode";
const SYSTEM_TOOLS = ["grep", "mv", "sort", "tr"];

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    );
});

function render(os: string): string {
    const result = Bun.spawnSync(
        [
            "chezmoi",
            "execute-template",
            "--config",
            "/dev/null",
            "--config-format",
            "toml",
            "--override-data",
            JSON.stringify({
                chezmoi: { os, arch: "arm64", homeDir: "/home/test", destDir: "/home/test" },
            }),
            "--file",
            cleanupTemplate,
        ],
        { cwd: repositoryRoot, stdout: "pipe", stderr: "pipe" },
    );
    expect(result.exitCode, result.stderr.toString()).toBe(0);
    return result.stdout.toString();
}

type Agent = "claude" | "codex" | "opencode";
type Flag = "list-fails" | "list-garbage" | "list-renamed" | "remove-fails" | "remove-sticky";

interface Listed {
    plugins?: string[];
    marketplaces?: string[];
    flags?: Flag[];
}

interface Scenario {
    claude?: Listed;
    codex?: Listed;
    opencode?: {
        files?: Partial<Record<"opencode.json" | "opencode.jsonc", string>>;
        flags?: Flag[];
    };
    missing?: (Agent | "jq")[];
}

interface Sandbox {
    root: string;
    bin: string;
    state: string;
    home: string;
    opencodeConfig: string;
    log: string;
    fake: string;
}

async function createSandbox(): Promise<Sandbox> {
    const root = await mkdtemp(path.join(tmpdir(), "agent-plugin-retirement-"));
    temporaryDirectories.push(root);
    const home = path.join(root, "home");
    const sandbox: Sandbox = {
        root,
        bin: path.join(root, "bin"),
        state: path.join(root, "state"),
        home,
        opencodeConfig: path.join(home, ".config", "opencode"),
        log: path.join(root, "calls.log"),
        fake: path.join(root, "fake-agent-cli.sh"),
    };
    await mkdir(sandbox.bin);
    await mkdir(sandbox.state);
    await mkdir(sandbox.opencodeConfig, { recursive: true });

    for (const tool of SYSTEM_TOOLS) {
        await linkTool(sandbox, tool, Bun.which(tool, { PATH: "/usr/bin:/bin" }));
    }
    await copyFile(fakeAgent, sandbox.fake);
    await chmod(sandbox.fake, 0o755);
    return sandbox;
}

async function linkTool(sandbox: Sandbox, name: string, target: string | null) {
    expect(target, `${name} must be installed to run the cleanup`).toBeTruthy();
    await symlink(target!, path.join(sandbox.bin, name));
}

async function installAgent(sandbox: Sandbox, agent: Agent, scenario: Scenario) {
    if (!scenario.missing?.includes(agent)) {
        await symlink(sandbox.fake, path.join(sandbox.bin, agent));
    }
    for (const flag of scenario[agent]?.flags ?? []) {
        await writeFile(path.join(sandbox.state, `${agent}.${flag}`), "");
    }
}

async function seedListings(sandbox: Sandbox, agent: "claude" | "codex", listed: Listed = {}) {
    for (const kind of ["plugins", "marketplaces"] as const) {
        const lines = listed[kind] ?? [];
        await writeFile(
            path.join(sandbox.state, `${agent}.${kind}`),
            lines.map((line) => `${line}\n`).join(""),
        );
    }
}

async function readLines(file: string) {
    return (await readFile(file, "utf8").catch(() => "")).split("\n").filter(Boolean);
}

async function runCleanup(scenario: Scenario = {}) {
    const sandbox = await createSandbox();
    if (!scenario.missing?.includes("jq")) {
        await linkTool(sandbox, "jq", Bun.which("jq"));
    }
    for (const agent of ["claude", "codex", "opencode"] as const) {
        await installAgent(sandbox, agent, scenario);
    }
    await seedListings(sandbox, "claude", scenario.claude);
    await seedListings(sandbox, "codex", scenario.codex);
    for (const [name, contents] of Object.entries(scenario.opencode?.files ?? {})) {
        await writeFile(path.join(sandbox.opencodeConfig, name), contents);
    }

    const script = path.join(sandbox.root, "cleanup.sh");
    await writeFile(script, render("darwin"));
    const result = Bun.spawnSync(["/bin/bash", script], {
        cwd: sandbox.root,
        env: {
            PATH: sandbox.bin,
            HOME: sandbox.home,
            FAKE_STATE: sandbox.state,
            FAKE_LOG: sandbox.log,
        },
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
    });

    return {
        exitCode: result.exitCode,
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
        calls: await readLines(sandbox.log),
        listed: (agent: "claude" | "codex", kind: "plugins" | "marketplaces") =>
            readLines(path.join(sandbox.state, `${agent}.${kind}`)),
        opencodeFile: (name: string) => readFile(path.join(sandbox.opencodeConfig, name), "utf8"),
    };
}

const agentNames = { claude: "Claude Code", codex: "Codex", opencode: "OpenCode" };

const removals = (calls: string[]) => calls.filter((call) => /\b(uninstall|remove)\b/.test(call));

const pluginRemoval = {
    claude: `claude plugin uninstall ${PLUGIN}`,
    codex: `codex plugin remove ${PLUGIN}`,
};
const marketplaceRemoval = {
    claude: `claude plugin marketplace remove ${MARKETPLACE}`,
    codex: `codex plugin marketplace remove ${MARKETPLACE}`,
};
const opencodeWithPlugin = JSON.stringify(
    { plugins: [{ package: OPENCODE_PACKAGE }, { package: "opencode-wakatime" }] },
    null,
    4,
);

test.each(["claude", "codex"] as const)(
    "%s: removes the plugin, then the marketplace, and keeps the others",
    async (agent) => {
        const run = await runCleanup({
            [agent]: { plugins: [PLUGIN, "other@market"], marketplaces: [MARKETPLACE, "market"] },
        });
        expect(run.exitCode, run.stderr).toBe(0);
        expect(removals(run.calls)).toEqual([pluginRemoval[agent], marketplaceRemoval[agent]]);
        expect(await run.listed(agent, "plugins")).toEqual(["other@market"]);
        expect(await run.listed(agent, "marketplaces")).toEqual(["market"]);
        expect(run.calls.filter((call) => call === `${agent} plugin list --json`)).toHaveLength(2);
        expect(
            run.calls.filter((call) => call === `${agent} plugin marketplace list --json`),
        ).toHaveLength(2);
    },
);

test.each(["opencode.json", "opencode.jsonc"] as const)(
    "opencode: removes the plugin listed in %s and keeps the others",
    async (name) => {
        const run = await runCleanup({ opencode: { files: { [name]: opencodeWithPlugin } } });
        expect(run.exitCode, run.stderr).toBe(0);
        expect(removals(run.calls)).toEqual([`opencode plugin remove ${OPENCODE_PACKAGE}`]);
        const config = await run.opencodeFile(name);
        expect(config).not.toContain(OPENCODE_PACKAGE);
        expect(config).toContain("opencode-wakatime");
    },
);

// `opencode plugin remove` matches the configured specifier exactly: the bare
// name leaves `@superwhisper/opencode@latest` in place and still exits 0.
test("opencode: a versioned specifier is removed by its exact name", async () => {
    const run = await runCleanup({
        opencode: {
            files: {
                "opencode.jsonc": `// managed\n{\n    "plugins": [\n        { "package": "${OPENCODE_PACKAGE}@latest" },\n    ],\n}\n`,
            },
        },
    });
    expect(run.exitCode, run.stderr).toBe(0);
    expect(removals(run.calls)).toEqual([`opencode plugin remove ${OPENCODE_PACKAGE}@latest`]);
});

test.each(["claude", "codex"] as const)(
    "%s: a marketplace without the plugin is still removed",
    async (agent) => {
        const run = await runCleanup({ [agent]: { marketplaces: [MARKETPLACE] } });
        expect(run.exitCode, run.stderr).toBe(0);
        expect(removals(run.calls)).toEqual([marketplaceRemoval[agent]]);
        expect(await run.listed(agent, "marketplaces")).toEqual([]);
    },
);

test("nothing installed runs only the listings", async () => {
    const run = await runCleanup({
        claude: { plugins: ["other@market"], marketplaces: ["market"] },
        codex: { plugins: ["other@market"], marketplaces: ["market"] },
        opencode: {
            files: { "opencode.jsonc": '{ "plugins": [{ "package": "opencode-wakatime" }] }' },
        },
    });
    expect(run.exitCode, run.stderr).toBe(0);
    expect(run.calls).toEqual([
        "claude plugin list --json",
        "claude plugin marketplace list --json",
        "codex plugin list --json",
        "codex plugin marketplace list --json",
    ]);
});

test("no agent CLI on PATH skips every agent and exits 0", async () => {
    const run = await runCleanup({ missing: ["claude", "codex", "opencode"] });
    expect(run.exitCode, run.stderr).toBe(0);
    expect(run.calls).toEqual([]);
    for (const name of ["Claude Code", "Codex", "OpenCode"]) {
        expect(run.stdout).toContain(`${name} is not installed`);
    }
});

test("a run with stdin on /dev/null removes the plugin without prompting", async () => {
    const run = await runCleanup({ claude: { plugins: [PLUGIN] } });
    expect(run.exitCode, run.stderr).toBe(0);
    expect(`${run.stdout}${run.stderr}`).not.toMatch(/\[Y\/n\]|TTY/);
    expect(await run.listed("claude", "plugins")).toEqual([]);
});

test("a failed removal still cleans the other agents, then fails naming the agent", async () => {
    const run = await runCleanup({
        claude: { plugins: [PLUGIN], flags: ["remove-fails"] },
        codex: { plugins: [PLUGIN] },
        opencode: { files: { "opencode.json": opencodeWithPlugin } },
    });
    expect(run.exitCode).not.toBe(0);
    expect(run.calls).toContain(pluginRemoval.codex);
    expect(await run.listed("codex", "plugins")).toEqual([]);
    expect(await run.opencodeFile("opencode.json")).not.toContain(OPENCODE_PACKAGE);
    expect(run.stderr).toMatch(/failed for: Claude Code$/m);
});

test.each([
    ["claude", "list-fails"],
    ["claude", "list-garbage"],
    ["claude", "list-renamed"],
    ["codex", "list-fails"],
    ["codex", "list-garbage"],
    ["codex", "list-renamed"],
] as const)(
    "%s: an unreadable listing (%s) fails instead of reading as empty",
    async (agent, flag) => {
        const run = await runCleanup({
            [agent]: { plugins: [PLUGIN], marketplaces: [MARKETPLACE], flags: [flag] },
        });
        expect(run.exitCode).not.toBe(0);
        expect(removals(run.calls)).toEqual([]);
        expect(run.stderr).toMatch(new RegExp(`failed for: ${agentNames[agent]}$`, "m"));
    },
);

test("without jq, Claude Code and Codex fail with a hint and OpenCode is still cleaned", async () => {
    const run = await runCleanup({
        missing: ["jq"],
        claude: { plugins: [PLUGIN] },
        opencode: { files: { "opencode.json": opencodeWithPlugin } },
    });
    expect(run.exitCode).not.toBe(0);
    expect(removals(run.calls)).toEqual([`opencode plugin remove ${OPENCODE_PACKAGE}`]);
    expect(run.stderr).toContain("brew install jq");
    expect(run.stderr).toMatch(/failed for: Claude Code, Codex$/m);
});

test("opencode: with both config files, a plugin left in opencode.jsonc fails naming it", async () => {
    const run = await runCleanup({
        opencode: {
            files: { "opencode.json": '{ "plugins": [] }\n', "opencode.jsonc": opencodeWithPlugin },
        },
    });
    expect(run.exitCode).not.toBe(0);
    expect(run.stderr).toContain(`opencode.jsonc still lists ${OPENCODE_PACKAGE}`);
    expect(run.stderr).toMatch(/failed for: OpenCode$/m);
});

test.each([
    ["claude", { claude: { plugins: [PLUGIN], flags: ["remove-sticky"] } }],
    ["codex", { codex: { plugins: [PLUGIN], flags: ["remove-sticky"] } }],
    [
        "opencode",
        { opencode: { files: { "opencode.json": opencodeWithPlugin }, flags: ["remove-sticky"] } },
    ],
] as const)("%s: a plugin still listed after removal fails the run", async (agent, scenario) => {
    const run = await runCleanup(scenario as Scenario);
    expect(run.exitCode).not.toBe(0);
    expect(run.stderr).toMatch(new RegExp(`failed for: ${agentNames[agent]}$`, "m"));
});

test("the Linux render is empty", () => {
    expect(render("linux").trim()).toBe("");
});
