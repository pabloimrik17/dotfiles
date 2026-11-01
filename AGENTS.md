# Code comments

Before writing or editing code comments, use the experiments:writing-comments skill.

# Package Manager

## Common npm-to-bun equivalents

| npm                    | bun                             |
| ---------------------- | ------------------------------- |
| `npm install`          | `bun install`                   |
| `npm install <pkg>`    | `bun add <pkg>`                 |
| `npm install -D <pkg>` | `bun add -d <pkg>`              |
| `npm uninstall <pkg>`  | `bun remove <pkg>`              |
| `npm run <script>`     | `bun run <script>`              |
| `npx <cmd>`            | `bunx <cmd>`                    |
| `npm init`             | `bun init`                      |
| `npm test`             | `bun test`                      |
| `npm ci`               | `bun install --frozen-lockfile` |
