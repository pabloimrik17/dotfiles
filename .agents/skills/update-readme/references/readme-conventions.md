# README conventions

Exact markdown patterns for editing `README.md`, plus the format a screenshot proposal must
follow. Read this before applying an approved proposal — the README's table, badges, and image
blocks are hand-maintained, so matching the existing shape keeps the diff reviewable.

### What's Included table row

```markdown
| **Category** | [Tool Name](https://tool-url/) | Brief description of what it does |
```

Categories in use: Terminal, Shell, CLI Tools, Git, AI Tooling

### Badge

```markdown
[![Label](https://img.shields.io/badge/Label-text-color?style=for-the-badge&logo=logo-name&logoColor=white)](https://url/)
```

### Screenshot

```markdown
<p align="center">
  <img src="assets/filename.png" alt="Description" width="800">
</p>
```

### Intro paragraph style

One sentence summarizing the stack: tools, theme, shell, terminal. Keep it concise.

## Screenshot Description Format

When proposing screenshots, always include:

1. **Suggested filename**: `assets/descriptive-name.png`
2. **What to show**: Specific content visible in the capture
3. **How to simulate**: Step-by-step to reproduce the scenario
4. **Suggested size**: Terminal dimensions or image width
5. **Placement**: Where in README.md the image should go
