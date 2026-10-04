import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const installer = path.join(repositoryRoot, "run_onchange_install-packages.sh.tmpl");
const settings = path.join(repositoryRoot, "dot_claude", "modify_settings.json.tmpl");
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

async function installerArray(name: string): Promise<string[]> {
    const source = await readFile(installer, "utf8");
    const assignment = source.match(
        new RegExp(`^${name}=\\((?:.*\\)$|\\n[\\s\\S]*?^\\)$)`, "m"),
    )?.[0];
    expect(assignment).toBeDefined();
    const result = run(["/bin/bash", "-c", `${assignment}\nprintf '%s\\n' "\${${name}[@]}"`]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout.split("\n").filter(Boolean);
}

function render(file: string, os = "darwin", arch = "amd64", machineType = "personal") {
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
        file,
    ]);
    expect(result.exitCode, result.stderr).toBe(0);
    return result.stdout;
}

type Permissions = { allow: string[]; ask: string[]; deny: string[] };

function managedPermissions(rendered: string): Permissions {
    const json = rendered.match(/MANAGED = json\.loads\(r'''\n([\s\S]*?)\n'''/)?.[1];
    expect(json).toBeDefined();
    return JSON.parse(json!).permissions;
}

describe("IBKR MCP registration", () => {
    test("the fixed server name and endpoint bring the real arrays to 17", async () => {
        const http = await installerArray("MCP_HTTP_SERVERS");
        expect(http.filter((entry) => entry.startsWith("ibkr:"))).toEqual([
            "ibkr:https://api.ibkr.com/v1/api/mcp-public",
        ]);
        expect(http.indexOf("ibkr:https://api.ibkr.com/v1/api/mcp-public")).toBe(
            http.indexOf("jetbrains:http://localhost:64542/stream") + 1,
        );
        expect([...http, ...(await installerArray("MCP_STDIO_SERVERS"))]).toHaveLength(17);
    });

    test("other agents do not register IBKR", async () => {
        expect((await installerArray("CODEX_HTTP_MCP_SERVERS")).join("\n")).not.toMatch(
            /ibkr|api\.ibkr\.com/i,
        );
        for (const file of [
            "dot_config/opencode/opencode.jsonc",
            "dot_junie/mcp/modify_mcp.json.tmpl",
        ])
            expect(await readFile(path.join(repositoryRoot, file), "utf8")).not.toMatch(
                /ibkr|api\.ibkr\.com/i,
            );
    });

    test("manual instructions cover authentication, revocation and the drafting deny", () => {
        const line = render(installer)
            .split("\n")
            .find((line) => line.includes("- IBKR MCP"));
        expect(line).toBeDefined();
        for (const text of [
            "Claude Code only",
            "OAuth",
            "/mcp",
            "'ibkr'",
            "login with 2FA",
            "AI agreements",
            "one account",
            "Client Portal → Settings → Manage Third-Party Consents",
            "create_order_instruction",
            "delete_order_instruction",
            "get_account_positions",
            "get_account_orders",
            "denied",
        ])
            expect(line).toContain(text);
        expect(line).not.toMatch(
            /\b[UF]\d{6,}\b|--header|--client-id|--client-secret|--callback-port/,
        );
    });

    test("parity records all three intentional gaps", async () => {
        const source = await readFile(
            path.join(repositoryRoot, ".agents/skills/sync-agent-config/parity.md"),
            "utf8",
        );
        const row = source.split("\n").find((line) => /^\|\s*IBKR MCP\s*\|/.test(line));
        expect(row).toBeDefined();
        const cells = row!
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim());
        expect(cells.slice(2, 5)).toEqual(["none", "none", "none"]);
        expect(cells[5]).toContain("order-drafting deny");
        expect(cells[5]).toContain("only consumer");
        expect(cells[5]).toContain("`stonks`");
    });
});

describe("IBKR order instruction denies", () => {
    test.each([
        ["darwin", "amd64", "personal"],
        ["darwin", "arm64", "work"],
        ["linux", "amd64", "personal"],
    ])(
        "%s %s %s denies instruction writes and preserves reads and bash denies",
        async (os, arch, machineType) => {
            const permissions = managedPermissions(render(settings, os, arch, machineType));
            const http = await installerArray("MCP_HTTP_SERVERS");
            const server = http.find((entry) =>
                entry.endsWith(":https://api.ibkr.com/v1/api/mcp-public"),
            );
            expect(server).toBeDefined();
            const prefix = `mcp__${server!.split(":")[0]}__`;
            const rules = ["create_order_instruction", "delete_order_instruction"].map(
                (tool) => `${prefix}${tool}`,
            );
            expect(permissions.deny.filter((entry) => entry.startsWith("mcp__ibkr__"))).toEqual(
                rules,
            );
            for (const tool of [
                "get_account_positions",
                "get_account_orders",
                "get_order_instructions",
            ])
                expect(permissions.deny).not.toContain(`${prefix}${tool}`);
            for (const list of [permissions.allow, permissions.ask])
                expect(list.filter((entry) => entry.includes("mcp__ibkr__"))).toEqual([]);
            expect(permissions.deny).not.toContain("mcp__ibkr__*");

            const spec = await readFile(
                path.join(repositoryRoot, "openspec/specs/claude-user-preferences/spec.md"),
                "utf8",
            );
            const requirement = spec
                .split("### Requirement: Deny rules block dangerous bash commands")[1]
                .split("#### Scenario:")[0];
            const bashRules = [...requirement.matchAll(/`(Bash\([^`]+\))`/g)].map(
                (match) => match[1],
            );
            expect(bashRules).toHaveLength(12);
            for (const bashRule of bashRules) expect(permissions.deny).toContain(bashRule);
        },
    );

    test.each([
        [[]],
        [["mcp__ibkr__create_order_instruction"]],
        [["mcp__ibkr__delete_order_instruction"]],
        [["mcp__ibkr__get_order_instructions"]],
    ])(
        "the settings merge restores both denies and replaces the obsolete rule (%j)",
        async (deny) => {
            const root = await mkdtemp(path.join(tmpdir(), "ibkr-settings-"));
            temporaryDirectories.push(root);
            const script = path.join(root, "modify.sh");
            await writeFile(script, render(settings));
            const result = run(
                ["/bin/sh", script],
                JSON.stringify({ permissions: { deny }, fictionalUnmanagedSetting: true }),
            );
            expect(result.exitCode, result.stderr).toBe(0);
            const merged = JSON.parse(result.stdout);
            expect(
                merged.permissions.deny.filter((entry: string) => entry.startsWith("mcp__ibkr__")),
            ).toEqual([
                "mcp__ibkr__create_order_instruction",
                "mcp__ibkr__delete_order_instruction",
            ]);
            expect(merged.fictionalUnmanagedSetting).toBe(true);
            const second = run(["/bin/sh", script], result.stdout);
            expect(second.exitCode, second.stderr).toBe(0);
            expect(second.stdout).toBe(result.stdout);
        },
    );
});
