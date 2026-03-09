# ACTIS — Autonomous Coordination & Transaction Integrity Standard

**What ACTIS is:** ACTIS is a vendor-neutral, open standard for transcript and evidence-bundle integrity verification and deterministic replay. It defines how to produce and verify cryptographically intact, hash-linked evidence so that any independent party can confirm that recorded events are unaltered and replay-consistent.

**What ACTIS is not:** ACTIS does not define adjudication, settlement, blame, reputation, or risk scoring. It answers one question: *"Is this evidence cryptographically intact and deterministically reproducible?"* Compliance, fault determination, and business outcomes are out of scope.

---

## Canonical documents

Classification and paths are defined in [docs/NORMATIVE_INDEX.md](./docs/NORMATIVE_INDEX.md).

**Normative:** [ACTIS_STANDARD_v1.md](./docs/ACTIS_STANDARD_v1.md) · [ACTIS_COMPATIBILITY.md](./docs/ACTIS_COMPATIBILITY.md) · [actis_transcript_v1.json](./schemas/actis_transcript_v1.json) · [ACTIS_AUDITOR_PACK.md](./docs/ACTIS_AUDITOR_PACK.md) · [ACTIS_AUTHORIZATION_EVIDENCE.md](./docs/ACTIS_AUTHORIZATION_EVIDENCE.md) · [ACTIS_SCOPE_v1.md](./docs/ACTIS_SCOPE_v1.md) · [ACTIS_SEMANTIC_CONVENTIONS_v1.md](./docs/ACTIS_SEMANTIC_CONVENTIONS_v1.md)

**Informational:** [ACTIS_BUNDLE_INTEGRATION_GUIDE.md](./docs/ACTIS_BUNDLE_INTEGRATION_GUIDE.md) · [ACTIS_INTEROP_EVENT_v1.md](./docs/ACTIS_INTEROP_EVENT_v1.md) · [ACTIS_EU_AI_ACT_ALIGNMENT.md](./docs/ACTIS_EU_AI_ACT_ALIGNMENT.md) · [ACTIS_NIST_AI_RMF_MAPPING.md](./docs/ACTIS_NIST_AI_RMF_MAPPING.md) · [GOVERNANCE.md](./GOVERNANCE.md)

**IP Commitment:** [ACTIS_IP_COMMITMENT.md](./docs/ACTIS_IP_COMMITMENT.md) — patent non-assert commitment for implementers.

**Licensing:** This repository is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE). The patent non-assert commitment in ACTIS_IP_COMMITMENT.md is separate from and in addition to the Apache-2.0 license.

---

## Implement from scratch

1. **Read the schema** — [schemas/actis_transcript_v1.json](./schemas/actis_transcript_v1.json) defines the transcript format. [ACTIS_COMPATIBILITY.md](./docs/ACTIS_COMPATIBILITY.md) defines the normative algorithms (round-0 hash, canonicalization, signing input, checksums, replay).
2. **Generate a transcript** — Emit JSON with `transcript_version: "actis-transcript/1.0"`, required fields, valid hash chain, and Ed25519 signatures. Package as a bundle with `input/transcript.json`, `manifest.json`, and `checksums.sha256`.
3. **Run a verifier** — Your verifier (or any ACTIS v1.0–compatible verifier) checks layout, schema, hash chain, signatures, and checksums; it outputs a verification report per [ACTIS_STANDARD_v1.md §5](./docs/ACTIS_STANDARD_v1.md).
4. **Run the conformance harness** — From `actis/test-vectors/`, run `./run_conformance.sh` with `ACTIS_VERIFIER_CMD` set to your verifier. The harness validates your implementation against the tv-001..tv-008 corpus.

No particular vendor or service is required. The standard and test vectors are self-contained under `actis/`.

---

## Core concepts

1. **Transcript** — Hash-linked, signed JSON record of a session or transaction.
2. **Manifest** — JSON describing bundle contents and core files.
3. **Bundle** — Container (e.g. ZIP) with manifest, transcript at `input/transcript.json`, and integrity data.
4. **Verification report** — Canonical JSON with `actis_status` (ACTIS_COMPATIBLE | ACTIS_PARTIAL | ACTIS_NONCOMPLIANT), `schema_ok`, `hash_chain_ok`, `signatures_ok`, `replay_ok`, `checksums_ok`, and `warnings`.

---

## Verification report (summary)

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

Full schema and conformance levels: [ACTIS_COMPATIBILITY.md](./docs/ACTIS_COMPATIBILITY.md).

---

## Project structure

```
actis/
├── README.md
├── LICENSE            ← Apache-2.0
├── GOVERNANCE.md
├── docs/              ← Normative and informational documents
├── schemas/           ← actis_transcript_v1.json, actis_manifest_v1.json
├── test-vectors/      ← tv-001..tv-008 corpus, expected_results.json, run_conformance.sh
└── ...
```

ACTIS is implementation-agnostic. Conformant implementations may be built by any party; the standard does not mandate any vendor or codebase.

---

*ACTIS is an open standard. Contributions and implementations from any party are welcome.*
