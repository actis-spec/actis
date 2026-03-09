#!/usr/bin/env bash
# ACTIS independence verification: scan actis/ for forbidden vendor/codebase references,
# then run the conformance harness. Pass only if both the scan is clean and conformance passes.
#
# Usage: Set ACTIS_VERIFIER_CMD to a command that accepts a bundle path and outputs JSON.
#   Example: ACTIS_VERIFIER_CMD="myverifier verify --zip"
#   From repo root: ACTIS_VERIFIER_CMD="myverifier verify --zip" ./actis/scripts/verify_independence.sh
#   From actis/:   ACTIS_VERIFIER_CMD="myverifier verify --zip" ./scripts/verify_independence.sh

set -e
ACTIS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ACTIS_ROOT"

# If ACTIS_VERIFIER_CMD is unset, print usage and exit 2 (neutral usage failure)
if [ -z "$ACTIS_VERIFIER_CMD" ]; then
  echo "Usage: ACTIS_VERIFIER_CMD=\"<verifier-cmd>\" $0" >&2
  echo "  Set ACTIS_VERIFIER_CMD to a command that accepts a bundle path and prints a JSON report to stdout." >&2
  echo "  Example: ACTIS_VERIFIER_CMD=\"myverifier verify --zip\"" >&2
  exit 2
fi

# 1. Grep scan for forbidden strings (scope: actis/ only; exclude this script)
MATCHES=""
MATCHES=$(grep -riw 'pact' --include='*.md' --include='*.json' --include='*.sh' . 2>/dev/null | grep -v 'scripts/verify_independence.sh' || true)
MATCHES="$MATCHES$(grep -rE 'optional/pact|packages/verifier|file:///|/Users/' --include='*.md' --include='*.json' --include='*.sh' . 2>/dev/null | grep -v 'scripts/verify_independence.sh' || true)"
if [ -n "$MATCHES" ]; then
  echo "ACTIS independence check: FAIL (forbidden string found in actis/)" >&2
  echo "$MATCHES" | head -20 >&2
  exit 1
fi

cd test-vectors
if ! bash run_conformance.sh; then
  echo "ACTIS independence check: FAIL (conformance harness failed)" >&2
  exit 1
fi
cd "$ACTIS_ROOT"

echo "ACTIS independence check: PASS"
exit 0
