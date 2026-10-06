#!/bin/sh
# Publish a built dev-standards docsite to mood481/tools-docs:main as
# site/dev-standards/.
# Generation stays in dev-standards: tools-docs never fetches or builds
# dev-standards docs. Replacement is complete: the entire
# site/dev-standards/ subtree is replaced with the selected revision's built
# output, stale dev-standards files disappear, sibling subtrees stay intact.
# A commit identifying the exact dev-standards source revision is created and
# pushed only when the subtree actually changed; an identical output produces
# no commit. Build, checkout or push failures fail visibly. Credentials never
# enter repository content or logs: the token is only used by git/auth
# configuration outside this script's file writes.
#
# Usage: sh scripts/docs/publish-to-tools-docs.sh <built-dir> <tools-docs-checkout> <dev-rev> [--push|--no-push]
#   <built-dir>           complete static artifact (must contain index.html)
#   <tools-docs-checkout> current checkout of mood481/tools-docs:main
#   <dev-rev>             exact dev-standards source revision (full SHA)
#   --push (default)      push the ingestion commit when one is created
#   --no-push             create the commit but do not push (local verification)
set -eu
built_dir="${1:?usage: publish-to-tools-docs.sh <built-dir> <tools-docs-checkout> <dev-rev> [--push|--no-push]}"
checkout="${2:?usage: publish-to-tools-docs.sh <built-dir> <tools-docs-checkout> <dev-rev> [--push|--no-push]}"
dev_rev="${3:?usage: publish-to-tools-docs.sh <built-dir> <tools-docs-checkout> <dev-rev> [--push|--no-push]}"
mode="${4:---push}"
case "$mode" in
  --push|--no-push) ;;
  *) echo "error: unknown mode $mode (want --push or --no-push)" >&2; exit 2 ;;
esac

test -f "$built_dir/index.html" || { echo "error: built artifact missing $built_dir/index.html; run node scripts/docs/build-docsite.mjs first" >&2; exit 1; }
test -d "$checkout/.git" || { echo "error: $checkout is not a git checkout (missing .git)" >&2; exit 1; }

# Confirm checkout is tools-docs on main without fetching (no network here).
remote_url=$(git -C "$checkout" config --get remote.origin.url || true)
case "$remote_url" in
  *tools-docs*) ;;
  *) echo "warning: checkout remote ($remote_url) does not look like mood481/tools-docs; continuing with path replacement only" >&2 ;;
esac
branch=$(git -C "$checkout" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
if [ "$branch" != "main" ]; then
  echo "error: tools-docs checkout is on '$branch', want 'main'" >&2
  exit 1
fi
if [ -n "$(git -C "$checkout" status --porcelain)" ]; then
  echo "error: tools-docs checkout has uncommitted changes; refusing to replace" >&2
  exit 1
fi

# Complete subtree replacement: remove stale dev-standards files, keep siblings.
rm -rf "$checkout/site/dev-standards"
mkdir -p "$checkout/site/dev-standards"
# Portable copy of built output including dotfiles (no hidden files expected, but complete).
(cd "$built_dir" && tar -cf - .) | (cd "$checkout/site/dev-standards" && tar -xf -)

# Stage only site/dev-standards/; siblings remain untouched.
git -C "$checkout" add site/dev-standards

if git -C "$checkout" diff --cached --quiet; then
  echo "no changes in site/dev-standards/ for dev-standards $dev_rev; no commit"
  exit 0
fi

msg="docs: ingest dev-standards site from dev-standards@$dev_rev"
git -C "$checkout" -c user.name="dev-standards-docs" -c user.email="dev-standards-docs@local" commit -m "$msg" -m "Source: dev-standards revision $dev_rev" -m "Subtree: site/dev-standards/ (complete replacement)" >/dev/null
created=$(git -C "$checkout" rev-parse HEAD)
echo "created $created in $checkout: $msg"

if [ "$mode" = "--no-push" ]; then
  echo "skipping push (--no-push)"
  exit 0
fi

git -C "$checkout" push origin main
echo "pushed $created to origin/main"
