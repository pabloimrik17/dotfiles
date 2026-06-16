import type { Configuration } from "lint-staged";

export default {
    "*": "oxfmt --no-error-on-unmatched-pattern --ignore-path .oxfmtignore",
    "renovate.json": "bunx --package renovate@43.227.0 renovate-config-validator --strict",
} satisfies Configuration;
