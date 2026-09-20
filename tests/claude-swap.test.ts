import { afterEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const chezmoiConfigTemplate = path.join(repositoryRoot, ".chezmoi.toml.tmpl");
const roleGuardTemplate = path.join(
    repositoryRoot,
    "run_onchange_before_claude-swap-role-guard.sh.tmpl",
);
const settingsSource = path.join(
    repositoryRoot,
    "private_dot_claude-swap-backup",
    "private_settings.json",
);
const installerTemplate = path.join(repositoryRoot, "run_onchange_install-packages.sh.tmpl");
const setupTemplate = path.join(
    repositoryRoot,
    "dot_local",
    "bin",
    "executable_claude-swap-setup.tmpl",
);
const offerTemplate = path.join(repositoryRoot, "run_onchange_after_claude-swap-setup.sh.tmpl");
const autoswitchFixture = path.join(
    repositoryRoot,
    "tests",
    "fixtures",
    "claude-swap-autoswitch.py",
);
const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    );
});

function run(
    command: string[],
    options: { env?: NodeJS.ProcessEnv; stdin?: string } = {},
): { exitCode: number; stdout: string; stderr: string } {
    const result = Bun.spawnSync(command, {
        cwd: repositoryRoot,
        env: { ...process.env, ...options.env },
        stdin: options.stdin ? new TextEncoder().encode(options.stdin) : undefined,
        stdout: "pipe",
        stderr: "pipe",
    });
    return {
        exitCode: result.exitCode,
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
    };
}

function renderInit(machineType: "personal" | "work"): string {
    const result = run([
        "chezmoi",
        "execute-template",
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--init",
        "--promptString",
        "Your full name=Test User,Your email address=test@example.com",
        "--promptChoice",
        `Machine type (required)=${machineType}`,
        "--file",
        chezmoiConfigTemplate,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

async function writeExecutable(file: string, source: string): Promise<void> {
    await writeFile(file, source);
    await chmod(file, 0o755);
}

async function runInstallerHelper(options: {
    cswapVersion?: string;
    menubarReady?: boolean;
    postInstallVersion?: string;
    postInstallMenubarReady?: boolean;
    serviceInstalled?: boolean;
    uvExitCode?: number;
}): Promise<{ output: string; log: string }> {
    const root = await mkdtemp(path.join(tmpdir(), "claude-swap-installer-"));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    const log = path.join(root, "commands.log");
    const installState = path.join(root, "installed");
    const harness = path.join(root, "harness.sh");
    await mkdir(bin);

    if (options.cswapVersion) {
        const python = path.join(bin, "python");
        await writeExecutable(
            python,
            `#!/bin/sh
if [ "$1" = "-c" ]; then
    if [ -f "$INSTALL_STATE" ]; then
        exit ${options.postInstallMenubarReady === false ? 1 : 0}
    fi
    exit ${options.menubarReady === false ? 1 : 0}
fi
script="$1"
shift
exec /bin/sh "$script" "$@"
`,
        );
        await writeExecutable(
            path.join(bin, "cswap"),
            `#!${python}
printf '%s\n' "$*" >>"$COMMAND_LOG"
if [ "$1" = "--version" ]; then
    if [ -f "$INSTALL_STATE" ]; then
        printf 'cswap %s\n' "${options.postInstallVersion ?? options.cswapVersion}"
    else
        printf 'cswap %s\n' "${options.cswapVersion}"
    fi
elif [ "$1" = "menubar" ] && [ "$2" = "--service-status" ]; then
    echo "${options.serviceInstalled ? "Menu bar service: running (pid 123)" : "Menu bar service is not installed."}"
fi
`,
        );
    }
    if (options.uvExitCode !== undefined) {
        await writeExecutable(
            path.join(bin, "uv"),
            `#!/bin/sh
printf 'uv %s\n' "$*" >>"$COMMAND_LOG"
if [ ${options.uvExitCode} -eq 0 ]; then
    : >"$INSTALL_STATE"
fi
exit ${options.uvExitCode}
`,
        );
    }

    const source = await readFile(installerTemplate, "utf8");
    const helpers = source
        .split("# BEGIN CLAUDE_SWAP_INSTALL_HELPERS\n", 2)[1]
        ?.split("# END CLAUDE_SWAP_INSTALL_HELPERS", 1)[0];
    expect(helpers).toBeDefined();
    await writeFile(
        harness,
        `#!/bin/bash
ERRORS=0
info() { printf '[dotfiles] %s\\n' "$*"; }
error() { printf '[dotfiles] ERROR: %s\\n' "$*" >&2; ERRORS=$((ERRORS + 1)); }
${helpers}
install_claude_swap
rc=$?
printf 'RESULT rc=%s errors=%s\\n' "$rc" "$ERRORS"
`,
    );

    const result = run(["/bin/bash", harness], {
        env: { PATH: bin, COMMAND_LOG: log, INSTALL_STATE: installState },
    });
    let commandLog = "";
    try {
        commandLog = await readFile(log, "utf8");
    } catch {
        // No fake command was invoked.
    }
    return { output: result.stdout + result.stderr, log: commandLog };
}

interface FakeAccount {
    number: number;
    email: string;
    alias?: string;
    active?: boolean;
}

async function runSetupFixture(options: {
    role: "personal" | "work";
    accounts?: FakeAccount[];
    activeAccountNumber?: number | null;
    args?: string[];
    input?: string;
    malformedList?: boolean;
    includeClaude?: boolean;
}): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    log: string[];
    state: { activeAccountNumber: number | null; accounts: FakeAccount[] };
}> {
    const root = await mkdtemp(path.join(tmpdir(), "claude-swap-setup-"));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    const stateFile = path.join(root, "state.json");
    const serviceFile = path.join(root, "service-installed");
    const logFile = path.join(root, "commands.log");
    const setup = path.join(root, "claude-swap-setup");
    await mkdir(bin);

    const accounts = options.accounts ?? [];
    const activeAccountNumber = options.activeAccountNumber ?? null;
    await writeFile(stateFile, JSON.stringify({ schemaVersion: 1, activeAccountNumber, accounts }));

    await writeExecutable(
        path.join(bin, "uname"),
        `#!/bin/sh
echo Darwin
`,
    );
    if (options.includeClaude !== false) {
        await writeExecutable(
            path.join(bin, "claude"),
            `#!/bin/sh
exit 0
`,
        );
    }
    await writeExecutable(
        path.join(bin, "cswap"),
        `#!/bin/sh
printf '%s\n' "$*" >>"$COMMAND_LOG"
case "$1" in
    --version)
        echo "cswap 0.26.0"
        ;;
    list)
        if [ "${options.malformedList ? "1" : "0"}" = "1" ]; then
            echo "not-json"
        else
            /bin/cat "$CSWAP_STATE"
        fi
        ;;
    status)
        jq '{schemaVersion: 1, active: ((.activeAccountNumber as $number | [.accounts[] | select(.number == $number)][0]) // null)}' "$CSWAP_STATE"
        ;;
    add)
        if [ "$2" = "--slot" ]; then
            slot="$3"
            jq --argjson slot "$slot" '
                if any(.accounts[]; .number == $slot) then
                    .activeAccountNumber = $slot |
                    .accounts |= map(.active = (.number == $slot))
                else
                    error("missing slot")
                end
            ' "$CSWAP_STATE" >"$CSWAP_STATE.tmp" && /bin/mv "$CSWAP_STATE.tmp" "$CSWAP_STATE"
        else
            alias_name="$3"
            jq --arg alias "$alias_name" '
                if any(.accounts[]; (.alias // "") == $alias) then .
                else
                    ((([.accounts[].number] | max) // 0) + 1) as $number |
                    .accounts += [{number: $number, email: ($alias + "@example.com"), alias: $alias, active: true}] |
                    .activeAccountNumber = $number |
                    .accounts |= map(.active = (.number == $number))
                end
            ' "$CSWAP_STATE" >"$CSWAP_STATE.tmp" && /bin/mv "$CSWAP_STATE.tmp" "$CSWAP_STATE"
        fi
        ;;
    switch)
        alias_name="$2"
        jq --arg alias "$alias_name" '
            ([.accounts[] | select((.alias // "") == $alias)][0].number) as $number |
            if $number == null then error("missing alias")
            else
                .activeAccountNumber = $number |
                .accounts |= map(.active = (.number == $number))
            end
        ' "$CSWAP_STATE" >"$CSWAP_STATE.tmp" && /bin/mv "$CSWAP_STATE.tmp" "$CSWAP_STATE"
        ;;
    auto)
        exit 2
        ;;
    menubar)
        if [ "$2" = "--install-service" ]; then
            : >"$CSWAP_SERVICE"
            echo "Menu bar service installed (com.cswap.menubar)."
        elif [ "$2" = "--service-status" ] && [ -f "$CSWAP_SERVICE" ]; then
            echo "Menu bar service: running (pid 123)"
        else
            echo "Menu bar service is not installed."
        fi
        ;;
    *)
        echo "unsupported fake cswap invocation: $*" >&2
        exit 1
        ;;
esac
`,
    );

    const render = run([
        "chezmoi",
        "execute-template",
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--override-data",
        JSON.stringify({ machineType: options.role }),
        "--file",
        setupTemplate,
    ]);
    expect(render.exitCode, render.stderr).toBe(0);
    await writeExecutable(setup, render.stdout);

    const jq = Bun.which("jq");
    expect(jq).toBeTruthy();
    const pathValue = [bin, path.dirname(jq!), "/usr/bin", "/bin"].join(":");
    const result = run([setup, ...(options.args ?? [])], {
        env: {
            HOME: root,
            PATH: pathValue,
            COMMAND_LOG: logFile,
            CSWAP_STATE: stateFile,
            CSWAP_SERVICE: serviceFile,
        },
        stdin: options.input,
    });
    let commandLog = "";
    try {
        commandLog = await readFile(logFile, "utf8");
    } catch {
        // Preflight may fail before cswap is invoked.
    }
    return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        log: commandLog.trim() ? commandLog.trim().split("\n") : [],
        state: JSON.parse(await readFile(stateFile, "utf8")),
    };
}

async function renderOffer(role: "personal" | "work"): Promise<string> {
    const result = run([
        "chezmoi",
        "execute-template",
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--override-data",
        JSON.stringify({ machineType: role }),
        "--file",
        offerTemplate,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

async function runOfferFixture(options: {
    checkExitCode: number;
    forceTty?: boolean;
    input?: string;
}): Promise<{ exitCode: number; stdout: string; stderr: string; log: string[] }> {
    const root = await mkdtemp(path.join(tmpdir(), "claude-swap-offer-"));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    const localBin = path.join(root, ".local", "bin");
    const logFile = path.join(root, "offer.log");
    const offer = path.join(root, "offer.sh");
    await Promise.all([mkdir(bin), mkdir(localBin, { recursive: true })]);
    await writeExecutable(path.join(bin, "uname"), "#!/bin/sh\necho Darwin\n");
    await writeExecutable(
        path.join(localBin, "claude-swap-setup"),
        `#!/bin/sh
if [ "$1" = "--check" ]; then
    echo "check" >>"$OFFER_LOG"
    exit ${options.checkExitCode}
fi
echo "run" >>"$OFFER_LOG"
echo "guided setup ran"
`,
    );
    await writeExecutable(offer, await renderOffer("personal"));

    const result = run([offer], {
        env: {
            HOME: root,
            PATH: [bin, "/usr/bin", "/bin"].join(":"),
            OFFER_LOG: logFile,
            CLAUDE_SWAP_SETUP_FORCE_TTY: options.forceTty ? "1" : "0",
        },
        stdin: options.input,
    });
    let log = "";
    try {
        log = await readFile(logFile, "utf8");
    } catch {
        // A missing setup command would leave no log.
    }
    return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        log: log.trim() ? log.trim().split("\n") : [],
    };
}

describe("machine type initialization", () => {
    test.each(["personal", "work"] as const)("renders the explicit %s choice", (machineType) => {
        const rendered = renderInit(machineType);

        expect(rendered).toContain('name = "Test User"');
        expect(rendered).toContain('email = "test@example.com"');
        expect(rendered).toContain(`machineType = "${machineType}"`);
    });

    test("reuses an existing valid role without prompting", () => {
        const result = run([
            "chezmoi",
            "execute-template",
            "--config",
            "/dev/null",
            "--config-format",
            "toml",
            "--init",
            "--override-data",
            JSON.stringify({
                name: "Existing User",
                email: "existing@example.com",
                machineType: "personal",
            }),
            "--file",
            chezmoiConfigTemplate,
        ]);

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain('name = "Existing User"');
        expect(result.stdout).toContain('email = "existing@example.com"');
        expect(result.stdout).toContain('machineType = "personal"');
    });

    test("declares exactly two choices and no default", async () => {
        const source = await readFile(chezmoiConfigTemplate, "utf8");

        expect(source).toContain('$machineTypes := list "personal" "work"');
        expect(source).toMatch(
            /promptChoiceOnce \. "machineType" "Machine type \(required\)" \$machineTypes\s*-}}/,
        );
        expect(source).not.toMatch(/promptChoiceOnce[^\n]+\$machineTypes\s+"(?:personal|work)"/);
    });
});

describe("machine type migration guard", () => {
    function renderGuard(data: Record<string, unknown>): string {
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
            roleGuardTemplate,
        ]);
        expect(result.exitCode, result.stderr).toBe(0);
        return result.stdout;
    }

    test("a role-less rendered apply path fails with the exact recovery instruction", () => {
        const rendered = renderGuard({});
        const result = Bun.spawnSync(["/bin/sh"], {
            cwd: repositoryRoot,
            stdin: new TextEncoder().encode(rendered),
            stdout: "pipe",
            stderr: "pipe",
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr.toString().trim()).toBe(
            "[dotfiles] ERROR: Machine type is not configured. Run 'chezmoi init', choose personal or work, then run 'chezmoi apply' again.",
        );
    });

    test.each(["personal", "work"] as const)("accepts the configured %s role", (machineType) => {
        const rendered = renderGuard({ machineType });
        const result = Bun.spawnSync(["/bin/sh"], {
            cwd: repositoryRoot,
            stdin: new TextEncoder().encode(rendered),
            stdout: "pipe",
            stderr: "pipe",
        });

        expect(result.exitCode, result.stderr.toString()).toBe(0);
        expect(result.stdout.toString()).toBe("");
        expect(result.stderr.toString()).toBe("");
    });
});

describe("managed claude-swap policy", () => {
    test("contains only the schema-v1 account-wide autoswitch policy", async () => {
        const settings = JSON.parse(await readFile(settingsSource, "utf8"));

        expect(settings).toEqual({
            schemaVersion: 1,
            autoswitch: {
                threshold: 85,
                intervalSeconds: 60,
                cooldownSeconds: 300,
                hysteresisPct: 10,
                strategy: "best",
                includeApiKeyAccounts: false,
                unhealthyTicks: 3,
            },
        });
        expect(settings.autoswitch).not.toHaveProperty("model");
    });

    test("applies with owner-only modes and converges after drift", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "claude-swap-settings-"));
        temporaryDirectories.push(root);
        const destination = path.join(root, "home");
        await mkdir(destination);
        const target = path.join(destination, ".claude-swap-backup", "settings.json");
        const common = [
            "--config",
            "/dev/null",
            "--config-format",
            "toml",
            "--persistent-state",
            path.join(root, "state.boltdb"),
            "--source",
            repositoryRoot,
            "--destination",
            destination,
            "--override-data",
            JSON.stringify({ machineType: "personal" }),
        ];

        const managedDirectory = path.dirname(target);
        const apply = run(["chezmoi", "apply", ...common, "--force", managedDirectory]);
        expect(apply.exitCode, apply.stderr).toBe(0);
        expect((await stat(path.dirname(target))).mode & 0o777).toBe(0o700);
        expect((await stat(target)).mode & 0o777).toBe(0o600);

        const converged = run(["chezmoi", "diff", ...common, target]);
        expect(converged.exitCode, converged.stderr).toBe(0);
        expect(converged.stdout).toBe("");

        const drifted = JSON.parse(await readFile(target, "utf8"));
        drifted.autoswitch.threshold = 90;
        await writeFile(target, JSON.stringify(drifted, null, 4) + "\n");
        const diff = run(["chezmoi", "diff", ...common, target]);
        expect(diff.exitCode, diff.stderr).toBe(0);
        expect(diff.stdout).toContain('"threshold": 90');
        expect(diff.stdout).toContain('"threshold": 85');

        const restore = run(["chezmoi", "apply", ...common, "--force", managedDirectory]);
        expect(restore.exitCode, restore.stderr).toBe(0);
        expect(JSON.parse(await readFile(target, "utf8")).autoswitch.threshold).toBe(85);
    });

    test("is accepted by the pinned cswap config parser", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "claude-swap-parser-"));
        temporaryDirectories.push(root);
        const backup = path.join(root, ".claude-swap-backup");
        await mkdir(backup, { recursive: true, mode: 0o700 });
        await writeFile(path.join(backup, "settings.json"), await readFile(settingsSource));

        const version = run(["cswap", "--version"], { env: { HOME: root } });
        expect(version.exitCode, version.stderr).toBe(0);
        expect(version.stdout.trim()).toBe("cswap 0.26.0");

        const threshold = run(["cswap", "config", "get", "autoswitch.threshold"], {
            env: { HOME: root },
        });
        expect(threshold.exitCode, threshold.stderr).toBe(0);
        expect(threshold.stdout.trim()).toBe("85");

        const model = run(["cswap", "config", "get", "autoswitch.model", "--json"], {
            env: { HOME: root },
        });
        expect(model.exitCode, model.stderr).toBe(0);
        expect(JSON.parse(model.stdout)).toMatchObject({
            schemaVersion: 1,
            key: "autoswitch.model",
            value: null,
        });
    });
});

describe("pinned claude-swap installer", () => {
    test("skips an exact menubar-capable version without requiring uv", async () => {
        const result = await runInstallerHelper({ cswapVersion: "0.26.0" });

        expect(result.output).toContain("already installed, skipping");
        expect(result.output).toContain("RESULT rc=0 errors=0");
        expect(result.log).toBe("--version\n");
    });

    test("repairs an exact base-only installation missing the menubar runtime", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.26.0",
            menubarReady: false,
            uvExitCode: 0,
        });

        expect(result.log).toContain(
            "uv tool install --managed-python --force claude-swap[menubar]==0.26.0",
        );
        expect(result.output).toContain("claude-swap 0.26.0 installed and verified");
        expect(result.output).toContain("RESULT rc=0 errors=0");
    });

    test("accounts visibly for a missing uv prerequisite", async () => {
        const result = await runInstallerHelper({});

        expect(result.output).toContain("ERROR: claude-swap: uv is required");
        expect(result.output).toContain("RESULT rc=1 errors=1");
    });

    test("accounts visibly for a failed uv installation", async () => {
        const result = await runInstallerHelper({ uvExitCode: 9 });

        expect(result.log).toContain(
            "uv tool install --managed-python --force claude-swap[menubar]==0.26.0",
        );
        expect(result.output).toContain("ERROR: claude-swap: uv tool installation failed");
        expect(result.output).toContain("RESULT rc=1 errors=1");
    });

    test("rejects a mismatched post-install version", async () => {
        const result = await runInstallerHelper({ cswapVersion: "0.25.0", uvExitCode: 0 });

        expect(result.output).toContain(
            "ERROR: claude-swap: version verification failed (expected 0.26.0, got 0.25.0)",
        );
        expect(result.output).toContain("RESULT rc=1 errors=1");
    });

    test("rejects a missing post-install menubar runtime", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.25.0",
            postInstallVersion: "0.26.0",
            postInstallMenubarReady: false,
            uvExitCode: 0,
        });

        expect(result.output).toContain(
            "ERROR: claude-swap: menubar runtime verification failed (missing rumps)",
        );
        expect(result.output).toContain("RESULT rc=1 errors=1");
    });

    test("renders an explicit command-free non-macOS skip", () => {
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
                chezmoi: { os: "linux", arch: "amd64" },
            }),
            "--file",
            installerTemplate,
        ]);

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain(
            "claude-swap: skipped — the managed account-switching integration is macOS-only",
        );
        expect(result.stdout).not.toContain("claude-swap[menubar]==");
        expect(result.stdout).not.toContain("uv tool install --managed-python");
    });

    test("refreshes an existing upstream menu service after a pin change", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.25.0",
            postInstallVersion: "0.26.0",
            serviceInstalled: true,
            uvExitCode: 0,
        });

        expect(result.output).toContain("menu bar service refreshed through cswap");
        expect(result.output).toContain("RESULT rc=0 errors=0");
        expect(result.log.trim().split("\n")).toEqual([
            "--version",
            "menubar --service-status",
            "uv tool install --managed-python --force claude-swap[menubar]==0.26.0",
            "--version",
            "menubar --install-service",
        ]);
    });

    test("does not create a service when none existed before the pin change", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.25.0",
            postInstallVersion: "0.26.0",
            serviceInstalled: false,
            uvExitCode: 0,
        });

        expect(result.output).toContain("RESULT rc=0 errors=0");
        expect(result.log).toContain("menubar --service-status");
        expect(result.log).not.toContain("menubar --install-service");
    });

    test("does not track the upstream LaunchAgent plist", async () => {
        const tracked = run(["git", "ls-files"]);
        expect(tracked.exitCode, tracked.stderr).toBe(0);
        expect(tracked.stdout).not.toContain("com.cswap.menubar.plist");
    });

    test("is repo-pinned rather than Homebrew-, self-, or update-extra-managed", async () => {
        const installer = await readFile(installerTemplate, "utf8");
        const zsh = await readFile(path.join(repositoryRoot, "dot_zshrc.tmpl"), "utf8");
        const brewPackages = installer.match(/^BREW_PACKAGES=\(([^\n]+)\)$/m)?.[1];
        const updateExtra = zsh.match(/update-extra\(\) \{([\s\S]*?)\n\}/)?.[1];

        expect(brewPackages).toBeDefined();
        expect(brewPackages).not.toContain("claude-swap");
        expect(updateExtra).toBeDefined();
        expect(updateExtra).not.toContain("cswap");
        expect(updateExtra).not.toContain("claude-swap");
        expect(installer).toContain(
            "claude-swap updates: review and change the repository pin, then run chezmoi apply",
        );
        expect(installer).not.toContain("cswap upgrade");
    });
});

describe("re-runnable claude-swap setup", () => {
    test("reports a complete personal setup from public JSON without prompting", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                { number: 1, email: "personal@example.com", alias: "personal", active: true },
                { number: 2, email: "work@example.com", alias: "work", active: false },
            ],
            activeAccountNumber: 1,
            args: ["--check"],
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain("Setup is complete for this personal machine");
        expect(result.log).toEqual(["--version", "list --json", "status --json"]);
    });

    test("repairs the service for a complete personal setup without re-enrolling", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                { number: 1, email: "personal@example.com", alias: "personal", active: true },
                { number: 2, email: "work@example.com", alias: "work", active: false },
            ],
            activeAccountNumber: 1,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toEqual([
            "--version",
            "list --json",
            "status --json",
            "auto --once --dry-run",
            "menubar --install-service",
            "menubar --service-status",
        ]);
    });

    test("reauthenticates an existing alias in place and restores the required identity", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                { number: 1, email: "personal@example.com", alias: "personal", active: true },
                { number: 2, email: "work@example.com", alias: "work", active: false },
            ],
            activeAccountNumber: 1,
            args: ["--reauth", "work"],
            input: "\n",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --slot 2");
        expect(result.log).toContain("switch personal");
        expect(result.state.accounts.find((account) => account.alias === "work")?.number).toBe(2);
        expect(result.state.activeAccountNumber).toBe(1);
    });

    test("rejects reauthentication aliases outside the machine policy", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: [{ number: 1, email: "work@example.com", alias: "work", active: true }],
            activeAccountNumber: 1,
            args: ["--reauth", "personal"],
        });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("Cannot reauthenticate 'personal' on a work machine");
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
    });

    test("rejects unknown reauthentication aliases", async () => {
        const result = await runSetupFixture({
            role: "personal",
            args: ["--reauth", "other"],
        });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain(
            "Usage: claude-swap-setup [--check | --reauth personal|work]",
        );
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
    });

    test("fills only the missing personal alias and finishes globally on personal", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [{ number: 1, email: "work@example.com", alias: "work", active: true }],
            activeAccountNumber: 1,
            input: "\n",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --alias personal");
        expect(result.log).not.toContain("add --alias work");
        expect(result.log).toContain("switch personal");
        expect(result.stdout).toContain("Do NOT run /logout");
        expect(result.state.accounts.map((account) => account.alias).sort()).toEqual([
            "personal",
            "work",
        ]);
        expect(
            result.state.accounts.find(
                (account) => account.number === result.state.activeAccountNumber,
            )?.alias,
        ).toBe("personal");
    });

    test("enrolls only work on a work machine and finishes globally on work", async () => {
        const result = await runSetupFixture({ role: "work", input: "\n" });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --alias work");
        expect(result.log).toContain("switch work");
        expect(result.log).not.toContain("auto --once --dry-run");
        expect(result.log).toContain("menubar --install-service");
        expect(result.log).toContain("menubar --service-status");
        expect(result.stdout).toContain("Do NOT run /logout");
        expect(result.stdout).toContain("Leave Settings → Auto-switch accounts disabled");
        expect(result.state.accounts).toHaveLength(1);
        expect(result.state.accounts[0]?.alias).toBe("work");
        expect(result.state.activeAccountNumber).toBe(result.state.accounts[0]?.number);
    });

    test("makes a missing prerequisite observable", async () => {
        const result = await runSetupFixture({
            role: "personal",
            includeClaude: false,
            args: ["--check"],
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("Missing prerequisite: claude");
    });

    test("rejects malformed public JSON", async () => {
        const result = await runSetupFixture({
            role: "personal",
            malformedList: true,
            args: ["--check"],
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("Malformed or unsupported JSON from 'cswap list --json'");
    });

    test("fails non-destructively on an unexpected work-machine account", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: [
                { number: 1, email: "work@example.com", alias: "work", active: true },
                {
                    number: 2,
                    email: "personal@example.com",
                    alias: "personal",
                    active: false,
                },
            ],
            activeAccountNumber: 1,
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("remove it explicitly with 'cswap remove");
        expect(result.stderr).toContain("Nothing was removed or disabled");
        expect(result.log.some((command) => /^(remove|disable)\b/.test(command))).toBe(false);
    });

    test("runs personal dry-run before service install and then names the menu toggle", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                { number: 1, email: "personal@example.com", alias: "personal", active: false },
                { number: 2, email: "work@example.com", alias: "work", active: true },
            ],
            activeAccountNumber: 2,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log.indexOf("auto --once --dry-run")).toBeLessThan(
            result.log.indexOf("menubar --install-service"),
        );
        expect(result.log).toContain("menubar --service-status");
        expect(result.stdout).toContain("Enable Settings → Auto-switch accounts");
    });

    test("keeps autoswitch off in work guidance", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: [{ number: 1, email: "work@example.com", alias: "work", active: false }],
            activeAccountNumber: null,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).not.toContain("auto --once --dry-run");
        expect(result.stdout).toContain("Leave Settings → Auto-switch accounts disabled");
    });
});

describe("post-apply claude-swap setup offer", () => {
    test("does not prompt when role-specific setup is complete", async () => {
        const result = await runOfferFixture({ checkExitCode: 0, forceTty: true });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain("already complete");
        expect(result.stdout).not.toContain("Run the guided setup now?");
        expect(result.log).toEqual(["check"]);
    });

    test("offers and runs the wizard for an incomplete TTY setup", async () => {
        const result = await runOfferFixture({
            checkExitCode: 2,
            forceTty: true,
            input: "y\n",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain("Run the guided setup now?");
        expect(result.stdout).toContain("guided setup ran");
        expect(result.log).toEqual(["check", "run"]);
    });

    test("prints the re-runnable command without blocking a non-TTY apply", async () => {
        const result = await runOfferFixture({ checkExitCode: 2 });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain("non-interactive apply will not prompt");
        expect(result.stdout).toContain(".local/bin/claude-swap-setup");
        expect(result.log).toEqual(["check"]);
    });

    test("keys rendered content to role, pin, and setup revision", async () => {
        const personal = await renderOffer("personal");
        const work = await renderOffer("work");

        expect(personal).not.toBe(work);
        expect(personal).toContain('MACHINE_TYPE="personal"');
        expect(work).toContain('MACHINE_TYPE="work"');
        expect(personal).toContain('CLAUDE_SWAP_VERSION="0.26.0"');
        expect(personal).toContain('SETUP_COMMAND_REVISION="1"');
    });
});

describe("claude-swap zsh aliases", () => {
    test("resolve to the exact global-account commands in interactive zsh", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "claude-swap-aliases-"));
        temporaryDirectories.push(root);
        const snippet = path.join(root, "aliases.zsh");
        const zshSource = await readFile(path.join(repositoryRoot, "dot_zshrc.tmpl"), "utf8");
        const aliases = zshSource
            .split("\n")
            .filter((line) => /^alias cs-(?:list|current|global)=/.test(line));
        await writeFile(snippet, aliases.join("\n") + "\n");

        const result = run([
            "zsh",
            "-dfi",
            "-c",
            'source "$1"; alias cs-list; alias cs-current; alias cs-global',
            "zsh",
            snippet,
        ]);

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout.trim().split("\n")).toEqual([
            "cs-list='cswap ls'",
            "cs-current='cswap status'",
            "cs-global='cswap switch'",
        ]);
        expect(aliases).toHaveLength(3);
        expect(aliases.join("\n")).not.toContain("cswap run");
    });
});

describe("upstream claude-swap autoswitch policy", () => {
    test("matches the personal-machine decision and failure matrix", async () => {
        const executable = run(["which", "cswap"]);
        expect(executable.exitCode, executable.stderr).toBe(0);
        const cswapPath = executable.stdout.trim();
        const shebang = (await readFile(cswapPath, "utf8")).split("\n", 1)[0];
        expect(shebang.startsWith("#!")).toBe(true);

        const result = run([shebang.slice(2), autoswitchFixture]);
        expect(result.exitCode, result.stderr).toBe(0);
        const report = JSON.parse(result.stdout);

        expect(report.claudeSwap).toBe("0.26.0");
        expect(report.scenarios).toEqual({
            allExhausted: "BLOCKED",
            authenticationQuarantine: "BLOCKED",
            cooldown: "NO_ACTION",
            hysteresis: "BLOCKED",
            recoveredInactive: "NO_ACTION",
            stale429: {
                acceptedLimitation: "stale last-good usage can delay a threshold switch",
                outcome: "NO_ACTION",
            },
            threeUnhealthyTicks: ["NO_ACTION", "NO_ACTION", "SWITCHED"],
            threshold: "SWITCHED",
            unreadableCandidate: "BLOCKED",
        });
    });
});

describe("claude-swap documentation", () => {
    test("keeps README as a concise three-step overview", async () => {
        const readme = await readFile(path.join(repositoryRoot, "README.md"), "utf8");
        const setup = readme.match(/## Setup\n([\s\S]*?)\n## Daily Workflows/)?.[1];

        expect(readme).toContain("[claude-swap](https://github.com/realiti4/claude-swap)");
        expect(readme).toContain("Pinned macOS account and quota manager for Claude Code");
        expect(setup).toBeDefined();
        expect(setup!.match(/^\d+\. /gm)).toHaveLength(3);
        expect(setup!.indexOf("brew install chezmoi")).toBeLessThan(
            setup!.indexOf("chezmoi init pabloimrik17/dotfiles"),
        );
        expect(setup!.indexOf("chezmoi init pabloimrik17/dotfiles")).toBeLessThan(
            setup!.indexOf("chezmoi apply"),
        );
        expect(setup).toContain("required `personal` or `work` machine type");
        expect(setup).toContain("~/.local/bin/claude-swap-setup");
        expect(setup).toContain("Keychain/application-owned");
        expect(setup).toContain("docs/manual.html#claude");
        expect(readme).not.toContain("assets/claude-swap");
    });

    test("adds the complete workflow inside existing Manual Section 11", async () => {
        const manual = await readFile(path.join(repositoryRoot, "docs", "manual.html"), "utf8");
        const section = manual.match(
            /<!-- Section 11: Claude Code -->([\s\S]*?)<!-- Section 12: OpenCode -->/,
        )?.[1];

        expect(section).toBeDefined();
        for (const requiredText of [
            "claude-swap accounts and quota (macOS)",
            "claude-swap-setup",
            "claude-swap-setup --reauth personal|work",
            "cs-list",
            "cs-current",
            "cs-global",
            "cswap switch personal|work",
            "cswap auto --once --dry-run",
            "Auto-switch accounts",
            "cswap menubar --service-status",
            "85%",
            "300s",
            "Keychain",
            "autoswitch_state.json",
            "menubar_settings.json",
            "issue #208",
            "Remote Control / Artifact affinity",
            "cswap menubar --uninstall-service",
        ]) {
            expect(section).toContain(requiredText);
        }
        expect(manual.match(/<summary>\d+\./g)).toHaveLength(15);
        expect(manual.match(/<a href="#[^"]+">\d+\./g)).toHaveLength(15);
        expect(manual).toContain("<summary>15. Agent Sessions (Agent of Empires)</summary>");
    });
});
