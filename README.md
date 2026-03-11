---
# ACTIS — Autonomous Coordination & Transaction Integrity Standard

**What ACTIS is:** A vendor-neutral, open standard for transcript and evidence-bundle integrity verification and deterministic replay. ACTIS defines how to produce and verify cryptographically intact, hash-linked evidence so that any independent party can confirm that recorded events are unaltered and replay-consistent.

**What ACTIS is not:** ACTIS does not define adjudication, settlement, blame, reputation, or risk scoring. It answers one question: *"Is this evidence cryptographically intact and deterministically reproducible?"*

---

## Implementations

ACTIS v1.0 has two independent conformant implementations:

| Implementation | Language | Conformance | Location |
|---|---|---|---|
| actis-verifier-rust | Rust | 11/11 corpus vectors | `actis-verifier-rust/` |
| actis-verifier-ts | TypeScript | 11/11 corpus vectors | `actis-verifier-ts/` |

Both implementations derive their logic independently from the normative spec. Neither shares code with the other.

To claim ACTIS compatibility, an implementation must pass the full conformance corpus via `run_conformance.sh`.

---

## Canonical documents

Classification and paths are defined in [docs/NORMATIVE_INDEX.md](./docs/NORMATIVE_INDEX.md).

**Normative:** [ACTIS_STANDARD_v1.md](./docs/ACTIS_STANDARD_v1.md) · [ACTIS_COMPATIBILITY.md](./docs/ACTIS_COMPATIBILITY.md) · [actis_transcript_v1.json](./schemas/actis_transcript_v1.json) · [ACTIS_AUDITOR_PACK.md](./docs/ACTIS_AUDITOR_PACK.md) · [ACTIS_AUTHORIZATION_EVIDENCE.md](./docs/ACTIS_AUTHORIZATION_EVIDENCE.md) · [ACTIS_SCOPE_v1.md](./docs/ACTIS_SCOPE_v1.md) · [ACTIS_SEMANTIC_CONVENTIONS_v1.md](./docs/ACTIS_SEMANTIC_CONVENTIONS_v1.md)

**Informational:** [ACTIS_BUNDLE_INTEGRATION_GUIDE.md](./docs/ACTIS_BUNDLE_INTEGRATION_GUIDE.md) · [ACTIS_INTEROP_EVENT_v1.md](./docs/ACTIS_INTEROP_EVENT_v1.md) · [ACTIS_EU_AI_ACT_ALIGNMENT.md](./docs/ACTIS_EU_AI_ACT_ALIGNMENT.md) · [ACTIS_NIST_AI_RMF_MAPPING.md](./docs/ACTIS_NIST_AI_RMF_MAPPING.md) · [GOVERNANCE.md](./GOVERNANCE.md)

**IP Commitment:** [ACTIS_IP_COMMITMENT.md](./docs/ACTIS_IP_COMMITMENT.md) — patent non-assert commitment for implementers.

**Licensing:** Apache License, Version 2.0. See [LICENSE](./LICENSE).

---

## Conformance corpus — v1.1

11 test vectors across two surfaces:

**v1.0 vectors (tv-001–tv-008):** schema, hash chain, signatures, checksums, replay.
**v1.1 vectors (tv-009–tv-011):** bundle security — final hash integrity, duplicate entries, path traversal.

Full corpus table: [test-vectors/CONFORMANCE.md](./test-vectors/CONFORMANCE.md)

To run conformance against your implementation:
```bash
ACTIS_VERIFIER_CMD="your-verifier <zip-path>" bash test-vectors/run_conformance.sh
```

---

## Core concepts

1. **Transcript** — Hash-linked, Ed25519-signed JSON record of a session or transaction.
2. **round_hash** — SHA-256 of the round object excluding `round_hash` and `signature` keys (structural integrity; independent of authentication).
3. **final_hash** — SHA-256 of the transcript object excluding `final_hash` and `model_context`.
4. **Manifest** — JSON describing bundle contents and core files.
5. **Bundle** — ZIP with manifest, transcript at `input/transcript.json`, and `checksums.sha256`.
6. **Verification report** — JSON with `actis_status`, `schema_ok`, `hash_chain_ok`, `signatures_ok`, `checksums_ok`, `replay_ok`.

**Key invariant:** `hash_chain_ok` is independent of signature verification. Signatures are attestations, not structural state.

---

## Verification report
```json
{
  "actis_version": "1.0",
  "actis_status": "ACTIS_COMPATIBLE",
  "integrity_status": "VALID",
  "schema_ok": true,
  "hash_chain_ok": true,
  "signatures_ok": true,
  "checksums_ok": true,
  "replay_ok": true,
  "warnings": [],
  "errors": []
}
```

`actis_status` values:
- `ACTIS_COMPATIBLE` — all checks pass
- `ACTIS_PARTIAL` — schema, hash chain, checksums pass; one or more signatures missing or invalid
- `ACTIS_NONCOMPLIANT` — any of schema, hash chain, or checksums fail

---

## Implement from scratch

1. **Read the schema** — [schemas/actis_transcript_v1.json](./schemas/actis_transcript_v1.json)
2. **Read the algorithms** — [docs/ACTIS_COMPATIBILITY.md](./docs/ACTIS_COMPATIBILITY.md) — normative hash formulas, canonicalization (RFC 8785), signing input, checksums, replay.
3. **Generate a transcript** — emit JSON with `transcript_version: "actis-transcript/1.0"`, required fields, valid hash chain, Ed25519 signatures, package as bundle.
4. **Run the conformance harness** — `ACTIS_VERIFIER_CMD="your-verifier" bash test-vectors/run_conformance.sh` — must pass 11/11.

---

## Project structure
actis/
├── README.md
├── LICENSE
├── GOVERNANCE.md
├── VERSION
├── docs/              ← Normative and informational documents
├── schemas/           ← actis_transcript_v1.json, actis_manifest_v1.json
└── test-vectors/      ← tv-001..tv-011 corpus, run_conformance.sh, CONFORMANCE.md
actis-verifier-rust/   ← Reference Rust implementation
actis-verifier-ts/     ← Independent TypeScript implementation

---

*ACTIS is an open standard. Conformant implementations from any party are welcome.*
---
