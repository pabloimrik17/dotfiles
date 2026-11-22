import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dir, "..");
const sourceRelative = "dot_claude/plugins/claude-hud/private_config.json";
const sourcePath = path.join(repositoryRoot, sourceRelative);

const expected = {
    lineLayout: "compact",
    showSeparators: true,
    pathLevels: 2,
    gitStatus: { showAheadBehind: true, showFileStats: true },
    display: {
        showTools: true,
        showAgents: true,
        showTodos: true,
        showDuration: true,
        usageThreshold: 60,
        sevenDayThreshold: 70,
    },
};

describe("claude-hud config source", () => {
    test("holds exactly the customised keys, in order", async () => {
        const config = JSON.parse(await readFile(sourcePath, "utf8"));
        expect(config).toEqual(expected);
        expect(Object.keys(config)).toEqual(Object.keys(expected));
        expect(Object.keys(config.gitStatus)).toEqual(Object.keys(expected.gitStatus));
        expect(Object.keys(config.display)).toEqual(Object.keys(expected.display));
    });

    test("omits hidden config counts and default-valued keys", async () => {
        const config = JSON.parse(await readFile(sourcePath, "utf8"));
        expect(config.display).not.toHaveProperty("environmentThreshold");
        expect(config.display).not.toHaveProperty("showConfigCounts");
        for (const key of [
            "showModel",
            "showContextBar",
            "showTokenBreakdown",
            "showUsage",
            "usageBarEnabled",
        ]) {
            expect(config.display).not.toHaveProperty(key);
        }
        for (const key of ["enabled", "showDirty"]) {
            expect(config.gitStatus).not.toHaveProperty(key);
        }
    });

    test("is 2-space JSON, as `hud set` writes it", async () => {
        const text = await readFile(sourcePath, "utf8");
        expect(text).toBe(`${JSON.stringify(JSON.parse(text), null, 2)}\n`);
    });

    test("is excluded from oxfmt", async () => {
        const ignore = await readFile(path.join(repositoryRoot, ".oxfmtignore"), "utf8");
        expect(ignore.split("\n")).toContain(sourceRelative);
    });

    test("deploys to .claude/plugins/claude-hud/config.json", () => {
        const result = Bun.spawnSync(["chezmoi", "managed", "--source", repositoryRoot], {
            cwd: repositoryRoot,
            stdout: "pipe",
            stderr: "pipe",
        });
        expect(result.exitCode, result.stderr.toString()).toBe(0);
        expect(result.stdout.toString().split("\n")).toContain(
            ".claude/plugins/claude-hud/config.json",
        );
    });
});
