import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const DEFAULT_INFERENCE_TIMEOUT_MS = 10_000;

type Modality = "normal" | "review";

export interface CliOptions {
    repoPath: string;
    repository: string;
    prNumber: number;
    modality: Modality;
    profile?: string;
}

export interface ProcessResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    timedOut: boolean;
}

interface RunOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
}

export type ProcessRunner = (
    command: string,
    args: string[],
    options?: RunOptions,
) => Promise<ProcessResult>;

interface PullRequestMetadata {
    title: string;
    body: string;
    headRefName: string;
    url?: string;
}

interface AoEGroup {
    name?: string;
    path: string;
    children?: AoEGroup[];
}

interface AoESession {
    id: string;
    title: string;
    path: string;
    group?: string;
    profile?: string;
    tool?: string;
}

interface SessionDetail extends AoESession {
    status?: string;
    agent_session_id?: string | null;
}

export interface NamingChoice {
    group: string;
    baseTitle: string;
}

interface Association {
    id: string;
    modality: Modality;
    worktree: string;
    reviewRef?: string;
    launchState?: "registered" | "started";
    conversationId?: string;
}

interface PendingCreation {
    modality: Modality;
    worktree: string;
    title: string;
    group: string;
    reviewRef: string;
}

interface StateRecord {
    version: 1;
    identity: {
        profile: string;
        repository: string;
        prNumber: number;
    };
    naming?: NamingChoice;
    associations: Partial<Record<Modality, Association>>;
    pending?: PendingCreation;
}

export interface InferenceResult {
    choice?: NamingChoice;
    durationMs: number;
    timedOut: boolean;
    diagnostic?: string;
}

export interface IntegrationResult {
    id: string;
    created: boolean;
    action: "queued" | "running" | "started" | "resumed";
    title: string;
    group: string;
}

function usage(): string {
    return [
        "Usage: ghd-aoe --repo-path <path> --repo <[host/]owner/repo> --pr <number> --mode <normal|review> [--profile <name>]",
        "",
        "  normal  Register or reuse the PR session without starting it.",
        "  review  Register and start, leave running, or resume the PR review.",
    ].join("\n");
}

export function parseCliArgs(args: string[]): CliOptions {
    const values = new Map<string, string>();
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (argument === "--help" || argument === "-h") {
            throw new Error(usage());
        }
        if (!argument?.startsWith("--")) {
            throw new Error(`Unexpected argument: ${argument ?? ""}\n${usage()}`);
        }
        const value = args[index + 1];
        if (!value || value.startsWith("--")) {
            throw new Error(`Missing value for ${argument}\n${usage()}`);
        }
        values.set(argument, value);
        index += 1;
    }

    const repoPath = values.get("--repo-path");
    const repository = values.get("--repo");
    const prText = values.get("--pr");
    const modality = values.get("--mode");
    const allowed = new Set(["--repo-path", "--repo", "--pr", "--mode", "--profile"]);
    const unknown = [...values.keys()].find((key) => !allowed.has(key));
    if (unknown) throw new Error(`Unknown option: ${unknown}\n${usage()}`);
    if (!repoPath || !repository || !prText || !modality) {
        throw new Error(`Missing required arguments\n${usage()}`);
    }
    if (!/^[1-9]\d*$/.test(prText) || !Number.isSafeInteger(Number(prText))) {
        throw new Error(`Invalid pull request number: ${prText}`);
    }
    if (modality !== "normal" && modality !== "review") {
        throw new Error(`Invalid mode: ${modality}`);
    }
    validateRepository(repository);
    const profile = values.get("--profile");
    if (profile !== undefined) validateProfile(profile);

    return {
        repoPath,
        repository,
        prNumber: Number(prText),
        modality,
        profile,
    };
}

function validateRepository(repository: string): void {
    const trimmed = repository.replace(/\.git$/, "");
    const parts = trimmed.split("/");
    if (
        (parts.length !== 2 && parts.length !== 3) ||
        parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part))
    ) {
        throw new Error(`Invalid repository identity: ${repository}`);
    }
}

function validateProfile(profile: string): void {
    if (!profile || /[\0\r\n]/.test(profile)) {
        throw new Error("Invalid AoE profile");
    }
}

async function validateDirectory(input: string, label: string): Promise<string> {
    if (/\0|\r|\n/.test(input)) throw new Error(`Invalid ${label}`);
    const resolved = await realpath(input).catch(() => "");
    if (!resolved) throw new Error(`${label} does not exist: ${input}`);
    const details = await stat(resolved);
    if (!details.isDirectory()) throw new Error(`${label} is not a directory: ${input}`);
    return resolved;
}

export const runProcess: ProcessRunner = async (command, args, options = {}) => {
    return await new Promise<ProcessResult>((resolve) => {
        const timed = options.timeoutMs !== undefined;
        const child = spawn(command, args, {
            cwd: options.cwd,
            env: options.env ?? process.env,
            detached: timed,
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        child.stdout?.setEncoding("utf8");
        child.stderr?.setEncoding("utf8");
        child.stdout?.on("data", (chunk) => (stdout += chunk));
        child.stderr?.on("data", (chunk) => (stderr += chunk));

        const finish = (result: ProcessResult) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            resolve(result);
        };

        child.on("error", (error) =>
            finish({ exitCode: 127, stdout, stderr: `${stderr}${error.message}`, timedOut: false }),
        );
        child.on("close", (code, signal) =>
            finish({
                exitCode: code ?? (signal ? 128 : 1),
                stdout,
                stderr,
                timedOut: false,
            }),
        );

        if (options.timeoutMs !== undefined) {
            timer = setTimeout(() => {
                if (child.pid) {
                    try {
                        process.kill(-child.pid, "SIGKILL");
                    } catch {
                        child.kill("SIGKILL");
                    }
                }
                finish({ exitCode: 124, stdout, stderr, timedOut: true });
            }, options.timeoutMs);
        }
    });
};

function commandFailure(label: string, result: ProcessResult): Error {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.exitCode}`;
    return new Error(`${label}: ${detail}`);
}

function parseJson<T>(text: string, label: string): T {
    try {
        return JSON.parse(text) as T;
    } catch {
        throw new Error(`${label} returned invalid JSON`);
    }
}

function stateRoot(env: NodeJS.ProcessEnv): string {
    if (env.GHD_AOE_STATE_HOME) return path.resolve(env.GHD_AOE_STATE_HOME);
    const xdgState = env.XDG_STATE_HOME
        ? path.resolve(env.XDG_STATE_HOME)
        : path.join(env.HOME || homedir(), ".local", "state");
    return path.join(xdgState, "ghd-aoe");
}

function identityHash(profile: string, repository: string, prNumber: number): string {
    return createHash("sha256")
        .update(JSON.stringify([profile, repository.toLowerCase(), prNumber]))
        .digest("hex");
}

export function getRecordPath(
    root: string,
    profile: string,
    repository: string,
    prNumber: number,
): string {
    return path.join(root, "records", `${identityHash(profile, repository, prNumber)}.json`);
}

export function getReviewMarkerPath(root: string, instanceId: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(instanceId)) {
        throw new Error(`Invalid AoE session ID: ${instanceId}`);
    }
    return path.join(root, "reviews", `${instanceId}.json`);
}

async function atomicJsonWrite(file: string, value: unknown): Promise<void> {
    const directory = path.dirname(file);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    await chmod(temporary, 0o600);
    await rename(temporary, file);
    await chmod(file, 0o600);
}

async function loadRecord(file: string): Promise<StateRecord | undefined> {
    try {
        return parseJson<StateRecord>(await readFile(file, "utf8"), "State record");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw error;
    }
}

async function acquireLock(
    root: string,
    key: string,
    timeoutMs = 30_000,
): Promise<() => Promise<void>> {
    const directory = path.join(root, "locks");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
    const lock = path.join(directory, `${key}.lock`);
    const started = Date.now();
    const nonce = randomUUID();

    while (true) {
        try {
            await writeFile(lock, `${JSON.stringify({ pid: process.pid, nonce })}\n`, {
                flag: "wx",
                mode: 0o600,
            });
            return async () => {
                try {
                    const current = parseJson<{ pid?: number; nonce?: string }>(
                        await readFile(lock, "utf8"),
                        "Lock",
                    );
                    if (current.pid === process.pid && current.nonce === nonce) {
                        await rm(lock, { force: true });
                    }
                } catch (error) {
                    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
                }
            };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        }

        let owner: { pid?: number; nonce?: string } | undefined;
        let observed = "";
        try {
            observed = await readFile(lock, "utf8");
            owner = parseJson<{ pid?: number; nonce?: string }>(observed, "Lock");
        } catch {
            owner = undefined;
        }
        if (owner?.pid && owner.nonce && !processIsAlive(owner.pid)) {
            const reclaimed = `${lock}.${process.pid}.${randomUUID()}.reclaim`;
            try {
                await rename(lock, reclaimed);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
                throw error;
            }
            const claimed = await readFile(reclaimed, "utf8").catch(() => "");
            if (claimed === observed) {
                await rm(reclaimed, { force: true });
                continue;
            }
            try {
                await rename(reclaimed, lock);
            } catch {
                await rm(reclaimed, { force: true });
            }
        }
        if (Date.now() - started >= timeoutMs) {
            throw new Error("Another ghd-aoe operation is still active for this pull request");
        }
        await Bun.sleep(25);
    }
}

function processIsAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === "EPERM";
    }
}

function repositoryParts(repository: string): string[] {
    return repository.replace(/\.git$/, "").split("/");
}

function reviewReference(repository: string, prNumber: number): string {
    const parts = repositoryParts(repository);
    return `${parts.slice(-2).join("/")}#${prNumber}`;
}

function repositorySlug(repository: string): string {
    return repositoryParts(repository).at(-1) ?? repository;
}

function repositoryWithHost(
    repository: string,
    metadata: PullRequestMetadata | undefined,
    env: NodeJS.ProcessEnv,
): string {
    const normalized = repository.replace(/\.git$/, "");
    if (repositoryParts(normalized).length === 3) return normalized;
    let host = env.GH_HOST || "github.com";
    if (metadata?.url) {
        try {
            host = new URL(metadata.url).hostname;
        } catch {
            // The configured/default GitHub host keeps identity stable on an unusable URL.
        }
    }
    return /^[A-Za-z0-9.-]+$/.test(host) ? host + "/" + normalized : normalized;
}

async function resolveProfile(
    explicit: string | undefined,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<string> {
    const selected = explicit || env.AGENT_OF_EMPIRES_PROFILE;
    if (selected) {
        validateProfile(selected);
        return selected;
    }
    const result = await runner("aoe", ["profile", "default"], { env });
    if (result.exitCode !== 0) throw commandFailure("Unable to resolve AoE profile", result);
    const match = result.stdout.match(/Default profile:\s*(.+?)\s*$/m);
    if (!match?.[1]) throw new Error("Unable to resolve AoE profile from aoe output");
    validateProfile(match[1]);
    return match[1];
}

async function prepareWorktree(
    repoPath: string,
    prNumber: number,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<string> {
    const result = await runner(
        "wt",
        ["-C", repoPath, "switch", `pr:${prNumber}`, "-x", "pwd", "--", "-P"],
        { env },
    );
    if (result.exitCode !== 0) throw commandFailure("Worktree preparation failed", result);
    const outputPath = result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .at(-1);
    if (!outputPath) throw new Error("Worktree preparation failed: Worktrunk returned no path");
    return await validateDirectory(outputPath, "Worktrunk worktree");
}

async function fetchMetadata(
    repository: string,
    prNumber: number,
    repoPath: string,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<PullRequestMetadata | undefined> {
    const result = await runner(
        "gh",
        [
            "pr",
            "view",
            String(prNumber),
            "--repo",
            repository,
            "--json",
            "title,body,headRefName,url",
        ],
        { cwd: repoPath, env },
    );
    if (result.exitCode !== 0) {
        console.error("ghd-aoe: GitHub metadata unavailable; using deterministic fallback");
        return undefined;
    }
    try {
        const parsed = parseJson<Partial<PullRequestMetadata>>(result.stdout, "gh pr view");
        if (typeof parsed.title !== "string") return undefined;
        return {
            title: parsed.title,
            body: typeof parsed.body === "string" ? parsed.body : "",
            headRefName: typeof parsed.headRefName === "string" ? parsed.headRefName : "",
            url: typeof parsed.url === "string" ? parsed.url : undefined,
        };
    } catch {
        console.error("ghd-aoe: GitHub metadata was invalid; using deterministic fallback");
        return undefined;
    }
}

function aoeArgs(profile: string, ...args: string[]): string[] {
    return ["--profile", profile, ...args];
}

async function listSessions(
    profile: string,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<AoESession[]> {
    const result = await runner("aoe", aoeArgs(profile, "list", "--json"), { env });
    if (result.exitCode !== 0) throw commandFailure("Unable to list AoE sessions", result);
    const sessions = parseJson<AoESession[]>(result.stdout, "aoe list");
    if (!Array.isArray(sessions)) throw new Error("aoe list returned an incompatible JSON shape");
    return sessions;
}

async function listGroups(
    profile: string,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<string[]> {
    const result = await runner("aoe", aoeArgs(profile, "group", "list", "--json"), { env });
    if (result.exitCode !== 0) throw commandFailure("Unable to list AoE groups", result);
    const groups = parseJson<AoEGroup[]>(result.stdout, "aoe group list");
    if (!Array.isArray(groups))
        throw new Error("aoe group list returned an incompatible JSON shape");
    const paths: string[] = [];
    const visit = (entries: AoEGroup[]) => {
        for (const group of entries) {
            if (typeof group.path === "string" && group.path) paths.push(group.path);
            if (Array.isArray(group.children)) visit(group.children);
        }
    };
    visit(groups);
    return paths;
}

function comparableName(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\/_-]+/g, " ")
        .replace(/[^A-Za-z0-9 ]+/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

export function humanizeRepository(repository: string): string {
    const words = repositorySlug(repository)
        .replace(/[_.-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    return words ? words[0]!.toUpperCase() + words.slice(1) : "Repository";
}

function stripConventionalPrefix(title: string): string {
    return title.replace(
        /^\s*(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^\r\n)]*\))?!?:\s*/i,
        "",
    );
}

function isUsableEnglishLabel(value: string): boolean {
    if (!/[A-Za-z]/.test(value)) return false;
    return ![...value].some(
        (character) => /[^\x00-\x7F]/.test(character) && /\p{Letter}/u.test(character),
    );
}

export function normalizeTitle(input: string): string | undefined {
    const withoutPrefix = stripConventionalPrefix(input)
        .replace(/^\s*review\s*[-:]\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!withoutPrefix || !isUsableEnglishLabel(withoutPrefix)) return undefined;
    const words = withoutPrefix.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.slice(0, 4);
    if (!words?.length || !words.some((word) => /[A-Za-z]/.test(word))) return undefined;
    const lowered = words.join(" ").toLowerCase();
    return lowered.replace(/[a-z]/, (letter) => letter.toUpperCase());
}

export function fallbackNaming(
    repository: string,
    prNumber: number,
    groups: string[],
    metadata?: PullRequestMetadata,
): NamingChoice {
    const target = comparableName(repositorySlug(repository));
    const matches = groups.filter(
        (group) => comparableName(group.split("/").at(-1) ?? group) === target,
    );
    const group = matches.length === 1 ? matches[0]! : humanizeRepository(repository);
    const baseTitle = metadata ? normalizeTitle(metadata.title) : undefined;
    return { group, baseTitle: baseTitle ?? `Pull request ${prNumber}` };
}

function parseInferenceChoice(
    output: string,
    repository: string,
    groups: string[],
): NamingChoice | undefined {
    let candidate = output.trim();
    const fence = candidate.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
    if (fence?.[1]) candidate = fence[1].trim();
    let parsed: { group?: unknown; title?: unknown };
    try {
        parsed = JSON.parse(candidate) as { group?: unknown; title?: unknown };
    } catch {
        return undefined;
    }
    if (typeof parsed.group !== "string" || typeof parsed.title !== "string") return undefined;
    const humanized = humanizeRepository(repository);
    let group: string | undefined;
    if (groups.includes(parsed.group)) group = parsed.group;
    else if (comparableName(parsed.group) === comparableName(humanized)) group = humanized;
    const baseTitle = normalizeTitle(parsed.title);
    return group && baseTitle ? { group, baseTitle } : undefined;
}

function inferencePrompt(
    repository: string,
    groups: string[],
    metadata: PullRequestMetadata,
): string {
    const input = JSON.stringify({
        repository,
        groups,
        pullRequest: {
            title: metadata.title,
            body: metadata.body,
            headBranch: metadata.headRefName,
        },
    });
    return [
        "Choose a project group from the supplied exact group paths when one clearly matches the repository; otherwise use a natural human-readable name for the repository slug.",
        "Summarize the pull request purpose as an English title of at most four words, preferably three or four. Return only JSON with string fields group and title. Do not inspect a diff or use tools.",
        input,
    ].join("\n");
}

export async function inferNaming(options: {
    repository: string;
    groups: string[];
    metadata: PullRequestMetadata;
    cwd: string;
    env?: NodeJS.ProcessEnv;
    runner?: ProcessRunner;
    timeoutMs?: number;
}): Promise<InferenceResult> {
    const env = { ...process.env, ...options.env, MAX_THINKING_TOKENS: "0" };
    const runner = options.runner ?? runProcess;
    const claude =
        env.GHD_AOE_CLAUDE_BIN || path.join(env.HOME || homedir(), ".local", "bin", "claude");
    const args = [
        "-p",
        "--model",
        "haiku",
        "--safe-mode",
        "--tools",
        "",
        "--disable-slash-commands",
        "--no-session-persistence",
        "--permission-mode",
        "dontAsk",
        "--permission-prompts",
        "none",
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
        "--effort",
        "low",
        "--output-format",
        "text",
        inferencePrompt(options.repository, options.groups, options.metadata),
    ];
    const started = performance.now();
    const result = await runner(claude, args, {
        cwd: options.cwd,
        env,
        timeoutMs: options.timeoutMs ?? DEFAULT_INFERENCE_TIMEOUT_MS,
    });
    const durationMs = performance.now() - started;
    if (result.timedOut) {
        return { durationMs, timedOut: true, diagnostic: "Haiku naming timed out; using fallback" };
    }
    if (result.exitCode !== 0) {
        return { durationMs, timedOut: false, diagnostic: "Haiku naming failed; using fallback" };
    }
    const choice = parseInferenceChoice(result.stdout, options.repository, options.groups);
    return choice
        ? { choice, durationMs, timedOut: false }
        : {
              durationMs,
              timedOut: false,
              diagnostic: "Haiku naming output was invalid; using fallback",
          };
}

async function canonicalComparablePath(input: string): Promise<string> {
    return await realpath(input).catch(() => path.resolve(input));
}

async function sessionsAtWorktree(sessions: AoESession[], worktree: string): Promise<AoESession[]> {
    const matches: AoESession[] = [];
    for (const session of sessions) {
        if (typeof session.path !== "string") continue;
        if ((await canonicalComparablePath(session.path)) === worktree) matches.push(session);
    }
    return matches;
}

async function recoverAssociation(
    record: StateRecord,
    modality: Modality,
    sessions: AoESession[],
    worktree: string,
    legacyTitle: string,
): Promise<Association | undefined> {
    const current = record.associations[modality];
    if (current) {
        const byId = sessions.find((session) => session.id === current.id);
        if (byId && (await canonicalComparablePath(byId.path)) === worktree) {
            current.worktree = worktree;
            return current;
        }
        delete record.associations[modality];
    }

    const atWorktree = await sessionsAtWorktree(sessions, worktree);
    const pending = record.pending?.modality === modality ? record.pending : undefined;
    if (pending) {
        const matches = atWorktree.filter(
            (session) => session.title === pending.title && (session.group ?? "") === pending.group,
        );
        if (matches.length > 1) throw new Error("AoE registration recovery is ambiguous");
        if (matches.length === 1) {
            const association: Association = {
                id: matches[0]!.id,
                modality,
                worktree,
                reviewRef: pending.reviewRef,
                launchState: "registered",
            };
            record.associations[modality] = association;
            delete record.pending;
            return association;
        }
    }

    const legacy = atWorktree.filter((session) => session.title === legacyTitle);
    if (legacy.length > 1) throw new Error("Legacy AoE session recovery is ambiguous");
    if (legacy.length === 1) {
        const association: Association = {
            id: legacy[0]!.id,
            modality,
            worktree,
            launchState: "registered",
        };
        record.associations[modality] = association;
        return association;
    }
    return undefined;
}

function sessionForAssociation(sessions: AoESession[], association: Association): AoESession {
    const session = sessions.find((candidate) => candidate.id === association.id);
    if (!session) throw new Error(`AoE session disappeared during operation: ${association.id}`);
    return session;
}

async function registerSession(options: {
    profile: string;
    modality: Modality;
    worktree: string;
    title: string;
    group: string;
    reviewRef: string;
    stateFile: string;
    record: StateRecord;
    stateRoot: string;
    existingSessions: AoESession[];
    env: NodeJS.ProcessEnv;
    runner: ProcessRunner;
}): Promise<Association> {
    const existingAtWorktree = await sessionsAtWorktree(options.existingSessions, options.worktree);
    if (
        existingAtWorktree.some(
            (session) => session.title === options.title && (session.group ?? "") === options.group,
        )
    ) {
        throw new Error(
            "An unassociated AoE session already uses this title and worktree; refusing identity by display-name collision",
        );
    }
    options.record.pending = {
        modality: options.modality,
        worktree: options.worktree,
        title: options.title,
        group: options.group,
        reviewRef: options.reviewRef,
    };
    await atomicJsonWrite(options.stateFile, options.record);

    const shim =
        options.env.GHD_AOE_CLAUDE_SHIM ||
        path.join(options.env.HOME || homedir(), ".local", "bin", "shims", "claude");
    const args = aoeArgs(
        options.profile,
        "add",
        options.worktree,
        "--title",
        options.title,
        "--group",
        options.group,
        "--tool",
        "claude",
        "--cmd-override",
        shim,
    );
    if (options.modality === "review") {
        args.push("--extra-args", `/review-team ${options.reviewRef}`);
    }
    const result = await options.runner("aoe", args, { env: options.env });
    if (result.exitCode !== 0) throw commandFailure("AoE registration failed", result);

    const sessions = await listSessions(options.profile, options.env, options.runner);
    const atWorktree = await sessionsAtWorktree(sessions, options.worktree);
    const matches = atWorktree.filter(
        (session) => session.title === options.title && (session.group ?? "") === options.group,
    );
    if (matches.length !== 1) {
        throw new Error(
            matches.length > 1
                ? "AoE registration result is ambiguous"
                : "AoE registration succeeded but the new session could not be resolved",
        );
    }
    const association: Association = {
        id: matches[0]!.id,
        modality: options.modality,
        worktree: options.worktree,
        reviewRef: options.modality === "review" ? options.reviewRef : undefined,
        launchState: "registered",
    };
    options.record.associations[options.modality] = association;
    delete options.record.pending;
    await atomicJsonWrite(options.stateFile, options.record);
    return association;
}

async function showSession(
    profile: string,
    id: string,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<SessionDetail> {
    const result = await runner("aoe", aoeArgs(profile, "session", "show", id, "--json"), { env });
    if (result.exitCode !== 0) throw commandFailure("Unable to inspect AoE session", result);
    return parseJson<SessionDetail>(result.stdout, "aoe session show");
}

async function runningSessionIds(
    profile: string,
    env: NodeJS.ProcessEnv,
    runner: ProcessRunner,
): Promise<Set<string>> {
    const result = await runner("aoe", aoeArgs(profile, "ps", "--json"), { env });
    if (result.exitCode !== 0) throw commandFailure("Unable to inspect AoE processes", result);
    const rows = parseJson<Array<{ session?: string }>>(result.stdout, "aoe ps");
    if (!Array.isArray(rows)) throw new Error("aoe ps returned an incompatible JSON shape");
    return new Set(
        rows.map((row) => row.session).filter((id): id is string => typeof id === "string"),
    );
}

async function writeReviewMarker(
    root: string,
    profile: string,
    association: Association,
): Promise<void> {
    await atomicJsonWrite(getReviewMarkerPath(root, association.id), {
        version: 1,
        profile,
        instanceId: association.id,
        worktree: association.worktree,
        reviewRef: association.reviewRef,
        launchState: association.launchState ?? "registered",
        conversationId: association.conversationId,
    });
}

async function manageReview(options: {
    profile: string;
    association: Association;
    stateFile: string;
    record: StateRecord;
    stateRoot: string;
    env: NodeJS.ProcessEnv;
    runner: ProcessRunner;
}): Promise<"running" | "started" | "resumed"> {
    const detail = await showSession(
        options.profile,
        options.association.id,
        options.env,
        options.runner,
    );
    const running = await runningSessionIds(options.profile, options.env, options.runner);
    const conversation =
        typeof detail.agent_session_id === "string" && detail.agent_session_id
            ? detail.agent_session_id
            : undefined;
    const wasStarted = options.association.launchState === "started";

    if (conversation) {
        options.association.conversationId = conversation;
        options.association.launchState = "started";
    }
    if (running.has(options.association.id)) {
        options.association.launchState = "started";
        await atomicJsonWrite(options.stateFile, options.record);
        await writeReviewMarker(options.stateRoot, options.profile, options.association);
        return "running";
    }
    if (wasStarted && !conversation) {
        await writeReviewMarker(options.stateRoot, options.profile, options.association);
        throw new Error(
            `Cannot resume review ${options.association.id}: its recorded conversation is missing; refusing a fresh replacement`,
        );
    }

    await atomicJsonWrite(options.stateFile, options.record);
    await writeReviewMarker(options.stateRoot, options.profile, options.association);
    const result = await options.runner(
        "aoe",
        aoeArgs(options.profile, "session", "start", options.association.id),
        { env: options.env },
    );
    if (result.exitCode !== 0) throw commandFailure("AoE review launch failed", result);

    options.association.launchState = "started";
    const after = await showSession(
        options.profile,
        options.association.id,
        options.env,
        options.runner,
    );
    if (typeof after.agent_session_id === "string" && after.agent_session_id) {
        options.association.conversationId = after.agent_session_id;
    }
    await atomicJsonWrite(options.stateFile, options.record);
    await writeReviewMarker(options.stateRoot, options.profile, options.association);
    return conversation ? "resumed" : "started";
}

export async function runIntegration(
    cli: CliOptions,
    options: { env?: NodeJS.ProcessEnv; runner?: ProcessRunner } = {},
): Promise<IntegrationResult> {
    const env = { ...process.env, ...options.env };
    const runner = options.runner ?? runProcess;
    const repoPath = await validateDirectory(cli.repoPath, "repository path");
    const profile = await resolveProfile(cli.profile, env, runner);
    const worktree = await prepareWorktree(repoPath, cli.prNumber, env, runner);
    const metadata = await fetchMetadata(cli.repository, cli.prNumber, repoPath, env, runner);
    const repository = repositoryWithHost(cli.repository, metadata, env);
    const root = stateRoot(env);
    const key = identityHash(profile, repository, cli.prNumber);
    const release = await acquireLock(root, key);

    try {
        const stateFile = getRecordPath(root, profile, repository, cli.prNumber);
        const record =
            (await loadRecord(stateFile)) ??
            ({
                version: 1,
                identity: { profile, repository, prNumber: cli.prNumber },
                associations: {},
            } satisfies StateRecord);
        if (
            record.identity.profile !== profile ||
            record.identity.repository.toLowerCase() !== repository.toLowerCase() ||
            record.identity.prNumber !== cli.prNumber
        ) {
            throw new Error("Stored ghd-aoe identity does not match the requested pull request");
        }

        let sessions = await listSessions(profile, env, runner);
        const legacyPrefix = cli.modality === "review" ? "review" : "pr";
        let association = await recoverAssociation(
            record,
            cli.modality,
            sessions,
            worktree,
            `${legacyPrefix} ${reviewReference(repository, cli.prNumber)}`,
        );
        let created = false;

        if (!association) {
            if (!record.naming) {
                const groups = await listGroups(profile, env, runner);
                if (metadata) {
                    const inference = await inferNaming({
                        repository,
                        groups,
                        metadata,
                        cwd: worktree,
                        env,
                        runner,
                    });
                    if (inference.diagnostic) console.error(`ghd-aoe: ${inference.diagnostic}`);
                    record.naming =
                        inference.choice ??
                        fallbackNaming(repository, cli.prNumber, groups, metadata);
                } else {
                    record.naming = fallbackNaming(repository, cli.prNumber, groups);
                }
                await atomicJsonWrite(stateFile, record);
            }
            const ref = reviewReference(repository, cli.prNumber);
            const title =
                cli.modality === "review"
                    ? `Review - ${record.naming.baseTitle}`
                    : record.naming.baseTitle;
            association = await registerSession({
                profile,
                modality: cli.modality,
                worktree,
                title,
                group: record.naming.group,
                reviewRef: ref,
                stateFile,
                record,
                stateRoot: root,
                existingSessions: sessions,
                env,
                runner,
            });
            created = true;
            sessions = await listSessions(profile, env, runner);
        } else {
            await atomicJsonWrite(stateFile, record);
        }

        const session = sessionForAssociation(sessions, association);
        if (cli.modality === "normal") {
            return {
                id: association.id,
                created,
                action: "queued",
                title: session.title,
                group: session.group ?? "",
            };
        }

        association.reviewRef ??= reviewReference(repository, cli.prNumber);
        const action = await manageReview({
            profile,
            association,
            stateFile,
            record,
            stateRoot: root,
            env,
            runner,
        });
        return {
            id: association.id,
            created,
            action,
            title: session.title,
            group: session.group ?? "",
        };
    } finally {
        await release();
    }
}

export async function cliMain(args = process.argv.slice(2)): Promise<number> {
    if (args.includes("--help") || args.includes("-h")) {
        console.log(usage());
        return 0;
    }
    try {
        const result = await runIntegration(parseCliArgs(args));
        console.log(`${result.id}\t${result.action}\t${result.group}/${result.title}`);
        return 0;
    } catch (error) {
        console.error(`ghd-aoe: ${(error as Error).message}`);
        return 1;
    }
}
