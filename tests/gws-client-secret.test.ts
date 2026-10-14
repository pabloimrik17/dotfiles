import { afterEach, expect, test } from "bun:test";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const sourceDirectory = path.join(repositoryRoot, "dot_config", "gws");
const sourceName = "encrypted_private_client_secret.json.age";
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

test("the only managed gws source is the private age ciphertext", async () => {
    expect(await readdir(sourceDirectory)).toEqual([sourceName]);
    const encrypted = await readFile(path.join(sourceDirectory, sourceName), "utf8");
    expect(encrypted.startsWith("-----BEGIN AGE ENCRYPTED FILE-----\n")).toBe(true);

    const result = run(["git", "ls-files", "-co", "--exclude-standard"]);
    expect(result.exitCode, result.stderr).toBe(0);
    const sources = result.stdout
        .split("\n")
        .filter((line) => line !== "")
        .filter((file) => {
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
