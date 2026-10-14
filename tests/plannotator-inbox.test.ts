import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repo = path.resolve(import.meta.dir, "..");
const installer = await readFile(path.join(repo, "run_onchange_install-packages.sh.tmpl"), "utf8");
const zshrc = await readFile(path.join(repo, "dot_zshrc.tmpl"), "utf8");
const roots: string[] = [];
const capability = `#!/bin/sh
case "$1" in
 --version) echo 'plannotator test'; exit 0 ;;
 inbox) echo '# Plannotator Inbox: a guide for agents' ;;
esac
`;
function section(source: string, start: string, end: string) {
    const a = source.indexOf(start),
        b = source.indexOf(end, a);
    expect(a).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(a);
    return source.slice(a, b);
}
const group7 = section(installer, "# Keep these helpers available", "# Group 8:");
const updater = section(zshrc, "_update_extra_plannotator()", "unalias update-extra");
afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function fixture(git = true) {
    const root = await mkdtemp(path.join(tmpdir(), "plannotator-test-"));
    roots.push(root);
    const bin = path.join(root, "bin"),
        home = path.join(root, "home");
    await mkdir(bin);
    await mkdir(path.join(home, ".local/bin"), { recursive: true });
    for (const name of ["bash", "cat", "chmod", "mkdir", "mktemp", "rm", "dirname"]) {
        const resolved = Bun.which(name)!;
        await symlink(resolved, path.join(bin, name));
    }
    async function stub(name: string, body: string) {
        const file = path.join(bin, name);
        await writeFile(file, body);
        await chmod(file, 0o755);
    }
    if (git) await stub("git", "#!/bin/sh\nexit 0\n");
    await writeFile(path.join(root, "current"), capability);
    await stub(
        "curl",
        `#!/bin/sh
[ "$DOWNLOAD_FAIL" != 1 ] || exit 9
while [ "$1" != -o ]; do shift; done
shift
cat > "$1" <<'INSTALL'
printf '%s\\n' "$*" >> "$CALLS"
[ "$INSTALL_FAIL" != 1 ] || exit 8
[ "$INSTALL_NO_BINARY" != 1 ] || exit 0
cat "$CURRENT" > "$HOME/.local/bin/plannotator"
chmod +x "$HOME/.local/bin/plannotator"
INSTALL
`,
    );
    const env = {
        ...process.env,
        HOME: home,
        PATH: bin,
        CALLS: path.join(root, "calls"),
        CURRENT: path.join(root, "current"),
    };
    async function run(
        script: string,
        extra: Record<string, string> = {},
        shell = "/bin/bash",
        input = "",
    ) {
        const file = path.join(root, "run.sh");
        await writeFile(file, script);
        const result = Bun.spawnSync([shell, file], {
            cwd: repo,
            env: { ...env, ...extra },
            stdin: Buffer.from(input),
            stdout: "pipe",
            stderr: "pipe",
        });
        return {
            code: result.exitCode,
            out: result.stdout.toString(),
            err: result.stderr.toString(),
            calls: await readFile(env.CALLS, "utf8").catch(() => ""),
        };
    }
    return { root, bin, home, env, stub, run };
}
const logging = `ERRORS=0
info() { echo "INFO: $*"; }
warn() { echo "WARN: $*" >&2; }
error() { echo "ERROR: $*" >&2; ERRORS=$((ERRORS+1)); }
confirm() { echo "CONFIRM: $*"; return 0; }
`;
const installRun = logging + group7 + '\nexit "$ERRORS"\n';
test.each(["path", "fallback"])(
    "compatible %s installation is reused without consent/download",
    async (location) => {
        const f = await fixture();
        if (location === "path") await f.stub("plannotator", capability);
        else {
            const file = path.join(f.home, ".local/bin/plannotator");
            await writeFile(file, capability);
            await chmod(file, 0o755);
        }
        const result = await f.run(installRun);
        expect(result.code, result.err).toBe(0);
        expect(result.out).toContain("compatible");
        expect(result.out).not.toContain("CONFIRM");
        expect(result.calls).toBe("");
    },
);
test.each([true, false])("missing binary installs with correct flags (git=%s)", async (git) => {
    const f = await fixture(git);
    const result = await f.run(installRun);
    expect(result.code, result.err).toBe(0);
    expect(result.out).toContain("ready at");
    expect(result.calls.trim()).toBe(git ? "--non-interactive" : "--non-interactive --skip-skills");
});
test("successful old help upgrades and verifies", async () => {
    const f = await fixture();
    const file = path.join(f.home, ".local/bin/plannotator");
    await writeFile(file, "#!/bin/sh\necho old\n");
    await chmod(file, 0o755);
    const result = await f.run(installRun);
    expect(result.code, result.err).toBe(0);
    expect(result.out).toContain("ready at");
    expect(result.calls).toContain("--non-interactive");
});
test.each(["--version", "inbox"])("failed %s detection does not reinstall", async (failure) => {
    const f = await fixture();
    await f.stub("plannotator", `#!/bin/sh\n[ "$1" != '${failure}' ] || exit 7\necho version\n`);
    const result = await f.run(installRun);
    expect(result.code).toBe(1);
    expect(result.err).toContain("capability check failed");
    expect(result.calls).toBe("");
});
test.each(["DOWNLOAD_FAIL", "INSTALL_FAIL", "INSTALL_NO_BINARY"])(
    "installer reports %s without claiming readiness",
    async (failure) => {
        const f = await fixture();
        const result = await f.run(installRun, { [failure]: "1" });
        expect(result.code).toBe(1);
        expect(result.out).not.toContain("ready at");
        expect(result.err).toContain("ERROR:");
        if (failure === "DOWNLOAD_FAIL") expect(result.calls).toBe("");
    },
);
test.each([true, false])("update helper passes flags under zsh (git=%s)", async (git) => {
    const f = await fixture(git);
    const result = await f.run(updater + "\n_update_extra_plannotator\n", {}, "/bin/zsh");
    expect(result.code, result.err).toBe(0);
    expect(result.calls.trim()).toBe(git ? "--non-interactive" : "--non-interactive --skip-skills");
    expect(zshrc.match(/_update_extra_step "plannotator"/g)).toHaveLength(1);
});
test.each(["DOWNLOAD_FAIL", "INSTALL_FAIL"])("updater propagates %s", async (failure) => {
    const f = await fixture();
    const result = await f.run(
        updater + "\n_update_extra_plannotator\n",
        { [failure]: "1" },
        "/bin/zsh",
    );
    expect(result.code).not.toBe(0);
});

const codexRead = section(installer, "codex_mcp_read_json()", "codex_mcp_entry_matches()");
const codexInbox = section(installer, "# BEGIN CODEX INBOX MCP", "# END CODEX INBOX MCP");
const helpers = section(installer, "resolve_plannotator()", "configure_plannotator()");
async function codexFixture() {
    const f = await fixture();
    await f.stub("plannotator", capability);
    await symlink(Bun.which("jq")!, path.join(f.bin, "jq"));
    const state = path.join(f.root, "mcp.json");
    await writeFile(
        state,
        JSON.stringify([
            {
                name: "unrelated",
                enabled: true,
                transport: { type: "streamable_http", url: "https://example.invalid" },
                custom: 42,
            },
        ]),
    );
    await f.stub(
        "codex",
        `#!/bin/bash
if [ "$1 $2" = 'mcp list' ]; then cat "$MCP_STATE"; exit 0; fi
printf '%s\\n' "$*" >> "$CALLS"
[ "$ADD_FAIL" != 1 ] || exit 1
[ "$ADD_NO_ENTRY" != 1 ] || exit 0
jq --arg binary "$5" '. + [{name:"plannotator-inbox",enabled:true,transport:{type:"stdio",command:$binary,args:["inbox","mcp"]}}]' "$MCP_STATE" > "$MCP_STATE.tmp"
cat "$MCP_STATE.tmp" > "$MCP_STATE"
`,
    );
    const entry = {
        name: "plannotator-inbox",
        enabled: true,
        transport: {
            type: "stdio",
            command: path.join(f.bin, "plannotator"),
            args: ["inbox", "mcp"],
        },
        extra: "preserve",
    };
    const run = (env = {}) =>
        f.run(logging + helpers + codexRead + codexInbox + "\nconfigure_codex_inbox\n", {
            MCP_STATE: state,
            ...env,
        });
    return { ...f, state, entry, check: run };
}
test("Codex adds once, verifies, preserves unrelated config and converges", async () => {
    const f = await codexFixture();
    const before = JSON.parse(await readFile(f.state, "utf8"));
    const first = await f.check();
    expect(first.out).toContain("registered and verified");
    expect(first.calls.trim()).toBe(
        `mcp add plannotator-inbox -- ${f.entry.transport.command} inbox mcp`,
    );
    expect(JSON.parse(await readFile(f.state, "utf8"))[0]).toEqual(before[0]);
    const second = await f.check();
    expect(second.out).toContain("already registered");
    expect(second.calls).toBe(first.calls);
});
test.each(["matching", "disabled", "command", "transport", "duplicate"])(
    "Codex preserves %s entries",
    async (kind) => {
        const f = await codexFixture();
        if (kind === "disabled") f.entry.enabled = false;
        if (kind === "command") f.entry.transport.command = "/different";
        if (kind === "transport") f.entry.transport.type = "streamable_http";
        const raw = JSON.stringify(kind === "duplicate" ? [f.entry, f.entry] : [f.entry]);
        await writeFile(f.state, raw);
        const result = await f.check();
        expect(result.calls).toBe("");
        expect(await readFile(f.state, "utf8")).toBe(raw);
        expect(result.out + result.err).toContain(
            kind === "matching" ? "already registered" : "disabled or conflicting",
        );
    },
);
test.each(["broken", "{}", '[{"name":"x"}]'])(
    "Codex refuses invalid discovery: %s",
    async (raw) => {
        const f = await codexFixture();
        await writeFile(f.state, raw);
        const result = await f.check();
        expect(result.err).toContain("valid Codex MCP data");
        expect(result.calls).toBe("");
        expect(await readFile(f.state, "utf8")).toBe(raw);
    },
);
test.each(["codex", "jq", "plannotator"])(
    "Codex missing %s leaves config untouched",
    async (prerequisite) => {
        const f = await codexFixture();
        await rm(path.join(f.bin, prerequisite));
        const before = await readFile(f.state, "utf8");
        const result = await f.check();
        expect(result.err).toContain("requires");
        expect(result.calls).toBe("");
        expect(await readFile(f.state, "utf8")).toBe(before);
    },
);
test.each(["ADD_FAIL", "ADD_NO_ENTRY"])(
    "Codex reports %s without claiming success",
    async (failure) => {
        const f = await codexFixture();
        const result = await f.check({ [failure]: "1" });
        expect(result.out).not.toContain("registered and verified");
        expect(result.err).toContain("failed");
    },
);

const junieMerge = await readFile(path.join(repo, "dot_junie/mcp/modify_mcp.json.tmpl"), "utf8");
const preferenceMerge = await readFile(
    path.join(repo, "dot_plannotator/modify_private_config.json"),
    "utf8",
);
async function mergeFixture() {
    const f = await fixture();
    const python = Bun.which("python3")!;
    await f.stub(
        "uv",
        `#!/bin/sh\n[ "$UV_FAIL" != 1 ] || exit 7\nshift 4\nexec '${python}' "$@"\n`,
    );
    return f;
}
test("Junie skips missing binary, converges after installation, preserves extra options", async () => {
    const f = await mergeFixture();
    const original = {
        custom: [1, 2],
        mcpServers: { custom: { command: "/custom", env: { KEY: "value" } } },
    };
    const first = await f.run(junieMerge, {}, "/bin/sh", JSON.stringify(original));
    expect(first.code, first.err).toBe(0);
    expect(first.err).toContain("reapply");
    expect(JSON.parse(first.out).mcpServers["plannotator-inbox"]).toBeUndefined();
    const binary = path.join(f.home, ".local/bin/plannotator");
    await writeFile(binary, capability);
    await chmod(binary, 0o755);
    const second = await f.run(junieMerge, {}, "/bin/sh", first.out);
    expect(second.code, second.err).toBe(0);
    const doc = JSON.parse(second.out);
    expect(doc.custom).toEqual(original.custom);
    expect(doc.mcpServers.custom).toEqual(original.mcpServers.custom);
    expect(doc.mcpServers["plannotator-inbox"]).toEqual({
        command: binary,
        args: ["inbox", "mcp"],
    });
    doc.mcpServers["plannotator-inbox"].timeout = 90;
    const third = await f.run(junieMerge, {}, "/bin/sh", JSON.stringify(doc));
    expect(JSON.parse(third.out)).toEqual(doc);
    expect(third.err).toContain("already configured");
    expect((await f.run(junieMerge, {}, "/bin/sh", third.out)).out).toBe(third.out);
});
test.each([{ command: "/other" }, { enabled: false }, { disabled: true }, null])(
    "Junie preserves conflict/opt-out %j",
    async (entry) => {
        const f = await mergeFixture();
        await f.stub("plannotator", capability);
        const result = await f.run(
            junieMerge,
            {},
            "/bin/sh",
            JSON.stringify({ mcpServers: { "plannotator-inbox": entry } }),
        );
        expect(result.code, result.err).toBe(0);
        expect(result.err).toContain("conflicting");
        expect(JSON.parse(result.out).mcpServers["plannotator-inbox"]).toEqual(entry);
    },
);
test("Junie incompatible binary skips only Inbox", async () => {
    const f = await mergeFixture();
    await f.stub("plannotator", "#!/bin/sh\necho old\n");
    const result = await f.run(junieMerge);
    expect(result.code, result.err).toBe(0);
    expect(JSON.parse(result.out).mcpServers.deepwiki).toBeDefined();
    expect(JSON.parse(result.out).mcpServers["plannotator-inbox"]).toBeUndefined();
    expect(result.err).toContain("compatible Plannotator missing");
});
test.each([
    {},
    { theme: "dark", inboxTool: { pi: false } },
    { inboxTool: false },
    { inboxTool: true },
    { inboxTool: { opencode: false, pi: true } },
])("OpenCode preference preserves choices: %j", async (original) => {
    const f = await mergeFixture();
    const raw = JSON.stringify(original);
    const result = await f.run(preferenceMerge, {}, "/bin/sh", raw);
    expect(result.code, result.err).toBe(0);
    const expected = structuredClone(original) as any;
    expected.inboxTool ??= {};
    if (typeof expected.inboxTool === "object") expected.inboxTool.opencode ??= true;
    expect(JSON.parse(result.out)).toEqual(expected);
    expect((await f.run(preferenceMerge, {}, "/bin/sh", result.out)).out).toBe(result.out);
});
test("OpenCode empty stdin defaults activation", async () => {
    const f = await mergeFixture();
    const result = await f.run(preferenceMerge);
    expect(result.code, result.err).toBe(0);
    expect(JSON.parse(result.out)).toEqual({ inboxTool: { opencode: true } });
});
test.each(["junie", "preference"])(
    "%s merges buffer failures and pass through only without uv",
    async (kind) => {
        const f = await mergeFixture();
        const script = kind === "junie" ? junieMerge : preferenceMerge;
        const malformed =
            kind === "junie"
                ? ["bad", "[]", '{"mcpServers":42}']
                : [
                      "bad",
                      "[]",
                      '{"inboxTool":null}',
                      '{"inboxTool":1}',
                      '{"inboxTool":{"opencode":"false"}}',
                  ];
        for (const raw of malformed) {
            const result = await f.run(script, {}, "/bin/sh", raw);
            expect(result.code).not.toBe(0);
            expect(result.out).toBe("");
            expect(result.err).toContain("merge failed");
        }
        const failed = await f.run(script, { UV_FAIL: "1" }, "/bin/sh", "{}");
        expect(failed.code).not.toBe(0);
        expect(failed.out).toBe("");
        await rm(path.join(f.bin, "uv"));
        const raw = ' {"custom": 1}\n';
        const passthrough = await f.run(script, {}, "/bin/sh", raw);
        expect(passthrough.code).toBe(0);
        expect(passthrough.out).toBe(raw);
        expect(passthrough.err).toContain("uv missing");
    },
);

test("chezmoi applies the preference privately, converges, and retains malformed live input", async () => {
    const f = await mergeFixture();
    const source = path.join(f.root, "source");
    await mkdir(path.join(source, "dot_plannotator"), { recursive: true });
    await writeFile(
        path.join(source, "dot_plannotator/modify_private_config.json"),
        preferenceMerge,
    );
    const target = path.join(f.home, ".plannotator/config.json");
    const args = [
        Bun.which("chezmoi")!,
        "--source",
        source,
        "--destination",
        f.home,
        "--config",
        "/dev/null",
        "--config-format",
        "toml",
        "--persistent-state",
        path.join(f.root, "state.boltdb"),
        "--cache",
        path.join(f.root, "cache"),
        "--no-tty",
        "apply",
    ];
    const apply = () => Bun.spawnSync(args, { env: f.env, stdout: "pipe", stderr: "pipe" });
    const first = apply();
    expect(first.exitCode, first.stderr.toString()).toBe(0);
    const actual = await readFile(target, "utf8");
    expect(JSON.parse(actual)).toEqual({ inboxTool: { opencode: true } });
    const mode = (await (await import("node:fs/promises")).stat(target)).mode;
    expect(mode & 0o777).toBe(0o600);
    expect(apply().exitCode).toBe(0);
    expect(await readFile(target, "utf8")).toBe(actual);
    await writeFile(target, '{"inboxTool":null}');
    expect(apply().exitCode).not.toBe(0);
    expect(await readFile(target, "utf8")).toBe('{"inboxTool":null}');
});

const cliMerge = await readFile(
    path.join(repo, "dot_config/opencode/modify_private_cli.json"),
    "utf8",
);
test.each([
    {},
    {
        theme: { name: "old", mode: "light" },
        scroll: { speed: 7, acceleration: false },
        session: { thinking: "show" },
        animations: false,
    },
])("OpenCode v2 CLI preserves unrelated preferences: %j", async (original) => {
    const f = await mergeFixture();
    const result = await f.run(cliMerge, {}, "/bin/sh", JSON.stringify(original));
    expect(result.code, result.err).toBe(0);
    expect(JSON.parse(result.out)).toEqual({
        ...original,
        $schema: "https://opencode.ai/v2/cli.json",
        theme: { ...(original as any).theme, name: "catppuccin-macchiato" },
        scroll: { ...(original as any).scroll, acceleration: true },
    });
    expect((await f.run(cliMerge, {}, "/bin/sh", result.out)).out).toBe(result.out);
});
test("OpenCode v2 CLI rejects malformed state and failed merges, passes through only without uv", async () => {
    const f = await mergeFixture();
    for (const raw of ["bad", "[]", '{"theme":null}', '{"scroll":false}']) {
        const result = await f.run(cliMerge, {}, "/bin/sh", raw);
        expect(result.code).not.toBe(0);
        expect(result.out).toBe("");
        expect(result.err).toContain("merge failed");
    }
    expect((await f.run(cliMerge, { UV_FAIL: "1" })).code).not.toBe(0);
    await rm(path.join(f.bin, "uv"));
    const result = await f.run(cliMerge, {}, "/bin/sh", '{"custom": 4}\n');
    expect(result.code).toBe(0);
    expect(result.out).toBe('{"custom": 4}\n');
    expect(result.err).toContain("uv missing");
});

test("OpenCode v2 migration preserves every declared permission, plugin and server", async () => {
    const previous = JSON.parse(
        await readFile(path.join(repo, "tests/fixtures/opencode-v1/global.json"), "utf8"),
    );
    const current = Bun.JSONC.parse(
        await readFile(path.join(repo, "dot_config/opencode/opencode.jsonc"), "utf8"),
    ) as any;
    const permissions = Object.entries(previous.permission).flatMap(([action, rules]) =>
        Object.entries(typeof rules === "string" ? { "*": rules } : (rules as object)).map(
            ([resource, effect]) => ({
                action: action === "bash" ? "shell" : action,
                resource,
                effect,
            }),
        ),
    );
    expect(current.permissions).toEqual(permissions);
    expect(current.plugins.map((p: any) => p.package)).toEqual(previous.plugin);
    for (const key of ["model", "shell", "formatter"]) expect(current[key]).toEqual(previous[key]);
    expect(current.update).toBe("auto");
    for (const [before, after] of [
        [previous, current],
        [
            JSON.parse(
                await readFile(path.join(repo, "tests/fixtures/opencode-v1/project.json"), "utf8"),
            ),
            JSON.parse(await readFile(path.join(repo, "opencode.json"), "utf8")),
        ],
    ]) {
        const recovered = Object.fromEntries(
            Object.entries(after.mcp.servers).map(([name, value]) => {
                const server = { ...(value as any) };
                if ("disabled" in server) {
                    server.enabled = !server.disabled;
                    delete server.disabled;
                }
                return [name, server];
            }),
        );
        expect(recovered).toEqual(before.mcp);
        expect(after.mcp.servers["plannotator-inbox"]).toBeUndefined();
    }
    expect(current.permission).toBeUndefined();
    expect(current.plugin).toBeUndefined();
    expect(current.tui).toBeUndefined();
});
