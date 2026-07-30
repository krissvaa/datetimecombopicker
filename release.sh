#!/usr/bin/env bash
#
# Release both packages in lockstep:
#   ./release.sh 1.2.0
#
# Steps: set versions, build & test everything, publish npm package,
# build the Vaadin Directory zip (flow/target/datetimecombopicker-<version>.zip),
# which is then uploaded manually at https://vaadin.com/directory.
set -euo pipefail

VERSION="${1:?Usage: ./release.sh <version>}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Setting version ${VERSION}"
(cd "$ROOT/web-component" && npm version "$VERSION" --no-git-tag-version)
(cd "$ROOT/flow" && mvn -q versions:set -DnewVersion="$VERSION" -DgenerateBackupPoms=false)

echo "==> Building and testing the web component"
(cd "$ROOT/web-component" && npm ci && npm run build && npm test)

echo "==> Building and testing the Flow add-on (+ directory zip)"
(cd "$ROOT/flow" && mvn clean install -Pdirectory)

echo "==> Publishing npm package (dry run first)"
(cd "$ROOT/web-component" && npm publish --dry-run)
read -r -p "Publish to npm for real? [y/N] " answer
if [[ "$answer" == "y" ]]; then
  (cd "$ROOT/web-component" && npm publish)
fi

echo
echo "Done. Upload flow/target/datetimecombopicker-${VERSION}.zip to https://vaadin.com/directory"
