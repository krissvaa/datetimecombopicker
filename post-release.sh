#!/usr/bin/env bash
#
# Run after a release to open the next development cycle:
#   ./post-release.sh          # bumps minor: 2.0.0 -> 2.1.0-SNAPSHOT / 2.1.0-snapshot
#   ./post-release.sh 3.0.0    # or target an explicit next version
#
# Sets the Maven pom to <next>-SNAPSHOT and the npm package to
# <next>-snapshot (npm rejects re-publishing the same version, and
# release.sh's `npm version` step needs a real change to make).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [[ -n "$(git -C "$ROOT" status --porcelain --untracked-files=no)" ]]; then
  echo "ERROR: working tree is not clean; commit the release first." >&2
  exit 1
fi

CURRENT="$(node -p "require('$ROOT/web-component/package.json').version")"
CURRENT="${CURRENT%-snapshot}"

if [[ $# -ge 1 ]]; then
  NEXT="${1%-SNAPSHOT}"
  NEXT="${NEXT%-snapshot}"
else
  IFS=. read -r MAJOR MINOR _PATCH <<<"$CURRENT"
  NEXT="${MAJOR}.$((MINOR + 1)).0"
fi

echo "==> Opening development cycle ${NEXT} (was ${CURRENT})"
(cd "$ROOT/web-component" && npm version "${NEXT}-snapshot" --no-git-tag-version)
(cd "$ROOT/flow" && mvn -q versions:set -DnewVersion="${NEXT}-SNAPSHOT" -DgenerateBackupPoms=false)

echo
echo "Done. Next step:"
echo "  git commit -m 'Open ${NEXT} development cycle' -- web-component/package.json web-component/package-lock.json flow/pom.xml"
