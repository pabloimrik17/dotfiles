# Dotfiles

Reproducible macOS/Linux workstation setup managed with chezmoi.

## Language

### Machines

**Machine type**:
The immutable role a Mac is given at `chezmoi init`: `personal` or `work`.
_Avoid_: machine role, profile

### Claude accounts

**Account**:
A Claude subscription identity enrolled in claude-swap under a native alias.
_Avoid_: login, profile, slot

**Active account**:
The account whose credential Claude Code uses globally right now.
_Avoid_: current login, default account

**Required account**:
An account the setup demands for the machine type; setup is incomplete without it.
_Avoid_: mandatory account, core account

**Optional account**:
An enrolled account the setup never demands; it may be unusable for months without making setup incomplete. `personal2` is the only one.
_Avoid_: secondary account, extra account, seasonal account

**Rotation**:
The accounts autoswitch may choose as a target.
_Avoid_: pool, eligible set

**Held out of rotation**:
Enrolled, but excluded from rotation until re-enabled.
_Avoid_: paused, deactivated, removed

**Priority tier**:
An account's rank for autoswitch; the engine uses the highest tier that is below its switch lines.
_Avoid_: priority order, rank

**Wall**:
The state where the active account is exhausted and no other account is below its switch lines, so Claude Code on the personal Mac stops.
_Avoid_: blocked, outage

**Reserve**:
The part of an account's quota kept for a consumer other than Claude Code on the personal Mac: the work Mac for `work`, the Claude app for `personal`.
_Avoid_: buffer, margin

**Surplus**:
The part of `work`'s weekly quota the work Mac will not need before the weekly reset; the only part the personal Mac should spend.
_Avoid_: leftover, spare quota

**Switch line**:
The utilization at which autoswitch leaves the active account and above which no account is a proactive target. Each account has one line, applied to both its 5-hour and 7-day windows.
_Avoid_: threshold (alone), limit
