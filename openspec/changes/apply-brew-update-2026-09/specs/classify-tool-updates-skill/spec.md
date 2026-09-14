## MODIFIED Requirements

### Requirement: Four-way update classification

The skill SHALL classify each new tool into exactly one of four classes and prescribe the matching action:

1. **brew-managed** → read the changelog for the version range and propose any adoption it warrants;
   the upgrade itself is applied per package, never by a bulk `brew upgrade`
2. **self-updating** → no action (do not wrap or duplicate the self-updater)
3. **repo-pinned** (Renovate-managed pins, version-pinned installers) → update via pin bump + `chezmoi apply`, never via `update-extra`
4. **manual** (none of the above) → add a step to `update-extra`

The brew-managed class previously prescribed **no action**, on the stated grounds that
`brew upgrade` covers it. That instruction is withdrawn for two reasons. It told readers not to look
at brew changelogs at all, which is the mechanical cause of a backlog that reached 26 outdated
packages carrying unadopted improvements. And shell history records no bulk upgrade (`brew upgrade`
or `bubu`) between 2026-05-01 and 2026-09-08. "Covered by an upgrade that skips four months" is not
coverage.

A brew-managed classification SHALL NOT be treated as an exemption from changelog review. Where the
changelog shows a behavior change, a removed flag, or a new key that interacts with a
chezmoi-managed file, that finding is the output of the classification, not a reason to skip it.

The class SHALL also account for two outcomes a bulk upgrade cannot express: a package whose new
version is wrong for this repo and must be held back, and a package whose upgrade cost depends on
the host architecture.

#### Scenario: Brew formula added

- **WHEN** the new tool is installed via brew formula or cask
- **THEN** the skill classifies it brew-managed and proposes no `update-extra` change

#### Scenario: Brew-managed does not skip changelog review

- **WHEN** a brew-managed tool has a newer version available
- **THEN** the skill reviews the changelog for the range and reports any adoption, removal, or
  behavior change that affects a chezmoi-managed file, rather than reporting no action

#### Scenario: A version that should not be adopted is reported as such

- **WHEN** a brew-managed tool's newer version is unsuitable for this repo
- **THEN** the skill proposes a declared hold with a reason and an exit condition, rather than
  treating the upgrade as automatic

#### Scenario: Self-updating tool added

- **WHEN** the new tool ships its own updater (e.g. installed via official curl installer that self-updates)
- **THEN** the skill classifies it self-updating and proposes no `update-extra` change

#### Scenario: Pinned tool added

- **WHEN** the new tool is installed at a version pinned in the repo (Renovate-managed or hardcoded tag)
- **THEN** the skill classifies it repo-pinned and points to the pin-bump + `chezmoi apply` path

#### Scenario: Manual tool added

- **WHEN** the new tool is neither brew-managed, self-updating, nor repo-pinned
- **THEN** the skill classifies it manual and proposes its update command as a new `update-extra` step
