# Spec Delta

## MODIFIED Requirements

### Requirement: Session identity is independent of its display name

The integration SHALL identify a PR by AoE profile, full repository identity and PR number, and SHALL distinguish normal and review modalities within that identity. Repeating a modality SHALL reuse its existing AoE session ID and preserve its title and conversation. The two modalities SHALL have independent session IDs and conversations even when sharing a worktree. A selected session reported as trashed or archived SHALL be restored to live state through AoE's CLI before reporting normal-mode success or handling the review lifecycle, preserving its current title, group and conversation. When lifecycle state is absent, the integration SHALL retain its existing reuse behavior without issuing restoration commands.

#### Scenario: Repeated normal shortcut

- **WHEN** the user repeats `f` for a PR with an existing normal session
- **THEN** the same session ID and title are retained
- **AND** no additional session, inference request or agent launch occurs

#### Scenario: Both modalities exist

- **WHEN** normal and review sessions are created for the same PR
- **THEN** they use different session IDs and independent conversations
- **AND** repeating either shortcut selects only its corresponding modality

#### Scenario: Similar names do not identify sessions

- **WHEN** another PR, repository or AoE profile has a session with the same display title
- **THEN** that session is not reused for the selected PR

#### Scenario: Reuse a trashed normal session

- **WHEN** the user presses `f` and the selected normal session is reported as `trashed`
- **THEN** the integration restores that session in its selected AoE profile before returning `queued`
- **AND** the session is live with the same ID, current title, group and conversation
- **AND** no new session, naming inference or agent launch occurs

#### Scenario: Reuse an archived normal session

- **WHEN** the user presses `f` and the selected normal session is reported as `archived`
- **THEN** the integration unarchives that session in its selected AoE profile before returning `queued`
- **AND** the session is live with the same ID, current title, group and conversation
- **AND** no new session, naming inference or agent launch occurs

#### Scenario: Restore a session that was archived before being trashed

- **WHEN** the selected session is trashed and restoring it returns it to archived state
- **THEN** the integration also unarchives that same session within the invocation
- **AND** normal-mode success or review lifecycle handling occurs only after it becomes live

#### Scenario: Restore before resuming a review

- **WHEN** the user presses `F` for a stopped review with an existing conversation and its session is trashed or archived
- **THEN** the session becomes live before the review is started
- **AND** the same session ID resumes its own explicit conversation without another initial `/review-team` submission

#### Scenario: Live session needs no restoration

- **WHEN** the selected session is reported as `live`
- **THEN** the integration issues neither restore nor unarchive
- **AND** normal queuing and the existing review start, running and resume behavior remain unchanged

#### Scenario: Older list output omits lifecycle state

- **WHEN** AoE's list output omits the selected session's lifecycle state
- **THEN** the integration retains the existing reuse behavior without restore or unarchive commands
- **AND** the missing field does not cause an incompatible-output error

### Requirement: External associations survive reuse and concurrent invocations

PR/session associations SHALL persist across helper invocations without directly editing AoE's internal session database. Session lifecycle changes SHALL use AoE's CLI. Stored session IDs SHALL be checked against the selected profile before reuse. Concurrent invocations for one PR SHALL converge on one naming choice and at most one session per modality. An interrupted creation SHALL be recoverable without adopting an unrelated session. Restoration SHALL apply to any unambiguously selected session, including pending and legacy recovery, without changing candidate selection or ambiguity rules.

#### Scenario: Simultaneous invocations

- **WHEN** two invocations request the same PR and modality concurrently
- **THEN** both resolve to the same AoE session
- **AND** at most one new naming inference and one registration occur

#### Scenario: Stale association

- **WHEN** a stored session ID no longer exists in the selected profile
- **THEN** it is not used to start a different session
- **AND** the integration checks for an unambiguous recoverable session before registering a replacement

#### Scenario: Recover an old shortcut session

- **WHEN** exactly one session matches the selected worktree and the old `pr owner/repo#N` or `review owner/repo#N` title for the requested modality
- **THEN** its existing ID is associated with that modality
- **AND** its title, group and conversation are retained

#### Scenario: Recovery is ambiguous

- **WHEN** multiple existing sessions satisfy the same recovery identity
- **THEN** the integration reports the ambiguity without starting an arbitrary session or registering another duplicate

#### Scenario: Recover a hidden session after interrupted registration

- **WHEN** exactly one session matches a pending registration and is reported as trashed or archived
- **THEN** its ID is associated with the requested modality and it becomes live before queuing or review lifecycle handling
- **AND** no replacement session is registered

#### Scenario: Recover a hidden legacy session

- **WHEN** exactly one legacy shortcut session matches the worktree and modality and is reported as trashed or archived
- **THEN** its ID is associated with the requested modality and it becomes live before queuing or review lifecycle handling
- **AND** its current display metadata and conversation are retained

### Requirement: Metadata and model output remain data

PR text, generated names, group names and filesystem paths SHALL be passed to external commands as data, without evaluating them as shell code. The integration SHALL not embed the PR's free-text title or description into gh-dash's rendered command. Worktrunk or AoE failures SHALL be reported without claiming that the requested session was successfully created, queued or resumed. A restoration failure SHALL stop the invocation with a nonzero exit status and no success output, preserve the association for retry, and prevent review launch or replacement registration during that invocation.

#### Scenario: Shell syntax in PR metadata

- **WHEN** a PR title contains quotes, command substitution syntax or newlines
- **THEN** those characters do not execute commands or alter command arguments
- **AND** the resulting session name is normalized or replaced by fallback

#### Scenario: Worktree preparation fails

- **WHEN** Worktrunk cannot resolve or prepare the selected PR worktree
- **THEN** no new AoE session is registered for that attempt
- **AND** the failure is reported as worktree preparation failure

#### Scenario: AoE cannot start a registered review

- **WHEN** registration succeeds but AoE cannot start the review
- **THEN** the association remains available for a later retry
- **AND** the invocation reports the launch failure

#### Scenario: Restore or unarchive fails

- **WHEN** restoring or unarchiving a selected session fails in either modality
- **THEN** the invocation exits unsuccessfully, identifies the failed operation on stderr and emits no success record on stdout
- **AND** no review is launched and no replacement session is registered
- **AND** the association remains available so a later invocation can retry the same ID

#### Scenario: Session remains hidden after a successful lifecycle command

- **WHEN** AoE reports command success but the subsequent session listing still reports a non-live state after the required restore and unarchive operations
- **THEN** the integration reports a restoration failure without success output or review launch
- **AND** it does not repeatedly retry lifecycle commands within that invocation
