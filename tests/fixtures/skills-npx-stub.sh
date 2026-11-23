#!/bin/bash
# Stands in for `npx -y skills` in install-script tests. The global skills list
# lives in $SKILLS_STATE; installed names listed in $FAIL_ADDS fail to install.
# Like skills.sh, a skill gets one folder under ~/.agents/skills and a Claude
# Code link under ~/.claude/skills when Claude Code is among its agents.
printf '%s\n' "$*" >>"$NPX_LOG"
[ "$1" = "-y" ] && shift
[ "$1" = "skills" ] && shift
command="$1"
shift

update() {
    jq "$@" "$SKILLS_STATE" >"$SKILLS_STATE.next" && mv "$SKILLS_STATE.next" "$SKILLS_STATE"
}

case "$command" in
    list)
        cat "$SKILLS_STATE"
        ;;
    add)
        repo="$1"
        shift
        name=""
        installed=""
        agents='["Claude Code","OpenCode","Junie"]'
        while [ $# -gt 0 ]; do
            case "$1" in
                --skill) name="$2"; shift 2 ;;
                --rename) installed="$2"; shift 2 ;;
                --agent)
                    shift
                    case " $* " in
                        *" claude-code "*) ;;
                        *) agents='["OpenCode","Junie"]' ;;
                    esac
                    break
                    ;;
                *) shift ;;
            esac
        done
        installed="${installed:-$name}"
        case " $FAIL_ADDS " in
            *" $installed "*) exit 1 ;;
        esac
        update --arg n "$installed" --arg o "$name" --arg s "$repo" --argjson a "$agents" \
            '[.[] | select(.name != $n)] + [{name: $n, source: $s, renamedFrom: (if $n == $o then null else $o end), agents: $a}]'
        mkdir -p "$HOME/.agents/skills/$installed"
        if echo "$agents" | grep -q 'Claude Code'; then
            ln -sfn "$HOME/.agents/skills/$installed" "$HOME/.claude/skills/$installed"
        fi
        ;;
    remove)
        update --arg n "$1" '[.[] | select(.name != $n)]'
        rm -rf "$HOME/.agents/skills/$1" "$HOME/.claude/skills/$1"
        ;;
esac
