# Tasks

## 1. NVM group without corepack

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl` Group 6, drop corepack from the header, the pre-scan, the prompt text and the enable step, so the group counts NVM and Node (`2/2`). Verify with a new `tests/install-script.test.ts` case that slices Group 6 with `nvm` and `node` stubbed: it prints `NVM/Node: 2/2 installed` without prompting, and the rendered Group 6 contains no `corepack`.

## 2. pnpm from the official installer

- [x] 2.1 Add a pnpm group right after Group 6. Declare `12.23.0`, check `[ -x "$PNPM_HOME/bin/pnpm" ]`, and on confirm download `https://get.pnpm.io/install.sh` to a `mktemp` file. Run it with `PNPM_VERSION`, `PNPM_HOME=$HOME/Library/pnpm` and `PNPM_NO_MODIFY_PATH=1`, then remove the file. Log the version when pnpm is already present. Verify with test cases that stub `curl` and `sh`:
    - a clean run invokes the installer with all three variables;
    - a decline downloads nothing;
    - a present install does not prompt;
    - a shim on `PATH` alone counts as pending;
    - a failed download or install logs an error and leaves no temp file.
- [x] 2.2 Add pnpm with `curl -fsSL https://get.pnpm.io/install.sh | sh -` to the non-macOS official-installer instructions. Verify that the linux render's output contains that line.
- [x] 2.3 In the pnpm block of `dot_zshrc.tmpl`, add `$PNPM_HOME/bin` before `$PNPM_HOME`, each guarded against duplicates. Verify with `chezmoi execute-template` plus zsh: source the block twice, then check that each entry appears once and that `$PNPM_HOME/bin` comes first.
- [x] 2.4 Update the Node/pnpm docs with the `update-manual` and `update-readme` skills. Cover where pnpm comes from, running `pnpm self-update` outside a project, that yarn is gone, and that `corepack enable` brings a shim back. Verify that `docs/manual.html` and README mention no corepack-provided pnpm.

## 3. Corepack shim retirement

- [x] 3.1 After the pnpm group, add a step that is never prompted and removes `$NVM_DIR/versions/node/*/bin/{pnpm,pnpx,yarn,yarnpkg}`. It only removes symlinks whose target contains `corepack/dist/`, only when `$PNPM_HOME/bin/pnpm` is executable, and logs each removal. Verify with test cases on a temp `NVM_DIR`:
    - corepack links are removed and logged, while `corepack`, `node`, `npm` and `npx` stay;
    - a pnpm link that does not point into corepack stays;
    - with no standalone pnpm, nothing is removed;
    - with no `versions/node` directory, the step prints nothing and exits 0.

## 4. Integration

- [x] 4.1 Run `bun test`, the repo's lint/format checks and `openspec validate pnpm-without-corepack --strict`; all pass, and both renders pass `bash -n`.
- [ ] 4.2 After merge, run `chezmoi update` on this Mac. Check the following, and record the output in the beads ticket:
    - the run installs pnpm, retires v24.18.0's shims and reports NVM/Node `2/2`;
    - in a new shell, `command -v pnpm` resolves to `~/Library/pnpm/bin/pnpm`;
    - `pnpm --version` in kinkoi-project (Node 20.12.2) prints `9.0.6`, and in monolab prints `12.21.0`;
    - after deleting the pnpm 11 leftover (`~/Library/pnpm/bin/openspec` and `~/Library/pnpm/global/v11`, openspec 1.13.0 only), `openspec --version` prints `2.0.0`.
- [ ] 4.3 After merge, run `chezmoi update` on the work Mac (reachable through Rex). Check the following:
    - the NVM group no longer errors, and the run retires the corepack shims of the Node 22 and 24 versions;
    - under Node 26, `npm uninstall -g pnpm` removes the npm-installed pnpm 12.21.0 (which the retirement step leaves alone by design); then `command -v pnpm` prints `~/Library/pnpm/bin/pnpm` and `pnpm --version` works;
    - no older global in `~/Library/pnpm/bin` shadows its copy in `~/Library/pnpm`.

## Workflow follow-up

- Archive the change once 4.2 and 4.3 pass, then close agentic-task-fpym.
