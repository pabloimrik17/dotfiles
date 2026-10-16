import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const pluginSources = {
    autonomous: "encrypted_private_config.json.tmpl.age",
    stonks: "encrypted_private_config.json.age",
};
const plugins = Object.keys(pluginSources) as (keyof typeof pluginSources)[];
const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true })),
    );
});

function run(command: string[], input?: string) {
    const result = Bun.spawnSync(command, {
        cwd: repositoryRoot,
        stdin: input === undefined ? undefined : Buffer.from(input),
        stdout: "pipe",
        stderr: "pipe",
    });
    return {
        exitCode: result.exitCode,
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
    };
}

// A throwaway home and chezmoi config whose age identity does not exist, so
// nothing can be decrypted and the real home and chezmoi state stay untouched.
async function isolatedChezmoi() {
    const root = await mkdtemp(path.join(tmpdir(), "plugin-configs-"));
    temporaryDirectories.push(root);
    const home = path.join(root, "home");
    const identity = path.join(root, "missing-identity.txt");
    const config = path.join(root, "chezmoi.toml");
    await mkdir(home);
    await writeFile(config, `encryption = "age"\n[age]\n    identity = "${identity}"\n`);
    const chezmoi = (...args: string[]) =>
        run([
            "chezmoi",
            "--source",
            repositoryRoot,
            "--config",
            config,
            "--destination",
            home,
            "--persistent-state",
            path.join(root, "state.boltdb"),
            "--cache",
            path.join(root, "cache"),
            "--no-tty",
            ...args,
        ]);
    return { home, identity, chezmoi };
}

describe("plugin configuration sources", () => {
    test.each(plugins)("dot_config/%s holds only the age-encrypted config", async (plugin) => {
        const directory = path.join(repositoryRoot, "dot_config", plugin);
        const sourceName = pluginSources[plugin];
        const files = run(["git", "ls-files", "-co", "--exclude-standard", `dot_config/${plugin}`])
            .stdout.trim()
            .split("\n");
        expect(files).toEqual([`dot_config/${plugin}/${sourceName}`]);

        const header = (await readFile(path.join(directory, sourceName)))
            .subarray(0, 35)
            .toString("latin1");
        expect(header).toMatch(/^(-----BEGIN AGE ENCRYPTED FILE-----|age-encryption\.org\/v1\n)/);
    });

    test("chezmoi maps each config path to its .age source and nothing else", async () => {
        const { chezmoi } = await isolatedChezmoi();
        const result = chezmoi("managed", "--path-style", "all", "--format", "json");
        expect(result.exitCode, result.stderr).toBe(0);

        const managed: Record<string, { sourceRelative: string }> = JSON.parse(result.stdout);
        const sources = Object.fromEntries(
            Object.entries(managed)
                .filter(([target]) => /^\.config\/(autonomous|stonks)(\/|$)/.test(target))
                .map(([target, entry]) => [target, entry.sourceRelative]),
        );
        expect(sources).toEqual(
            Object.fromEntries(
                plugins.flatMap((plugin) => [
                    [`.config/${plugin}`, `dot_config/${plugin}`],
                    [
                        `.config/${plugin}/config.json`,
                        `dot_config/${plugin}/${pluginSources[plugin]}`,
                    ],
                ]),
            ),
        );
    });

    test("apply without the identity fails and writes no config", async () => {
        const { home, identity, chezmoi } = await isolatedChezmoi();
        const autonomous = path.join(home, ".config/autonomous/config.json");
        const stonks = path.join(home, ".config/stonks/config.json");
        await mkdir(path.dirname(autonomous), { recursive: true });
        await writeFile(autonomous, "sentinel\n");

        for (const target of [autonomous, stonks]) {
            const result = chezmoi("--exclude", "scripts", "apply", "--parent-dirs", target);
            expect(result.exitCode).not.toBe(0);
            expect(result.stderr).toContain(path.relative(home, target));
            expect(result.stderr).toContain(identity);
        }

        expect(await readFile(autonomous, "utf8")).toBe("sentinel\n");
        expect(existsSync(stonks)).toBe(false);
    });

    test("no run_ script or template references a plugin config path", async () => {
        const files = run(["git", "ls-files", "-co", "--exclude-standard"])
            .stdout.split("\n")
            .filter((file) =>
                /(^|\/)(run_[^/]*|[^/]*\.tmpl)$|^\.chezmoi(scripts|templates)\//.test(file),
            );
        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
            const content = await readFile(path.join(repositoryRoot, file), "utf8");
            expect(content, file).not.toMatch(/\.config\/(autonomous|stonks)/);
        }
    });
});

// Synthetic configuration and throwaway keys only: never use the personal
// identity or decrypt repository ciphertext in CI.
async function encryptedTemplateFixture() {
    const root = await mkdtemp(path.join(tmpdir(), "plugin-template-"));
    temporaryDirectories.push(root);
    const source = path.join(root, "source");
    const config = path.join(root, "chezmoi.json");
    const identity = path.join(root, "identity.txt");
    const encrypted = path.join(source, "dot_config/autonomous", pluginSources.autonomous);
    await mkdir(path.dirname(encrypted), { recursive: true });
    await writeFile(config, JSON.stringify({ encryption: "age", age: { identity } }));
    const base = [
        "chezmoi",
        "--source",
        source,
        "--config",
        config,
        "--persistent-state",
        path.join(root, "state.boltdb"),
        "--cache",
        path.join(root, "cache"),
        "--use-builtin-age=true",
        "--no-tty",
    ];
    const keygen = run([...base, "age-keygen", "--output", identity]);
    expect(keygen.exitCode, keygen.stderr).toBe(0);
    const recipient = run([...base, "age-keygen", "--convert", identity]);
    expect(recipient.exitCode, recipient.stderr).toBe(0);
    await writeFile(
        config,
        JSON.stringify({
            encryption: "age",
            age: { identity, recipient: recipient.stdout.trim() },
        }),
    );

    async function encrypt(template: string) {
        const result = run([...base, "encrypt", "--output", encrypted], template);
        expect(result.exitCode, result.stderr).toBe(0);
    }

    async function forHome(name: string) {
        const home = path.join(root, name);
        await mkdir(home);
        const target = path.join(home, ".config/autonomous/config.json");
        const chezmoi = (...args: string[]) =>
            run([
                ...base,
                "--destination",
                home,
                "--override-data",
                JSON.stringify({ chezmoi: { homeDir: home } }),
                ...args,
            ]);
        const data = chezmoi("execute-template", "{{ .chezmoi.homeDir | toJson }}");
        expect(data.exitCode, data.stderr).toBe(0);
        expect(JSON.parse(data.stdout)).toBe(home);
        return { home, target, chezmoi };
    }

    return { encrypt, forHome };
}

describe("encrypted autonomous template deployment", () => {
    test("renders each home, preserves values, tightens permissions, and is idempotent", async () => {
        const { encrypt, forHome } = await encryptedTemplateFixture();
        const synthetic = {
            schema: "autonomous.config.v1",
            sources: { beads: { directory: "BEADS_HOME_PLACEHOLDER" } },
            unrelated: {
                literal: "{{ .notATemplate }} and {{- invalid template -}} and }}",
                escaped: 'quotes " and backslash \\ and newline\n',
                values: [true, null, 42, "unicode: café"],
            },
        };
        const template = JSON.stringify(synthetic)
            .replaceAll("{{", '{{ "{{" }}')
            .replace(
                '"BEADS_HOME_PLACEHOLDER"',
                '{{ printf "%s/WebstormProjects/agentic-task" .chezmoi.homeDir | toJson }}',
            );
        await encrypt(template);

        for (const name of ["first-home", 'second home "quoted" \\']) {
            const { home, target, chezmoi } = await forHome(name);
            const expected = structuredClone(synthetic);
            expected.sources.beads.directory = `${home}/WebstormProjects/agentic-task`;
            const rendered = chezmoi("cat", target);
            expect(rendered.exitCode, rendered.stderr).toBe(0);
            expect(JSON.parse(rendered.stdout)).toEqual(expected);

            const apply = chezmoi("--exclude", "scripts", "apply", "--parent-dirs", target);
            expect(apply.exitCode, apply.stderr).toBe(0);
            expect(JSON.parse(await readFile(target, "utf8"))).toEqual(expected);
            expect((await stat(target)).mode & 0o777).toBe(0o600);
            // Applying must not create a missing Beads checkout or validate its existence.
            expect(existsSync(expected.sources.beads.directory)).toBe(false);

            await chmod(target, 0o644);
            const tighten = chezmoi("--force", "--exclude", "scripts", "apply", target);
            expect(tighten.exitCode, tighten.stderr).toBe(0);
            expect((await stat(target)).mode & 0o777).toBe(0o600);
            const diff = chezmoi("--use-builtin-diff", "diff", target);
            expect(diff.exitCode, diff.stderr).toBe(0);
            expect(diff.stdout).toBe("");
        }
    });

    test("rendering errors fail without replacing an existing target", async () => {
        const { encrypt, forHome } = await encryptedTemplateFixture();
        await encrypt("{{ if }}");
        const { target, chezmoi } = await forHome("render-error");
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, "sentinel\n");
        const result = chezmoi("--exclude", "scripts", "apply", "--parent-dirs", target);
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("template");
        expect(await readFile(target, "utf8")).toBe("sentinel\n");
    });

    test("successfully rendered invalid JSON remains the plugin's concern", async () => {
        const { encrypt, forHome } = await encryptedTemplateFixture();
        await encrypt('{{ "not JSON" }}');
        const { target, chezmoi } = await forHome("invalid-json");
        const result = chezmoi("--exclude", "scripts", "apply", "--parent-dirs", target);
        expect(result.exitCode, result.stderr).toBe(0);
        expect(await readFile(target, "utf8")).toBe("not JSON");
        expect((await stat(target)).mode & 0o777).toBe(0o600);
    });
});
