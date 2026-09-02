#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_TEMPLATE="$REPO_ROOT/run_onchange_install-packages.sh.tmpl"

# Load only the production function under test. Its invocation sits outside the
# markers, so sourcing this slice cannot mutate live Codex configuration.
source <(sed -n '/^# BEGIN CODEX DEEPWIKI MCP$/,/^# END CODEX DEEPWIKI MCP$/p' "$INSTALL_TEMPLATE")

SCENARIO=""
CONFIRM_RESULT="yes"
CONFIRM_CALLS=0
MUTATIONS=()
WARNINGS=()
INFOS=()

info() {
    INFOS+=("$*")
}

warn() {
    WARNINGS+=("$*")
}

confirm() {
    CONFIRM_CALLS=$((CONFIRM_CALLS + 1))
    [ "$CONFIRM_RESULT" = "yes" ]
}

test_jq() {
    jq "$@"
}

codex_stub() {
    [ "$1" = "mcp" ] || return 97
    case "$2" in
        list)
            case "$SCENARIO" in
                failed-query) return 1 ;;
                invalid-json) printf '%s\n' '{"unexpected":true}' ;;
                missing | add-failure) printf '%s\n' '[]' ;;
                matching)
                    printf '%s\n' '[{"name":"deepwiki","transport":{"type":"streamable_http","url":"https://mcp.deepwiki.com/mcp"}}]'
                    ;;
                stale | declined | removal-failure)
                    printf '%s\n' '[{"name":"deepwiki","transport":{"type":"streamable_http","url":"https://example.invalid/old"}}]'
                    ;;
                *) return 98 ;;
            esac
            ;;
        remove)
            MUTATIONS+=("$*")
            [ "$SCENARIO" != "removal-failure" ]
            ;;
        add)
            MUTATIONS+=("$*")
            [ "$SCENARIO" != "add-failure" ]
            ;;
        *) return 99 ;;
    esac
}

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

assert_equal() {
    local expected="$1"
    local actual="$2"
    local label="$3"
    [ "$actual" = "$expected" ] || fail "$label: expected '$expected', got '$actual'"
}

assert_warning() {
    local label="$1"
    [ "${#WARNINGS[@]}" -gt 0 ] || fail "$label: expected a warning"
}

reset_case() {
    SCENARIO="$1"
    CONFIRM_RESULT="${2:-yes}"
    CONFIRM_CALLS=0
    MUTATIONS=()
    WARNINGS=()
    INFOS=()
}

mutation_log() {
    local IFS='|'
    printf '%s' "${MUTATIONS[*]-}"
}

reset_case no-codex
setup_codex_deepwiki_mcp missing-codex test_jq
assert_equal "" "$(mutation_log)" "no-Codex mutations"
assert_warning "no-Codex"

reset_case no-jq
setup_codex_deepwiki_mcp codex_stub missing-jq
assert_equal "" "$(mutation_log)" "no-jq mutations"
assert_warning "no-jq"

reset_case failed-query
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "" "$(mutation_log)" "failed-query mutations"
assert_warning "failed-query"

reset_case invalid-json
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "" "$(mutation_log)" "invalid-json mutations"
assert_warning "invalid-json"

reset_case missing
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "1" "$CONFIRM_CALLS" "missing confirmation count"
assert_equal "mcp add deepwiki --url https://mcp.deepwiki.com/mcp" "$(mutation_log)" "missing mutations"

reset_case matching
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "0" "$CONFIRM_CALLS" "matching confirmation count"
assert_equal "" "$(mutation_log)" "matching mutations"

reset_case stale
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "1" "$CONFIRM_CALLS" "stale confirmation count"
assert_equal "mcp remove deepwiki|mcp add deepwiki --url https://mcp.deepwiki.com/mcp" "$(mutation_log)" "stale mutations"

reset_case declined no
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "1" "$CONFIRM_CALLS" "declined confirmation count"
assert_equal "" "$(mutation_log)" "declined mutations"

reset_case removal-failure
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "mcp remove deepwiki" "$(mutation_log)" "removal-failure mutations"
assert_warning "removal-failure"

reset_case add-failure
setup_codex_deepwiki_mcp codex_stub test_jq
assert_equal "mcp add deepwiki --url https://mcp.deepwiki.com/mcp" "$(mutation_log)" "add-failure mutations"
assert_warning "add-failure"

printf 'PASS: Codex DeepWiki MCP registration paths\n'
