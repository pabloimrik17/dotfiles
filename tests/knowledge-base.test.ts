import { afterEach, describe, expect, test } from "bun:test";
import {
    chmod,
    lstat,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    rm,
    symlink,
    writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const installerTemplate = path.join(repositoryRoot, "run_onchange_install-packages.sh.tmpl");
const groupHeader = "# Group 4.5: Knowledge base";
const cloneCommand = "gh repo clone pabloimrik17/knowledge";
const toggleSteps = "Settings → General → Command line interface";
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
        env,
        stdin: "ignore",
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

function render(machineType: string): string {
    const cached = renders.get(machineType);
    if (cached !== undefined) return cached;
    const result = run(
        [
            "chezmoi",
            "execute-template",
            "--config",
            "/dev/null",
            "--config-format",
            "toml",
            "--override-data",
            JSON.stringify({
                machineType,
                chezmoi: { os: "darwin", arch: "arm64", destDir: "/home/test" },
            }),
            "--file",
            installerTemplate,
        ],
        { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: process.env.HOME ?? "/tmp" },
    );
    expect(result.exitCode, result.stderr).toBe(0);
    renders.set(machineType, result.stdout);
    return result.stdout;
}

function group(machineType = "personal"): string {
    const rendered = render(machineType);
    const start = rendered.indexOf(groupHeader);
    const end = rendered.indexOf("# Group 5:");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    return rendered.slice(start, end);
}

type Options = {
    gh?: "missing" | "unauthenticated" | "authenticated";
    clone?: "succeeds" | "fails";
    reply?: "yes" | "no";
    setup?: (paths: Paths) => Promise<void>;
};

type Paths = {
    root: string;
    knowledge: string;
    app: string;
    cli: string;
    link: string;
    config: string;
};

const ghStub = `#!/bin/sh
printf 'gh %s\\n' "$*" >> "$CMD_LOG"
case "$1 $2" in
    "auth status") [ "$GH_AUTH" = authenticated ] ;;
    "repo clone")
        mkdir -p "$4"
        echo partial > "$4/partial"
        [ "$GH_CLONE" = succeeds ] || exit 1
        mkdir "$4/.git"
        ;;
    *) exit 2 ;;
esac
`;

const gitStub = `#!/bin/sh
printf 'git %s\\n' "$*" >> "$CMD_LOG"
`;

async function setupPaths(): Promise<Paths> {
    const root = await mkdtemp(path.join(tmpdir(), "knowledge-base-"));
    temporaryDirectories.push(root);
    const app = path.join(root, "Applications", "Obsidian.app");
    return {
        root,
        knowledge: path.join(root, "home", "WebstormProjects", "knowledge"),
        app,
        cli: path.join(app, "Contents", "MacOS", "obsidian-cli"),
        link: path.join(root, "usr-local-bin", "obsidian"),
        config: path.join(root, "home", "obsidian.json"),
    };
}

async function installApp(paths: Paths, config?: string, linked = true) {
    await mkdir(path.dirname(paths.cli), { recursive: true });
    await writeFile(paths.cli, "#!/bin/sh\n");
    if (linked) {
        await mkdir(path.dirname(paths.link), { recursive: true });
        await symlink(paths.cli, paths.link);
    }
    if (config !== undefined) {
        await mkdir(path.dirname(paths.config), { recursive: true });
        await writeFile(paths.config, config);
    }
}

async function existingCheckout(paths: Paths) {
    await mkdir(path.join(paths.knowledge, ".git"), { recursive: true });
}

async function runGroup(options: Options = {}) {
    const paths = await setupPaths();
    const bin = path.join(paths.root, "bin");
    const log = path.join(paths.root, "commands.log");
    await mkdir(bin);
    await mkdir(path.join(paths.root, "home"));
    await writeFile(path.join(bin, "git"), gitStub);
    await chmod(path.join(bin, "git"), 0o755);
    if ((options.gh ?? "authenticated") !== "missing") {
        await writeFile(path.join(bin, "gh"), ghStub);
        await chmod(path.join(bin, "gh"), 0o755);
    }
    await options.setup?.(paths);
    const script = path.join(paths.root, "group.sh");
    await writeFile(
        script,
        `ERRORS=0
info() { printf 'INFO: %s\\n' "$*"; }
warn() { printf 'WARN: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
confirm() { printf 'CONFIRM: %s\\n' "$1"; [ "$CONFIRM_REPLY" = yes ]; }
${group()}
printf 'END ERRORS=%s\\n' "$ERRORS"
`,
    );
    const result = run(["/bin/bash", script], {
        PATH: `${bin}:/usr/bin:/bin`,
        HOME: path.join(paths.root, "home"),
        CMD_LOG: log,
        GH_AUTH: options.gh ?? "authenticated",
        GH_CLONE: options.clone ?? "succeeds",
        CONFIRM_REPLY: options.reply ?? "yes",
        KNOWLEDGE_DIR: paths.knowledge,
        OBSIDIAN_APP: paths.app,
        OBSIDIAN_CLI_LINK: paths.link,
        OBSIDIAN_CONFIG: paths.config,
    });
    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.stdout).toContain("END ERRORS=0");
    return {
        paths,
        output: result.stdout,
        log: await readFile(log, "utf8").catch(() => ""),
    };
}

describe("knowledge-base clone", () => {
    test("absent path with an authenticated gh clones the fixed owner after confirmation", async () => {
        const { paths, output, log } = await runGroup();
        expect(output).toContain("CONFIRM: Clone the knowledge base");
        expect(log).toContain("gh auth status");
        expect(log).toContain(`${cloneCommand} ${paths.knowledge}`);
        expect(existsSync(path.join(paths.knowledge, ".git"))).toBe(true);
        expect(output).toContain(`INFO:   Knowledge base cloned to ${paths.knowledge}`);
        expect(output).not.toContain("WARN:");
    });

    test("a missing gh warns with the manual command and continues", async () => {
        const { paths, output, log } = await runGroup({ gh: "missing" });
        expect(output).toContain("WARN: Knowledge base not cloned");
        expect(output).toContain(`${cloneCommand} ${paths.knowledge}`);
        expect(output).not.toContain("CONFIRM:");
        expect(log).toBe("");
        expect(existsSync(paths.knowledge)).toBe(false);
    });

    test("an unauthenticated gh warns with the manual command and does not clone", async () => {
        const { paths, output, log } = await runGroup({ gh: "unauthenticated" });
        expect(output).toContain("WARN: Knowledge base not cloned");
        expect(output).toContain(`${cloneCommand} ${paths.knowledge}`);
        expect(output).not.toContain("CONFIRM:");
        expect(log).toContain("gh auth status");
        expect(log).not.toContain("repo clone");
        expect(existsSync(paths.knowledge)).toBe(false);
    });

    test("a failed clone warns and leaves no partial checkout", async () => {
        const { paths, output, log } = await runGroup({ clone: "fails" });
        expect(log).toContain(`${cloneCommand} ${paths.knowledge}`);
        expect(output).toContain("WARN: Knowledge base clone failed");
        expect(output).toContain(`Retry manually: ${cloneCommand} ${paths.knowledge}`);
        expect(output).not.toContain("present");
        expect(output).not.toContain("cloned to");
        expect(existsSync(paths.knowledge)).toBe(false);
        expect(existsSync(path.dirname(paths.knowledge))).toBe(true);
    });

    test("declining skips the clone and reports it", async () => {
        const { paths, output, log } = await runGroup({ reply: "no" });
        expect(output).toContain("CONFIRM: Clone the knowledge base");
        expect(output).toContain("INFO:   Skipping knowledge base clone.");
        expect(log).not.toContain("repo clone");
        expect(existsSync(paths.knowledge)).toBe(false);
    });

    test.each(["personal", "work"])("the %s render contains the step", (machineType) => {
        const slice = group(machineType);
        expect(slice).toContain(`gh repo clone "$KNOWLEDGE_REPO" "$KNOWLEDGE_DIR"`);
        expect(slice).toContain('KNOWLEDGE_REPO="pabloimrik17/knowledge"');
    });
});

describe("existing knowledge-base path", () => {
    test("an existing checkout is reported present and no git or gh command runs", async () => {
        const { paths, output, log } = await runGroup({
            setup: async (paths) => {
                await existingCheckout(paths);
                await writeFile(path.join(paths.knowledge, "note.md"), "kept\n");
            },
        });
        expect(output).toContain(`INFO: Knowledge base: present at ${paths.knowledge}`);
        expect(output).not.toContain("CONFIRM:");
        expect(log).toBe("");
        expect(await readFile(path.join(paths.knowledge, "note.md"), "utf8")).toBe("kept\n");
    });

    test("an existing directory without .git warns and stays untouched", async () => {
        const { paths, output, log } = await runGroup({
            setup: async (paths) => {
                await mkdir(path.join(paths.knowledge, "updates"), { recursive: true });
                await writeFile(path.join(paths.knowledge, "updates", "run.md"), "run\n");
            },
        });
        expect(output).toContain("is not a knowledge-base checkout");
        expect(output).toContain("WARN:");
        expect(output).not.toContain("present");
        expect(log).toBe("");
        expect(await readdir(paths.knowledge, { recursive: true })).toEqual([
            "updates",
            path.join("updates", "run.md"),
        ]);
        expect(await readFile(path.join(paths.knowledge, "updates", "run.md"), "utf8")).toBe(
            "run\n",
        );
    });
});

describe("Obsidian CLI check", () => {
    test("a registered CLI emits no warning", async () => {
        const { output } = await runGroup({
            setup: async (paths) => {
                await existingCheckout(paths);
                await installApp(paths, '{"vaults":{},"cli":true}');
            },
        });
        expect(output).not.toContain("WARN:");
        expect(output).not.toContain("Obsidian CLI");
    });

    test.each([
        ["absent", '{"vaults":{}}'],
        ["false", '{"vaults":{},"cli":false}'],
        ["a string", '{"vaults":{},"cli":"true"}'],
        ["nested only", '{"vaults":{"cli":true}}'],
    ])("a linked CLI with cli %s warns and leaves obsidian.json unchanged", async (_, config) => {
        const { paths, output } = await runGroup({
            setup: async (paths) => {
                await existingCheckout(paths);
                await installApp(paths, config);
            },
        });
        expect(output).toContain(
            'WARN: Obsidian CLI not registered: obsidian.json lacks "cli": true',
        );
        expect(output).not.toContain("does not link");
        expect(output).toContain(toggleSteps);
        expect(await readFile(paths.config, "utf8")).toBe(config);
    });

    test("a missing obsidian.json warns", async () => {
        const { paths, output } = await runGroup({
            setup: async (paths) => {
                await existingCheckout(paths);
                await installApp(paths);
            },
        });
        expect(output).toContain('obsidian.json lacks "cli": true');
        expect(output).toContain(toggleSteps);
        expect(existsSync(paths.config)).toBe(false);
    });

    test("a missing link warns and no symlink is created", async () => {
        const { paths, output } = await runGroup({
            setup: async (paths) => {
                await existingCheckout(paths);
                await installApp(paths, '{"cli":true}', false);
            },
        });
        expect(output).toContain(`WARN: Obsidian CLI not registered: ${paths.link} does not link`);
        expect(output).toContain(toggleSteps);
        await expect(lstat(paths.link)).rejects.toThrow();
        expect(existsSync(path.dirname(paths.link))).toBe(false);
    });

    test("a link to another target warns", async () => {
        const { output } = await runGroup({
            setup: async (paths) => {
                await existingCheckout(paths);
                await installApp(paths, '{"cli":true}', false);
                await mkdir(path.dirname(paths.link), { recursive: true });
                await symlink("/usr/bin/true", paths.link);
            },
        });
        expect(output).toContain("does not link to the bundled obsidian-cli");
        expect(output).toContain(toggleSteps);
    });

    test("no Obsidian.app means no CLI warning", async () => {
        const { output } = await runGroup({ setup: existingCheckout });
        expect(output).not.toContain("Obsidian CLI");
        expect(output).not.toContain("WARN:");
    });
});
