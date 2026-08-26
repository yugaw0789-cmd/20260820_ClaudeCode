#!/usr/bin/env bash
# Install the emilkowalski/skills set as *user-level* Claude Code skills.
#
# User-level skills live in ~/.claude/skills/ and are available in EVERY
# project on the machine (or in every session of a cloud environment),
# not just the repository that ships this script.
#
# Usage:
#   bash .claude/scripts/install-skills.sh              # install to ~/.claude/skills
#   bash .claude/scripts/install-skills.sh --dest DIR   # install somewhere else
#   bash .claude/scripts/install-skills.sh --ref main    # track a different upstream ref
#   bash .claude/scripts/install-skills.sh --local       # copy from this repo's .claude/skills
#
# Standalone (no checkout needed) — usable as a cloud environment setup script:
#   git clone --depth 1 https://github.com/emilkowalski/skills.git /tmp/emil-skills \
#     && mkdir -p ~/.claude/skills \
#     && cp -R /tmp/emil-skills/skills/. ~/.claude/skills/ \
#     && rm -rf /tmp/emil-skills

set -euo pipefail

UPSTREAM="https://github.com/emilkowalski/skills.git"
# Pinned so installs are reproducible. Pass --ref main to follow upstream HEAD.
REF="d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7"
DEST="${HOME}/.claude/skills"
MODE="remote"

while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --local) MODE="local"; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

repo_root() {
  git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || true
}

src=""
cleanup=""

if [ "$MODE" = "local" ]; then
  root="$(repo_root)"
  src="${root}/.claude/skills"
  [ -d "$src" ] || { echo "no vendored skills at ${src}" >&2; exit 1; }
else
  tmp="$(mktemp -d)"
  cleanup="$tmp"
  echo "==> cloning ${UPSTREAM}"
  git clone --quiet --filter=blob:none --no-checkout "$UPSTREAM" "$tmp/repo"
  git -C "$tmp/repo" fetch --quiet --depth 1 origin "$REF"
  git -C "$tmp/repo" checkout --quiet FETCH_HEAD
  src="$tmp/repo/skills"
  cp "$tmp/repo/LICENSE" "$tmp/LICENSE-emilkowalski-skills"
fi

mkdir -p "$DEST"

installed=0
for dir in "$src"/*/; do
  [ -f "${dir}SKILL.md" ] || continue
  name="$(basename "$dir")"
  rm -rf "${DEST:?}/${name}"
  cp -R "$dir" "${DEST}/${name}"
  echo "    installed ${name}"
  installed=$((installed + 1))
done

if [ "$MODE" = "local" ]; then
  [ -f "${src}/LICENSE-emilkowalski-skills" ] &&
    cp "${src}/LICENSE-emilkowalski-skills" "${DEST}/LICENSE-emilkowalski-skills"
else
  cp "$tmp/LICENSE-emilkowalski-skills" "${DEST}/LICENSE-emilkowalski-skills"
fi

[ -n "$cleanup" ] && rm -rf "$cleanup"

if [ "$installed" -eq 0 ]; then
  echo "no skills found in ${src}" >&2
  exit 1
fi

echo "==> ${installed} skills installed to ${DEST}"
echo "    Restart Claude Code (or start a new session) to pick them up."
