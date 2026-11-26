import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const installerTemplate = path.join(repositoryRoot, "run_onchange_install-packages.sh.tmpl");
const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    );
});

function run(command: string[], env?: Record<string, string>) {
    const result = Bun.spawnSync(command, {
        cwd: repositoryRoot,
        env: env ? { ...process.env, ...env } : undefined,
        stdout: "pipe",
        stderr: "pipe",
    });
    return {
        exitCode: result.exitCode,
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
    };
}

let cachedGroup: string | undefined;

function codexGroup(): string {
    if (cachedGroup !== undefined) return cachedGroup;
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
            chezmoi: { os: "darwin", arch: "arm64", destDir: "/home/test" },
        }),
        "--file",
        installerTemplate,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    const start = result.stdout.indexOf("# Group 8.75: Codex plugins");
    const end = result.stdout.indexOf("# Group 9:");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    cachedGroup = result.stdout.slice(start, end);
    return cachedGroup;
}

interface Scenario {
    marketplaces?: string[];
    queryFails?: boolean;
    queryGarbage?: boolean;
    addFails?: boolean;
    installed?: string[];
}

async function runGroup(scenario: Scenario) {
    const root = await mkdtemp(path.join(tmpdir(), "codex-plugins-"));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    const log = path.join(root, "codex.log");
    await mkdir(bin);
    const jq = Bun.which("jq");
    expect(jq, "jq must be installed to run the Codex plugin group").toBeTruthy();
    await symlink(jq!, path.join(bin, "jq"));
    const codex = path.join(bin, "codex");
    // Canned JSON per subcommand; every call is logged as one argv line.
    await writeFile(
        codex,
        `#!/bin/bash
echo "$*" >> "$CODEX_LOG"
case "$1 $2 $3" in
    "plugin list --json")
        printf '{"installed":[%s]}' "$CODEX_INSTALLED_JSON" ;;
    "plugin marketplace list")
        [ "$CODEX_QUERY_FAILS" = 1 ] && exit 1
        [ "$CODEX_QUERY_GARBAGE" = 1 ] && { echo 'not json'; exit 0; }
        printf '{"marketplaces":[%s]}' "$CODEX_MARKETPLACES_JSON" ;;
    "plugin marketplace add")
        [ "$CODEX_ADD_FAILS" = 1 ] && exit 1
        exit 0 ;;
    "plugin add "*) exit 0 ;;
    *) exit 2 ;;
esac
`,
    );
    await chmod(codex, 0o755);
    const script = path.join(root, "group.sh");
    await writeFile(
        script,
        `ERRORS=0
info() { printf 'INFO: %s\\n' "$*"; }
warn() { printf 'WARN: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
confirm() { printf 'CONFIRM: %s\\n' "$1"; return 0; }
${codexGroup()}
printf 'ERROR_COUNT=%s\\n' "$ERRORS"
`,
    );
    const quote = (names: string[], extra: (name: string) => string) =>
        names.map((name) => extra(name)).join(",");
    const result = run(["/bin/bash", script], {
        PATH: `${bin}:/usr/bin:/bin`,
        CODEX_LOG: log,
        CODEX_QUERY_FAILS: scenario.queryFails ? "1" : "0",
        CODEX_QUERY_GARBAGE: scenario.queryGarbage ? "1" : "0",
        CODEX_ADD_FAILS: scenario.addFails ? "1" : "0",
        CODEX_MARKETPLACES_JSON: quote(
            scenario.marketplaces ?? ["openai-curated"],
            (name) => `{"name":"${name}","root":"/tmp/${name}"}`,
        ),
        CODEX_INSTALLED_JSON: quote(
            scenario.installed ?? [],
            (id) => `{"pluginId":"${id}","installed":true,"enabled":true}`,
        ),
    });
    expect(result.exitCode, result.stderr).toBe(0);
    const calls = (await readFile(log, "utf8").catch(() => "")).split("\n").filter(Boolean);
    return { output: result.stdout, calls };
}

const marketplaceAdd = "plugin marketplace add obsidianmd/obsidian-skills";
const obsidianAdd = "plugin add obsidian@obsidian-skills";
const superpowersAdd = "plugin add superpowers@openai-curated";
const expoAdd = "plugin add expo@openai-curated";

test("a missing marketplace is registered before its plugin installs", async () => {
    const { output, calls } = await runGroup({});
    expect(calls).toContain(marketplaceAdd);
    expect(calls.indexOf(marketplaceAdd)).toBeLessThan(calls.indexOf(obsidianAdd));
    expect(calls).toContain(superpowersAdd);
    expect(calls).toContain(expoAdd);
    expect(output).toContain("ERROR_COUNT=0");
});

test("an already registered marketplace is not added again", async () => {
    const { calls } = await runGroup({ marketplaces: ["openai-curated", "obsidian-skills"] });
    expect(calls).toContain(obsidianAdd);
    expect(calls.some((call) => call.startsWith("plugin marketplace add"))).toBe(false);
});

test("a failed add warns, skips only that marketplace's plugins and does not fail the run", async () => {
    const { output, calls } = await runGroup({ addFails: true });
    expect(calls).toContain(marketplaceAdd);
    expect(calls).not.toContain(obsidianAdd);
    expect(calls).toContain(superpowersAdd);
    expect(output).toContain("WARN: Could not register Codex marketplace obsidian-skills");
    expect(output).toContain("ERROR_COUNT=0");
});

test.each([
    ["exits non-zero", { queryFails: true }],
    ["returns unreadable JSON", { queryGarbage: true }],
] as const)(
    "a marketplace query that %s warns and skips without adding",
    async (_label, scenario) => {
        const { output, calls } = await runGroup(scenario);
        expect(calls.some((call) => call.startsWith("plugin marketplace add"))).toBe(false);
        expect(calls).not.toContain(obsidianAdd);
        expect(calls).toContain(superpowersAdd);
        expect(output).toContain("WARN: Could not read Codex marketplaces");
        expect(output).toContain("ERROR_COUNT=0");
    },
);

test("only built-in plugins pending runs no marketplace command", async () => {
    const { output, calls } = await runGroup({ installed: ["obsidian@obsidian-skills"] });
    expect(calls).toContain(superpowersAdd);
    expect(calls.some((call) => call.startsWith("plugin marketplace"))).toBe(false);
    expect(output).toContain("obsidian@obsidian-skills — already installed, skipping");
});

test("everything installed neither prompts nor runs any marketplace or add command", async () => {
    const { output, calls } = await runGroup({
        installed: [
            "superpowers@openai-curated",
            "obsidian@obsidian-skills",
            "expo@openai-curated",
        ],
    });
    expect(calls).toEqual(["plugin list --json"]);
    expect(output).toContain("Codex plugins: 3/3 installed");
    expect(output).not.toContain("CONFIRM:");
});
