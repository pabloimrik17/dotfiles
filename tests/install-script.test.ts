import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

// Evaluates a rendered top-level array assignment in bash and returns its rows.
function renderedArray(rendered: string, name: string): string[] {
    const assignment = rendered.match(new RegExp(`^${name}=\\(\\n[\\s\\S]*?^\\)$`, "m"))?.[0];
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
