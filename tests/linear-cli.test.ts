import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

function run(command: string[]) {
    const result = Bun.spawnSync(command, {
        cwd: repositoryRoot,
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

describe("linear brew freeze entry", () => {
    test("schpet/tap/linear is a trusted tap formula frozen at 2.6.0", async () => {
        const holds = await installerArray("BREW_HOLDS");

        expect(await installerArray("BREW_TAPS")).toContain("schpet/tap");
        expect(await installerArray("BREW_PACKAGES")).toContain("schpet/tap/linear");
        expect(
            (await installerArray("BREW_VERSIONS")).filter((row) => row.includes("linear")),
        ).toEqual(["schpet/tap/linear|2.6.0"]);
        expect(holds.filter((entry) => /linear|schpet/.test(entry))).toEqual([]);
    });

    test("pkg_bin resolves the qualified formula to the linear binary", async () => {
        const source = await readFile(installerTemplate, "utf8");
        const pkgBin = source.match(/^pkg_bin\(\) \{[\s\S]*?^\}$/m)?.[0];
        expect(pkgBin).toBeDefined();

        const result = run(["/bin/bash", "-c", `${pkgBin}\npkg_bin schpet/tap/linear`]);
        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toBe("linear\n");
    });

    test("the triage checklist sits beside the linear declaration", async () => {
        const source = await readFile(installerTemplate, "utf8");
        const declarations = source.slice(
            source.indexOf("\nBREW_TAPS=("),
            source.indexOf("\nBREW_PACKAGES=("),
        );

        for (const text of [
            "BREW_VERSIONS row",
            "linear issue query --all-teams --json",
            "linear label list --json",
            "linear issue update <id> --add-label <name>",
            "linear label create -n <name> -c '#rrggbb'",
            "disposable issue and a disposable label",
        ]) {
            expect(declarations).toContain(text);
        }
    });

    test("update-extra does not update linear", async () => {
        const zshrc = await readFile(zshrcTemplate, "utf8");
        const updateExtra = zshrc.match(/update-extra\(\) \{([\s\S]*?)\n\}/)?.[1];

        expect(updateExtra).toBeDefined();
        expect(updateExtra).not.toContain("linear");
    });
});

describe("linear CLI guidance and summaries", () => {
    test.each(["darwin", "linux"])(
        "%s branch prints the auth guidance right after the Linear MCP guidance",
        (os) => {
            const rendered = render(os);
            expect(
                rendered.split("\nprint_linear_mcp_guidance\nprint_linear_cli_guidance\n"),
            ).toHaveLength(2);
            expect(rendered).not.toContain("auth status");

            const guidance = rendered.match(
                /^print_linear_cli_guidance\(\) \{\n[\s\S]*?^\}$/m,
            )?.[0];
            expect(guidance).toBeDefined();
            const printed = run([
                "/bin/bash",
                "-c",
                `info() { printf '%s\\n' "$*"; }\n${guidance}\nprint_linear_cli_guidance`,
            ]).stdout;
            for (const text of [
                "linear auth login",
                "https://linear.app/settings/account/security",
                "macOS Keychain",
                "secret-tool from libsecret",
                "linear auth whoami",
                "linear auth list",
                "LINEAR_API_KEY",
                "takes precedence",
            ]) {
                expect(printed).toContain(text);
            }
            for (const line of lines(printed).filter((l) => l.includes("--plaintext"))) {
                expect(line).toContain("never use --plaintext");
            }
            expect(printed).not.toContain("lin_api_");
        },
    );

    test("the closing summaries and the non-macOS manual list include linear", () => {
        const cliToolLines = (os: string) =>
            lines(render(os)).filter((line) => line.includes("CLI tools:"));
        const all = [...cliToolLines("darwin"), ...cliToolLines("linux")];

        expect(all).toHaveLength(3);
        for (const line of all) expect(line).toContain(", tuicr, linear");
        expect(render("linux")).toContain("- linear: brew install schpet/tap/linear");
    });

    test.each(["darwin", "linux"])("rendered %s installer passes bash -n", async (os) => {
        const root = await mkdtemp(path.join(tmpdir(), "linear-cli-render-"));
        temporaryDirectories.push(root);
        const script = path.join(root, "install.sh");
        await writeFile(script, render(os));
        const result = run(["/bin/bash", "-n", script]);
        expect(result.exitCode, result.stderr).toBe(0);
    });
});
