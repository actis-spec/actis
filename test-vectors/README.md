# ACTIS Test Vector Corpus (v1.0)

**Status:** Normative  
**Version:** 1.0  
**Scope:** Public conformance test vectors for ACTIS v1.0 verification. Defines named test cases, expected outputs, and a CI-compatible runner specification.

---

## 1. Overview

This corpus contains eight named test vectors that exercise every normative check in the ACTIS verification report. Any implementation claiming ACTIS v1.0 conformance MUST produce the expected output for each vector.

Each vector specifies:
- **Case ID and Name** — Stable identifier for CI reporting
- **Scenario Description** — What condition is being tested
- **Deviation** — Exact change from a valid bundle (or "none")
- **Expected Result** — `ACTIS_COMPATIBLE`, `ACTIS_PARTIAL`, or `ACTIS_NONCOMPLIANT`
- **Expected Checks** — Five boolean fields: `signatures_ok`, `hash_chain_ok`, `schema_ok`, `replay_ok`, `checksums_ok`
- **Expected Notes** — Warning or error messages the verifier SHOULD produce

The **baseline valid bundle** for all vectors is a 3-round transcript (INTENT → ASK → ACCEPT) with valid Ed25519 signatures, correct hash chain, and matching `final_hash`. Pre-built bundles are in `generated/` (e.g. `tv-001-compatible-minimal.zip`). See §4 for construction; the corpus is self-contained under `actis/test-vectors/`.

---

## 2. Test Vectors

### tv-001-compatible-minimal

| Field | Value |
|---|---|
| **Case ID** | `tv-001` |
| **Name** | `compatible-minimal` |
| **Scenario** | Minimal valid bundle. All integrity checks pass. |
| **Deviation** | None. Bundle contains `manifest.json`, `checksums.sha256`, and `input/transcript.json` with 3 valid rounds, correct hash chain, valid signatures, and matching `final_hash`. |
| **Expected Result** | `ACTIS_COMPATIBLE` |
| **Expected Checks** | `signatures_ok: true`, `hash_chain_ok: true`, `schema_ok: true`, `replay_ok: true`, `checksums_ok: true` |
| **Expected `integrity_status`** | `VALID` |
| **Expected Notes** | Empty array. No warnings. |

---

### tv-002-partial-invalid-signature

| Field | Value |
|---|---|
| **Case ID** | `tv-002` |
| **Name** | `partial-invalid-signature` |
| **Scenario** | Valid layout, schema, hash chain, and checksums. One signature is cryptographically invalid. |
| **Deviation** | Round 1 (`ASK`): `signature.signature_b58` is replaced with a different valid Base58 string that does not verify against `envelope_hash` with the claimed `signer_public_key_b58`. All other fields remain valid. |
| **Expected Result** | `ACTIS_PARTIAL` |
| **Expected Checks** | `signatures_ok: false`, `hash_chain_ok: true`, `schema_ok: true`, `replay_ok: false`, `checksums_ok: true` |
| **Expected `integrity_status`** | `TAMPERED` |
| **Expected Notes** | `["Signature verification failed for round 1"]` (or equivalent message identifying the round and failure) |

---

### tv-003-noncompliant-schema-fail

| Field | Value |
|---|---|
| **Case ID** | `tv-003` |
| **Name** | `noncompliant-schema-fail` |
| **Scenario** | `transcript_version` is an invalid constant. Schema validation fails. |
| **Deviation** | `transcript_version` changed from `"actis-transcript/1.0"` to an invalid value (e.g. `"other-transcript/1.0"`). All other fields remain valid. |
| **Expected Result** | `ACTIS_NONCOMPLIANT` |
| **Expected Checks** | `signatures_ok: true`, `hash_chain_ok: true`, `schema_ok: false`, `replay_ok: true`, `checksums_ok: true` |
| **Expected `integrity_status`** | `TAMPERED` |
| **Expected Notes** | `["Schema validation failed: transcript_version must be 'actis-transcript/1.0'"]` (or equivalent) |

> **Implementation note:** Some verifiers may short-circuit on schema failure and not evaluate subsequent checks. Verifiers that short-circuit MUST still report `schema_ok: false` and `integrity_status: "TAMPERED"`. Non-evaluated checks SHOULD be reported as `false` with a note indicating they were not evaluated.

---

### tv-004-noncompliant-hash-chain-break

| Field | Value |
|---|---|
| **Case ID** | `tv-004` |
| **Name** | `noncompliant-hash-chain-break` |
| **Scenario** | Hash chain is broken: round 1's `previous_round_hash` does not match round 0's `round_hash`. |
| **Deviation** | Round 1: `previous_round_hash` changed from the correct value (SHA-256 of canonical round 0) to `"0000000000000000000000000000000000000000000000000000000000000000"`. All other fields remain valid. |
| **Expected Result** | `ACTIS_NONCOMPLIANT` |
| **Expected Checks** | `signatures_ok: true`, `hash_chain_ok: false`, `schema_ok: true`, `replay_ok: false`, `checksums_ok: true` |
| **Expected `integrity_status`** | `TAMPERED` |
| **Expected Notes** | `["Hash chain broken at round 1: previous_round_hash does not match round 0 hash"]` (or equivalent) |

---

### tv-005-noncompliant-checksum-tamper

| Field | Value |
|---|---|
| **Case ID** | `tv-005` |
| **Name** | `noncompliant-checksum-tamper` |
| **Scenario** | `checksums.sha256` contains the correct hash, but `transcript.json` has been modified after checksum generation. |
| **Deviation** | After generating `checksums.sha256`, a byte is appended to `input/transcript.json` inside the bundle. The checksum file still lists the original hash. The transcript JSON itself remains parseable (trailing whitespace added). |
| **Expected Result** | `ACTIS_NONCOMPLIANT` |
| **Expected Checks** | `signatures_ok: true`, `hash_chain_ok: true`, `schema_ok: true`, `replay_ok: true`, `checksums_ok: false` |
| **Expected `integrity_status`** | `TAMPERED` |
| **Expected Notes** | `["Checksum mismatch for input/transcript.json"]` (or equivalent) |

> **Implementation note:** This vector tests bundle-level integrity. Verifiers that operate on transcript-only input (no bundle) MAY skip this vector. The vector is mandatory for bundle-level (`auditor-pack-verify`) conformance.

---

### tv-006-noncompliant-missing-file

| Field | Value |
|---|---|
| **Case ID** | `tv-006` |
| **Name** | `noncompliant-missing-file` |
| **Scenario** | `manifest.json` is absent from the bundle. |
| **Deviation** | The bundle ZIP does not contain `manifest.json`. `checksums.sha256` and `input/transcript.json` are present and valid. |
| **Expected Result** | `ACTIS_NONCOMPLIANT` |
| **Expected Checks** | `signatures_ok: false`, `hash_chain_ok: false`, `schema_ok: false`, `replay_ok: false`, `checksums_ok: false` |
| **Expected `integrity_status`** | `TAMPERED` |
| **Expected Notes** | `["Required file missing from bundle: manifest.json"]` (or equivalent) |

> **Implementation note:** When a required core file is missing, the verifier cannot perform any meaningful checks. All check fields SHOULD be `false`.

---

### tv-007-compatible-with-failure-event

| Field | Value |
|---|---|
| **Case ID** | `tv-007` |
| **Name** | `compatible-with-failure-event` |
| **Scenario** | Valid bundle including a `failure_event`. The transcript terminated with an error, but the evidence is intact. |
| **Deviation** | None from integrity perspective. The transcript contains 2 rounds (INTENT → ASK) plus a `failure_event` with `code: "ACTIS-301"`, `stage: "negotiation"`, `fault_domain: "negotiation"`, `terminality: "terminal"`. Hash chain, signatures, checksums, and `final_hash` are all valid. |
| **Expected Result** | `ACTIS_COMPATIBLE` |
| **Expected Checks** | `signatures_ok: true`, `hash_chain_ok: true`, `schema_ok: true`, `replay_ok: true`, `checksums_ok: true` |
| **Expected `integrity_status`** | `VALID` |
| **Expected Notes** | Empty array. The failure event is part of the transcript content, not an integrity failure. |

> **Rationale:** ACTIS verifies evidence integrity, not transaction success. A transcript that records a failed negotiation is still valid evidence if its integrity checks pass.

---

### tv-008-partial-zero-signatures

| Field | Value |
|---|---|
| **Case ID** | `tv-008` |
| **Name** | `partial-zero-signatures` |
| **Scenario** | Valid layout, schema, hash chain, and checksums, but zero rounds have valid signatures. All signature fields contain placeholder values. |
| **Deviation** | All three rounds: `signature.signature_b58` set to `"1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"` (invalid signature). `signer_public_key_b58` remains valid. All other fields remain valid. |
| **Expected Result** | `ACTIS_PARTIAL` |
| **Expected Checks** | `signatures_ok: false`, `hash_chain_ok: true`, `schema_ok: true`, `replay_ok: false`, `checksums_ok: true` |
| **Expected `integrity_status`** | `TAMPERED` |
| **Expected Notes** | `["Signature verification failed for round 0", "Signature verification failed for round 1", "Signature verification failed for round 2"]` (or equivalent identifying all failed rounds) |

---

### 2.1 v1.1 vectors (bundle security and final_hash)

| Case ID | Name | Scenario | Expected |
|---------|------|----------|----------|
| **tv-009** | `noncompliant-incorrect-final-hash` | Valid bundle except `final_hash` does not match recomputation. | `ACTIS_NONCOMPLIANT`; `hash_chain_ok: false`, `replay_ok: false`. |
| **tv-010** | `noncompliant-duplicate-core-file` | Archive contains two entries for the same core path (e.g. `input/transcript.json` twice). | `ACTIS_NONCOMPLIANT`; bundle security rejection (duplicate path). |
| **tv-011** | `noncompliant-path-traversal` | Archive contains an entry with path traversal (e.g. `../input/transcript.json`). | `ACTIS_NONCOMPLIANT`; bundle security rejection (path traversal). |

Generate the v1.1 zip files with: `python3 scripts/gen_v1_1_vectors.py` (run from `actis/test-vectors/`).

---

## 3. Conformance Test Harness Specification

### 3.1 Runner Architecture

The conformance test harness is a CI-compatible tool that:

1. **Loads** each test vector definition (JSON or structured markdown).
2. **Constructs** the input bundle or transcript by applying the specified deviation to the baseline.
3. **Invokes** the implementation under test (IUT) to produce an ACTIS verification report.
4. **Compares** the IUT output against the expected output.
5. **Reports** pass/fail per vector, with details on mismatches.

### 3.2 Execution

Use the harness script `run_conformance.sh` in this directory. Set the `ACTIS_VERIFIER_CMD` environment variable to your verifier command (e.g. `actis-verify --zip` or `node ./myverifier.js --zip`). The script runs the verifier on each zip in `expected_results.json` and compares output to the expected report fields.

Example:

```bash
ACTIS_VERIFIER_CMD="your-verifier --zip" ./run_conformance.sh
```

The verifier MUST output JSON to stdout matching the ACTIS verification report schema (see ACTIS_STANDARD_v1.md §5).

### 3.3 Pass/Fail Criteria

A vector **passes** if and only if:

| Criterion | Rule |
|---|---|
| `integrity_status` | Exact string match with expected value |
| `signatures_ok` | Boolean match |
| `hash_chain_ok` | Boolean match |
| `schema_ok` | Boolean match |
| `replay_ok` | Boolean match |
| `checksums_ok` | Boolean match (for bundle-level vectors only) |
| `warnings` / notes | At least one warning message MUST be present when expected notes are non-empty. Exact wording is not required; the harness checks for substring presence of key terms (e.g., "round 1", "hash chain", "checksum"). |

### 3.4 Output Format

The harness produces a JSON results file:

```json
{
  "harness_version": "1.0",
  "iut_name": "your-verifier",
  "iut_version": "0.9.0",
  "timestamp": "2026-03-03T22:00:00Z",
  "vectors": [
    {
      "case_id": "tv-001",
      "name": "compatible-minimal",
      "status": "PASS",
      "expected_integrity_status": "VALID",
      "actual_integrity_status": "VALID",
      "check_mismatches": []
    },
    {
      "case_id": "tv-002",
      "name": "partial-invalid-signature",
      "status": "FAIL",
      "expected_integrity_status": "TAMPERED",
      "actual_integrity_status": "INDETERMINATE",
      "check_mismatches": [
        {
          "field": "integrity_status",
          "expected": "TAMPERED",
          "actual": "INDETERMINATE"
        }
      ]
    }
  ],
  "summary": {
    "total": 8,
    "passed": 7,
    "failed": 1,
    "skipped": 0
  }
}
```

### 3.5 Conformance Levels

| Level | Requirement |
|---|---|
| **ACTIS Core Conformant** | Pass tv-001 through tv-004, tv-007, tv-008 (transcript-level vectors) |
| **ACTIS Bundle Conformant** | Pass all vectors including tv-005 and tv-006 (bundle-level vectors) |
| **ACTIS Fully Conformant** | Pass all 8 vectors with no skips |

---

## 4. Baseline Bundle Construction

The baseline valid bundle for all test vectors is constructed as follows:

1. Use a valid ACTIS transcript (e.g. from `generated/tv-001-compatible-minimal.zip` or build from a 3-round INTENT→ASK→ACCEPT transcript with `transcript_version: "actis-transcript/1.0"`) as `input/transcript.json`.
2. Create `manifest.json`:
   ```json
   {
     "standard": { "name": "ACTIS", "version": "1.0" },
     "core_files": ["checksums.sha256", "manifest.json", "input/transcript.json"],
     "optional_files": []
   }
   ```
3. Generate `checksums.sha256` by computing SHA-256 of `manifest.json` and `input/transcript.json`.
4. Package as a ZIP archive.

Each test vector specifies a single deviation from this baseline. The harness applies the deviation, rebuilds the bundle (recomputing checksums only for vectors where the checksum file itself is valid), and invokes the IUT.

---

## 5. Future corpus additions (v1.1 or later)

The following are documented as **candidate** additions for a future corpus revision. They are not part of the v1.0 corpus; implementers are encouraged to handle them as specified in ACTIS_COMPATIBILITY.md §5 and ACTIS_AUDITOR_PACK.md §5.

| Candidate | Description | Normative rule |
|-----------|--------------|----------------|
| Incorrect `final_hash` present | Transcript has a `final_hash` that does not match recomputation | ACTIS_NONCOMPLIANT (or warning per implementation) |
| Duplicate core path in ZIP | Archive contains two or more entries for the same core path | ACTIS_NONCOMPLIANT (ACTIS_COMPATIBILITY.md §5) |
| Path traversal / symlink for core path | Core path is `../` or absolute, or is a symlink | ACTIS_NONCOMPLIANT (ACTIS_COMPATIBILITY.md §5) |
| Unlisted files | Archive contains files not in core_files or optional_files | MUST NOT affect actis_status; verifiers SHOULD warn |

Adding these as first-class vectors would require a corpus version bump and updated `expected_results.json`. The v1.0 corpus (tv-001..tv-008) remains stable.

---

*This corpus is versioned alongside ACTIS core. New vectors MAY be added in minor versions. Existing vector expected outputs MUST NOT change without a new ACTIS major version.*
