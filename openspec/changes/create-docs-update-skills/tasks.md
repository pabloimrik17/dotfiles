## 1. update-manual skill

- [ ] 1.1 Create `.claude/skills/update-manual/SKILL.md` with frontmatter (name, description for auto-trigger) and full prompt content: config-to-section mapping, gap detection workflow, HTML convention reference (details/summary, h3, tables, code/kbd, flow-only), propose-then-apply instructions
- [ ] 1.2 Create `.claude/commands/docs/manual.md` with frontmatter (description, argument-hint) and duplicated prompt content with `/docs:manual` slash command references

## 2. update-readme skill

- [ ] 2.1 Create `.claude/skills/update-readme/SKILL.md` with frontmatter (name, description for auto-trigger on tool-level changes) and full prompt content: What's Included table analysis, section analysis, screenshot description generation, propose-then-apply instructions
- [ ] 2.2 Create `.claude/commands/docs/readme.md` with frontmatter (description, argument-hint) and duplicated prompt content with `/docs:readme` slash command references

## 3. Verification

- [ ] 3.1 Verify both skills appear in Claude Code's available skills list (restart session, check skill discovery)
- [ ] 3.2 Verify both commands appear in `/help` output as `/docs:manual` and `/docs:readme`
- [ ] 3.3 Test `/docs:manual` invocation — confirm it reads manual.html, detects known gaps (gh-dash, bun/pnpm aliases), and proposes changes
- [ ] 3.4 Test `/docs:readme` invocation — confirm it reads README.md, detects known gaps (gh-dash, gh-enhance, CodeRabbit), and proposes table additions with screenshot descriptions
