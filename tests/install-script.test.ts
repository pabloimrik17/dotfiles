import { afterEach, expect, test } from "bun:test";
import {
    chmod,
    lstat,
    mkdir,
    mkdtemp,
    readdir,
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

const groupSix = "# Group 6: NVM + Node LTS";
const pnpmGroup = "# Group 6.25: pnpm";
const shimRetirement = "# Group 6.3: corepack shim retirement";
const fallowGroup = "# Group 6.5: fallow";

function darwinSection(from: string, to: string): string {
    const rendered = render("darwin");
    const start = rendered.indexOf(from);
    const end = rendered.indexOf(to, start);
    expect(start, from).toBeGreaterThan(-1);
    expect(end, to).toBeGreaterThan(start);
    return rendered.slice(start, end);
}

function retirementSection(): string {
    const pnpmHome = render("darwin").match(/^PNPM_HOME=.*$/m)?.[0];
    expect(pnpmHome).toBeDefined();
    return `${pnpmHome}\n${darwinSection(shimRetirement, fallowGroup)}`;
}

type Sandbox = { root: string; home: string; bin: string; nvmDir: string; log: string };

async function toolchainSandbox(): Promise<Sandbox> {
    const root = await mkdtemp(path.join(tmpdir(), "install-script-toolchain-"));
    temporaryDirectories.push(root);
    const sandbox = {
        root,
        home: path.join(root, "home"),
        bin: path.join(root, "bin"),
        nvmDir: path.join(root, "home", ".nvm"),
        log: path.join(root, "calls.log"),
    };
    await Promise.all([sandbox.home, sandbox.bin].map((dir) => mkdir(dir)));
    return sandbox;
}

async function executable(file: string, body: string) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `#!/bin/sh\n${body}\n`);
    await chmod(file, 0o755);
}

const standalonePnpm = (sandbox: Sandbox) => path.join(sandbox.home, "Library/pnpm/bin/pnpm");

async function stubNvm(sandbox: Sandbox) {
    await mkdir(sandbox.nvmDir, { recursive: true });
    await writeFile(
        path.join(sandbox.nvmDir, "nvm.sh"),
        `nvm() { printf 'nvm %s\\n' "$*" >> "$CALL_LOG"; [ "$1" != install ] || [ "$NVM_INSTALL_FAILS" != 1 ]; }\n`,
    );
}

async function stubPnpmInstaller(sandbox: Sandbox) {
    await executable(
        path.join(sandbox.bin, "curl"),
        `printf 'curl %s\\n' "$*" >> "$CALL_LOG"
while [ $# -gt 0 ]; do [ "$1" = -o ] && out="$2"; shift; done
echo 'echo installer' > "$out"
[ "$CURL_FAILS" != 1 ]`,
    );
    await executable(
        path.join(sandbox.bin, "sh"),
        `printf 'sh %s PNPM_VERSION=%s PNPM_HOME=%s PNPM_NO_MODIFY_PATH=%s\\n' "$*" "$PNPM_VERSION" "$PNPM_HOME" "$PNPM_NO_MODIFY_PATH" >> "$CALL_LOG"
printf 'ran %s\\n' "$(cat "$1")" >> "$CALL_LOG"
[ "$INSTALLER_FAILS" != 1 ] || exit 1
[ "$INSTALLER_LINKS_NOTHING" != 1 ] || exit 0
mkdir -p "$PNPM_HOME/bin"
printf '#!/bin/sh\\necho %s\\n' "$PNPM_VERSION" > "$PNPM_HOME/bin/pnpm"
chmod +x "$PNPM_HOME/bin/pnpm"`,
    );
}

async function nodeVersion(sandbox: Sandbox, version: string, links: Record<string, string>) {
    const bin = path.join(sandbox.nvmDir, "versions/node", version, "bin");
    await executable(path.join(bin, "node"), `echo ${version}`);
    await Promise.all(
        Object.entries(links).map(([name, target]) => symlink(target, path.join(bin, name))),
    );
    return bin;
}

const corepackShims = {
    pnpm: "../lib/node_modules/corepack/dist/pnpm.js",
    pnpx: "../lib/node_modules/corepack/dist/pnpx.js",
    yarn: "../lib/node_modules/corepack/dist/yarn.js",
    yarnpkg: "../lib/node_modules/corepack/dist/yarnpkg.js",
};

const nodeV24Links = {
    ...corepackShims,
    corepack: "../lib/node_modules/corepack/dist/corepack.js",
    npm: "../lib/node_modules/npm/bin/npm-cli.js",
    npx: "../lib/node_modules/npm/bin/npx-cli.js",
};

const present = (file: string) =>
    lstat(file).then(
        () => true,
        () => false,
    );

async function runSection(
    sandbox: Sandbox,
    section: string,
    env: Record<string, string | null> = {},
) {
    const script = path.join(sandbox.root, "section.sh");
    await writeFile(
        script,
        `ERRORS=0
info() { printf 'INFO: %s\\n' "$*"; }
warn() { printf 'WARN: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
confirm() { printf 'CONFIRM: %s\\n' "$1"; [ "$CONFIRM_REPLY" = y ]; }
${section}
printf 'ERROR_COUNT=%s\\n' "$ERRORS"
`,
    );
    const variables: Record<string, string | null> = {
        HOME: sandbox.home,
        PATH: `${sandbox.bin}:/usr/bin:/bin`,
        NVM_DIR: sandbox.nvmDir,
        // An inherited PNPM_HOME must not decide where pnpm goes.
        PNPM_HOME: path.join(sandbox.root, "inherited-pnpm-home"),
        PNPM_VERSION: "",
        PNPM_NO_MODIFY_PATH: "",
        CALL_LOG: sandbox.log,
        CONFIRM_REPLY: "n",
        ...env,
    };
    const unset = Object.keys(variables).filter((name) => variables[name] === null);
    const result = run(
        ["/usr/bin/env", ...unset.flatMap((name) => ["-u", name]), "/bin/bash", script],
        Object.fromEntries(
            Object.entries(variables).filter(
                (entry): entry is [string, string] => entry[1] !== null,
            ),
        ),
    );
    expect(result.exitCode, result.stderr).toBe(0);
    return {
        output: result.stdout,
        calls: await readFile(sandbox.log, "utf8").catch(() => ""),
    };
}

test("the NVM group counts NVM and Node without corepack", async () => {
    expect(darwinSection(groupSix, pnpmGroup).toLowerCase()).not.toContain("corepack");
    const sandbox = await toolchainSandbox();
    await stubNvm(sandbox);
    await executable(path.join(sandbox.bin, "node"), "echo v26.13.1");
    const result = await runSection(sandbox, darwinSection(groupSix, pnpmGroup));
    expect(result.output).toContain("INFO: NVM/Node: 2/2 installed");
    expect(result.output).not.toContain("CONFIRM:");
    expect(result.calls).not.toContain("nvm install");
    expect(result.output).toContain("ERROR_COUNT=0");
});

test("a failed NVM install logs an error and skips Node", async () => {
    const sandbox = await toolchainSandbox();
    await executable(path.join(sandbox.bin, "bash"), "exit 1");
    const result = await runSection(sandbox, darwinSection(groupSix, pnpmGroup), {
        CONFIRM_REPLY: "y",
    });
    expect(result.output).toContain("CONFIRM: Install NVM and Node LTS (2/2 pending)?");
    expect(result.output).toContain("ERROR: Failed to install NVM — skipping Node");
    expect(result.output).not.toContain("Installing Node LTS");
    expect(result.output).toContain("ERROR_COUNT=1");
});

test("a failed Node install logs an error and shims are still retired", async () => {
    const sandbox = await toolchainSandbox();
    await stubNvm(sandbox);
    await executable(standalonePnpm(sandbox), "echo 12.23.0");
    const bin = await nodeVersion(sandbox, "v24.18.0", nodeV24Links);
    const result = await runSection(sandbox, darwinSection(groupSix, fallowGroup), {
        CONFIRM_REPLY: "y",
        NVM_INSTALL_FAILS: "1",
    });
    expect(result.calls).toContain("nvm install --lts");
    expect(result.output).toContain("ERROR: Failed to install Node LTS");
    expect(result.output).toContain(`INFO: Retired corepack shim ${path.join(bin, "pnpm")}`);
    expect(await present(path.join(bin, "pnpm"))).toBe(false);
    expect(result.output).toContain("ERROR_COUNT=1");
});

test.each([
    ["reports 2/2", true],
    ["is declined", false],
])("shims are retired when the NVM group %s", async (_, nodeInstalled) => {
    const sandbox = await toolchainSandbox();
    await stubNvm(sandbox);
    if (nodeInstalled) await executable(path.join(sandbox.bin, "node"), "echo v26.13.1");
    await executable(standalonePnpm(sandbox), "echo 12.23.0");
    const bin = await nodeVersion(sandbox, "v24.18.0", nodeV24Links);
    const result = await runSection(sandbox, darwinSection(groupSix, fallowGroup));
    expect(result.output).toContain(
        nodeInstalled ? "INFO: NVM/Node: 2/2 installed" : "INFO: Skipping NVM/Node.",
    );
    for (const name of Object.keys(corepackShims)) {
        expect(await present(path.join(bin, name)), name).toBe(false);
    }
    expect(result.output).toContain("ERROR_COUNT=0");
});

// macOS mktemp ignores TMPDIR, so the installer is found through curl's -o argument.
function downloadedInstaller(calls: string): string {
    const file = calls.match(/^curl -fsSL https:\/\/get\.pnpm\.io\/install\.sh -o (\S+)$/m)?.[1];
    expect(file, calls).toBeDefined();
    temporaryDirectories.push(file!);
    return file!;
}

test.each([
    ["a stale PNPM_HOME is inherited", {}],
    ["no PNPM_HOME is inherited", { PNPM_HOME: null }],
])(
    "a clean pnpm install runs the downloaded installer pinned, without PATH edits, when %s",
    async (_, env) => {
        const sandbox = await toolchainSandbox();
        await stubPnpmInstaller(sandbox);
        const result = await runSection(sandbox, darwinSection(pnpmGroup, shimRetirement), {
            CONFIRM_REPLY: "y",
            ...env,
        });
        const installer = downloadedInstaller(result.calls);
        const pnpmHome = path.join(sandbox.home, "Library/pnpm");
        expect(result.calls).toContain(
            `sh ${installer} PNPM_VERSION=12.23.0 PNPM_HOME=${pnpmHome} PNPM_NO_MODIFY_PATH=1\nran echo installer\n`,
        );
        expect(result.output).toContain(
            "CONFIRM: Install pnpm 12.23.0 via its official standalone installer?",
        );
        expect(result.output).toContain("INFO: pnpm — ready (12.23.0)");
        expect(result.output).toContain("ERROR_COUNT=0");
        expect(await present(installer)).toBe(false);
        expect(await readdir(sandbox.home)).toEqual(["Library"]);
    },
);

test("a declined pnpm install downloads nothing", async () => {
    const sandbox = await toolchainSandbox();
    await stubPnpmInstaller(sandbox);
    const result = await runSection(sandbox, darwinSection(pnpmGroup, shimRetirement));
    expect(result.output).toContain("INFO: Skipping pnpm.");
    expect(result.calls).toBe("");
});

test("an installed standalone pnpm is reported with its version and not prompted", async () => {
    const sandbox = await toolchainSandbox();
    await stubPnpmInstaller(sandbox);
    await executable(standalonePnpm(sandbox), "echo 12.23.0");
    const result = await runSection(sandbox, darwinSection(pnpmGroup, shimRetirement), {
        CONFIRM_REPLY: "y",
    });
    expect(result.output).toContain("INFO: pnpm — already installed (12.23.0), skipping");
    expect(result.output).not.toContain("CONFIRM:");
    expect(result.calls).toBe("");
});

test("a corepack pnpm shim on PATH alone leaves pnpm pending", async () => {
    const sandbox = await toolchainSandbox();
    await stubPnpmInstaller(sandbox);
    await executable(path.join(sandbox.bin, "pnpm"), "echo 10.27.0");
    const result = await runSection(sandbox, darwinSection(pnpmGroup, shimRetirement));
    expect(result.output).toContain(
        "CONFIRM: Install pnpm 12.23.0 via its official standalone installer?",
    );
    expect(result.output).not.toContain("already installed");
});

test.each([
    [
        "download fails",
        { CURL_FAILS: "1" },
        "ERROR: Failed to download https://get.pnpm.io/install.sh",
    ],
    ["installer fails", { INSTALLER_FAILS: "1" }, "ERROR: Failed to run the pnpm installer"],
    [
        "installer links nothing",
        { INSTALLER_LINKS_NOTHING: "1" },
        "ERROR: pnpm installer completed but",
    ],
])("when the pnpm %s, an error is logged and no temp file is left", async (_, env, message) => {
    const sandbox = await toolchainSandbox();
    await stubPnpmInstaller(sandbox);
    const result = await runSection(sandbox, darwinSection(pnpmGroup, shimRetirement), {
        CONFIRM_REPLY: "y",
        ...env,
    });
    expect(result.output).toContain(message);
    expect(result.output).toContain("ERROR_COUNT=1");
    expect(await present(downloadedInstaller(result.calls))).toBe(false);
});

test("corepack shims are retired and logged; corepack, node, npm and npx stay", async () => {
    const sandbox = await toolchainSandbox();
    await executable(standalonePnpm(sandbox), "echo 12.23.0");
    const v24 = await nodeVersion(sandbox, "v24.18.0", nodeV24Links);
    const v26 = await nodeVersion(sandbox, "v26.13.1", {
        npm: "../lib/node_modules/npm/bin/npm-cli.js",
        npx: "../lib/node_modules/npm/bin/npx-cli.js",
    });
    const result = await runSection(sandbox, retirementSection());
    for (const name of Object.keys(corepackShims)) {
        expect(result.output).toContain(`INFO: Retired corepack shim ${path.join(v24, name)}\n`);
        expect(await present(path.join(v24, name)), name).toBe(false);
    }
    for (const file of [
        ...["corepack", "node", "npm", "npx"].map((name) => path.join(v24, name)),
        ...["node", "npm", "npx"].map((name) => path.join(v26, name)),
    ]) {
        expect(await present(file), file).toBe(true);
    }
    expect(result.output).toContain("ERROR_COUNT=0");
});

test("a pnpm that corepack did not create is left alone", async () => {
    const sandbox = await toolchainSandbox();
    await executable(standalonePnpm(sandbox), "echo 12.23.0");
    const linked = await nodeVersion(sandbox, "v24.18.0", {
        pnpm: "../lib/node_modules/pnpm/bin/pnpm.cjs",
    });
    const plain = await nodeVersion(sandbox, "v20.12.2", {});
    await executable(path.join(plain, "pnpm"), "echo 9.0.6");
    const result = await runSection(sandbox, retirementSection());
    expect(await present(path.join(linked, "pnpm"))).toBe(true);
    expect(await present(path.join(plain, "pnpm"))).toBe(true);
    expect(result.output).toBe("ERROR_COUNT=0\n");
});

test("without the standalone pnpm, no corepack shim is retired", async () => {
    const sandbox = await toolchainSandbox();
    const bin = await nodeVersion(sandbox, "v24.18.0", nodeV24Links);
    const result = await runSection(sandbox, retirementSection());
    for (const name of Object.keys(corepackShims)) {
        expect(await present(path.join(bin, name)), name).toBe(true);
    }
    expect(result.output).toBe("ERROR_COUNT=0\n");
});

test("without nvm Node versions, the shim retirement prints nothing", async () => {
    const sandbox = await toolchainSandbox();
    await executable(standalonePnpm(sandbox), "echo 12.23.0");
    const result = await runSection(sandbox, retirementSection());
    expect(result.output).toBe("ERROR_COUNT=0\n");
});

test("the non-macOS instructions name pnpm's official installer", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "install-script-linux-"));
    temporaryDirectories.push(root);
    const redirect = "exec > /dev/tty 2>&1";
    const rendered = render("linux");
    expect(rendered).toContain(redirect);
    const script = path.join(root, "install.sh");
    // Without a TTY the redirect would end the script before it prints.
    await writeFile(script, rendered.replace(redirect, ""));
    const result = run(["/bin/bash", script]);
    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.stdout).toContain(
        "- pnpm: curl -fsSL https://get.pnpm.io/install.sh | PNPM_HOME=~/Library/pnpm PNPM_NO_MODIFY_PATH=1 sh -",
    );
});
