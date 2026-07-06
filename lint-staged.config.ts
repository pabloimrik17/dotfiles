import type { Configuration } from "lint-staged";

export default {
    "*": "oxfmt --no-error-on-unmatched-pattern --ignore-path .oxfmtignore",
    "renovate.json": "bunx --package renovate@43.227.0 renovate-config-validator --strict",
    // global (function ignores the file list): runs once per commit touching
    // JS surface; audit = new-only ratchet on changed files
    "*.{ts,js,json,jsonc}": () => "bunx fallow audit",
} satisfies Configuration;
