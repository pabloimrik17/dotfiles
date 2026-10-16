import { afterEach, expect, setDefaultTimeout, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const config = Bun.TOML.parse(
    await Bun.file(path.join(import.meta.dir, "../dot_config/worktrunk/config.toml")).text(),
) as { "post-start": Record<string, string>[] };
const hook = config["post-start"].find((entry) => entry["install-deps"])!["install-deps"];
const roots: string[] = [];

// Subprocess/filesystem fixtures need headroom on busy macOS runners.
setDefaultTimeout(30_000);

afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function executable(file: string, body: string) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `#!/bin/sh\n${body}\n`);
    await chmod(file, 0o755);
}

async function setup(
    lockfiles = ["pnpm-lock.yaml"],
    nvmHome: "custom" | "default" | "empty" = "custom",
) {
    const root = await mkdtemp(path.join(tmpdir(), "worktrunk deps "));
    roots.push(root);
    const worktree = path.join(root, "worktree");
    const bin = path.join(root, "bin");
    const home = path.join(root, "home");
    const nvm = nvmHome === "custom" ? path.join(root, "custom nvm") : path.join(home, ".nvm");
    await Promise.all([mkdir(worktree), mkdir(bin), mkdir(home)]);
    // Only explicit utilities are visible; a host package manager must never run.
    for (const utility of ["cat", "sort", "tail", "mkdir"]) {
        await symlink(Bun.which(utility)!, path.join(bin, utility));
    }
    await executable(path.join(bin, "node"), "echo v24.0.0");
    for (const lockfile of lockfiles) await writeFile(path.join(worktree, lockfile), "");
    const env = {
        HOME: home,
        PATH: bin,
        ...(nvmHome === "default" ? {} : { NVM_DIR: nvmHome === "empty" ? "" : nvm }),
        INSTALL_STATUS: "0",
        REQUIRE_NODE: "",
    };
    async function manager(name: string, directory = bin) {
        await executable(
            path.join(directory, name),
            `
printf '%s %s\\n' '${name}' "$*" >> calls
node > child-node
printf '%s' "$PATH" > child-path
echo manager-output
echo manager-stderr >&2
if [ -n "$REQUIRE_NODE" ] && [ "$(node)" != "$REQUIRE_NODE" ]; then exit 42; fi
[ "$INSTALL_STATUS" = 0 ] || exit "$INSTALL_STATUS"
mkdir -p node_modules
: > node_modules/installed
`,
        );
    }
    async function node(version: string, usable = true) {
        const file = path.join(nvm, "versions/node", `v${version}`, "bin/node");
        await executable(file, `echo v${version}`);
        if (!usable) await chmod(file, 0o644);
        return path.dirname(file);
    }
    async function pin(value: string) {
        await writeFile(path.join(worktree, ".nvmrc"), value);
    }
    async function read(name: string) {
        const file = Bun.file(path.join(worktree, name));
        return (await file.exists()) ? file.text() : "";
    }
    async function run() {
        const child = Bun.spawn(["/bin/sh", "-c", hook], {
            cwd: worktree,
            env,
            stdout: "pipe",
            stderr: "pipe",
        });
        const [status, stdout, stderr] = await Promise.all([
            child.exited,
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
        ]);
        return { status, stdout, stderr };
    }
    return { root, worktree, bin, env, manager, node, pin, read, run };
}

test("pnpm and its children use pinned Node instead of incompatible ambient Node", async () => {
    const h = await setup();
    await h.manager("pnpm");
    await h.node("22.21.0");
    await h.pin("22.21.0\n");
    h.env.REQUIRE_NODE = "v22.21.0";
    const result = await h.run();
    expect(await h.read("child-node")).toBe("v22.21.0\n");
    expect(result.status).toBe(0);
    expect(await Bun.file(path.join(h.worktree, "node_modules/installed")).exists()).toBe(true);
    expect(result.stdout).toContain("[install-deps] done");
});

for (const [manager, lockfile] of [
    ["bun", "bun.lock"],
    ["pnpm", "pnpm-lock.yaml"],
    ["npm", "package-lock.json"],
]) {
    for (const status of [0, 37]) {
        test(`${manager} preserves install status ${status} and reports the correct outcome`, async () => {
            const h = await setup([lockfile]);
            await h.manager(manager);
            h.env.INSTALL_STATUS = String(status);
            const result = await h.run();
            expect(result.status).toBe(status);
            expect(await h.read("calls")).toBe(`${manager} install\n`);
            expect(result.stdout).toMatch(
                /detecting package manager[\s\S]*detected .*installing[\s\S]*manager-output/,
            );
            expect(result.stderr).toContain("manager-stderr");
            if (status === 0)
                expect(result.stdout).toMatch(/manager-output[\s\S]*\[install-deps\] done/);
            else {
                expect(result.stdout).not.toContain("[install-deps] done");
                expect(result.stderr).toMatch(new RegExp(`${manager}.*37`));
            }
        });
    }
}

for (const pin of ["22.21.0", "v22.21.0\n", " \tv22.21.0\r\n", "\n 22.21.0 \n\n"]) {
    test(`normalizes exact pin ${JSON.stringify(pin)}`, async () => {
        const h = await setup();
        await h.manager("pnpm");
        await h.node("22.21.0");
        await h.node("22.21.1");
        await h.pin(pin);
        const result = await h.run();
        expect(result.status).toBe(0);
        expect(await h.read("child-node")).toBe("v22.21.0\n");
        expect(result.stdout).toMatch(/selected Node v22\.21\.0[\s\S]*detected pnpm/);
    });
}

for (const [pin, expected] of [
    ["22", "22.22.0"],
    ["v22.21", "22.21.10"],
]) {
    test(`selects highest usable numeric match for ${pin}`, async () => {
        const h = await setup();
        await h.manager("pnpm");
        for (const version of [
            "22.9.0",
            "22.21.2",
            "22.21.10",
            "22.22.0",
            "23.0.0",
            "22.21.99-beta",
            "22.21.99.1",
        ])
            await h.node(version);
        await h.node("22.99.0", false);
        await h.node("22.21.99", false);
        await h.pin(pin);
        expect((await h.run()).status).toBe(0);
        expect(await h.read("child-node")).toBe(`v${expected}\n`);
    });
}

for (const home of ["custom", "default", "empty"] as const) {
    test(`honors ${home} nvm home and resolves manager from selected bin`, async () => {
        const h = await setup(undefined, home);
        const bin = await h.node("22.21.0");
        await h.manager("pnpm", bin);
        await h.pin("22.21.0");
        expect((await h.run()).status).toBe(0);
        expect(await h.read("calls")).toBe("pnpm install\n");
        expect(await h.read("child-path")).toBe(`${bin}:${h.env.PATH}`);
    });
}

for (const pin of [undefined, "", " \t\r\n"]) {
    test(`absent/empty root pin ${JSON.stringify(pin)} preserves PATH without searching elsewhere`, async () => {
        const h = await setup();
        await h.manager("pnpm");
        await h.node("22.21.0");
        await writeFile(path.join(h.root, ".nvmrc"), "22.21.0");
        await mkdir(path.join(h.worktree, "nested"));
        await writeFile(path.join(h.worktree, "nested/.nvmrc"), "22.21.0");
        if (pin !== undefined) await h.pin(pin);
        const result = await h.run();
        expect(result.status).toBe(0);
        expect(await h.read("child-path")).toBe(h.env.PATH);
        expect(result.stderr).not.toContain("ambient Node");
    });
}

for (const pin of ["22.21.0", "lts/*", "node", "22.*", "22..21", "22.21.0.1", "v", "22\n21"]) {
    test(`unresolved pin ${JSON.stringify(pin)} warns and preserves ambient PATH`, async () => {
        const h = await setup();
        await h.manager("pnpm");
        await h.node("22.21.0", false);
        await h.node("23.0.0");
        await h.pin(pin);
        // A sourced nvm.sh would leave evidence and break the fallback assertion.
        const nvm = h.env.NVM_DIR!;
        await writeFile(path.join(nvm, "nvm.sh"), "echo SOURCED; PATH=/invalid");
        const result = await h.run();
        expect(result.status).toBe(0);
        expect(await h.read("child-node")).toBe("v24.0.0\n");
        expect(await h.read("child-path")).toBe(h.env.PATH);
        expect(result.stderr).toContain(pin);
        expect(result.stderr).toContain("ambient Node");
        expect(result.stdout).not.toContain("SOURCED");
    });
}

test("unresolved pin retains the ambient manager's failing outcome", async () => {
    const h = await setup();
    await h.manager("pnpm");
    await h.pin("99.0.0");
    h.env.REQUIRE_NODE = "v22.21.0";
    const result = await h.run();
    expect(result.status).toBe(42);
    expect(result.stderr).toContain("ambient Node");
    expect(result.stderr).toMatch(/pnpm.*42/);
    expect(result.stdout).not.toContain("[install-deps] done");
    expect(await h.read("child-path")).toBe(h.env.PATH);
});

for (const [locks, chosen] of [
    [["bun.lock", "pnpm-lock.yaml", "package-lock.json"], "bun"],
    [["pnpm-lock.yaml", "package-lock.json"], "pnpm"],
] as const) {
    test(`${chosen} takes precedence even when it fails`, async () => {
        const h = await setup([...locks]);
        for (const manager of ["bun", "pnpm", "npm"]) await h.manager(manager);
        h.env.INSTALL_STATUS = "19";
        const result = await h.run();
        expect(result.status).toBe(19);
        expect(await h.read("calls")).toBe(`${chosen} install\n`);
        expect(result.stdout).not.toContain("[install-deps] done");
    });
}

for (const [lockfile, missing, fallback] of [
    ["bun.lock", "bun", "pnpm"],
    ["pnpm-lock.yaml", "pnpm", "npm"],
    ["package-lock.json", "npm", "bun"],
]) {
    test(`missing ${missing} skips without success or another manager`, async () => {
        const h = await setup([
            lockfile,
            ...(missing === "bun"
                ? ["pnpm-lock.yaml"]
                : missing === "pnpm"
                  ? ["package-lock.json"]
                  : []),
        ]);
        await h.manager(fallback);
        const result = await h.run();
        expect(result.status).toBe(0);
        expect(result.stderr).toContain(`${missing} is not installed; skipping`);
        expect(result.stdout).not.toContain("[install-deps] done");
        expect(await h.read("calls")).toBe("");
    });
}

test("no recognized lockfile logs detection and skip without resolving Node", async () => {
    const h = await setup([]);
    await h.pin("lts/*");
    for (const manager of ["bun", "pnpm", "npm"]) await h.manager(manager);
    const result = await h.run();
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
        /detecting package manager[\s\S]*no recognised lockfile, skipping/,
    );
    expect(result.stdout).not.toContain("[install-deps] done");
    expect(result.stderr).toBe("");
    expect(await h.read("calls")).toBe("");
});
