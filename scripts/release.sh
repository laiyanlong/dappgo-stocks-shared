#!/usr/bin/env bash
# release.sh — bump version, finalize CHANGELOG, tag.
# Usage:  ./scripts/release.sh [patch|minor|major]
#
# Reads version from package.json, computes the next SemVer, moves the
# [Unreleased] block in CHANGELOG.md to a dated release section, commits
# with "chore(release): vX.Y.Z", and creates an annotated git tag.
# Does NOT push — the human pushes manually.
set -euo pipefail

BUMP="${1:-patch}"
case "$BUMP" in
  patch|minor|major) ;;
  *) echo "Usage: $0 [patch|minor|major]" >&2; exit 1 ;;
esac

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "release.sh: working tree must be clean" >&2
  exit 1
fi

CURRENT="$(node -p "require('./package.json').version")"
if ! [[ "$CURRENT" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "release.sh: package.json version '$CURRENT' is not SemVer" >&2
  exit 1
fi

IFS='.' read -r MAJ MIN PAT <<< "$CURRENT"
case "$BUMP" in
  major) MAJ=$((MAJ+1)); MIN=0; PAT=0 ;;
  minor) MIN=$((MIN+1)); PAT=0 ;;
  patch) PAT=$((PAT+1)) ;;
esac
NEXT="${MAJ}.${MIN}.${PAT}"
TODAY="$(date -u +%Y-%m-%d)"
echo "release.sh: $CURRENT -> $NEXT ($TODAY)"

node -e "
const fs=require('fs');
const f='package.json';
const j=JSON.parse(fs.readFileSync(f,'utf8'));
j.version='$NEXT';
fs.writeFileSync(f, JSON.stringify(j,null,2)+'\n');
"

if [ -f CHANGELOG.md ]; then
  python3 - "$NEXT" "$TODAY" <<'PY'
import sys, re, pathlib
nxt, today = sys.argv[1], sys.argv[2]
p = pathlib.Path("CHANGELOG.md")
text = p.read_text()
new_unreleased = (
    "## [Unreleased]\n\n"
    "### Added\n- \n\n"
    "### Changed\n- \n\n"
    "### Fixed\n- \n\n"
)
released_header = f"## [{nxt}] - {today}"
pattern = re.compile(r"^## \[Unreleased\][^\n]*\n", re.M)
if not pattern.search(text):
    print("release.sh: no [Unreleased] header in CHANGELOG.md", file=sys.stderr)
    sys.exit(1)
text = pattern.sub(new_unreleased + released_header + "\n", text, count=1)
p.write_text(text)
PY
fi

git add package.json CHANGELOG.md
git commit -m "chore(release): v${NEXT}"
git tag -a "v${NEXT}" -m "Release v${NEXT}"
echo "release.sh: committed + tagged v${NEXT}. Push with: git push && git push --tags"
