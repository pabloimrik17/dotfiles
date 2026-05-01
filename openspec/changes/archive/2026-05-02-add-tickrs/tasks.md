## 1. Install script — tap support

- [x] 1.1 Add `BREW_TAPS=(tarkah/tickrs)` array declaration directly above `BREW_PACKAGES` in `run_onchange_install-packages.sh.tmpl`
- [x] 1.2 Insert a `for tap in "${BREW_TAPS[@]}"; do brew tap "$tap"; done` loop before the BREW_PACKAGES pre-scan
- [x] 1.3 Verify `brew tap tarkah/tickrs` is idempotent on a re-run (no extra prompts, exits 0)

## 2. Install script — tickrs package

- [x] 2.1 Append `tickrs` to the `BREW_PACKAGES` array (24th `)` boundary becomes 23 entries)
- [x] 2.2 Confirm no `pkg_bin` arm is needed (identity mapping returns `tickrs`)
- [x] 2.3 Update the closing summary `info` line listing CLI tools to include `tickrs`
- [x] 2.4 Update the non-macOS branch's printed instructions to list `tickrs` and recommend `cargo install tickrs`

## 3. chezmoi-managed config

- [x] 3.1 Create `Library/Application Support/tickrs/config.yml` (static, no `.tmpl` suffix) with `chart_type: candle`, `time_frame: 1M`, `update_interval: 30`, `enable_pre_post: true`, `show_volumes: true` — source path mirrors the macOS target path the `tickrs` binary reads
- [x] 3.2 Append the `symbols:` YAML sequence with the 42 tickers in order: ACM, ADBE, ADSK, AVTR, BAH, BMI, BRBR, BSX, CMG, COO, CPNG, CPRT, CRM, CRTO, DOCS, DPZ, DT, DUOL, FISV, HLI, HLNE, HRL, IPAR, JJSF, LULU, MORN, MSFT, NKE, NOMD, ODD, PAYX, PCTY, PINS, PLNT, POOL, QLYS, RACE, RMD, SMCI, SMPL, VEEV, VITL
- [x] 3.3 Run `chezmoi apply` (real, not dry) and confirm it creates `~/Library/Application Support/tickrs/config.yml` with the expected contents

## 4. Verification

- [x] 4.1 Run the install script end-to-end and confirm `tarkah/tickrs` is tapped and `tickrs` ends up in PATH
- [x] 4.2 Re-run the install script and confirm both the tap loop and the tickrs entry skip with idempotent messages
- [x] 4.3 Launch `tickrs` and verify it opens with candle chart, 1M time frame, 30s refresh, pre/post and volumes enabled, all 42 tickers streaming
- [x] 4.4 Run `openspec validate add-tickrs` and confirm the change is valid

## 5. Documentation

- [x] 5.1 Trigger the `update-readme` skill so README's "What's Included" mentions tickrs
- [x] 5.2 If the manual-print/manual-web flows surface CLI tools, confirm tickrs appears there too (or trigger the `update-manual` skill)
