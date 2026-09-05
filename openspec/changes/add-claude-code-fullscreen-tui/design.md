## Context

See `proposal.md` for motivation. `dot_claude/modify_settings.json.tmpl` merges an explicit `MANAGED` document into the live user settings. The root is already merged key by key; an ordinary scalar requires no change to the merge engine. The template currently has no `tui` entry or renderer environment override.

The installed Claude Code reports version `2.1.261`. The official [fullscreen guide](https://code.claude.com/docs/en/fullscreen) documents the persistent `tui` preference and `/tui` controls. Existing `dot_tmux.conf` already enables `set -g mouse on`. Section 11 of the manual starts with plugin commands and has no fullscreen subsection. A short design is useful to resolve ownership, rollback, and documentation before implementation.

## Goals / Non-Goals

**Goals:** Keep renderer selection in the existing user-settings ownership model, retain merge convergence, and make the interaction between runtime switching and managed settings clear.

**Non-Goals:** Implement a renderer, tune mouse or scroll behavior, force unsupported terminals into fullscreen, manage another agent's preferences, or maximize terminal windows. Runtime application is a separate rollout step from preparing the source changes.

## Decisions

### 1. Manage the native scalar preference

Add `"tui": "fullscreen"` after `statusLine` and before `voiceEnabled` in the `MANAGED` JSON. This follows the source's existing organization without imposing output ordering. Keep `MERGE_CONTAINERS`, `REMOVE`, and the overlay logic unchanged: root scalar replacement already covers missing and divergent values.

An environment variable in `env` or a shell wrapper would add another configuration surface. The native setting expresses the user's requested preference directly and retains Claude Code's normal compatibility and failed-start fallback behavior. A one-time `/tui fullscreen` command alone would leave new machines dependent on runtime state.

### 2. Keep ownership explicit when switching back

`/tui default` saves a different live preference. The next successful chezmoi merge restores the managed value. The manual must teach this consequence alongside the command.

For a directly launched interactive session, `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1 claude` provides a temporary override. The [environment-variable reference](https://code.claude.com/docs/en/env-vars) documents this switch. A durable managed opt-out changes the source to `"tui": "default"` and applies it. Simply deleting the managed key is not a rollback: the current merge preserves unmanaged live keys, including a previously applied fullscreen value.

### 3. Add a focused manual subsection

Insert this proposed HTML at the start of Section 11's `.section-content`, before `Slash commands (from plugins)`, using the surrounding indentation. The commands are built into Claude Code. This is the concrete documentation change for the implementation phase; the manual itself is not edited by this planning change.

```html
<h3>Fullscreen TUI</h3>
<p>
    Chezmoi sets <code>"tui": "fullscreen"</code> in
    <code>~/.claude/settings.json</code>. This research preview uses the terminal's
    alternate screen; it does not maximize the window.
</p>
<table>
    <thead>
        <tr>
            <th>Command / shortcut</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>/tui</code></td>
            <td>Show the active renderer</td>
        </tr>
        <tr>
            <td><code>/tui fullscreen</code></td>
            <td>Switch to fullscreen rendering</td>
        </tr>
        <tr>
            <td><code>/tui default</code></td>
            <td>Switch to classic rendering; the next chezmoi apply restores fullscreen</td>
        </tr>
        <tr>
            <td><kbd>Ctrl</kbd>+<kbd>o</kbd>, then <kbd>/</kbd></td>
            <td>Search the transcript; native terminal scrollback search cannot see it</td>
        </tr>
        <tr>
            <td><kbd>PgUp</kbd> / <kbd>PgDn</kbd></td>
            <td>Scroll the conversation</td>
        </tr>
        <tr>
            <td><code>CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1 claude</code></td>
            <td>Use classic rendering for one directly launched interactive session</td>
        </tr>
    </tbody>
</table>
<p>
    For a persistent managed opt-out, change <code>tui</code> to
    <code>"default"</code> in <code>dot_claude/modify_settings.json.tmpl</code>
    and apply it. Ordinary tmux sessions need mouse mode for wheel scrolling
    (already enabled by these dotfiles); fullscreen is incompatible with
    <code>tmux -CC</code>. See the
    <a href="https://code.claude.com/docs/en/fullscreen">official fullscreen guide</a>
    for compatibility and selection controls.
</p>
```

The existing README description, “AI coding assistant CLI with plugins,” remains accurate. No package, installation step, or README tool inventory changes are needed.

### 4. Record renderer parity without creating additional managed config

The parity comparison concerns availability of an interactive terminal renderer, with differences in preference ownership explicitly recorded. It does not promise identical rendering behavior across tools.

| Target tool | Parity status | Target surface | Concrete action |
| --- | --- | --- | --- |
| Claude Code | Proposed change | `dot_claude/modify_settings.json.tmpl`, top-level `MANAGED.tui` | Add `"tui": "fullscreen"`. |
| Codex | Already satisfied for ordinary supported terminal launches | Existing native TUI; runtime-owned `~/.codex/config.toml` supports `tui.alternate_screen` | None. Retain upstream `auto` behavior and its terminal exceptions. |
| OpenCode | Already satisfied by the default interactive interface | Native `opencode` TUI | None. Retain the existing TUI configuration. |
| Junie | Capability gap for an equivalent documented persistent renderer selector | `none` for a `tui`-style setting; Junie still provides a native interactive CLI | None. Record that the reviewed reference does not establish an equivalent managed setting. |

Evidence checked on 2026-09-05:

- [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference): `tui.alternate_screen` accepts `auto`, `always`, and `never`; `auto` is the default and skips alternate screen in Zellij. No `alternate_screen` override was found in this machine's user config. The [CLI reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli) and local `codex --help` document the `--no-alt-screen` opt-out.
- [OpenCode CLI reference](https://opencode.ai/docs/cli/): starting `opencode` without arguments opens its TUI. The repository already manages its TUI theme.
- [Junie reference](https://junie.jetbrains.com/docs/slash-commands.html) and [quickstart](https://junie.jetbrains.com/docs/junie-cli.html): interactive CLI and `/settings` are supported, but no equivalent persistent fullscreen/classic selector is documented there. This is a documentation-based gap for the setting, not a claim that Junie lacks a terminal interface.

Append the following mapping to `.agents/skills/sync-agent-config/parity.md` during implementation, retaining existing rows:

```markdown
| Fullscreen terminal renderer | Managed `tui: "fullscreen"` in user settings | Native TUI; runtime-owned `tui.alternate_screen` defaults to `auto` | Native TUI via `opencode` | none | Codex preserves its upstream terminal exceptions; OpenCode already launches its TUI. Junie has an interactive CLI, but the reviewed official reference does not document an equivalent persistent renderer selector. No other agent config changes. Sources: Claude fullscreen guide, Codex configuration reference, OpenCode CLI reference, Junie CLI reference; checked 2026-09-05. |
```

### 5. Verify through isolated rendering and a small runtime smoke check

Use the actual rendered modify script with temporary fixture files. Cover empty input, an existing `"tui": "default"` plus an unmanaged preference, and a second merge of already-converged output. Check valid JSON, the managed scalar, preservation of the unmanaged value, and byte-identical repeated output. Render representative macOS arm64 and Linux host contexts; `tui` must be unconditional. These are focused execution checks; this scalar addition does not need a new test framework or merge-engine rewrite.

Run the repository formatter check and strict OpenSpec validation. Inspect the manual subsection and its existing search filter. On rollout, inspect `/tui` in a directly launched supported terminal and an ordinary tmux session. Record runtime checks separately from fixture results; terminal support cannot be proven by parsing JSON.

## Risks / Trade-offs

- Upstream renderer remains a research preview → Retain upstream compatibility/recovery behavior and document the launch-specific opt-out.
- A runtime choice is overwritten by chezmoi → Explain source ownership beside `/tui default`, and use an explicit `"default"` source value for durable rollback.
- Fullscreen changes scrollback and selection behavior → Include transcript search/navigation and the upstream guide in the manual.
- Another writer modifies unrelated settings → Keep the existing merge contract and verify preservation and convergence with the rendered script.

## Migration Plan

1. Implement the source scalar and the manual/parity updates described above.
2. Complete isolated rendering, formatting, and spec validation before touching the live settings.
3. When rolling out to the machine, apply only the Claude Code user-settings target from this worktree and launch a fresh interactive session to inspect `/tui`. Existing conversations need a supported renderer switch or a restart to select the changed preference.
4. Roll back by setting the managed value to `"default"`, applying the settings target, and restarting or switching the renderer. If ending management entirely, first materialize `"default"`, then remove the managed entry.
