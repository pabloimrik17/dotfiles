#!/usr/bin/env bun

import { appendFileSync } from "node:fs";
import path from "node:path";

interface FixtureSession {
    id: string;
    title: string;
    path: string;
    group: string;
    profile: string;
    tool?: string;
    cmdOverride?: string;
    extraArgs?: string;
    agent_session_id?: string | null;
}

interface Fixture {
    profile?: string;
    worktree: string;
    metadata?: {
        title: string;
        body: string;
        headRefName: string;
        url?: string;
    };
    groups?: Array<{ name: string; path: string; session_count?: number; children?: unknown[] }>;
    sessions?: FixtureSession[];
    runtime?: Array<{ session: string; state: string }>;
    starts?: number;
    legacyLaunches?: number;
    lastLaunchArgs?: string[];
    lastCommandOverride?: string;
    inference?: {
        output?: string;
        exitCode?: number;
        delayMs?: number;
        spawnChild?: boolean;
        childPidFile?: string;
    };
    failures?: {
        wt?: boolean;
        gh?: boolean;
        add?: boolean;
        addAfterCreate?: boolean;
        start?: boolean;
    };
}

const command = process.argv[2];
const args = process.argv.slice(3);
const fixturePath = process.env.GHD_AOE_FIXTURE;
if (!fixturePath) throw new Error("GHD_AOE_FIXTURE is required");

const readFixture = async (): Promise<Fixture> =>
    JSON.parse(await Bun.file(fixturePath).text()) as Fixture;
const writeFixture = async (fixture: Fixture): Promise<void> => {
    await Bun.write(fixturePath, JSON.stringify(fixture, null, 2) + "\n");
};
appendFileSync(
    process.env.GHD_AOE_FIXTURE_LOG || fixturePath + ".jsonl",
    JSON.stringify({
        command,
        args,
        cwd: process.cwd(),
        thinking: process.env.MAX_THINKING_TOKENS,
    }) + "\n",
);

if (command === "wt") {
    const fixture = await readFixture();
    if (fixture.failures?.wt) {
        console.error("fixture Worktrunk failure");
        process.exit(31);
    }
    console.log(fixture.worktree);
    process.exit(0);
}

if (command === "gh") {
    const fixture = await readFixture();
    if (fixture.failures?.gh || !fixture.metadata) {
        console.error("fixture GitHub failure");
        process.exit(32);
    }
    console.log(JSON.stringify(fixture.metadata));
    process.exit(0);
}

if (command === "claude") {
    const fixture = await readFixture();
    const inference = fixture.inference ?? {};
    if (inference.spawnChild) {
        const pidFile = inference.childPidFile;
        if (!pidFile) throw new Error("childPidFile is required");
        Bun.spawn(["/bin/sh", "-c", 'printf "%s" "$$" > "$1"; exec sleep 60', "sh", pidFile], {
            stdout: "ignore",
            stderr: "ignore",
        });
        await Bun.sleep(60_000);
    } else if (inference.delayMs) {
        await Bun.sleep(inference.delayMs);
    }
    if (inference.output) console.log(inference.output);
    process.exit(inference.exitCode ?? 0);
}

if (command !== "aoe") throw new Error("Unknown fixture command: " + command);

const fixture = await readFixture();
fixture.sessions ??= [];
fixture.runtime ??= [];
const requireSession = (id: string): FixtureSession => {
    const session = fixture.sessions?.find((candidate) => candidate.id === id);
    if (!session) {
        console.error("fixture session missing");
        process.exit(35);
    }
    return session;
};
const profileIndex = args.indexOf("--profile");
const profile =
    profileIndex >= 0
        ? args[profileIndex + 1]!
        : process.env.AGENT_OF_EMPIRES_PROFILE || fixture.profile || "main";
const commandArgs =
    profileIndex >= 0
        ? [...args.slice(0, profileIndex), ...args.slice(profileIndex + 2)]
        : [...args];

if (commandArgs[0] === "profile" && commandArgs[1] === "default") {
    console.log("Default profile: " + (fixture.profile || "main"));
    process.exit(0);
}

if (commandArgs[0] === "list") {
    console.log(JSON.stringify(fixture.sessions.filter((session) => session.profile === profile)));
    process.exit(0);
}

if (commandArgs[0] === "group" && commandArgs[1] === "list") {
    console.log(JSON.stringify(fixture.groups ?? []));
    process.exit(0);
}

if (commandArgs[0] === "ps") {
    console.log(JSON.stringify(fixture.runtime));
    process.exit(0);
}

if (commandArgs[0] === "add") {
    if (fixture.failures?.add) {
        console.error("fixture AoE add failure");
        process.exit(33);
    }
    const sessionPath = path.resolve(commandArgs[1]!);
    const titleIndex = commandArgs.indexOf("--title");
    const groupIndex = commandArgs.indexOf("--group");
    const overrideIndex = commandArgs.indexOf("--cmd-override");
    const extraIndex = commandArgs.indexOf("--extra-args");
    const title = commandArgs[titleIndex + 1]!;
    const group = commandArgs[groupIndex + 1]!;
    const existing = fixture.sessions.find(
        (session) =>
            session.profile === profile &&
            session.title === title &&
            path.resolve(session.path) === sessionPath,
    );
    if (existing) {
        console.log("Session already exists: " + existing.id);
        await writeFixture(fixture);
        process.exit(0);
    }
    const session: FixtureSession = {
        id: "session-" + (fixture.sessions.length + 1),
        title,
        path: sessionPath,
        group,
        profile,
        tool: "claude",
        cmdOverride: overrideIndex >= 0 ? commandArgs[overrideIndex + 1] : undefined,
        extraArgs: extraIndex >= 0 ? commandArgs[extraIndex + 1] : undefined,
        agent_session_id: null,
    };
    fixture.sessions.push(session);
    if (commandArgs.includes("-l") || commandArgs.includes("--launch")) {
        fixture.legacyLaunches = (fixture.legacyLaunches ?? 0) + 1;
        session.agent_session_id = "00000000-0000-4000-8000-000000000001";
    }
    await writeFixture(fixture);
    if (fixture.failures?.addAfterCreate) {
        console.error("fixture interrupted after registration");
        process.exit(34);
    }
    console.log("Added session " + session.id);
    process.exit(0);
}

if (commandArgs[0] === "session" && commandArgs[1] === "show") {
    const id = commandArgs[2]!;
    const session = requireSession(id);
    const running = fixture.runtime.some((row) => row.session === id);
    console.log(JSON.stringify({ ...session, status: running ? "running" : "stopped" }));
    process.exit(0);
}

if (commandArgs[0] === "session" && commandArgs[1] === "start") {
    if (fixture.failures?.start) {
        console.error("fixture AoE start failure");
        process.exit(36);
    }
    const id = commandArgs[2]!;
    const session = requireSession(id);
    const resume = Boolean(session.agent_session_id);
    const conversation = session.agent_session_id || "00000000-0000-4000-8000-000000000001";
    fixture.lastLaunchArgs = [
        ...(session.extraArgs?.split(" ") ?? []),
        resume ? "--resume" : "--session-id",
        conversation,
    ];
    fixture.lastCommandOverride = session.cmdOverride;
    fixture.starts = (fixture.starts ?? 0) + 1;
    session.agent_session_id = conversation;
    if (!fixture.runtime.some((row) => row.session === id)) {
        fixture.runtime.push({ session: id, state: "running" });
    }
    await writeFixture(fixture);
    console.log("Started " + id);
    process.exit(0);
}

console.error("Unsupported aoe fixture invocation: " + commandArgs.join(" "));
process.exit(37);
