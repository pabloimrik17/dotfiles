import { afterEach, expect, test } from "bun:test";
import {
    chmod,
    copyFile,
    lstat,
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

const renders = new Map<string, string>();

function render(os: string, arch = "arm64", machineType = "personal"): string {
    const key = `${os}|${arch}|${machineType}`;
    const cached = renders.get(key);
    if (cached !== undefined) return cached;
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
            chezmoi: { os, arch, destDir: "/home/test" },
        }),
        "--file",
        installerTemplate,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    renders.set(key, result.stdout);
    return result.stdout;
}

test.each(["darwin", "linux"])("%s render passes bash -n", async (os) => {
    const root = await mkdtemp(path.join(tmpdir(), "install-script-render-"));
    temporaryDirectories.push(root);
    const script = path.join(root, "install.sh");
    await writeFile(script, render(os));
    const result = run(["/bin/bash", "-n", script]);
    expect(result.exitCode, result.stderr).toBe(0);
});

// Runs the macOS Group 1 pre-scan and install loop with brew stubbed and only
// the CLI casks declared. An `op` on PATH stands in for 1Password's .pkg.
async function runGroupOne(options: { caskInstalled: boolean; opOnPath: boolean }) {
    const rendered = render("darwin");
    const start = rendered.indexOf("# Pre-scan: check which brew packages");
    const end = rendered.indexOf("# Group 1.25:");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const root = await mkdtemp(path.join(tmpdir(), "install-script-group-one-"));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    const log = path.join(root, "brew.log");
    await mkdir(bin);
    if (options.opOnPath) {
        await writeFile(path.join(bin, "op"), "#!/bin/sh\n");
        await chmod(path.join(bin, "op"), 0o755);
    }
    const script = path.join(root, "group-one.sh");
    await writeFile(
        script,
        `ERRORS=0
BREW_PACKAGES=()
BREW_CLI_CASKS=(1password-cli)
BREW_HOLDS_ABSENT=()
info() { printf 'INFO: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
confirm() { printf 'CONFIRM: %s\\n' "$1"; }
pkg_bin() { echo "$1"; }
brew() {
    printf '%s\\n' "$*" >> "$BREW_LOG"
    case "$1 $2" in
        "list --cask") [ "$CASK_INSTALLED" = 1 ] ;;
        "install --cask") return 0 ;;
        *) return 2 ;;
    esac
}
${rendered.slice(start, end)}
printf 'ERROR_COUNT=%s\\n' "$ERRORS"
`,
    );
    const result = run(["/bin/bash", script], {
        PATH: `${bin}:/usr/bin:/bin`,
        BREW_LOG: log,
        CASK_INSTALLED: options.caskInstalled ? "1" : "0",
    });
    expect(result.exitCode, result.stderr).toBe(0);
    return {
        output: result.stdout,
        log: await readFile(log, "utf8").catch(() => ""),
    };
}

test("a CLI cask outside Homebrew is pending and installs with --cask", async () => {
    const result = await runGroupOne({ caskInstalled: false, opOnPath: true });
    expect(result.output).toContain("CONFIRM: Install brew packages (1/1 pending)?");
    expect(result.log).toContain("list --cask 1password-cli");
    expect(result.log).toContain("install --cask 1password-cli");
    expect(result.output).toContain("ERROR_COUNT=0");
});

test("an installed CLI cask is counted and not reinstalled", async () => {
    const result = await runGroupOne({ caskInstalled: true, opOnPath: false });
    expect(result.output).toContain("INFO: Brew packages: 1/1 installed");
    expect(result.output).not.toContain("CONFIRM:");
    expect(result.log).not.toContain("install");
});

// Evaluates a rendered top-level array assignment (one line or several) in bash
// and returns its rows.
function renderedArray(rendered: string, name: string): string[] {
    const assignment = rendered.match(
        new RegExp(`^${name}=\\((?:.*\\)|\\n[\\s\\S]*?^\\))$`, "m"),
    )?.[0];
    expect(assignment, name).toBeDefined();
    const result = run(["/bin/bash", "-c", `${assignment}\nprintf '%s\\n' "\${${name}[@]}"`]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout.split("\n").filter(Boolean);
}

const obsidianRow = "obsidian|Obsidian|Productivity|Knowledge base";

test.each([
    ["arm64", 22],
    ["amd64", 21],
] as const)("the %s core cask set has %i rows and includes obsidian", (arch, count) => {
    const core = renderedArray(render("darwin", arch), "ALL_CASKS").filter(
        (row) => row.split("|")[2] !== "Optional",
    );
    expect(core).toHaveLength(count);
    expect(core).toContain(obsidianRow);
    expect(core.indexOf(obsidianRow)).toBe(
        core.indexOf("adobe-acrobat-reader|Adobe Acrobat Reader|Productivity|PDF reader") + 1,
    );
});

test("obsidian carries no brew pin or version freeze", () => {
    const rendered = render("darwin");
    for (const name of ["BREW_VERSIONS", "BREW_HOLDS"]) {
        const names = renderedArray(rendered, name).map((row) => row.split("|")[0]);
        expect(names.length, name).toBeGreaterThan(0);
        expect(
            names.some((entry) => entry.split("/").pop() === "obsidian"),
            name,
        ).toBe(false);
    }
});

test("the Claude Code plugin arrays and the non-macOS fallback carry obsidian-skills", () => {
    const rendered = render("darwin");
    expect(renderedArray(rendered, "CC_MARKETPLACES")).toContain("obsidianmd/obsidian-skills");
    expect(renderedArray(rendered, "CC_PLUGINS")).toContain("obsidian@obsidian-skills");
    const fallback =
        'info "    - claude plugin marketplace add obsidianmd/obsidian-skills && claude plugin install obsidian@obsidian-skills"';
    expect(render("linux").split("\n")).toContain(fallback);
});

// Slices one group out of a rendered script, from its start marker up to the
// next marker.
function section(rendered: string, start: string, end: string): string {
    const from = rendered.indexOf(start);
    const to = rendered.indexOf(end, from);
    expect(from, start).toBeGreaterThan(-1);
    expect(to, end).toBeGreaterThan(from);
    return rendered.slice(from, to);
}

// Logging and confirmation stand-ins for the helpers the script defines at its top.
const shellHelpers = `ERRORS=0
info() { printf 'INFO: %s\\n' "$*"; }
warn() { printf 'WARN: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
confirm() { printf 'CONFIRM: %s\\n' "$1"; [ "$CONFIRMED" = 1 ]; }
run_claude_step() { shift; "$@" || error "step failed: $*"; }
`;

async function scratch(prefix: string) {
    const root = await mkdtemp(path.join(tmpdir(), prefix));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    await mkdir(bin);
    return { root, bin };
}

async function executable(file: string, body: string) {
    await writeFile(file, body);
    await chmod(file, 0o755);
}

type Skill = { name: string; source: string; renamedFrom: string | null; agents: string[] };

const npxStub = path.join(repositoryRoot, "tests", "fixtures", "skills-npx-stub.sh");
const renameAdd =
    "-y skills add coderabbitai/skills --skill code-review --rename coderabbit-review -g -y";
const oldRemove = "-y skills remove code-review -g -y";
const mattAdd = "-y skills add mattpocock/skills --skill code-review -g -y --agent opencode junie";
const shadowWarning =
    "/.claude/skills/code-review exists and shadows Claude Code's built-in /code-review";
const heldBack =
    "code-review — skipped: a code-review from another source is still installed; Matt Pocock's would replace it";
const oldCodeRabbit: Skill = {
    name: "code-review",
    source: "coderabbitai/skills",
    renamedFrom: null,
    agents: ["Claude Code", "OpenCode", "Junie"],
};

// Runs the macOS Group 9 with skills.sh stubbed (tests/fixtures/skills-npx-stub.sh)
// against a temporary HOME. `claudeLinks` seeds ~/.claude/skills links.
async function runAgentSkills(options: {
    skills: Skill[];
    failAdds?: string[];
    claudeLinks?: string[];
    confirmed?: boolean;
}) {
    const { root, bin } = await scratch("install-script-skills-");
    const home = path.join(root, "home");
    await mkdir(path.join(home, ".claude", "skills"), { recursive: true });
    await mkdir(path.join(home, ".agents", "skills"), { recursive: true });
    for (const name of options.claudeLinks ?? []) {
        const folder = path.join(home, ".agents", "skills", name);
        await mkdir(folder);
        await symlink(folder, path.join(home, ".claude", "skills", name));
    }
    await copyFile(npxStub, path.join(bin, "npx"));
    await chmod(path.join(bin, "npx"), 0o755);
    const jq = Bun.which("jq");
    expect(jq, "jq on PATH").toBeTruthy();
    await symlink(jq!, path.join(bin, "jq"));
    const state = path.join(root, "skills.json");
    const log = path.join(root, "npx.log");
    await writeFile(state, JSON.stringify(options.skills, null, 2));
    const script = path.join(root, "agent-skills.sh");
    await writeFile(
        script,
        shellHelpers +
            section(render("darwin"), "# Group 9: Agent skills", "# Manual install instructions"),
    );
    const result = run(["/bin/bash", script], {
        PATH: `${bin}:/usr/bin:/bin`,
        HOME: home,
        NPX_LOG: log,
        SKILLS_STATE: state,
        FAIL_ADDS: (options.failAdds ?? []).join(" "),
        CONFIRMED: options.confirmed === false ? "0" : "1",
    });
    expect(result.exitCode, result.stderr).toBe(0);
    return {
        output: result.stdout,
        calls: (await readFile(log, "utf8").catch(() => "")).split("\n").filter(Boolean),
        skills: JSON.parse(await readFile(state, "utf8")) as Skill[],
        claudeLink: await lstat(path.join(home, ".claude", "skills", "code-review")).then(
            () => true,
            () => false,
        ),
    };
}

test("both renders install CodeRabbit's code-review only as coderabbit-review", () => {
    expect(render("darwin")).toContain(
        'install_skill "coderabbitai/skills" "code-review" "" "coderabbit-review"',
    );
    expect(render("linux").split("\n")).toContain(`info "    npx ${renameAdd}"`);
    for (const os of ["darwin", "linux"]) {
        const installs = render(os)
            .split("\n")
            .filter(
                (line) =>
                    /install_skill|skills add/.test(line) &&
                    line.includes("coderabbitai/skills") &&
                    line.includes("code-review"),
            );
        expect(installs.length, os).toBeGreaterThan(0);
        for (const line of installs) expect(line).toContain("coderabbit-review");
    }
});

test("an old CodeRabbit code-review is removed after the rename and Matt Pocock's follows in the same run", async () => {
    const result = await runAgentSkills({ skills: [oldCodeRabbit], claudeLinks: ["code-review"] });
    const order = [renameAdd, oldRemove, mattAdd].map((call) => result.calls.indexOf(call));
    expect(
        order.every((index) => index > -1),
        result.calls.join("\n"),
    ).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(result.skills.find((skill) => skill.name === "coderabbit-review")?.renamedFrom).toBe(
        "code-review",
    );
    const codeReview = result.skills.find((skill) => skill.name === "code-review");
    expect(codeReview?.source).toBe("mattpocock/skills");
    expect(codeReview?.agents).not.toContain("Claude Code");
    expect(result.claudeLink).toBe(false);
    expect(result.output).not.toContain(shadowWarning);
});

test("a failed rename keeps the old copy and holds back Matt Pocock's code-review", async () => {
    const result = await runAgentSkills({
        skills: [oldCodeRabbit],
        failAdds: ["coderabbit-review"],
        claudeLinks: ["code-review"],
    });
    expect(result.calls).toContain(renameAdd);
    expect(result.calls).not.toContain(oldRemove);
    expect(result.calls).not.toContain(mattAdd);
    expect(result.output).toContain(`WARN:   ${heldBack}`);
    expect(result.skills).toContainEqual(oldCodeRabbit);
    expect(result.claudeLink).toBe(true);
    expect(result.output).toContain(shadowWarning);
});

test("a code-review from another source is never removed", async () => {
    const foreign: Skill = { ...oldCodeRabbit, source: "someone/skills" };
    const result = await runAgentSkills({ skills: [foreign] });
    expect(result.calls).not.toContain(oldRemove);
    expect(result.calls).not.toContain(mattAdd);
    expect(result.output).toContain(heldBack);
    expect(result.skills).toContainEqual(foreign);
});

test("a renamed CodeRabbit skill holding code-review is never removed", async () => {
    const renamed: Skill = { ...oldCodeRabbit, renamedFrom: "autofix" };
    const result = await runAgentSkills({ skills: [renamed] });
    expect(result.calls).not.toContain(oldRemove);
    expect(result.skills).toContainEqual(renamed);
});

test("a fresh machine removes nothing and installs both review skills", async () => {
    const result = await runAgentSkills({ skills: [] });
    expect(result.calls).toContain(renameAdd);
    expect(result.calls).toContain(mattAdd);
    expect(result.calls.some((call) => call.includes("skills remove"))).toBe(false);
    expect(result.claudeLink).toBe(false);
});

test("a machine already migrated changes nothing for the review skills", async () => {
    const result = await runAgentSkills({
        skills: [
            {
                name: "coderabbit-review",
                source: "coderabbitai/skills",
                renamedFrom: "code-review",
                agents: ["Claude Code", "OpenCode", "Junie"],
            },
            {
                name: "code-review",
                source: "mattpocock/skills",
                renamedFrom: null,
                agents: ["OpenCode", "Junie"],
            },
        ],
    });
    expect(result.calls).not.toContain(renameAdd);
    expect(result.calls).not.toContain(mattAdd);
    expect(result.calls.some((call) => call.includes("skills remove"))).toBe(false);
    expect(result.output).toContain("INFO:   coderabbit-review — already installed, skipping");
    expect(result.output).toContain("INFO:   code-review — already installed, skipping");
});

test.each([true, false])(
    "the agent-skills group warns about ~/.claude/skills/code-review when present (%p)",
    async (present) => {
        const result = await runAgentSkills({
            skills: [],
            claudeLinks: present ? ["code-review"] : [],
            confirmed: false,
        });
        expect(result.output).toContain("INFO: Skipping agent skills.");
        expect(result.output.includes(shadowWarning)).toBe(present);
    },
);

test("the non-macOS Matt Pocock command selects 24 skills, code-review included, for OpenCode and Junie only", () => {
    const line = render("linux")
        .split("\n")
        .find((entry) => entry.includes("skills add mattpocock/skills"));
    expect(line).toBeDefined();
    const skills = [...line!.matchAll(/--skill (\S+)/g)].map((match) => match[1]);
    expect(skills).toHaveLength(24);
    expect(skills).toContain("code-review");
    expect(line).toEndWith('-g -y --agent opencode junie"');
});

const officialCodeReview = "code-review@claude-plugins-official";

test("the official code-review plugin is listed as removed and no longer installed", () => {
    const rendered = render("darwin");
    expect(renderedArray(rendered, "CC_PLUGINS")).not.toContain(officialCodeReview);
    expect(renderedArray(rendered, "CC_PLUGINS_REMOVED")).toEqual([officialCodeReview]);
});

// Runs the macOS Group 8 with `claude` stubbed: every marketplace and managed
// plugin installed, plus `extraPlugins`.
async function runPluginGroup(options: { extraPlugins: string[]; confirmed: boolean }) {
    const rendered = render("darwin");
    const { root, bin } = await scratch("install-script-plugins-");
    const state = path.join(root, "plugins.txt");
    const marketplaces = path.join(root, "marketplaces.txt");
    const log = path.join(root, "claude.log");
    const installed = [...renderedArray(rendered, "CC_PLUGINS"), ...options.extraPlugins];
    await writeFile(state, `${installed.join("\n")}\n`);
    await writeFile(marketplaces, `${renderedArray(rendered, "CC_MARKETPLACES").join("\n")}\n`);
    await executable(
        path.join(bin, "claude"),
        `#!/bin/bash
printf '%s\\n' "$*" >> "$CLAUDE_LOG"
case "$1 $2" in
    "plugin marketplace") cat "$MARKETPLACES" ;;
    "plugin list") sed 's/.*/"&"/' "$PLUGIN_STATE" ;;
    "plugin install") echo "$3" >> "$PLUGIN_STATE" ;;
    "plugin uninstall") grep -vxF "$3" "$PLUGIN_STATE" > "$PLUGIN_STATE.next"; mv "$PLUGIN_STATE.next" "$PLUGIN_STATE" ;;
esac
`,
    );
    const script = path.join(root, "plugins.sh");
    await writeFile(
        script,
        shellHelpers +
            section(rendered, "# Group 8: Claude Code plugin dependencies", "# Group 8.25:"),
    );
    const result = run(["/bin/bash", script], {
        PATH: `${bin}:/usr/bin:/bin`,
        CLAUDE_LOG: log,
        PLUGIN_STATE: state,
        MARKETPLACES: marketplaces,
        CONFIRMED: options.confirmed ? "1" : "0",
    });
    expect(result.exitCode, result.stderr).toBe(0);
    return {
        output: result.stdout,
        log: await readFile(log, "utf8"),
        plugins: (await readFile(state, "utf8")).split("\n").filter(Boolean),
        total: installed.length - options.extraPlugins.length,
    };
}

test("an installed official code-review plugin is uninstalled once the group is confirmed", async () => {
    const result = await runPluginGroup({ extraPlugins: [officialCodeReview], confirmed: true });
    expect(result.output).toContain("0 marketplaces + 0 plugins pending, 1 to retire)?");
    expect(result.log).toContain(`plugin uninstall ${officialCodeReview}`);
    expect(result.plugins).not.toContain(officialCodeReview);
});

test("a declined plugin group keeps the official code-review plugin", async () => {
    const result = await runPluginGroup({ extraPlugins: [officialCodeReview], confirmed: false });
    expect(result.output).toContain("INFO: Skipping Claude Code plugin dependencies.");
    expect(result.log).not.toContain("uninstall");
    expect(result.plugins).toContain(officialCodeReview);
});

test("with no removed plugin installed the plugin group asks nothing", async () => {
    const result = await runPluginGroup({ extraPlugins: [], confirmed: true });
    expect(result.output).toContain(`INFO: CC plugins: ${result.total}/${result.total} installed`);
    expect(result.output).not.toContain("CONFIRM:");
});

// Runs the macOS Greptile group with node, npm and greptile stubbed as asked.
async function runGreptileGroup(options: {
    greptile?: boolean;
    node?: number;
    npmExit?: number;
    confirmed?: boolean;
}) {
    const { root, bin } = await scratch("install-script-greptile-");
    const log = path.join(root, "npm.log");
    if (options.greptile) await executable(path.join(bin, "greptile"), "#!/bin/sh\necho 3.8.0\n");
    if (options.node !== undefined) {
        await executable(
            path.join(bin, "node"),
            `#!/bin/sh\ncase "$1" in -p) echo ${options.node} ;; --version) echo v${options.node}.0.0 ;; esac\n`,
        );
        await executable(
            path.join(bin, "npm"),
            `#!/bin/sh\nprintf '%s\\n' "$*" >> "$NPM_LOG"\nexit ${options.npmExit ?? 0}\n`,
        );
    }
    const script = path.join(root, "greptile.sh");
    await writeFile(
        script,
        `${shellHelpers}${section(render("darwin"), "# Group 6.6: Greptile CLI", "# Group 7:")}
printf 'ERROR_COUNT=%s\\n' "$ERRORS"
`,
    );
    const result = run(["/bin/bash", script], {
        PATH: `${bin}:/usr/bin:/bin`,
        NPM_LOG: log,
        CONFIRMED: options.confirmed === false ? "0" : "1",
    });
    expect(result.exitCode, result.stderr).toBe(0);
    return { output: result.stdout, npm: await readFile(log, "utf8").catch(() => "") };
}

test("the Greptile group installs through npm on Node 22 or newer", async () => {
    const result = await runGreptileGroup({ node: 22 });
    expect(result.output).toContain("CONFIRM: Install the Greptile CLI globally via npm?");
    expect(result.npm).toBe("install -g greptile\n");
    expect(result.output).toContain("ERROR_COUNT=0");
});

test("the Greptile group skips an installed CLI", async () => {
    const result = await runGreptileGroup({ greptile: true, node: 24 });
    expect(result.output).toContain("INFO: greptile — already installed (3.8.0), skipping");
    expect(result.npm).toBe("");
});

test.each([
    [undefined, "WARN: node/npm is not available — skipping Greptile CLI install"],
    [20, "WARN: Greptile CLI needs Node 22 or newer (found v20.0.0) — skipping install"],
] as const)("the Greptile group skips with Node %p", async (node, message) => {
    const result = await runGreptileGroup({ node });
    expect(result.output).toContain(message);
    expect(result.output).not.toContain("CONFIRM:");
    expect(result.npm).toBe("");
});

test("a failed Greptile install is counted and the script continues", async () => {
    const result = await runGreptileGroup({ node: 24, npmExit: 1 });
    expect(result.output).toContain("ERROR: Failed to install greptile");
    expect(result.output).toContain("ERROR_COUNT=1");
});

test("a declined Greptile group installs nothing", async () => {
    const result = await runGreptileGroup({ node: 22, confirmed: false });
    expect(result.output).toContain("INFO: Skipping Greptile CLI.");
    expect(result.npm).toBe("");
});

test("Greptile's login and install lines are printed, and nothing pins or brews it", async () => {
    const darwin = render("darwin");
    expect(darwin.split("\n")).toContain(
        `info "  - Greptile CLI: sign in with 'greptile login', or set GREPTILE_API_KEY for non-interactive use; it updates itself with 'greptile update'"`,
    );
    expect(render("linux").split("\n")).toContain(
        `info "    - Greptile CLI: npm install -g greptile  (needs Node 22 or newer; updates itself with 'greptile update')"`,
    );
    for (const name of ["BREW_TAPS", "BREW_PACKAGES", "BREW_VERSIONS"]) {
        const rows = renderedArray(darwin, name);
        expect(rows.length, name).toBeGreaterThan(0);
        expect(
            rows.some((row) => /greptile/i.test(row)),
            name,
        ).toBe(false);
    }
    for (const file of ["renovate.json", "dot_zshrc.tmpl"]) {
        expect(await readFile(path.join(repositoryRoot, file), "utf8")).not.toMatch(/greptile/i);
    }
});
