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

function arrayTokens(source: string, name: string): string[] {
    const match = source.match(new RegExp(`^${name}=\\(([^)]*)\\)`, "m"));
    if (!match) throw new Error(`Missing ${name} array`);
    return (match[1].match(/"[^"]+"|\S+/g) ?? []).map((token) => token.replace(/^"|"$/g, ""));
}

function assertVersionCoverage(source: string): void {
    const frozen = [
        ...arrayTokens(source, "BREW_PACKAGES"),
        ...arrayTokens(source, "ZSH_PLUGIN_FORMULAE"),
        ...arrayTokens(source, "FONT_CASKS").map((spec) => spec.split(":")[0]),
    ];
    const versions = arrayTokens(source, "BREW_VERSIONS");
    const rows = versions.map((row) => row.split("|"));
    const versionNames = rows.map(([name]) => name);
    expect(frozen).toHaveLength(35);
    expect(rows).toHaveLength(35);
    for (const [name, version] of rows) {
        expect(name).toBeTruthy();
        expect(version).toBeTruthy();
    }
    expect(versionNames).toEqual(
        [...versionNames].sort((a, b) =>
            a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0,
        ),
    );
    expect([...versionNames].sort()).toEqual([...frozen].sort());
}

test("every frozen brew package has exactly one version row", () => {
    assertVersionCoverage(template);
});

test("coverage detects a removed version row", () => {
    const scratch = template.replace(/^    "git\|[^"\n]+"\n/m, "");
    expect(scratch).not.toBe(template);
    expect(() => assertVersionCoverage(scratch)).toThrow();
});

// Pins packages installed in the same pass: Group 3 installs the last frozen ones.
test("the freeze pass runs after Group 3 and before Group 4", () => {
    const groupThree = template.indexOf("# Group 3:");
    const call = template.search(/^apply_brew_freeze$/m);
    const groupFour = template.indexOf("# Group 4:");
    expect(groupThree).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(groupThree);
    expect(groupFour).toBeGreaterThan(call);
});

const helper = template.match(
    /# BEGIN BREW_FREEZE_HELPERS\n([\s\S]*?)# END BREW_FREEZE_HELPERS/,
)?.[1];
if (!helper) throw new Error("Missing brew freeze helper block");

type Fixture = {
    packages?: string[];
    plugins?: string[];
    fonts?: string[];
    versions?: string[];
    holds?: string[];
    installed?: string[];
    pinned?: string[];
    record?: string[];
    recordUnwritable?: boolean;
    failUnpin?: string;
};

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

function shellArray(values: string[]): string {
    return `(${values.map(shellQuote).join(" ")})`;
}

function harnessSource(strict: boolean, fixture: Fixture): string {
    return `${strict ? "set -u\n" : ""}
ERRORS=0
BREW_PACKAGES=${shellArray(fixture.packages ?? ["git"])}
ZSH_PLUGIN_FORMULAE=${shellArray(fixture.plugins ?? [])}
FONT_CASKS=${shellArray(fixture.fonts ?? [])}
BREW_VERSIONS=${shellArray(fixture.versions ?? ["git|2.55.0"])}
BREW_HOLDS=${shellArray(fixture.holds ?? [])}
BREW_FREEZES_STATE="\${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles/brew-freezes"
info() { printf 'INFO: %s\\n' "$*"; }
warn() { printf 'WARNING: %s\\n' "$*"; }
error() { printf 'ERROR: %s\\n' "$*"; ERRORS=$((ERRORS + 1)); }
brew() {
    printf '%s\\n' "$*" >> "$BREW_LOG"
    local command="$1" kind name version temporary
    shift
    case "$command" in
        list)
            if [ "$1" = '--pinned' ]; then cat "$BREW_PINNED"; return 0; fi
            kind="${"${1#--}"}"
            name="$2"
            awk -F '|' -v kind="$kind" -v name="$name" '$1 == kind && ($2 == name || $4 == name) { found = 1 } END { exit !found }' "$BREW_INSTALLED"
            ;;
        pin)
            kind="${"${1#--}"}"
            name="$2"
            version="$(awk -F '|' -v kind="$kind" -v name="$name" '$1 == kind && $2 == name { print $3; exit }' "$BREW_INSTALLED")"
            [ -n "$version" ] || return 1
            printf '%s %s\\n' "$name" "$version" >> "$BREW_PINNED"
            ;;
        unpin)
            kind="${"${1#--}"}"
            name="$2"
            [ "$name" != "$FAIL_UNPIN" ] || return 1
            temporary="$BREW_PINNED.tmp"
            awk -v name="$name" '$1 != name' "$BREW_PINNED" > "$temporary"
            mv "$temporary" "$BREW_PINNED"
            ;;
        *) return 2 ;;
    esac
}
${helper}
apply_brew_freeze
printf 'ERROR_COUNT=%s\\n' "$ERRORS"
`;
}

function runFreeze(strict: boolean, fixture: Fixture = {}) {
    const directory = mkdtempSync(path.join(tmpdir(), "brew-freeze-test-"));
    try {
        const installedFile = path.join(directory, "installed");
        const pinnedFile = path.join(directory, "pinned");
        const logFile = path.join(directory, "brew.log");
        const stateDirectory = path.join(directory, "state");
        const recordFile = path.join(stateDirectory, "dotfiles", "brew-freezes");
        const harnessFile = path.join(directory, "harness.sh");
        writeFileSync(
            installedFile,
            (fixture.installed ?? ["formula|git|2.55.0|git"]).join("\n") + "\n",
        );
        writeFileSync(pinnedFile, (fixture.pinned ?? []).join("\n") + "\n");
        if (fixture.record) {
            mkdirSync(path.dirname(recordFile), { recursive: true });
            writeFileSync(recordFile, fixture.record.join("\n") + "\n");
        }
        // A directory at the record path makes the redirect fail.
        if (fixture.recordUnwritable) mkdirSync(recordFile, { recursive: true });
        writeFileSync(harnessFile, harnessSource(strict, fixture));
        const result = Bun.spawnSync(["/bin/bash", harnessFile], {
            env: {
                ...process.env,
                BREW_INSTALLED: installedFile,
                BREW_PINNED: pinnedFile,
                BREW_LOG: logFile,
                XDG_STATE_HOME: stateDirectory,
                FAIL_UNPIN: fixture.failUnpin ?? "",
            },
            stdout: "pipe",
            stderr: "pipe",
        });
        return {
            exitCode: result.exitCode,
            output: result.stdout.toString() + result.stderr.toString(),
            log: existsSync(logFile) ? readFileSync(logFile, "utf8") : "",
            pinned: readFileSync(pinnedFile, "utf8").trim().split("\n").filter(Boolean),
            record:
                existsSync(recordFile) && statSync(recordFile).isFile()
                    ? readFileSync(recordFile, "utf8").trim().split("\n").filter(Boolean)
                    : [],
        };
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

for (const strict of [false, true]) {
    const mode = strict ? "with set -u" : "without set -u";

    test(`installed formula is pinned and recorded (${mode})`, () => {
        const result = runFreeze(strict);
        expect(result.exitCode, result.output).toBe(0);
        expect(result.log).toContain("pin --formula git");
        expect(result.pinned).toEqual(["git 2.55.0"]);
        expect(result.record).toEqual(["formula git"]);
        expect(result.output).toContain("ERROR_COUNT=0");
    });

    test(`installed font cask is pinned and recorded as a cask (${mode})`, () => {
        const result = runFreeze(strict, {
            packages: [],
            fonts: ["font-hack-nerd-font:HackNerdFont"],
            versions: ["font-hack-nerd-font|3.5.1"],
            installed: ["cask|font-hack-nerd-font|3.5.1|font-hack-nerd-font"],
        });
        expect(result.exitCode, result.output).toBe(0);
        expect(result.log).toContain("pin --cask font-hack-nerd-font");
        expect(result.record).toEqual(["cask font-hack-nerd-font"]);
    });

    test(`unwritable record is an error (${mode})`, () => {
        const result = runFreeze(strict, { recordUnwritable: true });
        expect(result.output).toContain("ERROR: Failed to write freeze record");
        expect(result.output).toContain("ERROR_COUNT=1");
    });

    test(`declined and absent formula has no pin or warning (${mode})`, () => {
        const result = runFreeze(strict, { installed: [] });
        expect(result.log).not.toContain("pin --formula");
        expect(result.record).toEqual([]);
        expect(result.output).not.toContain("WARNING:");
        expect(result.output).toContain("ERROR_COUNT=0");
    });

    test(`recorded pin is a silent no-op on rerun (${mode})`, () => {
        const result = runFreeze(strict, {
            pinned: ["git 2.55.0"],
            record: ["formula git"],
        });
        expect(result.log).not.toContain("pin --formula git");
        expect(result.output).not.toContain("WARNING:");
        expect(result.record).toEqual(["formula git"]);
    });

    test(`GUI cask and dependency are outside the frozen set (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: [
                "formula|git|2.55.0|git",
                "formula|openssl@3|3.6.4|openssl@3",
                "cask|ghostty|1.0.0|ghostty",
            ],
        });
        expect(result.log).not.toContain("pin --cask ghostty");
        expect(result.log).not.toContain("pin --formula openssl@3");
        expect(result.record).toEqual(["formula git"]);
    });

    test(`a held package is compared but not recorded by freeze (${mode})`, () => {
        const result = runFreeze(strict, {
            holds: ["git|reason|exit condition"],
            pinned: ["git 2.55.0"],
        });
        expect(result.log).not.toContain("pin --formula git");
        expect(result.record).toEqual([]);
        expect(result.output).not.toContain("WARNING:");
    });

    test(`missing version row reports error but still pins (${mode})`, () => {
        const result = runFreeze(strict, { versions: [] });
        expect(result.output).toContain("ERROR: Frozen package has no version row: git");
        expect(result.log).toContain("pin --formula git");
        expect(result.record).toEqual(["formula git"]);
    });

    test(`orphan version row reports an error (${mode})`, () => {
        const result = runFreeze(strict, {
            versions: ["git|2.55.0", "ghost|1.0"],
        });
        expect(result.output).toContain("ERROR: Version row has no frozen package: ghost");
        expect(result.log).not.toContain("pin --formula ghost");
    });

    test(`different formula source is pinned with switch warning (${mode})`, () => {
        const result = runFreeze(strict, {
            packages: ["AlexsJones/llmfit/llmfit"],
            versions: ["AlexsJones/llmfit/llmfit|1.1.15"],
            installed: ["formula|llmfit|1.1.15|homebrew/core/llmfit"],
        });
        expect(result.log).toContain("pin --formula llmfit");
        expect(result.output).toContain(
            "AlexsJones/llmfit/llmfit is declared from a different source",
        );
        expect(result.output).toContain(
            "brew unpin llmfit && brew uninstall llmfit && brew install AlexsJones/llmfit/llmfit",
        );
        expect(result.record).toEqual(["formula AlexsJones/llmfit/llmfit"]);
    });

    test(`hand-pinned source mismatch still shows the switch command (${mode})`, () => {
        const result = runFreeze(strict, {
            packages: ["AlexsJones/llmfit/llmfit"],
            versions: ["AlexsJones/llmfit/llmfit|1.1.15"],
            installed: ["formula|llmfit|1.1.15|homebrew/core/llmfit"],
            pinned: ["llmfit 1.1.15"],
        });
        expect(result.log).not.toContain("pin --formula llmfit");
        expect(result.output).toContain("brew unpin llmfit && brew uninstall llmfit");
        expect(result.record).toEqual([]);
    });

    test(`recorded source mismatch is silent on rerun (${mode})`, () => {
        const result = runFreeze(strict, {
            packages: ["AlexsJones/llmfit/llmfit"],
            versions: ["AlexsJones/llmfit/llmfit|1.1.15"],
            installed: ["formula|llmfit|1.1.15|homebrew/core/llmfit"],
            pinned: ["llmfit 1.1.15"],
            record: ["formula AlexsJones/llmfit/llmfit"],
        });
        expect(result.output).not.toContain("WARNING:");
        expect(result.log).not.toContain("pin --formula llmfit");
        expect(result.record).toEqual(["formula AlexsJones/llmfit/llmfit"]);
    });

    test(`matching pinned version is silent (${mode})`, () => {
        const result = runFreeze(strict, { pinned: ["git 2.55.0"] });
        expect(result.output).not.toContain("WARNING:");
    });

    test(`version drift warns without changing installs or error count (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: ["formula|git|2.56.0|git"],
            pinned: ["git 2.56.0"],
        });
        expect(result.output).toContain("WARNING: git: declared 2.55.0, pinned 2.56.0");
        expect(result.output).toContain("ERROR_COUNT=0");
        expect(result.log).not.toMatch(/^(install|upgrade|uninstall) /m);
        expect(result.pinned).toEqual(["git 2.56.0"]);
    });

    test(`revision suffix is version drift (${mode})`, () => {
        const result = runFreeze(strict, {
            versions: ["git|1.18.2"],
            installed: ["formula|git|1.18.2_1|git"],
            pinned: ["git 1.18.2_1"],
        });
        expect(result.output).toContain("declared 1.18.2, pinned 1.18.2_1");
    });

    test(`forgotten version bump warns on the next run (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: ["formula|git|2.56.0|git"],
            pinned: ["git 2.56.0"],
            record: ["formula git"],
        });
        expect(result.output).toContain("declared 2.55.0, pinned 2.56.0");
        expect(result.log).not.toContain("pin --formula git");
    });

    test(`removed formula and cask release their recorded pins (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: [
                "formula|git|2.55.0|git",
                "formula|old|1.0|old",
                "cask|old-font|2.0|old-font",
            ],
            pinned: ["old 1.0", "old-font 2.0"],
            record: ["formula old", "cask old-font"],
        });
        expect(result.log).toContain("unpin --formula old");
        expect(result.log).toContain("unpin --cask old-font");
        expect(result.record).toEqual(["formula git"]);
        expect(result.pinned).toEqual(["git 2.55.0"]);
    });

    test(`hand pin survives package removal (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: ["formula|git|2.55.0|git", "formula|old|1.0|old"],
            pinned: ["old 1.0"],
        });
        expect(result.log).not.toContain("unpin --formula old");
        expect(result.pinned).toContain("old 1.0");
    });

    test(`uninstalled recorded package is dropped without unpin (${mode})`, () => {
        const result = runFreeze(strict, { record: ["formula old"] });
        expect(result.log).not.toContain("unpin --formula old");
        expect(result.record).toEqual(["formula git"]);
    });

    test(`manually removed pin is dropped from the record (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: ["formula|git|2.55.0|git", "formula|old|1.0|old"],
            record: ["formula old"],
        });
        expect(result.log).not.toContain("unpin --formula old");
        expect(result.record).toEqual(["formula git"]);
    });

    test(`failed release remains recorded for retry (${mode})`, () => {
        const result = runFreeze(strict, {
            installed: ["formula|git|2.55.0|git", "formula|old|1.0|old"],
            pinned: ["old 1.0"],
            record: ["formula old"],
            failUnpin: "old",
        });
        expect(result.output).toContain("ERROR: Failed to release freeze on old");
        expect(result.record).toContain("formula old");
    });
}
