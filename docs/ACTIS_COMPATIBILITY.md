# ACTIS v1 — Compatibility and Verification Algorithms

**Version:** 1.0  
**Status:** Normative  
**Entrypoint:** [ACTIS_STANDARD_v1.md](./ACTIS_STANDARD_v1.md)

This document defines the normative algorithms for ACTIS v1.0 verification: envelope hash construction, round and transcript hashing, signature verification, and the actis_status decision tree. Implementations MUST follow these algorithms to be conformant.

**Normative:** The algorithms and decision rules in this document are normative. Formulas and worked examples are labeled informative.

---

## 1. Normative Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" are to be interpreted as in RFC 2119 and RFC 8174.

---

## 2. Envelope Hash Construction

**envelope_hash** is a round-local digest. It is the hash of a canonical JSON serialization of the round’s envelope object. The signature in the round is computed **over** this digest (the 64-character hex string), not over the raw envelope. The envelope object MUST NOT include the signature or the envelope_hash field itself.

### 2.1 Envelope Object (round-local)

The **envelope object** is a JSON object containing only the following round fields, with all other round fields excluded:

**Included (if present in the round):**

- `round_number`
- `round_type`
- `message_hash`
- `timestamp_ms`
- `previous_round_hash`
- `round_hash` (optional in round; include in envelope object only if present in the round)
- `agent_id` (optional; include only if present)
- `public_key_b58` (optional; include only if present)
- `content_summary` (optional; include only if present)

**Excluded:**

- `envelope_hash` — excluded so the digest is not self-referential.
- `signature` — excluded; the signature is over the digest of the envelope, not part of the envelope.

No transcript-level fields (e.g. `transcript_id`, `intent_id`) are part of the envelope. The envelope is round-local only.

### 2.2 Serialization and Digest

1. Build the envelope object from the round by taking only the included keys listed in §2.1 (with the same values as in the round). Omit any key not present in the round.
2. Serialize the envelope object to canonical JSON per RFC 8785 (JSON Canonicalization Scheme, JCS): deterministic key ordering, no unnecessary whitespace, deterministic encoding of numbers and strings. Implementations MUST use an RFC 8785–compliant canonicalizer (or equivalent that produces the same output). Strings MUST be interpreted exactly as encoded in the JSON document without Unicode normalization.
3. Compute SHA-256 over the UTF-8 encoding of the canonical JSON string.
4. Encode the digest as exactly 64 lowercase hexadecimal characters (no prefix, no spaces).

**Formula (informative):**

```
envelope_object = { round fields except "envelope_hash" and "signature" }
envelope_hash = to_lower_hex( SHA-256( utf8( canonical_json( envelope_object ) ) ) )
```

### 2.3 Signature Binding

The signing message is the 40-byte concatenation of the UTF-8 encoding of the domain string "ACTIS/v1" (8 bytes) followed by the 32-byte binary value obtained by hex-decoding the round's envelope_hash field (64 lowercase hex characters):

signing_message = utf8("ACTIS/v1") || hex_decode(envelope_hash)  // 8 + 32 = 40 bytes

Implementations MUST construct the signing message exactly as above. The domain string prevents cross-protocol signature reuse. The raw hex-decoded envelope_hash alone is NOT the signing message, and the UTF-8 encoding of the hex string is NOT the signing message.

Verifiers MAY recompute the envelope object from the round (excluding envelope_hash and signature), compute the digest, and compare it to the round's envelope_hash to detect tampering of envelope fields.

### 2.4 Informative example (pseudocode)

```
Round (excerpt):
  round_number: 0
  round_type: "INTENT"
  message_hash: "a1b2..."
  envelope_hash: "<to be computed>"
  signature: { ... }   // not part of envelope

Envelope object (input to hash):
  { "message_hash": "a1b2...", "previous_round_hash": "c3d4...", "round_hash": "e5f6...", "round_number": 0, "round_type": "INTENT", "timestamp_ms": 1709500000000 }

Canonical JSON string → SHA-256 → 64 lowercase hex → envelope_hash.
Then: signing_message = utf8("ACTIS/v1") || hex_decode(envelope_hash).  // 8 + 32 = 40 bytes
      signature = Ed25519_sign(signing_message).
```

---

## 3. Round and Transcript Hashing

### 3.1 Round 0 — previous_round_hash (genesis)

For round 0 there is no previous round. The genesis value is:

```
previous_round_hash = to_lower_hex( SHA-256( utf8( intent_id + ":" + created_at_ms ) ) )
```

`intent_id` and `created_at_ms` are the transcript-level values. The string is the concatenation of `intent_id`, the literal character `:`, and the decimal representation of `created_at_ms` (no leading zeros, no JSON wrapping). No Unicode normalization or trimming is applied to `intent_id`.

### 3.2 Round hash (per round)

For each round, the **round_hash** is the SHA-256 digest of the canonical JSON serialization of the round object **excluding the `round_hash` and `signature` fields**. RFC 8785 canonicalization MUST be used. The result is 64 lowercase hex characters.

```
round_object_for_hashing = round with keys "round_hash" AND "signature" removed
round_hash = to_lower_hex( SHA-256( utf8( canonical_json( round_object_for_hashing ) ) ) )
```

**Invariant:** `hash_chain_ok` MUST NOT depend on signature verification. Signatures are attestations, not structural state; they are excluded from structural hashing.

### 3.3 Chain linkage

For round index `i > 0`, `round[i].previous_round_hash` MUST equal the `round_hash` of round `i-1` (or the digest computed from round `i-1` as in §3.2 if `round_hash` is omitted).

### 3.4 Final hash (transcript)

The **final_hash** of the transcript is the SHA-256 digest of the canonical JSON serialization of the **entire transcript object excluding the `final_hash` field**. The `model_context` field (if present) is excluded from the object before serialization so that MRM metadata does not affect determinism. RFC 8785 MUST be used. The result is 64 lowercase hex.

```
transcript_for_hash = transcript with "final_hash" and "model_context" removed
final_hash = to_lower_hex( SHA-256( utf8( canonical_json( transcript_for_hash ) ) ) )
```

### 3.5 Hash Chain Framing (Informative)

A common attack against hash-chain protocols is framing ambiguity: if a chain
is constructed by raw concatenation of variable-length fields, then
`hash("ab" + "c")` equals `hash("a" + "bc")`, allowing an attacker to produce
two different logical inputs that yield the same hash.

ACTIS v1.0 is not vulnerable to this attack. The round_hash and final_hash are
computed over the RFC 8785 canonical JSON serialization of a structured object,
not over raw field concatenation. RFC 8785 produces an unambiguous, length-delimited
encoding for every field. Two distinct JSON objects with different field values
or structure cannot produce the same canonical serialization, and therefore cannot
produce the same hash.

Implementations MUST use an RFC 8785-compliant canonicalizer. The use of raw
string concatenation or non-canonical serialization in place of JCS is a
conformance defect and voids the framing ambiguity protection.

### 3.6 Replay Determinism (Normative)

Replay MUST be deterministic. Two conformant verifiers presented with the same
bundle MUST produce identical `hash_chain_ok` and `replay_ok` results.

The following are forbidden sources of nondeterminism in replay:

- **Timestamps and wall-clock time** — Verifiers MUST NOT read the system clock
  during replay. All timestamps used in hash computation MUST come from the
  transcript fields.
- **Random number generation** — Verifiers MUST NOT use RNG during replay.
- **Locale and collation** — Verifiers MUST NOT apply locale-specific string
  ordering or comparison during canonicalization. RFC 8785 key ordering is
  lexicographic by Unicode code point, not locale-dependent.
- **Floating-point serialization** — Verifiers MUST NOT use platform-specific
  float-to-string conversion. RFC 8785 defines deterministic number encoding;
  implementations MUST follow it.
- **Unicode normalization** — Verifiers MUST NOT apply NFC, NFD, NFKC, or NFKD
  normalization to string values during canonicalization. Strings MUST be
  interpreted exactly as encoded in the JSON document.

Any input that affects replay outcome MUST be recorded in the transcript itself.
External state that is not recorded in the transcript MUST NOT affect replay.

---

## 4. Signature Verification

- **Scheme:** ACTIS v1.0 supports Ed25519 only. The signature is a detached Ed25519 signature.
- **Message signed:** The signing message is the 40-byte concatenation of utf8("ACTIS/v1") (8 bytes) and the 32-byte binary value obtained by hex-decoding the round's envelope_hash field (64 lowercase hex characters → 32 raw bytes): signing_message = utf8("ACTIS/v1") || hex_decode(envelope_hash). Implementations MUST use this exact construction. The raw hex-decoded envelope_hash alone is NOT the signing message.
- **Verification:** The verifier MUST decode signature.signer_public_key_b58 and signature.signature_b58 (Base58), construct the 40-byte signing message as utf8("ACTIS/v1") || hex_decode(envelope_hash), and verify that the signature is valid for the public key over that message. If the round’s public_key_b58 is present, it MUST match signature.signer_public_key_b58 for the round to be considered valid.

---

## 5. Manifest and Bundle Rules

**Manifest:** The bundle MUST contain a `manifest.json` at the root (or path declared in the bundle format). The manifest MUST include a `core_files` array: relative paths, unique, forward slashes, no `../`, no absolute or drive paths. The minimal ACTIS core set is `["checksums.sha256", "manifest.json", "input/transcript.json"]`. See [ACTIS_AUDITOR_PACK.md](./ACTIS_AUDITOR_PACK.md) §2 and schema [actis/schemas/actis_manifest_v1.json](../schemas/actis_manifest_v1.json). The checksum file (e.g. `checksums.sha256`) MUST NOT list itself; it lists the other core files only.

**Bundle security:**

- Checksums apply only to paths listed in `core_files`. Only those paths are in the ACTIS verification surface. Unlisted files MUST NOT affect actis_status; verifiers SHOULD warn when unlisted files are present.
- Core file paths in the manifest MUST be unique. Duplicate archive entries for the same core path MUST result in ACTIS_NONCOMPLIANT. Symlinks for core paths MUST be rejected. Path traversal (e.g. `../`, absolute paths, drive prefixes) in core paths MUST be rejected.
- ACTIS_COMPATIBLE means the verified core surface (transcript, hash chain, signatures, listed checksums) is intact. It does not imply that the entire archive is safe to execute or trust beyond that surface. Verifiers MAY add a warning (e.g. in `warnings`) when unlisted or suspicious entries are present.

---

## 6. actis_status Decision Tree

Verification MUST derive **actis_status** from the following (and only the following) checks:

1. **Schema/layout:** Transcript conforms to schema; required fields present; bundle layout valid; manifest core files present and unique; no duplicate core path entries; no symlinks or path traversal for core paths.
2. **Hash chain:** All round hashes and previous_round_hash linkage valid; final_hash (if present) matches recomputation.
3. **Checksums:** All core files listed in manifest match checksums (if checksum file present).
4. **Evidence refs:** All artifacts referenced in evidence_refs arrays are present in the bundle (see §8).
5. **Signatures:** All rounds have valid Ed25519 signatures over the 40-byte domain-separated message (see §4).

**ACTIS_COMPATIBLE:** All of (1)–(5) pass.

**ACTIS_PARTIAL:** (1)–(4) pass; one or more signatures missing or invalid. No other failure.

**ACTIS_NONCOMPLIANT:** Any of (1)–(4) fail, or any failure other than signature-only.

Implementations MUST NOT use blame, reputation, risk, or settlement to determine actis_status. Only the checks above are normative.

---

## 7. References

- RFC 2119: Key words for use in RFCs
- RFC 8174: Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words
- RFC 8785: JSON Canonicalization Scheme (JCS)
- NIST FIPS 180-4: Secure Hash Standard (SHA-256)

---

## 8. Evidence Omission Enforcement (Normative)

If a transcript round or failure_event contains an `evidence_refs` array, all
referenced artifacts MUST be present in the bundle for the bundle to be
considered complete.

Verifiers MUST check that every entry in every `evidence_refs` array resolves
to an artifact present in the bundle. If any referenced artifact is absent,
verification MUST fail with `actis_status: ACTIS_NONCOMPLIANT`.

This rule closes the evidence omission attack: an attacker cannot exclude
unfavorable evidence from a bundle while keeping the remaining structure intact.
A bundle that is missing referenced evidence is not a complete ACTIS bundle and
MUST NOT receive `ACTIS_COMPATIBLE` or `ACTIS_PARTIAL` status.

**Verification order (normative):**

Implementations MUST check bundle integrity in the following order and MUST
fail fast at the first failure:

1. Manifest present and valid (core_files listed, no path traversal, no duplicates)
2. All core files present and checksums match
3. Transcript schema valid
4. Hash chain valid (round hashes, chain linkage, final_hash)
5. Evidence refs complete (all evidence_refs resolve to bundle artifacts)
6. Signatures valid (Ed25519 over 40-byte domain-separated message)

Reporting `actis_status` MUST reflect the earliest failure in this order.
`ACTIS_PARTIAL` is reserved for signature-only failures (step 6 only).
Any failure at steps 1–5 MUST yield `ACTIS_NONCOMPLIANT`.
