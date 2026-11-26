#!/bin/bash
# Stand-in for the claude, codex and opencode plugin CLIs, chosen by the name it
# is invoked as. Claude and Codex keep one plugin id or marketplace name per line
# in $FAKE_STATE/<agent>.plugins and <agent>.marketplaces. OpenCode edits
# $HOME/.config/opencode/opencode.json, or opencode.jsonc when there is no
# opencode.json, as the real CLI does. A file $FAKE_STATE/<agent>.<flag> turns on
# a failure mode: list-fails, list-garbage, list-renamed (entries carry a key
# other than the one asked for), remove-fails or remove-sticky (exits 0 and
# changes nothing, as `opencode plugin remove` does for a specifier it does not
# know).

agent="${0##*/}"
state="$FAKE_STATE/$agent"
echo "$agent $*" >>"$FAKE_LOG"

has() { [ -e "$state.$1" ]; }

objects() {
    local key="$1" file="$2" sep="" name
    [ -f "$file" ] || return 0
    while IFS= read -r name; do
        printf '%s{"%s":"%s"}' "$sep" "$key" "$name"
        sep=","
    done <"$file"
}

listing() {
    has list-fails && exit 1
    has list-garbage && { echo '{"available":[]}'; exit 0; }
    local key="$3"
    has list-renamed && key="renamed"
    printf '%s%s%s\n' "$1" "$(objects "$key" "$4")" "$2"
    exit 0
}

removal() {
    has remove-fails && { echo "$agent: removal failed" >&2; exit 1; }
    has remove-sticky && exit 0
    return 0
}

drop() {
    removal
    [ -f "$1" ] || exit 0
    grep -vxF "$2" "$1" >"$1.tmp"
    mv "$1.tmp" "$1"
    exit 0
}

opencode_remove() {
    removal
    local file="$HOME/.config/opencode/opencode.json"
    [ -f "$file" ] || file="$HOME/.config/opencode/opencode.jsonc"
    if [ -f "$file" ] && grep -qF "\"$1\"" "$file"; then
        grep -vF "\"$1\"" "$file" >"$file.tmp"
        mv "$file.tmp" "$file"
    else
        echo "Plugin \"$1\" is not configured"
    fi
    exit 0
}

last="${*: -1}"
case "$agent $*" in
    "claude plugin list --json") listing '[' ']' id "$state.plugins" ;;
    "claude plugin marketplace list --json") listing '[' ']' name "$state.marketplaces" ;;
    "claude plugin uninstall "*) drop "$state.plugins" "$last" ;;
    "claude plugin marketplace remove "*) drop "$state.marketplaces" "$last" ;;
    "codex plugin list --json") listing '{"installed":[' '],"available":[]}' pluginId "$state.plugins" ;;
    "codex plugin marketplace list --json") listing '{"marketplaces":[' ']}' name "$state.marketplaces" ;;
    "codex plugin remove "*) drop "$state.plugins" "$last" ;;
    "codex plugin marketplace remove "*) drop "$state.marketplaces" "$last" ;;
    "opencode plugin remove "*) opencode_remove "$last" ;;
    *)
        echo "fake $agent: unexpected arguments: $*" >&2
        exit 2
        ;;
esac
