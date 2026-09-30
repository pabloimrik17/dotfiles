import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const zshrc = readFileSync(path.resolve(import.meta.dir, "../dot_zshrc.tmpl"), "utf8");
const upgradeFunction = zshrc.match(/^brew-upgrade-pinned\(\) \{[\s\S]*?^\}/m)?.[0];
if (!upgradeFunction) throw new Error("Missing brew-upgrade-pinned function");

function runUpgrade({
    upgradeStatus = 0,
    pinStatus = 0,
    unpinStatus = 0,
    holds = [] as string[],
    interrupt = false,
} = {}) {
    const directory = mkdtempSync(path.join(tmpdir(), "brew-upgrade-pinned-test-"));
    try {
        const log = path.join(directory, "brew.log");
        const state = path.join(directory, "state");
        mkdirSync(path.join(state, "dotfiles"), { recursive: true });
        writeFileSync(log, "");
        if (holds.length > 0) {
            writeFileSync(path.join(state, "dotfiles", "brew-holds"), holds.join("\n") + "\n");
        }
        // `kill -INT 0` signals the job's process group, as a terminal ^C does.
        const script = `${upgradeFunction}
brew() {
    print -r -- "$*" >> "$BREW_LOG"
    case "$1" in
        unpin) return "$UNPIN_STATUS" ;;
        upgrade)
            [[ -n $INTERRUPT ]] && /bin/sh -c 'kill -INT 0; sleep 1'
            return "$UPGRADE_STATUS"
            ;;
        pin) return "$PIN_STATUS" ;;
    esac
}
brew-upgrade-pinned git
`;
        // Only an interactive zsh with job control aborts a function on ^C.
        const command = interrupt
            ? ["script", "-q", "/dev/null", "/bin/zsh", "-f", "-i", "-c", script]
            : ["/bin/zsh", "-f", "-c", script];
        const result = Bun.spawnSync(command, {
            env: {
                ...process.env,
                XDG_STATE_HOME: state,
                BREW_LOG: log,
                UNPIN_STATUS: String(unpinStatus),
                UPGRADE_STATUS: String(upgradeStatus),
                PIN_STATUS: String(pinStatus),
                INTERRUPT: interrupt ? "1" : "",
            },
            stdin: "ignore",
            stdout: "pipe",
            stderr: "pipe",
        });
        return {
            status: result.exitCode,
            calls: readFileSync(log, "utf8").trim().split("\n").filter(Boolean),
            stderr: result.stderr.toString(),
        };
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

test("successful upgrade restores the pin", () => {
    expect(runUpgrade()).toMatchObject({
        status: 0,
        calls: ["unpin git", "upgrade git", "pin git"],
    });
});

test("failed upgrade restores the pin and returns the upgrade status", () => {
    expect(runUpgrade({ upgradeStatus: 7 })).toMatchObject({
        status: 7,
        calls: ["unpin git", "upgrade git", "pin git"],
    });
});

test("failed repin returns an error", () => {
    expect(runUpgrade({ pinStatus: 1 })).toMatchObject({
        status: 1,
        calls: ["unpin git", "upgrade git", "pin git"],
    });
});

test("failed unpin does not start the upgrade", () => {
    expect(runUpgrade({ unpinStatus: 1 })).toMatchObject({
        status: 1,
        calls: ["unpin git"],
    });
});

test("interrupted upgrade restores the pin", () => {
    expect(runUpgrade({ interrupt: true }).calls).toEqual(["unpin git", "upgrade git", "pin git"]);
});

test("declared hold is refused without calling brew", () => {
    const result = runUpgrade({ holds: ["git"] });
    expect(result).toMatchObject({ status: 1, calls: [] });
    expect(result.stderr).toContain("git is a declared hold");
});
