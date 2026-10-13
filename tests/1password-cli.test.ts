import { afterEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const installerTemplate = path.join(repositoryRoot, "run_onchange_install-packages.sh.tmpl");
const zshrcTemplate = path.join(repositoryRoot, "dot_zshrc.tmpl");
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

function lines(text: string): string[] {
    return text.split("\n").filter((line) => line !== "");
}

const renders = new Map<string, string>();

function render(os: string): string {
    const cached = renders.get(os);
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
            machineType: "personal",
            chezmoi: { os, arch: "arm64", destDir: "/home/test" },
        }),
        "--file",
        installerTemplate,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    renders.set(os, result.stdout);
    return result.stdout;
}

// Evaluates one top-level array assignment of the real installer, so the checks
// read the declaration exactly as bash parses it.
async function installerArray(name: string): Promise<string[]> {
    const source = await readFile(installerTemplate, "utf8");
    const assignment = source.match(
        new RegExp(`^${name}=\\((?:.*\\)$|\\n[\\s\\S]*?^\\)$)`, "m"),
    )?.[0];
    expect(assignment).toBeDefined();
    const result = run(["/bin/bash", "-c", `${assignment}\nprintf '%s\\n' "\${${name}[@]}"`]);
    expect(result.exitCode, result.stderr).toBe(0);
    return lines(result.stdout);
}

// Runs the macOS Group 1 pre-scan and install loop with brew stubbed and only
// the CLI casks declared. An `op` on PATH stands in for 1Password's .pkg.
async function runGroupOne(options: { caskInstalled: boolean; opOnPath: boolean }) {
    const rendered = render("darwin");
    const start = rendered.indexOf("# Pre-scan: check which brew packages");
    const end = rendered.indexOf("# Group 1.25:");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const root = await mkdtemp(path.join(tmpdir(), "op-group-one-"));
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

describe("1Password CLI freeze", () => {
    test("the cask has one frozen row, no hold, and no other brew list", async () => {
        expect(await installerArray("BREW_CLI_CASKS")).toEqual(["1password-cli"]);
        expect(
            (await installerArray("BREW_VERSIONS")).filter((row) =>
                row.startsWith("1password-cli|"),
            ),
        ).toEqual(["1password-cli|2.41.0"]);
        expect(
            (await installerArray("BREW_HOLDS")).filter((entry) =>
                ["1password-cli", "op"].includes(entry.split("|")[0]),
            ),
        ).toEqual([]);
        for (const name of ["BREW_PACKAGES", "ALL_CASKS"]) {
            expect(
                (await installerArray(name)).filter((entry) =>
                    ["1password-cli", "op"].includes(entry.split("|")[0]),
                ),
            ).toEqual([]);
        }
    });

    test("an op outside Homebrew is pending and installed with --cask", async () => {
        const result = await runGroupOne({ caskInstalled: false, opOnPath: true });
        expect(result.output).toContain("CONFIRM: Install brew packages (1/1 pending)?");
        expect(result.log).toContain("list --cask 1password-cli");
        expect(result.log).toContain("install --cask 1password-cli");
        expect(result.output).toContain("ERROR_COUNT=0");
    });

    test("an installed cask is counted and not reinstalled", async () => {
        const result = await runGroupOne({ caskInstalled: true, opOnPath: false });
        expect(result.output).toContain("INFO: Brew packages: 1/1 installed");
        expect(result.output).not.toContain("CONFIRM:");
        expect(result.log).not.toContain("install");
    });
});

describe("1Password CLI guidance", () => {
    test.each(["darwin", "linux"])("%s prints app-integration guidance after gws", (os) => {
        const rendered = render(os);
        expect(rendered.split("\nprint_gws_guidance\nprint_op_guidance\n")).toHaveLength(2);
        const guidance = rendered.match(/^print_op_guidance\(\) \{\n[\s\S]*?^\}/m)?.[0];
        expect(guidance).toBeDefined();
        const result = run([
            "/bin/bash",
            "-c",
            `info() { printf '%s\\n' "$*"; }\n${guidance}\nprint_op_guidance`,
        ]);
        expect(result.exitCode, result.stderr).toBe(0);
        for (const text of [
            "unlock the 1Password app",
            "Settings → Developer → Integrate with 1Password CLI",
            "Touch ID",
            "op vault list",
        ])
            expect(result.stdout).toContain(text);
    });

    test("all three tool lists include op and the Linux hint follows gws", () => {
        const lists = [...lines(render("darwin")), ...lines(render("linux"))].filter((line) =>
            line.includes("CLI tools:"),
        );
        expect(lists).toHaveLength(3);
        for (const line of lists) expect(line).toContain(', gws, op"');
        const linux = lines(render("linux"));
        const gwsHint = linux.findIndex((line) => line.includes("    - gws: "));
        expect(gwsHint).toBeGreaterThan(-1);
        expect(linux[gwsHint + 1]).toContain(
            "    - op: apt, dnf or the release binary per https://developer.1password.com/docs/cli/get-started",
        );
    });

    test("no managed source targets ~/.config/op", () => {
        const result = run(["git", "ls-files", "-co", "--exclude-standard"]);
        expect(result.exitCode, result.stderr).toBe(0);
        const sources = lines(result.stdout).filter((file) => {
            const target = file
                .split("/")
                .map((component) =>
                    component
                        .replace(/^(?:(?:encrypted|private|readonly|exact|create|modify)_)+/, "")
                        .replace(/\.tmpl$/, ""),
                )
                .join("/");
            return target === "dot_config/op" || target.startsWith("dot_config/op/");
        });
        expect(sources).toEqual([]);
    });

    test("op updates only through the brew freeze", async () => {
        const result = run(["git", "ls-files", "-co", "--exclude-standard"]);
        expect(result.exitCode, result.stderr).toBe(0);
        const managed = lines(result.stdout).filter(
            (file) => !/^(?:openspec|tests|docs)\/|\.md$/.test(file),
        );
        for (const file of managed) {
            const text = await readFile(path.join(repositoryRoot, file), "utf8").catch(() => "");
            expect(text, file).not.toMatch(/\bop update\b/);
        }
        const update = (await readFile(zshrcTemplate, "utf8")).match(
            /update-extra\(\) \{([\s\S]*?)\n\}/,
        )?.[1];
        expect(update).toBeDefined();
        expect(update).not.toMatch(/\bop\b|1password/);
    });
});
