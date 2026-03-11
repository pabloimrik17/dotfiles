## Context

`dot_tmux.conf` currently has 2 settings (mouse, default-terminal). The machine's live config also has `focus-events on`, which isn't tracked in the repo. This is a single-line addition with a comment.

## Goals / Non-Goals

**Goals:**

- Add `focus-events on` so tmux forwards focus events to inner applications
- Add descriptive comment matching existing style
- Group settings logically

**Non-Goals:**

- Tmux plugin management or further config expansion
- Keybinding customization
- Status bar configuration

## Decisions

**Comment style**: Match existing pattern — comment line above the setting explaining what it does and why.

**Setting placement**: After `default-terminal`, with a blank line separator. Group as: terminal settings (default-terminal) then interaction settings (mouse, focus-events). However, since mouse was first historically and the file is tiny, append focus-events at the end to minimize diff noise.

**Grouping**: With only 3 settings, explicit section headers are overkill. Rely on comments + blank lines for logical separation.

## Risks / Trade-offs

No meaningful risks. `focus-events on` is passive — it only forwards events that applications opt into consuming. No change to existing mouse or terminal behavior.
