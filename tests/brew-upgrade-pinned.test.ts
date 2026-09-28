import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const zshrc = readFileSync(path.resolve(import.meta.dir, "../dot_zshrc.tmpl"), "utf8");
const upgradeFunction = zshrc.match(/^brew-upgrade-pinned\(\) \{[\s\S]*?^\}/m)?.[0];
if (!upgradeFunction) throw new Error("Missing brew-upgrade-pinned function");

function runUpgrade({ upgradeStatus = 0, pinStatus = 0, unpinStatus = 0 } = {}) {
    const directory = mkdtempSync(path.join(tmpdir(), "brew-upgrade-pinned-test-"));
    try {
        const log = path.join(directory, "brew.log");
        const script = `${upgradeFunction}
brew() {
    print -r -- "$*" >> "$BREW_LOG"
    case "$1" in
        unpin) return "$UNPIN_STATUS" ;;
        upgrade) return "$UPGRADE_STATUS" ;;
        pin) return "$PIN_STATUS" ;;
    esac
}
brew-upgrade-pinned git
`;
        const result = Bun.spawnSync(["/bin/zsh", "-f", "-c", script], {
            env: {
                ...process.env,
                BREW_LOG: log,
                UNPIN_STATUS: String(unpinStatus),
                UPGRADE_STATUS: String(upgradeStatus),
                PIN_STATUS: String(pinStatus),
            },
            stdout: "pipe",
            stderr: "pipe",
        });
        return {
            status: result.exitCode,
            calls: readFileSync(log, "utf8").trim().split("\n"),
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
