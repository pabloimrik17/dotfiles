import { afterEach, describe, expect, setDefaultTimeout, test } from "bun:test";
import { access, chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
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
const shellIntegrationTimeoutMs = 20_000;
setDefaultTimeout(shellIntegrationTimeoutMs);

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
    usageStatus?: string;
    priority?: number;
    threshold?: number;
    disabled?: boolean;
}

function personalAccounts(options: {
    active: number;
    personal2?: boolean;
    personal2Status?: string;
    work2?: boolean;
}): FakeAccount[] {
    const accounts: FakeAccount[] = [
        { number: 1, email: "personal@example.com", alias: "personal" },
        { number: 2, email: "work@example.com", alias: "work" },
    ];
    if (options.personal2) {
        accounts.push({
            number: 3,
            email: "personal2@example.com",
            alias: "personal2",
            ...(options.personal2Status ? { usageStatus: options.personal2Status } : {}),
        });
    }
    if (options.work2 !== false) {
        accounts.push({ number: 4, email: "work2@example.com", alias: "work2" });
    }
    return accounts.map((account) => ({ ...account, active: account.number === options.active }));
}

function workAccounts(options: { active: number | null; work2?: boolean }): FakeAccount[] {
    const accounts: FakeAccount[] = [{ number: 1, email: "work@example.com", alias: "work" }];
    if (options.work2 !== false) {
        accounts.push({ number: 2, email: "work2@example.com", alias: "work2" });
    }
    return accounts.map((account) => ({ ...account, active: account.number === options.active }));
}

function activeAlias(state: { activeAccountNumber: number | null; accounts: FakeAccount[] }) {
    return state.accounts.find((account) => account.number === state.activeAccountNumber)?.alias;
}

function expectInOrder(log: readonly string[], ...commands: string[]): void {
    for (const command of commands) {
        expect(log).toContain(command);
    }
    const indexes = commands.map((command) => log.indexOf(command));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
}

async function prepareAutoswitchState(
    root: string,
    options: { dryRunExitCode?: number; autoswitchPending?: boolean },
): Promise<{ env: Record<string, string>; pendingMarker: string }> {
    const stateHome = path.join(root, ".local", "state");
    const pendingMarker = path.join(stateHome, "dotfiles", "claude-swap-autoswitch-pending");
    if (options.autoswitchPending) {
        await mkdir(path.dirname(pendingMarker), { recursive: true });
        await writeFile(pendingMarker, "");
    }
    return {
        env: { XDG_STATE_HOME: stateHome, CSWAP_DRY_RUN_EXIT: String(options.dryRunExitCode ?? 2) },
        pendingMarker,
    };
}

function fileExists(file: string): Promise<boolean> {
    return access(file).then(
        () => true,
        () => false,
    );
}

async function runSetupFixture(options: {
    role: "personal" | "work";
    accounts?: FakeAccount[];
    activeAccountNumber?: number | null;
    args?: string[];
    input?: string;
    malformedList?: boolean;
    includeClaude?: boolean;
    loginAtPrompt?: "new" | "unchanged" | number;
    dryRunExitCode?: number;
    autoswitchPending?: boolean;
}): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    log: string[];
    state: { activeAccountNumber: number | null; accounts: FakeAccount[] };
    autoswitchPending: boolean;
}> {
    const root = await mkdtemp(path.join(tmpdir(), "claude-swap-setup-"));
    temporaryDirectories.push(root);
    const bin = path.join(root, "bin");
    const stateFile = path.join(root, "state.json");
    const serviceFile = path.join(root, "service-installed");
    const logFile = path.join(root, "commands.log");
    const setup = path.join(root, "claude-swap-setup");
    await mkdir(bin);
    const autoswitchState = await prepareAutoswitchState(root, options);

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
        echo "cswap 1.2.0"
        ;;
    list)
        if [ "${options.malformedList ? "1" : "0"}" = "1" ]; then
            echo "not-json"
        else
            /bin/cat "$CSWAP_STATE"
        fi
        ;;
    status)
        # The only status read not right after "list --json" is the pre-capture guard. "new"
        # reports an unmanaged login, as if the user really ran /login; a slot number reports
        # that slot's managed account, as upstream does after a correct reauth /login.
        previous="$(/usr/bin/tail -n 2 "$COMMAND_LOG" | /usr/bin/head -n 1)"
        login="$CSWAP_LOGIN_AT_PROMPT"
        [ "$previous" = "list --json" ] && login="unchanged"
        case "$login" in
            new)
                echo '{"schemaVersion":1,"active":{"email":"new@example.com","managed":false}}'
                ;;
            unchanged)
                jq '{schemaVersion: 1, active: ((.activeAccountNumber as $number | [.accounts[] | select(.number == $number)][0]) // null)}' "$CSWAP_STATE"
                ;;
            *)
                jq --argjson number "$login" '{schemaVersion: 1, active: ([.accounts[] | select(.number == $number)][0] // null)}' "$CSWAP_STATE"
                ;;
        esac
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
            jq --arg alias "$alias_name" --arg mode "$CSWAP_LOGIN_AT_PROMPT" '
                if $mode == "unchanged" and .activeAccountNumber != null then
                    .activeAccountNumber as $active |
                    .accounts |= map(if .number == $active then .alias = $alias else . end)
                elif any(.accounts[]; (.alias // "") == $alias) then .
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
        jq --arg id "$2" '
            (if ($id | test("^[0-9]+$")) then ($id | tonumber)
            else [.accounts[] | select((.alias // "") == $id)][0].number end) as $number |
            if $number == null then error("missing alias")
            else
                .activeAccountNumber = $number |
                .accounts |= map(.active = (.number == $number))
            end
        ' "$CSWAP_STATE" >"$CSWAP_STATE.tmp" && /bin/mv "$CSWAP_STATE.tmp" "$CSWAP_STATE"
        ;;
    priority|threshold)
        jq -e --arg key "$1" --arg alias "$2" --argjson value "$3" '
            if any(.accounts[]; (.alias // "") == $alias) then
                .accounts |= map(if (.alias // "") == $alias then .[$key] = $value else . end)
            else
                error("missing alias")
            end
        ' "$CSWAP_STATE" >"$CSWAP_STATE.tmp" && /bin/mv "$CSWAP_STATE.tmp" "$CSWAP_STATE"
        echo "Set $2 $1 to $3."
        ;;
    disable)
        jq -e --arg alias "$2" '
            if any(.accounts[]; (.alias // "") == $alias) then
                .accounts |= map(if (.alias // "") == $alias then .disabled = true else . end)
            else
                error("missing alias")
            end
        ' "$CSWAP_STATE" >"$CSWAP_STATE.tmp" && /bin/mv "$CSWAP_STATE.tmp" "$CSWAP_STATE"
        ;;
    auto)
        exit "$CSWAP_DRY_RUN_EXIT"
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
            ...autoswitchState.env,
            PATH: pathValue,
            COMMAND_LOG: logFile,
            CSWAP_STATE: stateFile,
            CSWAP_SERVICE: serviceFile,
            CSWAP_LOGIN_AT_PROMPT: String(options.loginAtPrompt ?? "new"),
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
        autoswitchPending: await fileExists(autoswitchState.pendingMarker),
    };
}

async function renderOffer(
    role: "personal" | "work",
    source: string = repositoryRoot,
): Promise<string> {
    const result = run([
        "chezmoi",
        "execute-template",
        "--source",
        source,
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--override-data",
        JSON.stringify({ machineType: role }),
        "--file",
        path.join(source, path.basename(offerTemplate)),
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

async function runOfferFixture(options: {
    checkExitCode: number;
    applyPolicyExitCode?: number;
    role?: "personal" | "work";
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
if [ "$1" = "--apply-policy" ]; then
    echo "apply-policy" >>"$OFFER_LOG"
    echo "policy applied"
    exit ${options.applyPolicyExitCode ?? 0}
fi
if [ "$1" = "--check" ]; then
    echo "check" >>"$OFFER_LOG"
    exit ${options.checkExitCode}
fi
echo "run" >>"$OFFER_LOG"
echo "guided setup ran"
`,
    );
    await writeExecutable(offer, await renderOffer(options.role ?? "personal"));

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
                strategy: "priority-consume-first",
                includeApiKeyAccounts: false,
                unhealthyTicks: 3,
            },
        });
        expect(settings.autoswitch).not.toHaveProperty("model");
        expect(settings.autoswitch).not.toHaveProperty("weeklyThreshold");
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
        expect(version.stdout.trim()).toBe("cswap 1.2.0");

        const threshold = run(["cswap", "config", "get", "autoswitch.threshold"], {
            env: { HOME: root },
        });
        expect(threshold.exitCode, threshold.stderr).toBe(0);
        expect(threshold.stdout.trim()).toBe("85");

        const strategy = run(["cswap", "config", "get", "autoswitch.strategy"], {
            env: { HOME: root },
        });
        expect(strategy.exitCode, strategy.stderr).toBe(0);
        expect(strategy.stdout.trim()).toBe("priority-consume-first");

        const weekly = run(["cswap", "config", "get", "autoswitch.weeklyThreshold", "--json"], {
            env: { HOME: root },
        });
        expect(weekly.exitCode, weekly.stderr).toBe(0);
        expect(JSON.parse(weekly.stdout)).toMatchObject({ value: null, isSet: false });

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
    test("CI installs the same claude-swap pin as the installer", async () => {
        const installer = await readFile(installerTemplate, "utf8");
        const ci = await readFile(
            path.join(repositoryRoot, ".github", "workflows", "ci.yml"),
            "utf8",
        );
        const pin = installer.match(/^CLAUDE_SWAP_VERSION="([^"]+)"$/m)?.[1];

        expect(pin).toBeDefined();
        expect(ci).toContain(`'claude-swap[menubar]==${pin}'`);
    });

    test("skips an exact menubar-capable version without requiring uv", async () => {
        const result = await runInstallerHelper({ cswapVersion: "1.2.0" });

        expect(result.output).toContain("already installed, skipping");
        expect(result.output).toContain("RESULT rc=0 errors=0");
        expect(result.log).toBe("--version\n");
    });

    test("repairs an exact base-only installation missing the menubar runtime", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "1.2.0",
            menubarReady: false,
            uvExitCode: 0,
        });

        expect(result.log).toContain(
            "uv tool install --managed-python --force claude-swap[menubar]==1.2.0",
        );
        expect(result.output).toContain("claude-swap 1.2.0 installed and verified");
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
            "uv tool install --managed-python --force claude-swap[menubar]==1.2.0",
        );
        expect(result.output).toContain("ERROR: claude-swap: uv tool installation failed");
        expect(result.output).toContain("RESULT rc=1 errors=1");
    });

    test("rejects a mismatched post-install version", async () => {
        const result = await runInstallerHelper({ cswapVersion: "0.29.0", uvExitCode: 0 });

        expect(result.output).toContain(
            "ERROR: claude-swap: version verification failed (expected 1.2.0, got 0.29.0)",
        );
        expect(result.output).toContain("RESULT rc=1 errors=1");
    });

    test("rejects a missing post-install menubar runtime", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.29.0",
            postInstallVersion: "1.2.0",
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

    test("upgrades from the previous 0.29.0 pin and refreshes the menu service", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.29.0",
            postInstallVersion: "1.2.0",
            serviceInstalled: true,
            uvExitCode: 0,
        });

        expect(result.output).toContain("menu bar service refreshed through cswap");
        expect(result.output).toContain("RESULT rc=0 errors=0");
        expect(result.log.trim().split("\n")).toEqual([
            "--version",
            "menubar --service-status",
            "uv tool install --managed-python --force claude-swap[menubar]==1.2.0",
            "--version",
            "menubar --install-service",
        ]);
    });

    test("does not create a service when none existed before the pin change", async () => {
        const result = await runInstallerHelper({
            cswapVersion: "0.29.0",
            postInstallVersion: "1.2.0",
            serviceInstalled: false,
            uvExitCode: 0,
        });

        expect(result.output).toContain("RESULT rc=0 errors=0");
        expect(result.log).toContain("menubar --service-status");
        expect(result.log).not.toContain("menubar --install-service");
    });

    test("does not track the upstream LaunchAgent plist or menubar app wrapper", async () => {
        const tracked = run(["git", "ls-files"]);
        expect(tracked.exitCode, tracked.stderr).toBe(0);
        expect(tracked.stdout).not.toContain("com.cswap.menubar.plist");
        expect(tracked.stdout).not.toContain("Menubar.app");
    });

    // Upstream contracts re-verified against 1.2.0 on 2026-11-24, unchanged from 0.29.0:
    // `add --alias`/`--slot` flags, the `Menu bar service:` status prefix, and the
    // `auto --once` exit codes (0 switched, 2 no action, 3 blocked).
    test("pinned cswap keeps schema-v1 public JSON", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "claude-swap-contract-"));
        temporaryDirectories.push(root);

        const list = run(["cswap", "list", "--json"], { env: { HOME: root } });
        expect(list.exitCode, list.stderr).toBe(0);
        expect(JSON.parse(list.stdout)).toMatchObject({ schemaVersion: 1, accounts: [] });

        const status = run(["cswap", "status", "--json"], { env: { HOME: root } });
        expect(status.exitCode, status.stderr).toBe(0);
        expect(JSON.parse(status.stdout)).toEqual({ schemaVersion: 1, active: null });
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
            accounts: personalAccounts({ active: 1 }),
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
            accounts: personalAccounts({ active: 1 }),
            activeAccountNumber: 1,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toEqual([
            "--version",
            "list --json",
            "status --json",
            "priority work 50",
            "threshold work 70",
            "priority work2 50",
            "threshold work2 70",
            "priority personal 10",
            "threshold personal 80",
            "auto --once --dry-run",
            "menubar --install-service",
            "menubar --service-status",
        ]);
    });

    test("repairs the service for a complete work setup without re-enrolling or switching", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 2 }),
            activeAccountNumber: 2,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toEqual([
            "--version",
            "list --json",
            "status --json",
            "priority work 50",
            "threshold work 95",
            "priority work2 50",
            "threshold work2 95",
            "auto --once --dry-run",
            "menubar --install-service",
            "menubar --service-status",
        ]);
        expect(result.state.activeAccountNumber).toBe(2);
    });

    test("reauthenticates an existing alias in place and restores the previously active account", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ active: 1 }),
            activeAccountNumber: 1,
            args: ["--reauth", "work"],
            input: "\n",
            loginAtPrompt: 2,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --slot 2");
        expect(result.log).toContain("switch 1");
        expect(result.state.accounts.find((account) => account.alias === "work")?.number).toBe(2);
        expect(result.state.activeAccountNumber).toBe(1);
    });

    test("rejects reauthentication aliases outside the machine policy", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 1 }),
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
            "Usage: claude-swap-setup [--check | --apply-policy | --enroll work2|personal2 | --reauth personal|work|work2|personal2]",
        );
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
    });

    test("fills only the missing personal alias and finishes globally on personal", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                { number: 1, email: "work@example.com", alias: "work", active: true },
                { number: 2, email: "work2@example.com", alias: "work2", active: false },
            ],
            activeAccountNumber: 1,
            input: "\n",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --alias personal");
        expect(result.log).not.toContain("add --alias work");
        expect(result.log).not.toContain("add --alias work2");
        expect(result.log).toContain("switch personal");
        expect(result.stdout).toContain("Do NOT run /logout");
        expect(result.state.accounts.map((account) => account.alias).sort()).toEqual([
            "personal",
            "work",
            "work2",
        ]);
        expect(activeAlias(result.state)).toBe("personal");
    });

    test("enrolls work and work2 on a fresh work machine and finishes globally on work", async () => {
        const result = await runSetupFixture({ role: "work", input: "\n\n" });

        expect(result.exitCode, result.stderr).toBe(0);
        expectInOrder(result.log, "add --alias work", "add --alias work2", "switch work");
        expectInOrder(
            result.log,
            "auto --once --dry-run",
            "menubar --install-service --auto-switch",
        );
        expect(result.log).not.toContain("menubar --install-service");
        expect(result.log).toContain("menubar --service-status");
        expect(result.stdout).toContain("Do NOT run /logout");
        expect(result.stdout).not.toContain("Settings → Auto-switch accounts");
        expect(result.stdout).toContain("pause Auto-switch from the claude-swap menu");
        expect(result.state.accounts.map((account) => account.alias)).toEqual(["work", "work2"]);
        expect(activeAlias(result.state)).toBe("work");
    });

    test.each([
        ["personal", personalAccounts({ active: 1, work2: false }), 1, "personal"],
        ["work", workAccounts({ active: 1, work2: false }), 1, "work"],
    ] as const)(
        "reports an existing %s machine without work2 incomplete and captures only work2",
        async (role, accounts, active, finalAlias) => {
            const check = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: active,
                args: ["--check"],
            });
            expect(check.exitCode).toBe(2);
            expect(check.stdout).toContain(`Incomplete ${role} setup`);
            expect(check.stdout).toContain("'work2'");

            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: active,
                input: "\n",
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.log.filter((command) => command.startsWith("add "))).toEqual([
                "add --alias work2",
            ]);
            expect(result.log).toContain(`switch ${finalAlias}`);
            expectInOrder(
                result.log,
                "auto --once --dry-run",
                "menubar --install-service --auto-switch",
            );
            expect(result.log).not.toContain("menubar --install-service");
            const unchanged = accounts.map(({ number, email, alias }) => [number, email, alias]);
            expect(
                result.state.accounts
                    .filter((account) => account.alias !== "work2")
                    .map(({ number, email, alias }) => [number, email, alias]),
            ).toEqual(unchanged);
            expect(activeAlias(result.state)).toBe(finalAlias);
        },
    );

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

    test.each([
        ["personal", { number: 3, email: "personal@example.com", alias: "personal" }],
        ["personal2", { number: 3, email: "personal2@example.com", alias: "personal2" }],
        ["an unaliased", { number: 3, email: "hand@example.com" }],
    ])("fails non-destructively on %s account on a work machine", async (_label, extra) => {
        const result = await runSetupFixture({
            role: "work",
            accounts: [...workAccounts({ active: 1 }), { ...extra, active: false }],
            activeAccountNumber: 1,
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stdout).toContain(`account 3: ${extra.email}`);
        expect(result.stderr).toContain("other than the native 'work' and 'work2' aliases");
        expect(result.stderr).toContain("remove it explicitly with 'cswap remove");
        expect(result.stderr).toContain("Nothing was removed or disabled");
        expect(result.log.some((command) => /^(remove|disable)\b/.test(command))).toBe(false);
        expect(result.state.accounts).toHaveLength(3);
    });

    test("keeps Auto-switch pending when the completing run's dry run fails", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 1, work2: false }),
            activeAccountNumber: 1,
            input: "\n",
            dryRunExitCode: 1,
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.log).toContain("add --alias work2");
        expect(result.log.some((command) => command.startsWith("menubar --install-service"))).toBe(
            false,
        );
        expect(result.stderr).toContain("re-run claude-swap-setup to turn it on");
        expect(result.autoswitchPending).toBe(true);
    });

    test.each(["personal", "work"] as const)(
        "turns Auto-switch on in the next run on a complete %s machine with a pending activation",
        async (role) => {
            const accounts =
                role === "personal" ? personalAccounts({ active: 2 }) : workAccounts({ active: 1 });
            const result = await runSetupFixture({
                role,
                accounts,
                activeAccountNumber: accounts.find((account) => account.active)!.number,
                autoswitchPending: true,
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
            expectInOrder(
                result.log,
                "auto --once --dry-run",
                "menubar --install-service --auto-switch",
            );
            expect(result.autoswitchPending).toBe(false);
        },
    );

    test("clears the pending activation once the completing run succeeds", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 1, work2: false }),
            activeAccountNumber: 1,
            input: "\n",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("menubar --install-service --auto-switch");
        expect(result.autoswitchPending).toBe(false);
    });

    test.each([
        ["personal", personalAccounts({ active: 2 }), 2],
        ["work", workAccounts({ active: 1 }), 1],
    ] as const)(
        "warns and still refreshes the service when a %s repair run's dry run fails",
        async (role, accounts, active) => {
            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: active,
                dryRunExitCode: 1,
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stderr).toContain("WARNING: Autoswitch dry-run failed (exit 1)");
            expect(result.log).toContain("menubar --install-service");
            expect(result.log).not.toContain("menubar --install-service --auto-switch");
        },
    );

    test("reports a work machine whose live login is unmanaged incomplete and switches to work", async () => {
        const check = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: null }),
            activeAccountNumber: null,
            args: ["--check"],
        });
        expect(check.exitCode).toBe(2);
        expect(check.stdout).toContain("one of them must be the current Claude login");

        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: null }),
            activeAccountNumber: null,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
        expect(result.log).toContain("switch work");
        expect(result.log).not.toContain("menubar --install-service --auto-switch");
        expect(activeAlias(result.state)).toBe("work");
    });

    test("runs the dry run before a repair install that keeps the autoswitch state", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ active: 2 }),
            activeAccountNumber: 2,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expectInOrder(result.log, "auto --once --dry-run", "menubar --install-service");
        expect(result.log).not.toContain("menubar --install-service --auto-switch");
        expect(result.log).toContain("menubar --service-status");
        expect(result.log.some((command) => command.startsWith("switch "))).toBe(false);
        expect(result.state.activeAccountNumber).toBe(2);
        expect(result.stdout).not.toContain("Settings → Auto-switch accounts");
        expect(result.stdout).toContain("pause Auto-switch from the claude-swap menu");
    });

    test.each([
        ["personal", "work", 2],
        ["personal", "work2", 4],
        ["personal", "personal2", 3],
        ["work", "work2", 2],
    ] as const)(
        "passes --check on a %s machine with %s active without switching",
        async (role, _alias, active) => {
            const result = await runSetupFixture({
                role,
                accounts:
                    role === "personal"
                        ? personalAccounts({ personal2: true, active })
                        : workAccounts({ active }),
                activeAccountNumber: active,
                args: ["--check"],
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain(`Setup is complete for this ${role} machine`);
            expect(result.log).toEqual(["--version", "list --json", "status --json"]);
        },
    );

    test("finishes a fresh personal enrollment on personal", async () => {
        const result = await runSetupFixture({ role: "personal", input: "\n\n\n" });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log.filter((command) => command.startsWith("add "))).toEqual([
            "add --alias personal",
            "add --alias work",
            "add --alias work2",
        ]);
        expect(result.log).toContain("switch personal");
        expectInOrder(
            result.log,
            "auto --once --dry-run",
            "menubar --install-service --auto-switch",
        );
        expect(result.log).not.toContain("menubar --install-service");
        expect(activeAlias(result.state)).toBe("personal");
    });

    test("enrolls personal2 in a new slot and restores the active account", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ active: 2 }),
            activeAccountNumber: 2,
            args: ["--enroll", "personal2"],
            input: "\n",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain("Do NOT run /logout");
        expect(result.log).toContain("add --alias personal2");
        expect(result.log).toContain("switch 2");
        expect(result.log).not.toContain("switch personal");
        expect(result.log).toContain("menubar --install-service");
        expect(result.log).not.toContain("menubar --install-service --auto-switch");
        expect(result.state.accounts.find((account) => account.alias === "personal2")?.number).toBe(
            5,
        );
        expect(activeAlias(result.state)).toBe("work");
    });

    test.each([
        ["personal", personalAccounts({ active: 2, work2: false }), 2, "personal"],
        ["work", workAccounts({ active: 1, work2: false }), 1, "work"],
    ] as const)(
        "completes a %s setup with --enroll work2 and turns autoswitch on",
        async (role, accounts, active, finalAlias) => {
            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: active,
                args: ["--enroll", "work2"],
                input: "\n",
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("Do NOT run /logout");
            expect(result.log.filter((command) => command.startsWith("add "))).toEqual([
                "add --alias work2",
            ]);
            expect(result.log).toContain(`switch ${finalAlias}`);
            expectInOrder(
                result.log,
                "auto --once --dry-run",
                "menubar --install-service --auto-switch",
            );
            expect(result.log).not.toContain("menubar --install-service");
            expect(
                result.state.accounts.filter((account) => account.alias === "work2"),
            ).toHaveLength(1);
            expect(activeAlias(result.state)).toBe(finalAlias);
        },
    );

    test.each([
        ["personal", personalAccounts({ active: 2 }), 2],
        ["work", workAccounts({ active: 1 }), 1],
    ] as const)(
        "leaves an enrolled work2 unchanged on --enroll work2 on a %s machine",
        async (role, accounts, active) => {
            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: active,
                args: ["--enroll", "work2"],
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("'work2' is already enrolled");
            expect(result.log.some((command) => /^(add|switch) /.test(command))).toBe(false);
            expect(result.log).toContain("menubar --install-service");
            expect(result.log).not.toContain("menubar --install-service --auto-switch");
            const identities = (list: readonly FakeAccount[]) =>
                list.map(({ number, email, alias }) => [number, email, alias]);
            expect(identities(result.state.accounts)).toEqual(identities(accounts));
            expect(result.state.activeAccountNumber).toBe(active);
        },
    );

    test.each([
        ["personal", personalAccounts({ active: 2 }), 2, 4],
        ["work", workAccounts({ active: 1 }), 1, 2],
    ] as const)(
        "reauthenticates work2 in its slot on a %s machine and restores the previous account",
        async (role, accounts, active, slot) => {
            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: active,
                args: ["--reauth", "work2"],
                input: "\n",
                loginAtPrompt: slot,
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("Do NOT run /logout");
            expect(result.log).toContain(`add --slot ${slot}`);
            expect(result.log).toContain(`switch ${active}`);
            expect(result.log).toContain("menubar --install-service");
            expect(result.log).not.toContain("menubar --install-service --auto-switch");
            expect(result.state.accounts.find((account) => account.alias === "work2")?.number).toBe(
                slot,
            );
            expect(result.state.activeAccountNumber).toBe(active);
        },
    );

    test("reauthenticates work on a work machine and restores work2", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 2 }),
            activeAccountNumber: 2,
            args: ["--reauth", "work"],
            input: "\n",
            loginAtPrompt: 1,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --slot 1");
        expect(result.log).toContain("switch 2");
        expect(result.log).not.toContain("menubar --install-service --auto-switch");
        expect(activeAlias(result.state)).toBe("work2");
    });

    test.each([[["--enroll", "work2"]], [[]]])(
        "adopts an unaliased current login as work2 in place (args: %p)",
        async (args) => {
            const result = await runSetupFixture({
                role: "personal",
                accounts: [
                    ...personalAccounts({ active: 3, work2: false }),
                    { number: 3, email: "hand@example.com", active: true },
                ],
                activeAccountNumber: 3,
                args,
                input: "\n",
                loginAtPrompt: "unchanged",
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.log.filter((command) => command.startsWith("add "))).toEqual([
                "add --alias work2",
            ]);
            expect(
                result.state.accounts.map((account) => [
                    account.number,
                    account.email,
                    account.alias,
                ]),
            ).toEqual([
                [1, "personal@example.com", "personal"],
                [2, "work@example.com", "work"],
                [3, "hand@example.com", "work2"],
            ]);
        },
    );

    test("refuses --enroll work2 for an unaliased login on a work machine", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: [
                ...workAccounts({ active: 3, work2: false }),
                { number: 3, email: "hand@example.com", active: true },
            ],
            activeAccountNumber: 3,
            args: ["--enroll", "work2"],
            input: "\n",
            loginAtPrompt: "unchanged",
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("other than the native 'work' and 'work2' aliases");
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
        expect(
            result.state.accounts.find((account) => account.number === 3)?.alias,
        ).toBeUndefined();
    });

    test("reauthenticates personal2 in its slot and ends on the previously active work", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ personal2: true, active: 2 }),
            activeAccountNumber: 2,
            args: ["--reauth", "personal2"],
            input: "\n",
            loginAtPrompt: 3,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toContain("Do NOT run /logout");
        expect(result.log).toContain("add --slot 3");
        expect(result.log).not.toContain("switch personal");
        const personal2 = result.state.accounts.find((account) => account.alias === "personal2");
        expect(personal2?.number).toBe(3);
        expect(personal2?.priority).toBe(100);
        expect(personal2?.threshold).toBe(95);
        expect(result.log).toContain("add --slot 3");
        const addIndex = result.log.indexOf("add --slot 3");
        const policyIndexes = result.log
            .map((command, index) =>
                /^(priority|threshold) personal2 /.test(command) ? index : -1,
            )
            .filter((index) => index >= 0);
        expect(policyIndexes.length).toBeGreaterThan(0);
        expect(policyIndexes.every((index) => index > addIndex)).toBe(true);
        expect(activeAlias(result.state)).toBe("work");
    });

    test("keeps a held-out personal2 out of rotation across --reauth", async () => {
        const accounts = personalAccounts({ personal2: true, active: 2 }).map((account) =>
            account.alias === "personal2" ? { ...account, disabled: true } : account,
        );
        const result = await runSetupFixture({
            role: "personal",
            accounts,
            activeAccountNumber: 2,
            args: ["--reauth", "personal2"],
            input: "\n",
            loginAtPrompt: 3,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --slot 3");
        expect(result.log.some((command) => command.startsWith("disable "))).toBe(false);
        expect(result.log).not.toContain("menubar --install-service --auto-switch");
        expect(
            result.state.accounts.find((account) => account.alias === "personal2")?.disabled,
        ).toBe(true);
    });

    test("does not disable personal2 on --reauth when it was not held out", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ personal2: true, active: 2 }),
            activeAccountNumber: 2,
            args: ["--reauth", "personal2"],
            input: "\n",
            loginAtPrompt: 3,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log.some((command) => command.startsWith("disable "))).toBe(false);
    });

    test.each([
        ["--enroll", "personal2", "Cannot enroll 'personal2' on a work machine"],
        ["--reauth", "personal2", "Cannot reauthenticate 'personal2' on a work machine"],
    ])("rejects %s %s on a work machine", async (flag, alias, message) => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 1 }),
            activeAccountNumber: 1,
            args: [flag, alias],
        });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain(message);
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
    });

    test.each(["work", "personal", "other"])("rejects --enroll %s", async (alias) => {
        const result = await runSetupFixture({
            role: "personal",
            args: ["--enroll", alias],
        });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain("Usage: claude-swap-setup");
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
    });

    test.each([
        ["absent", personalAccounts({ active: 1 })],
        ["lapsed", personalAccounts({ personal2: true, active: 1, personal2Status: "expired" })],
    ])("prints nothing about personal2 when it is %s", async (_state, accounts) => {
        for (const args of [["--check"], []]) {
            const result = await runSetupFixture({
                role: "personal",
                accounts,
                activeAccountNumber: 1,
                args,
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout + result.stderr).not.toContain("personal2");
        }
    });

    test("refuses to enroll personal2 while the login is another enrolled account", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ active: 1 }),
            activeAccountNumber: 1,
            args: ["--enroll", "personal2"],
            input: "\n",
            loginAtPrompt: "unchanged",
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("'personal'");
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
        expect(result.state.accounts.map((account) => account.alias).sort()).toEqual([
            "personal",
            "work",
            "work2",
        ]);
    });

    test("refuses a required alias capture while the login is another enrolled account", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                { number: 1, email: "personal@example.com", alias: "personal", active: true },
            ],
            activeAccountNumber: 1,
            input: "\n",
            loginAtPrompt: "unchanged",
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
        expect(result.state.accounts.map((account) => account.alias)).toEqual(["personal"]);
    });

    test("adopts an unaliased managed account as personal2", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: [
                ...personalAccounts({ active: 3 }),
                { number: 3, email: "hand@example.com", active: true },
            ],
            activeAccountNumber: 3,
            args: ["--enroll", "personal2"],
            input: "\n",
            loginAtPrompt: "unchanged",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --alias personal2");
        expect(result.state.accounts.map((account) => [account.number, account.alias])).toEqual([
            [1, "personal"],
            [2, "work"],
            [4, "work2"],
            [3, "personal2"],
        ]);
    });

    test("refuses reauthentication while the login is another enrolled account", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ personal2: true, active: 2 }),
            activeAccountNumber: 2,
            args: ["--reauth", "personal2"],
            input: "\n",
            loginAtPrompt: "unchanged",
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("account 2");
        expect(result.log.some((command) => command.startsWith("add --slot"))).toBe(false);
    });

    // Upstream `add --slot` over a different account prompts to overwrite: declining exits 0,
    // accepting deletes the stored slot.
    test("refuses reauthentication while the login is not enrolled", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ personal2: true, active: 2 }),
            activeAccountNumber: 2,
            args: ["--reauth", "personal2"],
            input: "\n",
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("not an enrolled account");
        expect(result.log.some((command) => command.startsWith("add --slot"))).toBe(false);
        expect(result.state.accounts.find((account) => account.alias === "personal2")?.number).toBe(
            3,
        );
    });

    test("reauthenticates personal2 when it is already the current login", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ personal2: true, active: 3 }),
            activeAccountNumber: 3,
            args: ["--reauth", "personal2"],
            input: "\n",
            loginAtPrompt: "unchanged",
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.log).toContain("add --slot 3");
    });

    test("treats personal2 on a work machine as an unexpected account", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: [
                ...workAccounts({ active: 1 }),
                { number: 3, email: "personal2@example.com", alias: "personal2", active: false },
            ],
            activeAccountNumber: 1,
            args: ["--check"],
        });

        expect(result.exitCode).not.toBe(0);
        expect(result.stdout).toContain("alias: personal2");
        expect(result.stderr).toContain("remove it explicitly with 'cswap remove");
        expect(result.log.some((command) => /^(remove|disable)\b/.test(command))).toBe(false);
    });
});

describe("claude-swap rotation policy", () => {
    const personalPolicy = [
        "priority personal2 100",
        "threshold personal2 95",
        "priority work 50",
        "threshold work 70",
        "priority work2 50",
        "threshold work2 70",
        "priority personal 10",
        "threshold personal 80",
    ];
    const workPolicy = [
        "priority work 50",
        "threshold work 95",
        "priority work2 50",
        "threshold work2 95",
    ];
    const policyCommands = (log: string[]) =>
        log.filter((command) => /^(priority|threshold) /.test(command));
    const policyState = (accounts: FakeAccount[]) =>
        accounts.map(({ alias, priority, threshold }) => [alias, priority, threshold]);

    test("applies every declared personal tier and line to the enrolled aliases", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ personal2: true, active: 1 }),
            activeAccountNumber: 1,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(policyCommands(result.log)).toEqual(personalPolicy);
        expect(policyState(result.state.accounts)).toEqual([
            ["personal", 10, 80],
            ["work", 50, 70],
            ["personal2", 100, 95],
            ["work2", 50, 70],
        ]);
    });

    test("applies the work tier and line to both work accounts", async () => {
        const result = await runSetupFixture({
            role: "work",
            accounts: workAccounts({ active: 1 }),
            activeAccountNumber: 1,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(policyCommands(result.log)).toEqual(workPolicy);
        expect(policyState(result.state.accounts)).toEqual([
            ["work", 50, 95],
            ["work2", 50, 95],
        ]);
    });

    test("skips personal2 when it is not enrolled", async () => {
        const result = await runSetupFixture({
            role: "personal",
            accounts: personalAccounts({ active: 1 }),
            activeAccountNumber: 1,
        });

        expect(result.exitCode, result.stderr).toBe(0);
        expect(policyCommands(result.log)).toEqual(personalPolicy.slice(2));
    });

    test.each([
        [
            "personal",
            personalAccounts({ personal2: true, active: 1, work2: false }),
            [...personalPolicy.slice(0, 4), ...personalPolicy.slice(6)],
        ],
        ["work", workAccounts({ active: 1, work2: false }), workPolicy.slice(0, 2)],
    ] as const)(
        "--apply-policy skips work2 on a %s machine before it is enrolled",
        async (role, accounts, expected) => {
            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: 1,
                args: ["--apply-policy"],
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.log).toEqual(["--version", "list --json", "status --json", ...expected]);
        },
    );

    test.each([
        ["personal", personalAccounts({ personal2: true, active: 1 }), personalPolicy, [50, 70]],
        ["work", workAccounts({ active: 1 }), workPolicy, [50, 95]],
    ] as const)(
        "converges hand-made drift on a %s re-run without re-enrolling",
        async (role, accounts, expected, workValues) => {
            const drifted = accounts.map((account) =>
                account.alias === "work" ? { ...account, priority: 100, threshold: 90 } : account,
            );
            const result = await runSetupFixture({
                role,
                accounts: drifted,
                activeAccountNumber: 1,
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(policyCommands(result.log)).toEqual(expected);
            expect(result.log.some((command) => command.startsWith("add "))).toBe(false);
            const work = result.state.accounts.find((account) => account.alias === "work");
            expect([work?.priority, work?.threshold]).toEqual([...workValues]);
        },
    );

    test.each([
        ["personal", personalAccounts({ personal2: true, active: 2 }), personalPolicy],
        ["work", workAccounts({ active: 2 }), workPolicy],
    ] as const)(
        "--apply-policy only applies tiers and lines on a %s machine",
        async (role, accounts, expected) => {
            const result = await runSetupFixture({
                role,
                accounts: [...accounts],
                activeAccountNumber: 2,
                args: ["--apply-policy"],
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.log).toEqual(["--version", "list --json", "status --json", ...expected]);
            expect(result.state.activeAccountNumber).toBe(2);
        },
    );

    test("keeps held-out work accounts held out on a personal machine", async () => {
        const accounts = personalAccounts({ personal2: true, active: 3 }).map((account) =>
            account.alias?.startsWith("work") ? { ...account, disabled: true } : account,
        );
        for (const args of [[], ["--check"], ["--apply-policy"]]) {
            const result = await runSetupFixture({
                role: "personal",
                accounts,
                activeAccountNumber: 3,
                args,
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.log.some((command) => /^(enable|disable) /.test(command))).toBe(false);
            expect(
                result.state.accounts
                    .filter((account) => account.alias?.startsWith("work"))
                    .map((account) => account.disabled),
            ).toEqual([true, true]);
        }
    });
});

describe("post-apply claude-swap setup offer", () => {
    test(
        "does not prompt when role-specific setup is complete",
        async () => {
            const result = await runOfferFixture({ checkExitCode: 0, forceTty: true });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("already complete");
            expect(result.stdout).not.toContain("Run the guided setup now?");
            expect(result.log).toEqual(["apply-policy", "check"]);
        },
        shellIntegrationTimeoutMs,
    );

    test(
        "offers and runs the wizard for an incomplete TTY setup",
        async () => {
            const result = await runOfferFixture({
                checkExitCode: 2,
                forceTty: true,
                input: "y\n",
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("Run the guided setup now?");
            expect(result.stdout).toContain("guided setup ran");
            expect(result.log).toEqual(["apply-policy", "check", "run"]);
        },
        shellIntegrationTimeoutMs,
    );

    test(
        "prints the re-runnable command without blocking a non-TTY apply",
        async () => {
            const result = await runOfferFixture({ checkExitCode: 2 });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("non-interactive apply will not prompt");
            expect(result.stdout).toContain(".local/bin/claude-swap-setup");
            expect(result.log).toEqual(["apply-policy", "check"]);
        },
        shellIntegrationTimeoutMs,
    );

    test(
        "keys rendered content to role, pin, and setup revision",
        async () => {
            const personal = await renderOffer("personal");
            const work = await renderOffer("work");

            expect(personal).not.toBe(work);
            expect(personal).toContain('MACHINE_TYPE="personal"');
            expect(work).toContain('MACHINE_TYPE="work"');
            for (const rendered of [personal, work]) {
                expect(rendered).toContain('CLAUDE_SWAP_VERSION="1.2.0"');
                expect(rendered).toContain('SETUP_COMMAND_REVISION="3"');
                expect(rendered).toContain(
                    'ROTATION_POLICY_PERSONAL="personal2:100:95 work:50:70 work2:50:70 personal:10:80"',
                );
                expect(rendered).toContain('ROTATION_POLICY_WORK="work:50:95 work2:50:95"');
                expect(rendered).toContain(
                    ': "$CLAUDE_SWAP_VERSION" "$SETUP_COMMAND_REVISION" "$ROTATION_POLICY_PERSONAL" "$ROTATION_POLICY_WORK"',
                );
            }
        },
        shellIntegrationTimeoutMs,
    );

    test.each([
        ["personal", true],
        ["personal", false],
        ["work", true],
        ["work", false],
    ] as const)(
        "applies the rotation policy on a %s machine without prompting (TTY: %p)",
        async (role, forceTty) => {
            const result = await runOfferFixture({ checkExitCode: 0, role, forceTty });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("policy applied");
            expect(result.stdout).not.toContain("Run the guided setup now?");
            expect(result.log).toEqual(["apply-policy", "check"]);
        },
        shellIntegrationTimeoutMs,
    );

    test(
        "offers the wizard for an incomplete work setup after applying the policy",
        async () => {
            const result = await runOfferFixture({
                checkExitCode: 2,
                role: "work",
                forceTty: true,
                input: "y\n",
            });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("incomplete for this work machine");
            expect(result.log).toEqual(["apply-policy", "check", "run"]);
        },
        shellIntegrationTimeoutMs,
    );

    test(
        "keeps going when the policy cannot be applied",
        async () => {
            const result = await runOfferFixture({ checkExitCode: 0, applyPolicyExitCode: 1 });

            expect(result.exitCode, result.stderr).toBe(0);
            expect(result.stdout).toContain("retry with:");
            expect(result.log).toEqual(["apply-policy", "check"]);
        },
        shellIntegrationTimeoutMs,
    );

    async function offerSourceWith(transform: (setup: string) => string): Promise<string> {
        const source = await mkdtemp(path.join(tmpdir(), "claude-swap-offer-source-"));
        temporaryDirectories.push(source);
        const setupCopy = path.join(source, path.relative(repositoryRoot, setupTemplate));
        await mkdir(path.dirname(setupCopy), { recursive: true });
        await writeFile(setupCopy, transform(await readFile(setupTemplate, "utf8")));
        await writeFile(
            path.join(source, path.basename(offerTemplate)),
            await readFile(offerTemplate),
        );
        return source;
    }

    test.each([
        ["ROTATION_POLICY_PERSONAL", "work2:50:70", "work2:50:65"],
        ["ROTATION_POLICY_WORK", "work2:50:95", "work2:50:90"],
    ] as const)(
        "changes its rendered content on both machine types when %s changes",
        async (name, from, to) => {
            const source = await offerSourceWith((setup) =>
                setup.replace(new RegExp(`^(${name}="[^"]*)${from}`, "m"), `$1${to}`),
            );

            for (const role of ["personal", "work"] as const) {
                const original = await renderOffer(role);
                const changed = await renderOffer(role, source);

                expect(changed).not.toBe(original);
                expect(changed).toMatch(new RegExp(`^${name}="[^"]*${to}`, "m"));
            }
        },
        shellIntegrationTimeoutMs,
    );

    test.each(["ROTATION_POLICY_PERSONAL", "ROTATION_POLICY_WORK"])(
        "fails the render when %s is missing",
        async (name) => {
            const source = await offerSourceWith((setup) =>
                setup.replace(new RegExp(`^${name}=.*\\n`, "m"), ""),
            );

            const result = run([
                "chezmoi",
                "execute-template",
                "--source",
                source,
                "--config",
                "/dev/null",
                "--config-format",
                "toml",
                "--override-data",
                JSON.stringify({ machineType: "personal" }),
                "--file",
                path.join(source, path.basename(offerTemplate)),
            ]);

            expect(result.exitCode).not.toBe(0);
            expect(result.stderr).toContain(
                `${name} is missing from dot_local/bin/executable_claude-swap-setup.tmpl`,
            );
        },
        shellIntegrationTimeoutMs,
    );
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
    test("matches both machine types' rotation and failure matrices", async () => {
        const executable = run(["which", "cswap"]);
        expect(executable.exitCode, executable.stderr).toBe(0);
        const cswapPath = executable.stdout.trim();
        const shebang = (await readFile(cswapPath, "utf8")).split("\n", 1)[0];
        expect(shebang.startsWith("#!")).toBe(true);

        const result = run([shebang.slice(2), autoswitchFixture]);
        expect(result.exitCode, result.stderr).toBe(0);
        const report = JSON.parse(result.stdout);

        expect(report.claudeSwap).toBe("1.2.0");
        expect(report.policy).toEqual({
            personal: {
                tiers: { personal2: 100, work: 50, work2: 50, personal: 10 },
                lines: { personal2: 95, work: 70, work2: 70, personal: 80 },
            },
            work: {
                tiers: { work: 50, work2: 50 },
                lines: { work: 95, work2: 95 },
            },
        });
        const stay = (active: string, outcome: string, ...reasons: string[]) => ({
            active,
            outcome,
            reasons,
        });
        const switched = (to: string, trigger: string) => ({ outcome: "SWITCHED", to, trigger });
        expect(report.scenarios.personal).toEqual({
            activeExhausted: stay("personal", "BLOCKED", "no-qualifying-candidate"),
            authenticationQuarantine: {
                ...switched("work2", "proactive"),
                quarantined: ["work"],
            },
            cooldown: stay("work", "NO_ACTION", "cooldown"),
            heldOut: stay("work", "NO_ACTION", "already-consuming-priority"),
            heldOutMovesOn: switched("work2", "proactive"),
            higherTierUsable: switched("personal2", "priority"),
            lineDeparture: switched("work", "proactive"),
            manualHeldOutWorkLeft: switched("personal", "priority"),
            manualLowerTierReverted: [
                stay("personal2", "NO_ACTION", "already-consuming-priority"),
                switched("personal2", "priority"),
            ],
            noReadableCandidate: [
                stay("personal2", "NO_ACTION", "active-usage-unknown"),
                stay("personal2", "NO_ACTION", "active-usage-unknown"),
                stay("personal2", "BLOCKED", "no-qualifying-candidate"),
            ],
            noneQualify: stay("personal2", "BLOCKED", "no-qualifying-candidate"),
            restartKeepsWork: stay("work", "NO_ACTION", "already-consuming-priority"),
            soonerResetFirst: switched("work2", "proactive"),
            stale429: {
                ...stay("personal2", "NO_ACTION", "already-consuming-priority"),
                acceptedLimitation: "stale last-good usage can delay a line departure",
            },
            threeUnhealthyTicks: [
                stay("personal2", "NO_ACTION", "active-usage-unknown"),
                stay("personal2", "NO_ACTION", "active-usage-unknown"),
                switched("work", "failover"),
            ],
            unreadableCandidate: stay("personal2", "BLOCKED", "no-qualifying-candidate"),
            weeklyLineDeparture: switched("work", "proactive"),
            workAboveLineSkipped: switched("personal", "proactive"),
            workHeldOut: switched("personal", "proactive"),
            workHeldOutStays: stay("personal", "NO_ACTION", "already-consuming-priority"),
        });
        expect(report.scenarios.work).toEqual({
            activeExhausted: stay("work", "BLOCKED", "no-qualifying-candidate"),
            bothAboveLines: stay("work", "BLOCKED", "no-qualifying-candidate"),
            cooldown: stay("work", "NO_ACTION", "cooldown"),
            lineDeparture: switched("work2", "proactive"),
            manualWithinTierReverted: [
                stay("work", "NO_ACTION", "already-consuming-priority"),
                switched("work", "priority"),
            ],
            soonerResetActiveStays: stay("work", "NO_ACTION", "already-consuming-priority"),
            soonerResetConsumedFirst: switched("work2", "priority"),
            threeUnhealthyTicks: [
                stay("work", "NO_ACTION", "active-usage-unknown"),
                stay("work", "NO_ACTION", "active-usage-unknown"),
                switched("work2", "failover"),
            ],
            weeklyLineDeparture: switched("work2", "proactive"),
        });
    });
});

describe("claude-swap documentation", () => {
    test("keeps README as a concise four-step overview", async () => {
        const readme = await readFile(path.join(repositoryRoot, "README.md"), "utf8");
        const setup = readme.match(/## Setup\n([\s\S]*?)\n## Daily Workflows/)?.[1];

        expect(readme).toContain("[claude-swap](https://github.com/realiti4/claude-swap)");
        expect(readme).toContain("Pinned macOS account and quota manager for Claude Code");
        expect(setup).toBeDefined();
        expect(setup!.match(/^\d+\. /gm)).toHaveLength(4);
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
            "claude-swap-setup --reauth personal|work|work2|personal2",
            "claude-swap-setup --enroll work2",
            "claude-swap-setup --enroll personal2",
            "claude-swap-setup --apply-policy",
            "cswap disable personal2",
            "cswap disable work2",
            "cswap enable work2",
            "cswap menubar --install-service --auto-switch",
            "priority-consume-first",
            "<strong>trial</strong>",
            "<code>add-work2-rotation-policies</code>",
            "<strong>1.5&times;</strong>",
            "<strong>not usage caps</strong>",
            "Fable",
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
        expect(section).not.toContain("claude.ai/artifact/6TgAbxVLuaYbFj3Psick5k");
        expect(section).not.toContain("add-optional-claude-account");
        expect(section).toContain("<code>1.2.0</code>");
        expect(manual.match(/<summary>\d+\./g)).toHaveLength(15);
        expect(manual.match(/<a href="#[^"]+">\d+\./g)).toHaveLength(15);
        expect(manual).toContain("<summary>15. Agent Sessions (Agent of Empires)</summary>");
    });
});
