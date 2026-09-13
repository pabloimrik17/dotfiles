## Purpose

Create and reuse AoE sessions for GitHub pull requests with project-based grouping, concise English names and predictable queue or review behavior from gh-dash.

## ADDED Requirements

### Requirement: Session identity is independent of its display name

The integration SHALL identify a PR by AoE profile, full repository identity and PR number, and SHALL distinguish normal and review modalities within that identity. Repeating a modality SHALL reuse its existing AoE session ID and preserve its title and conversation. The two modalities SHALL have independent session IDs and conversations even when sharing a worktree.

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

### Requirement: Group and base title are shared when creating the two modalities

The first generated or fallback group and base-title choice for a PR SHALL be reused when creating its other modality, without another inference request. Existing sessions, including their manual title or group changes, SHALL NOT be renamed or moved merely because a shortcut is repeated. Generated-title rules SHALL apply to newly named sessions; recovered legacy sessions SHALL retain their current display metadata.

#### Scenario: Normal session precedes review

- **WHEN** a normal session was created as `Fix login redirect` in `Dotfiles` and the user creates its review session
- **THEN** the review is created as `Review - Fix login redirect` in `Dotfiles`
- **AND** the existing naming choice is reused without calling Haiku

#### Scenario: Review precedes normal session

- **WHEN** a review was created as `Review - Fix login redirect` in `Dotfiles` and the user creates its normal session
- **THEN** the normal session is created as `Fix login redirect` in `Dotfiles`
- **AND** the existing naming choice is reused without calling Haiku

#### Scenario: Reuse preserves a manual change

- **WHEN** the user renamed or moved an existing session after its creation and repeats its shortcut
- **THEN** the session keeps its current title and group

### Requirement: Haiku selects a project group and a concise English title together

For a PR with no reusable naming choice, the integration SHALL request both group and base title together from Haiku using the existing Claude Code authentication. It SHALL supply the full repository name, current AoE groups, PR title, description and head branch. Group selection SHALL be based on the repository; title generation SHALL summarize the PR's purpose. The inference SHALL NOT read the diff, invoke tools, inherit project instructions or start a review.

#### Scenario: Existing project group

- **WHEN** repository `owner/dotfiles` has no prior naming choice and AoE contains a fitting `Dotfiles` group
- **THEN** Haiku selects the existing group using its exact path and spelling
- **AND** the same request produces the base title from PR metadata

#### Scenario: No existing group fits

- **WHEN** repository `owner/my-cool-project` has no clearly fitting group
- **THEN** the new session uses a group named naturally from the repository, such as `My cool project`
- **AND** the name replaces repository hyphens with spaces instead of forcing a weak existing-group match

### Requirement: New session titles obey the agreed display format

New base titles SHALL be in English and contain at most four words, with three or four preferred when needed to identify the work. The first letter SHALL be uppercase and subsequent letters lowercase, including acronyms. A normal session SHALL use the base title alone; a review SHALL prepend exactly `Review - `, which does not count toward the word limit. The integration SHALL enforce these constraints locally on model output and deterministic fallbacks.

#### Scenario: Normal and review title formatting

- **WHEN** the chosen base title is `fix API login redirect`
- **THEN** the normal title is `Fix api login redirect`
- **AND** the review title is `Review - Fix api login redirect`

#### Scenario: Model returns more than four words

- **WHEN** Haiku returns `Add tuicr code review tool`
- **THEN** local normalization produces a valid title of at most four words, such as `Add tuicr code review`
- **AND** the excessive word count is never passed through to a new session title

### Requirement: Inference has a ten-second budget and deterministic fallback

The integration SHALL stop waiting for inference at ten seconds, including Claude CLI startup, and SHALL continue through deterministic fallback on timeout, unavailable authentication, model failure or unusable output. It SHALL NOT retry inference within that invocation. GitHub metadata retrieval and Worktrunk preparation SHALL be outside this inference budget and SHALL have their failures reported distinctly.

Fallback grouping SHALL select a unique existing group whose name clearly matches the repository after case and separator normalization; otherwise it SHALL humanize the repository name. The fallback base title SHALL take up to four usable words from the PR title after removing a Conventional Commits prefix, or use `Pull request N` when no usable English title is available. It SHALL use the generic English fallback rather than requiring another model request to translate an unusable source title.

#### Scenario: Inference exceeds its budget

- **WHEN** Haiku has not returned a usable response within ten seconds
- **THEN** the inference process is cancelled and the invocation proceeds with fallback
- **AND** cleanup does not introduce an additional fixed wait beyond that deadline

#### Scenario: Malformed output or unavailable Claude

- **WHEN** the output cannot be parsed and validated, or the Claude CLI cannot complete inference
- **THEN** a brief diagnostic is shown and the session is still registered or started with fallback metadata

#### Scenario: Repository matches an existing group without inference

- **WHEN** fallback is needed for `owner/daily-agentic-task-force` and a unique `Daily agentic task force` group exists
- **THEN** that existing group is reused

#### Scenario: PR metadata is unavailable

- **WHEN** the PR title cannot be retrieved but Worktrunk successfully resolves PR 123
- **THEN** the base title is `Pull request 123`
- **AND** review mode uses `Review - Pull request 123`

#### Scenario: Available title is not a usable English label

- **WHEN** inference fails for PR 123 and its source title cannot be used as an English label
- **THEN** the base title is `Pull request 123`
- **AND** no translation request is made

### Requirement: External associations survive reuse and concurrent invocations

PR/session associations SHALL persist across helper invocations without modifying AoE's internal session database. Stored session IDs SHALL be checked against the selected profile before reuse. Concurrent invocations for one PR SHALL converge on one naming choice and at most one session per modality. An interrupted creation SHALL be recoverable without adopting an unrelated session.

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

### Requirement: Reviews start once and resume their own conversation

A newly registered review SHALL start in the background with `/review-team owner/repo#N`. Repeating `F` for a running review SHALL leave its process and conversation unchanged. Repeating it for a stopped review SHALL resume that review's explicit conversation without resending the initial review command. A registered review that has never started SHALL still receive its initial command on its first launch.

#### Scenario: Register and start a new review

- **WHEN** the user presses `F` and no review session exists for the PR
- **THEN** a review session is registered and started in the background
- **AND** its initial instruction identifies the selected repository and PR

#### Scenario: Existing stopped review

- **WHEN** the user presses `F` for a stopped review with an existing conversation
- **THEN** that session ID is started using that conversation's explicit resume target
- **AND** `/review-team` is not submitted again

#### Scenario: Existing running review

- **WHEN** the user presses `F` for a review whose process already exists
- **THEN** no restart or additional review instruction occurs

#### Scenario: Required conversation is missing

- **WHEN** a previously started review is expected to resume but its conversation can no longer be found
- **THEN** the integration reports failed resumption
- **AND** it does not silently start a fresh review or select another conversation from the shared worktree

### Requirement: Metadata and model output remain data

PR text, generated names, group names and filesystem paths SHALL be passed to external commands as data, without evaluating them as shell code. The integration SHALL not embed the PR's free-text title or description into gh-dash's rendered command. Worktrunk or AoE failures SHALL be reported without claiming that the requested session was successfully created or resumed.

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
