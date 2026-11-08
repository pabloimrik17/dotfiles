import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const zshrc = readFileSync(path.resolve(import.meta.dir, "../dot_zshrc.tmpl"), "utf8");
const block = zshrc.match(/^# >>> agent shell >>>$[\s\S]*?^# <<< agent shell <<<$/m)?.[0];
if (!block) throw new Error("Missing agent shell block");

// Claude Code sources its snapshot, then runs each command through eval.
function run(command: string, { interactive = false, claudecode = true } = {}) {
    const directory = mkdtempSync(path.join(tmpdir(), "agent-shell-test-"));
    try {
        const script = `alias ls="eza --icons --group-directories-first"
alias cat="bat --style=auto"
${block}
eval "$AGENT_COMMAND"
`;
        const flags = interactive ? ["-f", "-i", "-c"] : ["-f", "-c"];
        const result = Bun.spawnSync(["/bin/zsh", ...flags, script], {
            cwd: directory,
            env: {
                PATH: "/usr/bin:/bin",
                HOME: directory,
                AGENT_COMMAND: command,
                ...(claudecode ? { CLAUDECODE: "1" } : {}),
            },
            stdin: "ignore",
            stdout: "pipe",
            stderr: "pipe",
        });
        return {
            status: result.exitCode,
            stdout: result.stdout.toString(),
            stderr: result.stderr.toString(),
        };
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

const options = "print -r -- $options[nomatch] $options[equals] $options[shwordsplit]";

test("block is the last thing in the zshrc, after zoxide init", () => {
    const zoxide = zshrc.indexOf('eval "$(zoxide init zsh --cmd cd)"');
    const start = zshrc.indexOf(block);
    expect(zoxide).toBeGreaterThan(-1);
    expect(start).toBeGreaterThan(zoxide);
    expect(zshrc.slice(start + block.length).trim()).toBe("");
});

describe("agent shell", () => {
    test("unmatched glob passes through literally", () => {
        expect(run("echo --include=*.zzz")).toMatchObject({
            status: 0,
            stdout: "--include=*.zzz\n",
        });
    });

    test("leading equals signs are literal", () => {
        expect(run("echo ======")).toMatchObject({ status: 0, stdout: "======\n" });
    });

    test("unquoted parameter splits on whitespace", () => {
        expect(run('f="a b"; printf "%s\\n" $f')).toMatchObject({ status: 0, stdout: "a\nb\n" });
    });

    test("ls is the system command", () => {
        const { stdout } = run("type ls");
        expect(stdout).toContain("/bin/ls");
        expect(stdout).not.toContain("eza");
    });

    test("cat is the system command", () => {
        const { stdout } = run("type cat");
        expect(stdout).toContain("/bin/cat");
        expect(stdout).not.toContain("bat");
    });
});

describe("interactive shell with inherited CLAUDECODE", () => {
    const interactive = { interactive: true };

    test("unmatched glob fails with no matches found", () => {
        const result = run("echo *.zzz", interactive);
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain("no matches found");
    });

    test("ls and cat keep eza and bat", () => {
        const { stdout } = run("type ls; type cat", interactive);
        expect(stdout).toContain("ls is an alias for eza");
        expect(stdout).toContain("cat is an alias for bat");
    });

    test("nomatch and equals stay on, sh_word_split off", () => {
        expect(run(options, interactive).stdout).toBe("on on off\n");
    });
});

test("non-interactive shell without CLAUDECODE keeps the defaults", () => {
    expect(run(options, { claudecode: false }).stdout).toBe("on on off\n");
    const { stdout } = run("type ls; type cat", { claudecode: false });
    expect(stdout).toContain("ls is an alias for eza");
    expect(stdout).toContain("cat is an alias for bat");
});
