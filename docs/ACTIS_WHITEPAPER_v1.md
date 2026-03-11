ACTIS: A Deterministic Standard for Autonomous Transaction Evidence
Version 1.0 — March 2026

Abstract
Autonomous agents can now negotiate, commit, and settle transactions without human intervention. Existing audit infrastructure — logs, SOC 2 attestations, API receipts — was designed for human-mediated systems and provides no mechanism for independent parties to verify that a recorded sequence of events is unaltered, replay-consistent, or cryptographically attributable to specific participants.
ACTIS (Autonomous Coordination & Transaction Integrity Standard) defines a minimal, vendor-neutral format for producing and verifying cryptographically intact evidence of autonomous transactions. An ACTIS-compatible transcript is a hash-linked, Ed25519-signed JSON record that any party can verify offline, without trusting the system that produced it. ACTIS answers exactly one question: is this evidence cryptographically intact and deterministically reproducible?
ACTIS v1.0 has three conformant verifier implementations in Rust, TypeScript, and Python, each derived independently from the normative specification with no shared code between implementations. All three pass the full conformance corpus. The conformance corpus comprises tv-001–tv-008 (canonical ACTIS v1.0 compliance vectors) and tv-009–tv-011 (extended security-hardening vectors published alongside v1.0).

This document is explanatory. Normative ACTIS requirements are defined in ACTIS_STANDARD_v1.md, ACTIS_COMPATIBILITY.md, and the published schemas and conformance corpus. In the event of any conflict between this document and the normative specifications, the normative specifications take precedence. The ACTIS specification is implementation-independent. Conformance is determined exclusively by the published test corpus and verification model, not by reference implementations.

1. Introduction
The deployment of autonomous agents in commercial systems is accelerating. Agents now execute procurement decisions, negotiate service agreements, trigger financial settlements, and act on behalf of institutional principals — often without a human in the loop at the moment of commitment.
This creates an evidence problem.
When a dispute arises — a payment is contested, a commitment is denied, a policy violation is alleged — the parties involved need to answer a question that existing infrastructure cannot reliably answer: what actually happened, and can that record be trusted?
Application logs can be modified. API receipts are unilateral. SOC 2 attestations certify process, not outcomes. None of these provide a cryptographically verifiable, independently reproducible record of a specific transaction sequence.
ACTIS addresses this gap. It defines:

A transcript format: a hash-linked, signed JSON record of a transaction session
A bundle format: a portable evidence container with integrity verification
A verification model: deterministic, offline-verifiable checks with a canonical output report
A conformance corpus: 11 test vectors that any implementation must pass

ACTIS does not define negotiation protocols, settlement logic, identity systems, reputation scoring, or adjudication. It defines only the evidence layer — the minimum structure required for any independent party to verify that a recorded transaction sequence is unaltered and replay-consistent.

2. The Problem: Autonomous Transaction Evidence
2.1 The evidence gap
Traditional transaction systems produce evidence as a side effect of human-mediated processes. A signed contract, a wire transfer receipt, an email confirmation — these artifacts exist because humans produced and retained them. Their integrity is typically enforced by institutional trust: the bank, the notary, the counterparty's legal team.
Autonomous agent systems break this model in three ways.
Speed. Agents transact at machine speed, producing and consuming commitments in milliseconds. Human review of individual transactions is infeasible at scale.
Attribution. When an agent acts on behalf of a principal, the causal chain from instruction to outcome spans multiple systems, providers, and runtime environments. Attributing a specific outcome to a specific instruction requires a complete, ordered record of the intermediary steps.
Trust boundaries. Agent systems frequently cross organizational boundaries. A buyer agent deployed by one institution may negotiate with a seller agent deployed by another, using infrastructure provided by a third party. No single party controls the full record.
2.2 Why existing approaches fail
Application logs are mutable. Any party with write access to the logging infrastructure can alter or delete records. Logs are typically retained by the system operator, creating a conflict of interest in disputes.
API receipts are unilateral. A receipt issued by a service provider attests only that the provider received a request — not that the request was processed correctly, not what the agent actually sent, not what commitments were made downstream.
Audit databases are append-only by convention, not by construction. Cryptographic append-only guarantees require careful implementation that most systems do not provide.
Blockchain-based approaches solve the mutability problem but introduce dependencies on specific infrastructure, consensus mechanisms, and token economics that are inappropriate for enterprise deployments requiring vendor neutrality and offline verifiability. ACTIS intentionally avoids reliance on consensus networks or public ledgers. It focuses purely on deterministic, offline-verifiable evidence artifacts that can operate across heterogeneous systems without external infrastructure dependencies.
2.3 The requirement
A practical evidence standard for autonomous transactions needs to satisfy four properties:

Tamper-evidence: modification of any part of the record must be detectable by any verifier
Offline verifiability: verification must not require trust in any online service
Determinism: two independent verifiers given the same evidence must produce identical verdicts
Vendor neutrality: the standard must be implementable by any party without dependency on proprietary systems

ACTIS is designed around these four properties.

3. Design Principles
ACTIS is governed by five design principles that constrain every aspect of the specification.
3.1 Minimality
ACTIS defines only what is necessary for integrity verification. It does not define the content of messages, the semantics of negotiation, the structure of identities, or the logic of settlement. A minimal standard is easier to implement correctly, easier to audit, and harder to misuse.
3.2 Determinism
Every ACTIS operation must produce the same result given the same inputs, on any conformant implementation, on any platform, at any time. This requires specifying canonicalization precisely — ACTIS mandates RFC 8785 (JSON Canonicalization Scheme) for all hash inputs, which eliminates ambiguity in key ordering, number serialization, and string encoding.
3.3 Offline verifiability
A verification report must be producible from a bundle alone, without network access, without querying any external service, and without trusting the system that produced the bundle. This is the property that makes ACTIS evidence useful in adversarial contexts — disputes, audits, regulatory reviews.
3.4 Separation of concerns
ACTIS separates structural integrity from authentication. The hash chain proves that the structure of the transcript is unaltered. Signatures prove that participants authorized the rounds. These are independent verification dimensions: a transcript can have a valid hash chain but invalid signatures, or valid signatures over a structurally intact record. This separation is enforced by a normative invariant: hash_chain_ok must not depend on signature verification.
3.5 Implementability
The standard must be implementable from the specification alone, without reference to any existing implementation. ACTIS v1.0 has three independent conformant implementations — in Rust, TypeScript, and Python — derived independently from the specification documents. This is the practical test of implementability.

4. ACTIS Architecture
An ACTIS deployment consists of two layers with a strict separation between them.
Producer layer                    Verifier layer
────────────────                  ────────────────
agent runtime          ──────▶    transcript.json
negotiation logic                 bundle (.zip)
settlement logic                       │
                                       ▼
                                  verifier (offline)
                                       │
                                       ▼
                               verification report
The producer layer is out of scope for ACTIS. Any system that produces conformant transcripts and bundles is a valid ACTIS producer. ACTIS specifies only what the verifier checks and what the resulting evidence artifact must contain.

**4.1 Core concepts**

**Transcript**: A hash-linked, signed JSON record of a transaction session. A transcript contains one or more rounds, each representing a discrete step in the transaction. The transcript has a final_hash that commits to the complete record.

**Round**: The atomic unit of a transcript. Each round contains a round_type (one of INTENT, ASK, BID, COUNTER, ACCEPT, REJECT, ABORT), a message_hash committing to the round's content, an envelope_hash over which the signature is computed, a previous_round_hash linking to the prior round, and a round_hash committing to the round's structural content.

**Bundle**: A ZIP archive containing input/transcript.json, manifest.json, and checksums.sha256. The bundle is the unit of evidence exchange — a self-contained artifact that can be transmitted, stored, and verified independently.

**Verification report**: A JSON object with actis_status, schema_ok, hash_chain_ok, signatures_ok, checksums_ok, and replay_ok. The report is the canonical output of verification.

5. The Verification Model
ACTIS verification consists of four primary checks: schema validation, hash chain verification, signature verification, and bundle checksum verification. Each maps to a boolean in the verification report. A fifth field, replay_ok, reflects whether the transcript's final_hash, if present, matches the value recomputed from the canonical transcript representation. In ACTIS v1.0, replay_ok is false whenever hash_chain_ok is false. The checks are independent: failure of one does not prevent the others from running (with one exception: schema failure suppresses the final hash check, since the canonical form of an unknown-version transcript is undefined).
5.1 Check 1 — Schema and layout
The transcript must conform to the ACTIS transcript schema (version actis-transcript/1.0). Required top-level fields: transcript_version, transcript_id, intent_id, intent_type, created_at_ms, policy_hash, strategy_hash, identity_snapshot_hash, rounds. Each round must contain round_number, round_type, message_hash, envelope_hash, signature, timestamp_ms, previous_round_hash. The signature object is required in every round and must contain non-empty signer_public_key_b58 and signature_b58 fields. A round whose signature fails cryptographic verification does not fail schema validation; it affects only signatures_ok, producing ACTIS_PARTIAL rather than ACTIS_NONCOMPLIANT. The bundle must contain all three required files with no duplicate entries and no path traversal.
Maps to: schema_ok
5.2 Check 2 — Hash chain
The hash chain proves structural integrity. It has three components.
Genesis hash (round 0): previous_round_hash for round 0 is computed as:
SHA-256( UTF-8( intent_id + ":" + decimal(created_at_ms) ) )
This binds the chain to the specific transaction identity, preventing chain transplantation attacks.
For round n > 0, previous_round_hash MUST equal the round_hash of round n−1. Rounds cannot be reordered or inserted without breaking this linkage.
Round hash: Each round's round_hash is computed as:
round_hash = SHA-256( JCS( round_object \ { round_hash, signature } ) )
hash_chain_ok MUST NOT depend on signature verification. Signatures are excluded from round_hash computation precisely to preserve independence between structural integrity and authentication checks.
The signature field is explicitly excluded from the hash input. This is a normative design decision: signatures are attestations over the round's content, not part of the structural record. Including signatures in the hash chain would make hash_chain_ok depend on signatures_ok, collapsing two independent failure dimensions into one and preventing diagnostically useful partial results.
Final hash: The transcript's final_hash is computed as:
final_hash = SHA-256( JCS( transcript \ { final_hash, model_context } ) )
Maps to: hash_chain_ok, replay_ok
5.3 Check 3 — Checksums
The bundle's checksums.sha256 file lists SHA-256 hashes for the bundle's core files in standard sha256sum format (two-space separator). Each listed file must exist in the bundle and its computed hash must match the stored value.
Maps to: checksums_ok
5.4 Check 4 — Signatures
Each round's signature object contains signer_public_key_b58 (Ed25519 public key, Base58-encoded) and signature_b58 (Ed25519 signature, Base58-encoded). The signing message is the 40-byte concatenation of the UTF-8 encoding of the domain string "ACTIS/v1" (8 bytes) and the 32-byte binary value obtained by hex-decoding the round's envelope_hash field: signing_message = utf8("ACTIS/v1") || hex_decode(envelope_hash). The domain string prevents cross-protocol signature reuse. The raw hex-decoded envelope_hash alone is not the signing message. Verification uses standard Ed25519.
Maps to: signatures_ok
5.5 Status derivation
The four checks produce a canonical actis_status:

| Condition | actis_status |
|---|---|
| All four primary checks pass | ACTIS_COMPATIBLE |
| Checks 1–3 pass; one or more signatures invalid | ACTIS_PARTIAL |
| Any of checks 1–3 fail | ACTIS_NONCOMPLIANT |

ACTIS_PARTIAL indicates that the structural transcript is intact but one or more participants did not produce valid cryptographic signatures. This status preserves evidentiary value for structural verification while signaling incomplete authentication.
The verification report MAY include integrity_status as a compatibility alias: VALID when actis_status is ACTIS_COMPATIBLE, INDETERMINATE when ACTIS_PARTIAL, and TAMPERED when ACTIS_NONCOMPLIANT. This field is present in corpus expected_results.json for reference. New implementations SHOULD emit actis_status and MAY omit integrity_status. Consumers MUST use actis_status for conformance determination.
5.6 Canonicalization
All hash inputs use RFC 8785 JSON Canonicalization Scheme (JCS):

Object keys sorted lexicographically by Unicode code-unit order
No insignificant whitespace
Numbers serialized per ECMAScript NumberToString — 0.00005 not 5e-5
Strings use standard JSON escaping without Unicode normalization

JCS is mandatory. Implementations must use a conformant JCS implementation. JSON.stringify with sorted keys is not equivalent to JCS for all inputs.

6. Evidence Bundles
An ACTIS bundle is a ZIP archive with a defined layout:
bundle.zip
├── manifest.json          ← bundle metadata and core file list
├── input/
│   └── transcript.json    ← the ACTIS transcript
└── checksums.sha256       ← SHA-256 checksums of core files
6.1 Manifest
The manifest identifies the standard and version and lists the bundle's core files:
```json
{
  "standard": { "name": "ACTIS", "version": "1.0" },
  "core_files": ["checksums.sha256", "manifest.json", "input/transcript.json"]
}
```
6.2 Bundle security
Verifiers must enforce bundle security rules before transcript verification begins:

- **Path traversal rejection**: entries with `..` segments or absolute paths MUST be rejected.
- **Duplicate entry rejection**: ZIP archives containing duplicate entry names MUST be rejected.
- **Missing manifest**: absence of `manifest.json` is a schema/layout failure; the verifier MUST return `ACTIS_NONCOMPLIANT` with all verification booleans false.
- **Unreadable or malformed ZIP**: if the bundle cannot be opened or parsed, the verifier MUST return `ACTIS_NONCOMPLIANT` and MAY set all verification booleans to false.

These rules prevent a class of attacks where a crafted bundle produces misleading verification results by exploiting ZIP parser behavior.
6.3 Optional files
Bundles may contain additional files beyond the core set. Verifiers must ignore unrecognized files. This allows producers to include supplementary evidence — policy documents, agent configurations, settlement artifacts — without invalidating the core verification. Optional files are outside the ACTIS verification surface. Their presence MUST NOT affect verification results.

7. Conformance and Test Corpus
7.1 Conformance requirements
An implementation is ACTIS v1.0 compatible if it:

Accepts bundles as ZIP archives with the defined layout
Produces verification reports with the canonical fields and status values
Passes the full published ACTIS conformance corpus via the standard harness

Conformance is binary: an implementation either passes the full corpus or it does not. There is no partial conformance designation. Conformance is determined solely by matching the published expected results in expected_results.json for the full published corpus. No other criteria apply.
7.2 The conformance corpus
The published corpus currently contains 11 test vectors across two groups:
tv-001–tv-008 — canonical ACTIS v1.0 compliance corpus:

| Vector | Description | Expected status |
|---|---|---|
| tv-001 | Compatible minimal transcript | ACTIS_COMPATIBLE |
| tv-002 | Invalid signature, intact chain | ACTIS_PARTIAL |
| tv-003 | Wrong transcript_version | ACTIS_NONCOMPLIANT |
| tv-004 | Hash chain break | ACTIS_NONCOMPLIANT |
| tv-005 | Checksum tamper | ACTIS_NONCOMPLIANT |
| tv-006 | Missing manifest | ACTIS_NONCOMPLIANT |
| tv-007 | Compatible with failure event | ACTIS_COMPATIBLE |
| tv-008 | All signatures cryptographically invalid | ACTIS_PARTIAL |

tv-009–tv-011 — extended security-hardening vectors published alongside v1.0:

| Vector | Description | Expected status |
|---|---|---|
| tv-009 | Incorrect final_hash | ACTIS_NONCOMPLIANT |
| tv-010 | Duplicate core file in ZIP | ACTIS_NONCOMPLIANT |
| tv-011 | Path traversal in ZIP entry | ACTIS_NONCOMPLIANT |

The extended vectors (tv-009–tv-011) test security properties already required by the v1.0 specification. They do not introduce new normative behavior.
7.3 Conformance matrix

| Requirement | Normative source | Verified by |
|---|---|---|
| Transcript schema and required fields | ACTIS_STANDARD_v1.md + actis_transcript_v1.json | tv-003 |
| Bundle layout and manifest presence | ACTIS_COMPATIBILITY.md §5 | tv-006 |
| Hash chain linkage and round_hash | ACTIS_COMPATIBILITY.md §3.2 | tv-004 |
| final_hash recomputation | ACTIS_COMPATIBILITY.md §3.4 | tv-009 |
| Ed25519 signature verification | ACTIS_COMPATIBILITY.md §4 | tv-002, tv-008 |
| Checksums | ACTIS_COMPATIBILITY.md §5 | tv-005 |
| Duplicate ZIP entry rejection | ACTIS_COMPATIBILITY.md §5 | tv-010 |
| Path traversal rejection | ACTIS_COMPATIBILITY.md §5 | tv-011 |
| Compatible with failure event | ACTIS_COMPATIBILITY.md §6 | tv-007 |

7.4 Running conformance
```bash
ACTIS_VERIFIER_CMD="your-verifier <zip-path>" \
  bash actis/test-vectors/run_conformance.sh
```
The harness compares each vector's output against expected_results.json. All 11 vectors must pass.
7.5 Corpus invariants
The corpus encodes several normative invariants that implementations must satisfy:

hash_chain_ok must be true for tv-002 and tv-008 — signature invalidity must not affect the hash chain check
schema_ok must be false for tv-006 — missing manifest is a schema/layout failure
actis_status must be ACTIS_PARTIAL (not ACTIS_NONCOMPLIANT) for tv-002 and tv-008

An implementation that passes all 11 vectors necessarily implements these invariants correctly.

8. Security Model
ACTIS assumes the continued collision resistance of SHA-256 and the security of Ed25519. If either primitive is compromised, ACTIS integrity guarantees no longer hold.
8.1 What ACTIS proves
A bundle with actis_status: ACTIS_COMPATIBLE provides the following guarantees:
Structural integrity: The transcript has not been modified since final_hash was computed. Any change to any field in any round, or to the transcript metadata, produces a different final_hash and causes hash_chain_ok to be false.
Round linkage: Each round's previous_round_hash correctly references the prior round. Rounds cannot be reordered, inserted, or removed without breaking the chain.
Participant authorization: Each round's signature verifies against the stated public key over the round's envelope_hash. Participants cannot later deny having authorized the rounds they signed.
Bundle integrity: The files in the bundle match the checksums recorded at bundle creation time. Bundle contents have not been substituted or modified after sealing.
8.2 What ACTIS does not prove
Content correctness: ACTIS verifies that message_hash is present and well-formed, but does not verify what the message contained. The content of messages is outside ACTIS scope.
Key authenticity: ACTIS verifies that a signature was produced by the key stated in signer_public_key_b58. It does not verify that this key belongs to any particular real-world identity. Key-to-identity binding requires a separate identity layer.
Liveness: ACTIS cannot prove that a transcript was produced in real time rather than constructed after the fact. Timestamp fields are present but not cryptographically bound to external time sources.
Completeness: ACTIS cannot prove that a bundle contains the complete transaction record. A producer could omit rounds before bundling. Completeness guarantees require higher-level protocol commitments outside ACTIS scope.
8.3 Threat model
Transcript tampering: Modification of any transcript field after round_hash or final_hash computation is detectable. An adversary cannot modify a transcript and produce a valid hash chain without knowledge of a collision in SHA-256.
Round reordering: The previous_round_hash chain binds rounds in sequence. Reordering rounds breaks the chain.
Signature stripping: Removing signatures produces ACTIS_PARTIAL rather than ACTIS_COMPATIBLE. Verifiers and consumers must treat ACTIS_PARTIAL as a distinct state — structurally intact but unauthenticated.
Genesis substitution: The genesis hash binds the chain to intent_id and created_at_ms. A chain transplant — taking valid rounds from one transcript and inserting them into another transcript — produces a genesis hash mismatch on round 0.
Path traversal in bundles: Crafted ZIP archives with .. path segments or duplicate entries are rejected by the bundle security rules before any transcript processing occurs.
Re-signing attack: Excluding signatures from round_hash preserves separation between structural integrity and authentication. An attacker can construct a new unsigned transcript with internally consistent structural hashes, but cannot transform a signed transcript into an unsigned one without changing transcript hashes and producing a different evidence artifact. The verifier correctly reports such an artifact as structurally intact but unauthenticated (ACTIS_PARTIAL). Cross-protocol signature reuse is prevented by the domain string "ACTIS/v1" prepended to the signing message.

**Equivocation (split-view attack):** ACTIS verifies that a presented transcript bundle is internally intact and replay-consistent. It does not prove that no alternate valid transcript exists for the same underlying transaction. An actor with a valid signing key may produce multiple transcripts that each verify independently. Preventing equivocation requires external coordination mechanisms such as bilateral counter-signing, append-only transparency log anchoring, or external transaction registry binding. This limitation is explicitly acknowledged; see §7.2 of ACTIS_STANDARD_v1.md.

9. Governance
ACTIS is governed as an open standard. The governance model is documented in actis/GOVERNANCE.md.
Specification authority: The normative specification is maintained in the ACTIS repository. Changes to normative documents require review against the conformance corpus — any change that causes a previously passing implementation to fail a published corpus vector is a breaking change and requires a version increment.
Conformance corpus authority: The corpus is versioned independently of the specification. New vectors may be added in minor corpus versions (e.g., v1.1) without changing the specification version, provided all new vectors test behavior already specified in the current normative documents.
IP commitment: The ACTIS IP commitment (actis/docs/ACTIS_IP_COMMITMENT.md) provides a patent non-assert for all implementers. Any party may implement ACTIS v1.0 without patent encumbrance from the specification authors.
Licensing: The specification, schemas, test vectors, and conformance harness are licensed under Apache 2.0.
Implementations: Third-party implementations are not governed by this repository. An implementation is considered conformant when it passes the full corpus. The ACTIS project maintains a registry of known conformant implementations at actis.world/implementations.

10. Future Work
ACTIS v1.0 is intentionally minimal. The following areas are candidates for future specification work, listed for informational purposes only. None of these are commitments, and none affect v1.0 conformance.
Merkle bundle format: For very large transcripts, a Merkle-structured bundle format would allow selective disclosure — proving a specific subset of rounds without revealing the full transcript. This requires a new bundle format version.
Canonical transcript compression: Long transcripts with many rounds produce large bundles. A canonical compression scheme would reduce storage and transmission costs without affecting verification semantics.
Streaming verification: The current model requires a complete bundle to verify. A streaming variant would allow incremental verification of rounds as they are produced, enabling real-time integrity monitoring.
These items are noted to indicate the design space. ACTIS v2 planning has not begun. The stability of v1.0 is a feature.

References

RFC 8785 — JSON Canonicalization Scheme (JCS)
RFC 8032 — Edwards-Curve Digital Signature Algorithm (EdDSA)
RFC 2119 — Key words for use in RFCs to Indicate Requirement Levels
RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words
ACTIS_STANDARD_v1.md — Normative specification
ACTIS_COMPATIBILITY.md — Normative algorithms and conformance levels
actis_transcript_v1.json — Normative transcript schema
ACTIS_AUDITOR_PACK.md — Bundle format specification


Appendix A — Example verification report
```json
{
  "actis_version": "1.0",
  "actis_status": "ACTIS_COMPATIBLE | ACTIS_PARTIAL | ACTIS_NONCOMPLIANT",
  "integrity_status": "VALID | INDETERMINATE | TAMPERED",
  "schema_ok": true,
  "hash_chain_ok": true,
  "signatures_ok": true,
  "checksums_ok": true,
  "replay_ok": true,
  "warnings": [],
  "errors": []
}
```

Note: integrity_status is a deprecated compatibility alias. New implementations MAY omit it. actis_status is the canonical conformance field. Consumers MUST use actis_status for conformance determination.

Appendix B — Example transcript
```json
{
  "transcript_version": "actis-transcript/1.0",
  "transcript_id": "transcript-<sha256hex>",
  "intent_id": "...",
  "intent_type": "...",
  "created_at_ms": 1000000000000,
  "policy_hash": "<sha256hex>",
  "strategy_hash": "<sha256hex>",
  "identity_snapshot_hash": "<sha256hex>",
  "rounds": [
    {
      "round_number": 0,
      "round_type": "INTENT",
      "message_hash": "<sha256hex>",
      "envelope_hash": "<sha256hex>",
      "signature": {
        "signer_public_key_b58": "<base58>",
        "signature_b58": "<base58>",
        "scheme": "ed25519"
      },
      "timestamp_ms": 1000000000000,
      "previous_round_hash": "<sha256hex>",
      "round_hash": "<sha256hex>",
      "agent_id": "buyer",
      "content_summary": {}
    }
  ],
  "final_hash": "<sha256hex>"
}
```

Appendix C — Hash formula reference

| Hash | Formula |
|---|---|
| Genesis previous_round_hash | SHA-256(UTF-8(intent_id + ":" + decimal(created_at_ms))) |
| round_hash | SHA-256(JCS(round \ {round_hash, signature})) |
| final_hash | SHA-256(JCS(transcript \ {final_hash, model_context})) |
| Signing message | hex_decode(envelope_hash) → 32 bytes |
| Checksum | SHA-256(file_bytes) → lowercase hex |

All SHA-256 outputs are 64 lowercase hex characters. JCS per RFC 8785.

ACTIS v1.0. Apache License 2.0. Patent non-assert: actis/docs/ACTIS_IP_COMMITMENT.md.
