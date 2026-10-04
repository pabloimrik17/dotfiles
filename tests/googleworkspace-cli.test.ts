import { afterEach, describe, expect, test } from "bun:test";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

describe("Google Workspace CLI freeze", () => {
    test("the core formula has one frozen row and no hold or tap", async () => {
        const packages = await installerArray("BREW_PACKAGES");
        expect(packages).toHaveLength(32);
        expect(packages.at(-1)).toBe("googleworkspace-cli");
        expect(packages).not.toContain("gws");
        expect(
            (await installerArray("BREW_VERSIONS")).filter((row) =>
                row.startsWith("googleworkspace-cli|"),
            ),
        ).toEqual(["googleworkspace-cli|0.22.5"]);
        for (const name of ["BREW_TAPS", "BREW_HOLDS"]) {
            expect(
                (await installerArray(name)).filter((row) => /gws|googleworkspace/.test(row)),
            ).toEqual([]);
        }
        const source = await readFile(installerTemplate, "utf8");
        const pkgBin = source.match(/^pkg_bin\(\) \{[\s\S]*?^\}/m)?.[0];
        expect(pkgBin).toBeDefined();
        const result = run(["/bin/bash", "-c", `${pkgBin}\npkg_bin googleworkspace-cli`]);
        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toBe("gws\n");
    });

    test("the consumer check uses placeholders and records the upgrade sequence", async () => {
        const source = await readFile(installerTemplate, "utf8");
        const block = source.slice(
            source.indexOf("# googleworkspace-cli is"),
            source.indexOf("\nBREW_PACKAGES=("),
        );
        for (const text of [
            "gws sheets spreadsheets values get",
            "<spreadsheet-id>",
            "<tab>!A1:E5",
            "UNFORMATTED_VALUE",
            "range",
            "majorDimension",
            "values",
            "array of rows",
            "JSON numbers",
            "name, not by gid",
            "After the check passes",
            "brew-upgrade-pinned googleworkspace-cli",
            "then bump",
        ])
            expect(block).toContain(text);
        expect(block).not.toMatch(/[A-Za-z0-9_-]{40,}/);
    });

    test("update-extra leaves gws to the brew freeze", async () => {
        const source = await readFile(zshrcTemplate, "utf8");
        const update = source.match(/update-extra\(\) \{([\s\S]*?)\n\}/)?.[1];
        expect(update).toBeDefined();
        expect(update).not.toMatch(/gws|googleworkspace-cli/);
    });
});

describe("Google Workspace CLI guidance", () => {
    test.each(["darwin", "linux"])("%s prints restricted-scope guidance after linear", (os) => {
        const rendered = render(os);
        expect(rendered.split("\nprint_linear_cli_guidance\nprint_gws_guidance\n")).toHaveLength(2);
        const guidance = rendered.match(/^print_gws_guidance\(\) \{\n[\s\S]*?^\}/m)?.[0];
        expect(guidance).toBeDefined();
        const result = run([
            "/bin/bash",
            "-c",
            `info() { printf '%s\\n' "$*"; }\n${guidance}\nprint_gws_guidance`,
        ]);
        expect(result.exitCode, result.stderr).toBe(0);
        for (const text of [
            "one-time-ever",
            "personal Google account",
            "own Google Cloud project",
            "Google Sheets API",
            "app name",
            "support email",
            "public homepage",
            "privacy-policy URL",
            "External",
            "In production",
            "Testing",
            "7 days",
            "fewer than 100 users",
            "Google hasn't verified this app",
            "Desktop app",
            "~/.config/gws/client_secret.json",
            "encrypt",
            "new machine",
            "chezmoi apply",
            "only the login remains",
            "gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly",
            "macOS Keychain",
            "refresh token",
            "100 per client/account",
            "oldest",
            "six months",
            "revoked",
            "Never use gws auth export --unmasked",
            "Never use gws auth setup",
            "gcloud",
        ])
            expect(result.stdout).toContain(text);
        expect(rendered.match(/https:\/\/www\.googleapis\.com\/auth\/[a-z.]+/g)).toEqual([
            "https://www.googleapis.com/auth/spreadsheets.readonly",
        ]);
        for (const line of lines(rendered)) {
            if (line.includes("gws auth login")) expect(line).toContain("--scopes");
            if (line.includes("--unmasked")) expect(line.toLowerCase()).toContain("never");
        }
    });

    test("all three tool lists include gws and Linux has the install hint", () => {
        const lists = [...lines(render("darwin")), ...lines(render("linux"))].filter((line) =>
            line.includes("CLI tools:"),
        );
        expect(lists).toHaveLength(3);
        for (const line of lists) expect(line).toContain(", linear, gws");
        expect(render("linux")).toContain("gws: brew install googleworkspace-cli");
        expect(render("linux")).toContain("the googleworkspace-cli row of BREW_VERSIONS");
    });

    test.each(["darwin", "linux"])("%s render passes bash -n", async (os) => {
        const root = await mkdtemp(path.join(tmpdir(), "gws-render-"));
        temporaryDirectories.push(root);
        const script = path.join(root, "install.sh");
        await writeFile(script, render(os));
        const result = run(["/bin/bash", "-n", script]);
        expect(result.exitCode, result.stderr).toBe(0);
    });
});

describe("encrypted Google OAuth client", () => {
    const sourceDirectory = path.join(repositoryRoot, "dot_config", "gws");
    const sourceName = "encrypted_private_client_secret.json.age";

    test("the only managed gws source is the private age ciphertext", async () => {
        expect(await readdir(sourceDirectory)).toEqual([sourceName]);
        const encrypted = await readFile(path.join(sourceDirectory, sourceName), "utf8");
        expect(encrypted.startsWith("-----BEGIN AGE ENCRYPTED FILE-----\n")).toBe(true);

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
            return target === "dot_config/gws" || target.startsWith("dot_config/gws/");
        });
        expect(sources).toEqual([`dot_config/gws/${sourceName}`]);
    });

    test("a missing age identity prevents deployment and leaves no client file", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "gws-missing-identity-"));
        temporaryDirectories.push(root);
        const destination = path.join(root, "home");
        await mkdir(destination);
        const target = path.join(destination, ".config", "gws", "client_secret.json");
        const config = path.join(root, "chezmoi.toml");
        await writeFile(
            config,
            `encryption = "age"\n[age]\nidentity = ${JSON.stringify(path.join(root, "missing-key.txt"))}\n`,
        );
        const result = run([
            "chezmoi",
            "--config",
            config,
            "--source",
            repositoryRoot,
            "--destination",
            destination,
            "--persistent-state",
            path.join(root, "state.boltdb"),
            "apply",
            "--parent-dirs",
            target,
        ]);
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("client_secret.json");
        expect(result.stderr).toContain("missing-key.txt");
        expect(
            await access(target).then(
                () => true,
                () => false,
            ),
        ).toBe(false);
    });
});
