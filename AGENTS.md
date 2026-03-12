# Package Manager

This project uses **bun** as the package manager. Always use `bun` instead of `npm`/`yarn`/`pnpm`.

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
