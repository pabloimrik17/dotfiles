import type { Configuration } from "lint-staged";

export default {
    "*": "oxfmt --no-error-on-unmatched-pattern",
} satisfies Configuration;
