# ACTIS Conformance Matrix

This document maps core ACTIS requirements to normative spec sections, conformance corpus coverage, and the reference Rust verifier implementation. It is an aid to transparency and independent implementability. The **ACTIS standard** is defined by the normative docs; the **conformance corpus** is the set of test vectors; the **reference verifier** is one implementation and is not required for conformance.

**Normative core:** ACTIS_STANDARD_v1.md, ACTIS_COMPATIBILITY.md.

---

## Matrix

| Requirement | Normative source | Corpus coverage | Reference implementation | Notes |
|-------------|------------------|-----------------|---------------------------|-------|
| Transcript schema validation | ACTIS_STANDARD_v1 §3.1; §4 (verification semantics) | tv-001 (pass), tv-003 (fail) | `src/schema.rs`; called from `src/verify.rs` | Schema/version MUST be validated before reporting integrity. |
| Canonical JSON / hash determinism | ACTIS_COMPATIBILITY §2.2 (RFC 8785), §3.2, §3.4; ACTIS_STANDARD_v1 §3.1 (no Unicode normalization) | tv-001, tv-004 (hash chain), tv-009 (final_hash) | `src/canonicalize.rs`; used by `src/hashchain.rs` | tv-009 is extended security (final_hash); canonical corpus covers chain via tv-004. |
| envelope_hash construction | ACTIS_COMPATIBILITY §2 (Envelope Hash Construction), §2.1–§2.3 | tv-001, tv-002 (invalid signature / hash) | `src/signatures.rs` (verifies over decoded envelope_hash); envelope object build implied by verification | Signature verification uses envelope_hash value; construction in spec §2. |
| round_hash computation | ACTIS_COMPATIBILITY §3.2 (Round hash) | tv-001, tv-004 (hash chain break) | `src/hashchain.rs` | Canonical JSON of round excluding round_hash, then SHA-256. |
| final_hash computation | ACTIS_COMPATIBILITY §3.4 (Final hash) | tv-001; tv-009 (incorrect final_hash, extended only) | `src/hashchain.rs` | tv-009 is extended security vector only. |
| Ed25519 signature verification | ACTIS_COMPATIBILITY §4 (Signature Verification); ACTIS_STANDARD_v1 §4 | tv-001 (pass), tv-002 (invalid sig), tv-008 (zero sigs) | `src/signatures.rs`; called from `src/verify.rs` | Message = envelope_hash (64 hex → 32 bytes per §4). |
| Checksum validation | ACTIS_STANDARD_v1 §4; ACTIS_COMPATIBILITY §5 (manifest/checksum file) | tv-001, tv-005 (tampered), tv-006 (missing manifest) | `src/checksums.rs`; called from `src/verify.rs` | Strict format: 64 hex, two spaces, path. |
| Manifest / core file expectations | ACTIS_STANDARD_v1 §3.2, §3.3; ACTIS_COMPATIBILITY §5 (Manifest and Bundle Rules) | tv-005, tv-006 (bundle-level); tv-010 (duplicate, extended) | `src/bundle.rs` (reads manifest/transcript/checksums); `src/checksums.rs` | Default core set: checksums.sha256, manifest.json, input/transcript.json. |
| actis_status decision tree | ACTIS_COMPATIBILITY §6 (actis_status Decision Tree); ACTIS_STANDARD_v1 §5 (report schema) | All vectors (each expects specific actis_status) | `src/status.rs`; `src/verify.rs` assembles StatusInput | (1) schema/layout, (2) hash chain, (3) checksums, (4) signatures → COMPATIBLE/PARTIAL/NONCOMPLIANT. |
| Duplicate path rejection | ACTIS_COMPATIBILITY §5 (Bundle security); §6 (1) | tv-010 only (extended security) | `src/bundle.rs` (seen_paths; returns BundleSecurity) | Not in canonical v1 corpus (tv-001–tv-008). |
| Path traversal rejection | ACTIS_COMPATIBILITY §5 (Bundle security); §6 (1) | tv-011 only (extended security) | `src/bundle.rs` (is_invalid_path) | Rejects ../, absolute, drive prefixes. Extended only. |
| Symlink rejection | ACTIS_COMPATIBILITY §5 (Bundle security); §6 (1) | Not covered by current corpus | `src/bundle.rs` (unix_mode S_IFLNK) | Documented and implemented; no dedicated vector. |
| Canonical corpus scope (tv-001–tv-008) | ACTIS_STANDARD_v1; ACTIS_COMPATIBILITY; test-vectors/expected_results.json | tv-001 through tv-008 | `src/conformance.rs` reads expected_results.json; `src/verify.rs` | Canonical ACTIS v1 conformance corpus. All 8 required for v1 Verifier Conformance. |
| Extended security vectors (tv-009–tv-011) | Same normative docs; test-vectors/expected_results.json, test-vectors/README.md | tv-009 (final_hash), tv-010 (duplicate), tv-011 (path traversal) | Same verifier; corpus runner runs all entries in expected_results.json | Security-hardening; not part of canonical v1 corpus. |

---

## References

- **Normative:** [ACTIS_STANDARD_v1.md](./ACTIS_STANDARD_v1.md), [ACTIS_COMPATIBILITY.md](./ACTIS_COMPATIBILITY.md)
- **Corpus:** [test-vectors/expected_results.json](../test-vectors/expected_results.json), [test-vectors/README.md](../test-vectors/README.md)
- **Reference verifier (one implementation):** [actis-spec/actis-verifier-rust](https://github.com/actis-spec/actis-verifier-rust) — `src/verify.rs`, `src/schema.rs`, `src/canonicalize.rs`, `src/hashchain.rs`, `src/signatures.rs`, `src/checksums.rs`, `src/bundle.rs`, `src/status.rs`, `src/conformance.rs`

Implementations other than the reference verifier may conform to ACTIS by satisfying the normative documents and passing the canonical corpus (tv-001–tv-008).
