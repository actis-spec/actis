# ACTIS v1 — Audit-Compliant Transaction Integrity Standard

**Version:** 1.0  
**Status:** Normative  
**Protocol identifier:** actis/1.0

This document is the single normative entrypoint for the ACTIS standard. It defines integrity verification and replay semantics for signed, hash-linked transaction evidence. It does not define blame, reputation, risk scoring, or settlement rails.

---

## 1. Purpose

ACTIS specifies:

1. **Integrity verification** — Whether evidence is cryptographically intact: signature validity, hash-chain validity, and checksum consistency.
2. **Replay** — Whether a transcript can be deterministically replayed and produces the same integrity outcomes (e.g. same round hashes, same final hash).

Conformance to ACTIS means a verifier accepts only the inputs and outputs defined in this standard and reports only the fields defined in the verification report schema (§5). Any additional inputs, outputs, or semantics are out of scope.

---

## 2. Non-goals

The following are **not** part of ACTIS and must not appear as normative requirements or as keys in the canonical ACTIS verification report:

- Blame or fault determination (who is at fault).
- Reputation, confidence scoring, or risk tiers.
- Risk or actuarial scoring (e.g. outcome probability estimates).
- Settlement rails, payment, or money movement.
- Claim qualification, disbursement, or underwriting decisions.
- Identity or credential verification beyond what is required to verify signatures on the transcript.

Implementations that produce or consume such information must treat it as optional, non-ACTIS data (e.g. in separate attachments or clearly labeled non-ACTIS sections).

---

## 2.1 Canonical Identifiers (v1.0.0)

The following identifiers are the normative reference for implementations. They MUST be used when referencing the standard, schema, report format, or bundle format in manifests, tooling, or documentation.

| Identifier | Value |
|------------|-------|
| ACTIS_STANDARD_ID | `ACTIS/1.0.0` |
| TRANSCRIPT_SCHEMA_ID | `actis.transcript.v1` |
| REPORT_SCHEMA_ID | `actis.report.v1` |
| BUNDLE_FORMAT_ID | `actis.bundle.v1` |

Full definitions and stability rules: [ACTIS_CANONICAL_IDS.md](../ACTIS_CANONICAL_IDS.md) (repository path: `actis/ACTIS_CANONICAL_IDS.md`).

---

## 3. Formats

### 3.1 Transcript

- A **transcript** is a JSON document that represents a single negotiation or transaction session.
- It MUST be hash-linked: each round (or equivalent unit) MUST include or reference a content hash; the chain MUST link to a final hash.
- It MUST include signature material so that each required signer's contribution can be verified.
- Schema and version requirements are defined by the transcript schema in use (e.g. a versioned transcript format). ACTIS verifiers MUST validate schema and version before reporting integrity.

### 3.2 Manifest

- A **manifest** is a JSON document that describes an evidence bundle.
- It MUST list the bundle's contents (e.g. file paths or entry identifiers) and MAY list content hashes or other integrity metadata.
- For ACTIS-aligned bundles, the manifest MAY include:
  - `standard`: `{ "name": "ACTIS", "version": "1.0" }`
  - `core_files`: array of paths required for ACTIS verification (e.g. `["checksums.sha256", "manifest.json", "input/transcript.json"]`).
  - `optional_files`: array of paths that are not required for ACTIS validity.

When `standard.name` is `"ACTIS"`, verification MUST require only the files listed in `core_files` (or the default core set). All other files are optional for ACTIS pass/fail.

### 3.3 Bundle

- A **bundle** is a container (e.g. a ZIP archive) that includes at least:
  - A manifest.
  - A transcript (e.g. at a path such as `input/transcript.json`).
  - Integrity data (e.g. a checksum file) covering at least the core files.
- Additional files MAY be present. If the manifest declares them as optional, they MUST NOT affect ACTIS verification outcome (pass/fail). Verifiers MAY report their presence as a neutral notice (e.g. `optional_attachments_present`).

---

## 4. Verification semantics

Verification outcomes MUST be computed using the algorithms defined in [ACTIS_COMPATIBILITY.md](./ACTIS_COMPATIBILITY.md).

- **Checksums:** All paths in the manifest's core set (or default core set) MUST be present in the bundle and MUST match the checksums in the bundle's checksum file.
- **Hash chain:** The transcript's hash chain MUST be valid (each round's hash matches recomputation; final hash consistent).
- **Signatures:** All required signatures on the transcript MUST verify.
- **Replay:** For v1.0, replay is hash-chain recomputation only: recompute round hashes and final_hash (if present) and confirm equality with claimed values. For v1.0, `replay_ok` SHALL equal `hash_chain_ok`. Signature validity is reported via `signatures_ok` only. See ACTIS_COMPATIBILITY.md §3.7 for normative algorithms.

A bundle passes ACTIS verification if and only if all of the above hold. No other criteria (e.g. presence or content of optional files) may affect the ACTIS pass/fail result.

---

## 5. Verification report schema

The canonical ACTIS verification report is a single JSON object. No key in this object may encode blame, reputation, risk scoring, or settlement. The following keys are normative.

**Canonical status field:** `actis_status` is the canonical status field and MUST be one of:

- `ACTIS_COMPATIBLE`
- `ACTIS_PARTIAL`
- `ACTIS_NONCOMPLIANT`

`integrity_status` is a deprecated compatibility alias retained for legacy implementations. Implementations MAY emit additional diagnostic values in `integrity_status` (e.g. `"TAMPERED"`, `"VALID"`, `"INDETERMINATE"`), but these MUST map to one of the canonical `actis_status` values. Consumers MUST use only `actis_status` for conformance determination.

**Required:**

| Field | Type | Description |
|-------|------|-------------|
| `actis_version` | string | ACTIS version, e.g. `"1.0"`. |
| `actis_status` | string | **Canonical** conformance level. One of exactly: `ACTIS_COMPATIBLE`, `ACTIS_PARTIAL`, `ACTIS_NONCOMPLIANT`. Case-sensitive. |
| `signatures_ok` | boolean | All required signatures verified. |
| `hash_chain_ok` | boolean | Hash chain intact. |
| `schema_ok` | boolean | Transcript schema valid. |
| `replay_ok` | boolean | Deterministic replay succeeded. |
| `warnings` | string[] | Neutral warnings (no blame or risk). |

**Optional:**

| Field | Type | Description |
|-------|------|-------------|
| `integrity_status` | string | **Deprecated alias.** One of: `"VALID"`, `"TAMPERED"`, `"INDETERMINATE"`. When present, MUST match the semantics of `actis_status` (VALID↔ACTIS_COMPATIBLE, INDETERMINATE↔ACTIS_PARTIAL, TAMPERED↔ACTIS_NONCOMPLIANT or ACTIS_PARTIAL per ACTIS_COMPATIBILITY.md). New implementations SHOULD emit `actis_status` and MAY omit `integrity_status`. |
| `checksums_ok` | boolean | Bundle checksums valid for core files. |
| `recompute_ok` | boolean | Recomputed artifacts match bundle (when applicable). |
| `evidence_refs_checked_count` | number | Number of evidence refs checked. |
| `files_hashed_count` | number | Number of files hashed in replay. |
| `optional_attachments_present` | string[] | Namespaces of optional attachments present (e.g. `["vendor/*"]`). Informational only. |

**Example:**

```json
{
  "actis_version": "1.0",
  "actis_status": "ACTIS_COMPATIBLE",
  "signatures_ok": true,
  "hash_chain_ok": true,
  "schema_ok": true,
  "replay_ok": true,
  "checksums_ok": true,
  "warnings": []
}
```

---

## 6. Compatibility requirements

- **Implementations** that claim ACTIS conformance MUST consume transcripts and bundles that satisfy the format requirements in §3 and MUST produce reports that conform to §5.
- **Consumers** of ACTIS reports MUST treat only the fields defined in §5 as normative for ACTIS; any extra fields are non-ACTIS and must not be used to infer ACTIS pass/fail.
- **Backward compatibility:** Future ACTIS versions that add optional report fields or optional manifest fields MUST remain backward compatible for the core semantics (integrity, replay, report schema). Breaking changes require a new major version of the standard.

---

## Developer note: separation of concerns

- **ACTIS** defines only neutral verification (integrity, replay, report schema). Conformant implementations MUST NOT require or normatively reference blame, reputation, risk scoring, or settlement.
- **Vendor-specific extensions** (e.g. fault determination, actuarial snapshots, reputation snapshots, underwriting summaries) are optional, non-standard attachments. They MUST be clearly labeled as such and MUST NOT affect ACTIS pass/fail. Bundles and UIs should keep them in separate namespaces or panels from the ACTIS verification result.

---

Non-normative examples: multiple implementations may exist. ACTIS conformance is determined by the normative documents and the test vector corpus; no specific implementation is required.

*ACTIS is an open standard. Contributions and implementations from any party are welcome.*
