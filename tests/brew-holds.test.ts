import { expect, test } from "bun:test";
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const template = readFileSync(
    path.resolve(import.meta.dir, "../run_onchange_install-packages.sh.tmpl"),
    "utf8",
);
const recordWriter = template.match(/^write_brew_record\(\) \{[\s\S]*?^\}/m)?.[0];
const holdPass = template.match(/^apply_brew_holds\(\) \{[\s\S]*?^\}/m)?.[0];
const freezeHelpers = template.match(
    /# BEGIN BREW_FREEZE_HELPERS\n([\s\S]*?)# END BREW_FREEZE_HELPERS/,
)?.[1];
if (!recordWriter || !holdPass || !freezeHelpers) {
    throw new Error("Missing brew reconciliation functions");
}

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

type Fixture = {
    hold?: string;
    installed?: boolean;
    pinned?: boolean;
    holdRecord?: string[];
    freezeRecord?: string[];
    holdRecordUnwritable?: boolean;
    thenFreeze?: boolean;
    removeAfter?: boolean;
};

function readRecord(file: string): string {
    return existsSync(file) && statSync(file).isFile() ? readFileSync(file, "utf8").trim() : "";
}

function harnessSource(fixture: Fixture): string {
    const hold = fixture.hold === undefined ? "git|reason|exit condition" : fixture.hold;
    const script = `BREW_HOLDS_STATE="$XDG_STATE_HOME/dotfiles/brew-holds"
BREW_FREEZES_STATE="$XDG_STATE_HOME/dotfiles/brew-freezes"
BREW_HOLDS_ABSENT=()
BREW_HOLDS=(${hold ? shellQuote(hold) : ""})
BREW_PACKAGES=(git)
ZSH_PLUGIN_FORMULAE=()
FONT_CASKS=()
BREW_VERSIONS=('git|2.55.0')
ERRORS=0
info() { printf 'INFO: %s\\n' "$*"; }
warn() { printf 'WARNING: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
brew() {
printf '%s\\n' "$*" >> "$BREW_LOG"
case "$*" in
    'list --pinned') awk '{ print $1 }' "$BREW_PINNED" ;;
    'list --pinned --versions') cat "$BREW_PINNED" ;;
    'list --formula git') [ "$BREW_INSTALLED" = 1 ] ;;
    'pin git'|'pin --formula git') printf 'git 2.55.0\\n' > "$BREW_PINNED" ;;
    'unpin git'|'unpin --formula git') : > "$BREW_PINNED" ;;
    *) return 2 ;;
esac
}
${recordWriter}
${holdPass}
${freezeHelpers}
apply_brew_holds
${fixture.thenFreeze ? "apply_brew_freeze" : ""}
${
    fixture.removeAfter
        ? `apply_brew_freeze
printf 'OWNED_AFTER_TRANSFER=%s\\n' "$(grep -Fxc git "$BREW_HOLDS_STATE")"
BREW_HOLDS=()
BREW_PACKAGES=()
BREW_VERSIONS=()
apply_brew_holds
apply_brew_freeze`
        : `printf 'ABSENT=%s\\n' "\${BREW_HOLDS_ABSENT[*]:-}"`
}
printf 'ERROR_COUNT=%s\\n' "$ERRORS"
`;
    return script;
}

function runHolds(fixture: Fixture = {}) {
    const directory = mkdtempSync(path.join(tmpdir(), "brew-holds-test-"));
    try {
        const stateDirectory = path.join(directory, "state", "dotfiles");
        const holdRecord = path.join(stateDirectory, "brew-holds");
        const freezeRecord = path.join(stateDirectory, "brew-freezes");
        const pinnedFile = path.join(directory, "pinned");
        const logFile = path.join(directory, "brew.log");
        const scriptFile = path.join(directory, "harness.sh");
        mkdirSync(stateDirectory, { recursive: true });
        writeFileSync(pinnedFile, fixture.pinned ? "git 2.55.0\n" : "");
        if (fixture.holdRecord) writeFileSync(holdRecord, fixture.holdRecord.join("\n") + "\n");
        if (fixture.freezeRecord)
            writeFileSync(freezeRecord, fixture.freezeRecord.join("\n") + "\n");
        // A directory at the record path makes the redirect fail.
        if (fixture.holdRecordUnwritable) mkdirSync(holdRecord);

        writeFileSync(scriptFile, harnessSource(fixture));
        const result = Bun.spawnSync(["/bin/bash", scriptFile], {
            env: {
                ...process.env,
                XDG_STATE_HOME: path.join(directory, "state"),
                BREW_PINNED: pinnedFile,
                BREW_LOG: logFile,
                BREW_INSTALLED: fixture.installed === false ? "0" : "1",
            },
            stdout: "pipe",
            stderr: "pipe",
        });
        return {
            exitCode: result.exitCode,
            output: result.stdout.toString() + result.stderr.toString(),
            log: existsSync(logFile) ? readFileSync(logFile, "utf8") : "",
            pinned: readFileSync(pinnedFile, "utf8").trim(),
            holdRecord: readRecord(holdRecord),
            freezeRecord: readRecord(freezeRecord),
        };
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

test("a freeze-owned pin moves to a hold and is released when both declarations leave", () => {
    const result = runHolds({ pinned: true, freezeRecord: ["formula git"], removeAfter: true });
    expect(result.exitCode, result.output).toBe(0);
    expect(result.output).toContain("OWNED_AFTER_TRANSFER=1");
    expect(result.log).toContain("unpin git");
    expect(result.pinned).toBe("");
    expect(result.holdRecord).toBe("");
    expect(result.freezeRecord).toBe("");
});

test("a declared hold pins an installed package and reports it", () => {
    const result = runHolds();
    expect(result.exitCode, result.output).toBe(0);
    expect(result.log).toContain("pin git");
    expect(result.pinned).toBe("git 2.55.0");
    expect(result.holdRecord).toBe("git");
    expect(result.output).toContain("Brew holds: git");
});

test("an unwritable hold record is an error and still pins the hold", () => {
    const result = runHolds({ holdRecordUnwritable: true });
    expect(result.output).toContain("ERROR: Failed to write hold record");
    expect(result.output).toContain("ERROR_COUNT=1");
    expect(result.pinned).toBe("git 2.55.0");
});

test("a failed hold record write leaves the freeze owning the transferred pin", () => {
    const result = runHolds({
        pinned: true,
        freezeRecord: ["formula git"],
        holdRecordUnwritable: true,
        thenFreeze: true,
    });
    expect(result.freezeRecord).toBe("formula git");
    expect(result.pinned).toBe("git 2.55.0");
});

test("an already recorded hold needs no pin or warning", () => {
    const result = runHolds({ pinned: true, holdRecord: ["git"] });
    expect(result.exitCode, result.output).toBe(0);
    expect(result.log).not.toMatch(/^pin git$/m);
    expect(result.output).not.toContain("WARNING:");
    expect(result.holdRecord).toBe("git");
});

test("every declared hold has a reason and an exit condition", () => {
    const declarations = template.match(/^BREW_HOLDS=\(\n([\s\S]*?)^\)/m)?.[1];
    expect(declarations).toBeDefined();
    const entries = [...declarations!.matchAll(/^\s*"([^"]+)"\s*$/gm)].map((match) => match[1]);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
        const fields = entry.split("|");
        expect(fields).toHaveLength(3);
        expect(fields.every((field) => field.trim().length > 0)).toBe(true);
    }
});

test("an absent held package is skipped with its reason and exit condition", () => {
    const result = runHolds({ installed: false });
    expect(result.exitCode, result.output).toBe(0);
    expect(result.log).not.toMatch(/^pin git$/m);
    expect(result.holdRecord).toBe("");
    expect(result.output).toContain("ABSENT=git");
    expect(result.output).toContain("Reason: reason. Exit condition: exit condition");
    expect(result.output).toContain("ERROR_COUNT=0");
});

test("a hand pin is not claimed when it becomes a hold", () => {
    const result = runHolds({ pinned: true, removeAfter: true });
    expect(result.exitCode, result.output).toBe(0);
    expect(result.output).toContain("OWNED_AFTER_TRANSFER=0");
    expect(result.log).not.toContain("unpin git");
    expect(result.pinned).toBe("git 2.55.0");
    expect(result.holdRecord).toBe("");
});
