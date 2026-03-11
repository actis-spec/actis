# ACTIS Conformance Corpus

Version: 1.1
Vectors: tv-001 through tv-011

## v1.0 vectors (tv-001–tv-008)
Core compliance surface: schema, hash chain, signatures, checksums, replay.

| ID | Description | Expected status |
|---|---|---|
| tv-001 | Compatible minimal | ACTIS_COMPATIBLE |
| tv-002 | Invalid signature | ACTIS_PARTIAL |
| tv-003 | Schema fail (wrong version) | ACTIS_NONCOMPLIANT |
| tv-004 | Hash chain break | ACTIS_NONCOMPLIANT |
| tv-005 | Checksum tamper | ACTIS_NONCOMPLIANT |
| tv-006 | Missing manifest | ACTIS_NONCOMPLIANT |
| tv-007 | Compatible with failure event | ACTIS_COMPATIBLE |
| tv-008 | Zero signatures | ACTIS_PARTIAL |

## v1.1 vectors (tv-009–tv-011)
Bundle security surface: final hash integrity, duplicate entries, path traversal.

| ID | Description | Expected status |
|---|---|---|
| tv-009 | Incorrect final_hash | ACTIS_NONCOMPLIANT |
| tv-010 | Duplicate core file in ZIP | ACTIS_NONCOMPLIANT |
| tv-011 | Path traversal in ZIP | ACTIS_NONCOMPLIANT |

## Invariants verified by corpus
- hash_chain_ok is independent of signature verification (§3.2)
- Missing manifest sets all booleans false (§5)
- Schema failure skips final_hash check (§3.4)
- Bundle security failures (duplicate entries, path traversal) set all booleans false (§5)
