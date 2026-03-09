#!/usr/bin/env bash
# ACTIS conformance harness: run verifier on each test vector and compare to expected_results.json.
# Usage: ACTIS_VERIFIER_CMD="your-verifier verify --zip" ./run_conformance.sh
# Run from actis/test-vectors/ (or repo root; script resolves paths).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
VECTORS_DIR="$SCRIPT_DIR"
if [ ! -f "expected_results.json" ]; then
  echo "Error: expected_results.json not found. Run from actis/test-vectors/." >&2
  exit 1
fi

if [ -z "$ACTIS_VERIFIER_CMD" ]; then
  echo "Error: Set ACTIS_VERIFIER_CMD to your verifier command (e.g. 'your-verifier verify --zip')." >&2
  exit 1
fi

FAILED=0
COUNT=0
while read -r id zip rest; do
  [ -z "$id" ] && continue
  [ "$id" = "harness_version" ] && continue
  # Parse from expected_results.json: "id": "tv-001" and "zip": "generated/..."
  # Use jq to iterate and run
  true
done < <(jq -r '.vectors[] | "\(.id) \(.zip)"' expected_results.json 2>/dev/null || true)

# Simpler: use jq to get each vector and run verifier
for row in $(jq -c '.vectors[]' expected_results.json); do
  id=$(echo "$row" | jq -r '.id')
  zip_rel=$(echo "$row" | jq -r '.zip')
  zip_path="$VECTORS_DIR/$zip_rel"
  if [ ! -f "$zip_path" ]; then
    echo "FAIL $id: zip not found: $zip_path" >&2
    FAILED=$((FAILED + 1))
    COUNT=$((COUNT + 1))
    continue
  fi
  expected=$(echo "$row" | jq -c '.expected')
  out=$(eval "$ACTIS_VERIFIER_CMD \"$zip_path\"" 2>/dev/null) || true
  # Take first JSON object if verifier outputs multiple (e.g. duplicate lines)
  out=$(echo "$out" | jq -s 'if type == "array" then .[0] else . end' 2>/dev/null || echo "$out")
  if ! echo "$out" | jq -e . >/dev/null 2>&1; then
    echo "FAIL $id: verifier did not output valid JSON" >&2
    echo "$out" | head -5 >&2
    FAILED=$((FAILED + 1))
    COUNT=$((COUNT + 1))
    continue
  fi
  # Require either actis_status (canonical) or integrity_status (deprecated fallback)
  has_actis=$(echo "$out" | jq -r '.actis_status // empty')
  has_integrity=$(echo "$out" | jq -r '.integrity_status // empty')
  if [ -z "$has_actis" ] && [ -z "$has_integrity" ]; then
    echo "FAIL $id: verifier output has neither actis_status nor integrity_status" >&2
    FAILED=$((FAILED + 1))
    COUNT=$((COUNT + 1))
    continue
  fi
  mismatch=""
  for key in schema_ok checksums_ok hash_chain_ok signatures_ok replay_ok actis_status; do
    exp=$(echo "$expected" | jq -r --arg k "$key" '.[$k] // empty')
    [ -z "$exp" ] && continue
    if [ "$key" = "actis_status" ]; then
      # Prefer actis_status; derive from integrity_status + booleans when absent
      act=$(echo "$out" | jq -r '
        if .actis_status then .actis_status
        elif .integrity_status == "VALID" then "ACTIS_COMPATIBLE"
        elif .integrity_status == "INDETERMINATE" then "ACTIS_PARTIAL"
        elif .integrity_status == "TAMPERED" then
          if .schema_ok and .hash_chain_ok and .checksums_ok and (.signatures_ok | not) then "ACTIS_PARTIAL"
          else "ACTIS_NONCOMPLIANT" end
        else empty end')
      # If both actis_status and integrity_status present, derived must match reported
      reported=$(echo "$out" | jq -r '.actis_status // empty')
      if [ -n "$reported" ] && [ -n "$(echo "$out" | jq -r '.integrity_status // empty')" ]; then
        derived=$(echo "$out" | jq -r '
          if .integrity_status == "VALID" then "ACTIS_COMPATIBLE"
          elif .integrity_status == "INDETERMINATE" then "ACTIS_PARTIAL"
          elif .integrity_status == "TAMPERED" then
            if .schema_ok and .hash_chain_ok and .checksums_ok and (.signatures_ok | not) then "ACTIS_PARTIAL"
            else "ACTIS_NONCOMPLIANT" end
          else empty end')
        if [ -n "$derived" ] && [ "$derived" != "$reported" ]; then
          mismatch="${mismatch}  actis_status: reported $reported but derived $derived (inconsistent with integrity_status)\n"
        fi
      fi
      # Enum must be exactly one of the three canonical tokens (case-sensitive)
      case "$act" in
        ACTIS_COMPATIBLE|ACTIS_PARTIAL|ACTIS_NONCOMPLIANT) ;;
        *)
          mismatch="${mismatch}  actis_status: value \"$act\" is not one of ACTIS_COMPATIBLE, ACTIS_PARTIAL, ACTIS_NONCOMPLIANT\n"
          ;;
      esac
    else
      act=$(echo "$out" | jq -r --arg k "$key" '.[$k] // empty')
    fi
    if [ "$act" != "$exp" ]; then
      mismatch="${mismatch}  $key: expected $exp, got $act\n"
    fi
  done
  if [ -n "$mismatch" ]; then
    echo "FAIL $id:" >&2
    printf "$mismatch" >&2
    FAILED=$((FAILED + 1))
  else
    echo "PASS $id"
  fi
  COUNT=$((COUNT + 1))
done

echo ""
echo "Result: $COUNT vectors, $FAILED failed"
[ "$FAILED" -gt 0 ] && exit 1
exit 0
