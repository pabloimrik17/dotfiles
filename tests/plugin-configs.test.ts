import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const plugins = ["autonomous", "stonks"];
const sourceName = "encrypted_private_config.json.age";
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
        expect(await readdir(directory)).toEqual([sourceName]);

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
                    [`.config/${plugin}/config.json`, `dot_config/${plugin}/${sourceName}`],
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
            const result = chezmoi("--exclude", "scripts", "apply", target);
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
