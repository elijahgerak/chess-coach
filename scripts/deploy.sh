#!/usr/bin/env bash
# Build and publish site/ to the gh-pages branch (GitHub Pages serves from it).
# Live at https://elijahgerak.github.io/chess-coach/
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build.py
tmp="$(mktemp -d)"
trap 'git worktree remove --force "$tmp" >/dev/null 2>&1 || true' EXIT
git fetch --depth=1 origin gh-pages
git worktree add -f -B gh-pages "$tmp" origin/gh-pages >/dev/null
find "$tmp" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R site/. "$tmp"/
cd "$tmp"
git add -A
if git diff --cached --quiet; then echo "Nothing changed. Site is up to date."; exit 0; fi
git commit -q -m "Deploy $(git -C "$OLDPWD" rev-parse --short HEAD)"
git push -q origin gh-pages
echo "Deployed. Live in about a minute: https://elijahgerak.github.io/chess-coach/"
