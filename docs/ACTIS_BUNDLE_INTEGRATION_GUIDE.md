# Emitting ACTIS Bundles: Integration Guide

**Status:** Informational  
**Version:** 1.0  
**Scope:** Step-by-step guide for producers and verifiers (example roles) to produce and verify ACTIS-compatible evidence bundles independently.

---

## 1. What Is an ACTIS Bundle?

An ACTIS bundle is a ZIP archive containing a cryptographically verifiable record of an autonomous agent transaction. It proves — to any independent verifier — that a specific sequence of events occurred, in a specific order, signed by specific agents, without tampering. The bundle is self-contained: everything needed to verify integrity is inside it.

---

## 2. Minimum Required Files

An ACTIS bundle MUST contain exactly three core files:

```
bundle.zip
├── manifest.json           # Bundle metadata and file listing
├── checksums.sha256         # SHA-256 checksums of core files
└── input/
    └── transcript.json      # Hash-linked, signed transcript
```

### 2.1 `manifest.json`

```json
{
  "standard": { "name": "ACTIS", "version": "1.0" },
  "core_files": ["checksums.sha256", "manifest.json", "input/transcript.json"],
  "optional_files": [],
  "created_at": "2026-03-03T22:00:00Z",
  "producer": "noble.xyz"
}
```

### 2.2 `checksums.sha256`

A text file with one line per file, in the format `<sha256-hex>  <filepath>`:

```
a1b2c3d4e5f6...64chars...  manifest.json
f6e5d4c3b2a1...64chars...  input/transcript.json
```

**Critical:** The checksum file MUST NOT include a checksum of itself. Only hash `manifest.json` and `input/transcript.json`.

### 2.3 `input/transcript.json`

The transcript is the core evidence artifact. See §3 for the complete field specification.

---

## 3. Transcript Schema (actis-transcript/1.0)

ACTIS v1.0 uses the transcript format identified by **`actis-transcript/1.0`**.

### 3.1 Required Top-Level Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `transcript_version` | string | MUST be `"actis-transcript/1.0"` | `"actis-transcript/1.0"` |
| `transcript_id` | string | `"transcript-"` + SHA-256 hex of `intent_id + created_at_ms` | `"transcript-4500579f..."` |
| `intent_id` | string | Unique intent identifier | `"intent-noble-weather-001"` |
| `intent_type` | string | Service category | `"weather.data"` |
| `created_at_ms` | integer | Unix milliseconds | `1709500000000` |
| `policy_hash` | string | SHA-256 hex of canonical buyer policy JSON | `"a1b2c3d4..."` |
| `strategy_hash` | string | SHA-256 hex of canonical strategy JSON | `"e5f6a7b8..."` |
| `identity_snapshot_hash` | string | SHA-256 hex of canonical identity snapshot JSON | `"c9d0e1f2..."` |
| `rounds` | array | Array of `TranscriptRound` objects (min 1) | See §3.2 |

### 3.2 TranscriptRound Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `round_number` | integer | Yes | Zero-indexed, sequential, no gaps |
| `round_type` | string | Yes | One of: `"INTENT"`, `"ASK"`, `"BID"`, `"COUNTER"`, `"ACCEPT"`, `"REJECT"`, `"ABORT"` |
| `message_hash` | string | Yes | SHA-256 hex of canonical message content |
| `envelope_hash` | string | Yes | SHA-256 hex of complete signed envelope |
| `signature` | object | Yes | `{ signer_public_key_b58, signature_b58, signed_at_ms, scheme: "ed25519" }` |
| `timestamp_ms` | integer | Yes | Unix milliseconds, non-decreasing |
| `previous_round_hash` | string | Yes | SHA-256 hex — see §4.1 for round-0 computation |
| `round_hash` | string | No | SHA-256 hex of this round (canonical, excluding `round_hash` itself) |
| `agent_id` | string | No | Agent identifier (e.g., `"buyer"`, `"seller"`) |
| `public_key_b58` | string | No | Base58-encoded Ed25519 public key |
| `content_summary` | object | No | Human-readable content (does not affect hashing) |

### 3.3 Optional Top-Level Fields

| Field | Type | Description |
|---|---|---|
| `failure_event` | object | Terminal failure event (if negotiation failed) |
| `final_hash` | string | SHA-256 hex of canonical transcript (excluding `final_hash` itself) |
| `metadata` | object | Non-deterministic metadata |
| `model_context` | object | MRM traceability (`model_id` required within) |

---

## 4. Critical Implementation Details

### 4.1 Round-0 `previous_round_hash`

Round 0 (the INTENT round) has no previous round. Its `previous_round_hash` is computed as:

```
intent_id_bytes = UTF-8 encode of intent_id (raw string as in JSON; no trimming, no Unicode normalization)
previous_round_hash = SHA-256(intent_id_bytes)  // 64 lowercase hex
```

Implementations MUST treat leading/trailing whitespace in `intent_id` as significant and MUST NOT apply Unicode normalization. See ACTIS_COMPATIBILITY.md §3.7.1.

**Example:**

```javascript
import { createHash } from "node:crypto";

const intentId = "intent-noble-weather-001";
const previousRoundHash = createHash("sha256")
  .update(intentId, "utf8")
  .digest("hex");
```

### 4.2 Ed25519 Signing

Each round MUST be signed with Ed25519. The signature covers the `envelope_hash`:

```javascript
import nacl from "tweetnacl";
import bs58 from "bs58";

// Generate a keypair (or load from your agent's identity store)
const keypair = nacl.sign.keyPair();

// The data to sign is the envelope_hash as 64 lowercase hex characters, UTF-8 encoded (no 0x prefix). See ACTIS_COMPATIBILITY.md §3.7.3.
const envelopeHash = "144090ff43d039c1ea7cae50824a1bc1376ca97f7fc326dfa8021315af47e077";
const message = new TextEncoder().encode(envelopeHash);

// Sign
const signatureBytes = nacl.sign.detached(message, keypair.secretKey);

// Encode for transcript
const signature = {
  signer_public_key_b58: bs58.encode(keypair.publicKey),
  signature_b58: bs58.encode(signatureBytes),
  signed_at_ms: Date.now(),
  scheme: "ed25519"
};
```

### 4.3 Hash Chain Verification

For each round `n > 0`:

```
round[n].previous_round_hash === SHA-256( canonical_json( round[n-1] ) )
```

Where `canonical_json` means JSON.stringify with sorted keys and no whitespace (RFC 8785 JCS or equivalent deterministic serialization). The `round_hash` field itself MUST be excluded from the canonical form before hashing.

### 4.4 Computing `final_hash`

After the last round is appended:

```
final_hash = SHA-256( canonical_json( transcript_without_final_hash ) )
```

The `final_hash` field is excluded from the canonical form.

### 4.5 Generating `checksums.sha256`

```bash
sha256sum manifest.json input/transcript.json > checksums.sha256
```

Or programmatically:

```javascript
import { createHash, readFileSync } from "node:fs";

function sha256File(path) {
  const content = readFileSync(path);
  return createHash("sha256").update(content).digest("hex");
}

const lines = [
  `${sha256File("manifest.json")}  manifest.json`,
  `${sha256File("input/transcript.json")}  input/transcript.json`,
].join("\n") + "\n";

writeFileSync("checksums.sha256", lines);
```

**Do not include `checksums.sha256` in the checksum list.**

---

## 5. Complete Example: 2-Round Transcript (INTENT + ACCEPT)

```json
{
  "transcript_version": "actis-transcript/1.0",
  "transcript_id": "transcript-b7e23f8a91c04d5e6f78901234abcdef0123456789abcdef0123456789abcdef",
  "intent_id": "intent-noble-weather-20260303-001",
  "intent_type": "weather.data",
  "created_at_ms": 1709500000000,
  "policy_hash": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "strategy_hash": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
  "identity_snapshot_hash": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  "rounds": [
    {
      "round_number": 0,
      "round_type": "INTENT",
      "message_hash": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      "envelope_hash": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      "signature": {
        "signer_public_key_b58": "21wxunPRWgrzXqK48yeE1aEZtfpFU2AwY8odDiGgBT4J",
        "signature_b58": "128SdR5tqs76YAyF2cxD5f2pRbmYZaTNrcA8LJugU6kTwJrJNaA3pALAS3mPwVMsL1yTbxBKtk2B4ZVSxaUmz6ca",
        "signed_at_ms": 1709500000000,
        "scheme": "ed25519"
      },
      "timestamp_ms": 1709500000000,
      "previous_round_hash": "SHA256('intent-noble-weather-20260303-001')",
      "agent_id": "buyer",
      "public_key_b58": "21wxunPRWgrzXqK48yeE1aEZtfpFU2AwY8odDiGgBT4J",
      "content_summary": {
        "intent_type": "weather.data",
        "description": "Request current weather data for NYC"
      },
      "round_hash": "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6"
    },
    {
      "round_number": 1,
      "round_type": "ACCEPT",
      "message_hash": "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
      "envelope_hash": "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
      "signature": {
        "signer_public_key_b58": "HBUkwmmQVFX3mGF6ris1mWDATY27nAupX6wQNXgJD9j9",
        "signature_b58": "3LwhuzhEt4FdM117RKYfQ5kJbPerSrH86SoiM226PDoQHyXhEN8MbNDJPJkiQAVGoEqUgYD3dDANNbmcZ4T6Fitx",
        "signed_at_ms": 1709500001000,
        "scheme": "ed25519"
      },
      "timestamp_ms": 1709500001000,
      "previous_round_hash": "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
      "agent_id": "seller",
      "public_key_b58": "HBUkwmmQVFX3mGF6ris1mWDATY27nAupX6wQNXgJD9j9",
      "content_summary": {
        "price": 0.00005,
        "accepted": true
      },
      "round_hash": "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8"
    }
  ],
  "final_hash": "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9"
}
```

> **Note:** The hashes and signatures in this example are illustrative placeholders showing the correct format and structure. In a real implementation, all hashes MUST be computed from actual content, and all signatures MUST be cryptographically valid Ed25519 signatures.

---

## 6. Submitting to a verifier (example)

ACTIS defines no network API; the following is an example only. A verifier service might accept a bundle and return a verification report.

```bash
curl -X POST https://verifier.example/v1/verify \
  -H "Content-Type: application/zip" \
  -H "Authorization: Bearer <your-api-key>" \
  --data-binary @bundle.zip
```

**Example successful response (HTTP 200):**

```json
{
  "bundle_id": "bundle-abc123def456...",
  "actis_status": "ACTIS_COMPATIBLE",
  "actis_version": "1.0",
  "verified_at": "2026-03-03T22:00:00Z",
  "verifier_version": "0.9.0",
  "report_content_hash": "sha256-of-full-report..."
}
```

**Status values:**

| Status | Meaning |
|---|---|
| `ACTIS_COMPATIBLE` | All integrity checks pass |
| `ACTIS_PARTIAL` | Some checks pass, some fail (e.g., valid structure but invalid signature) |
| `ACTIS_NONCOMPLIANT` | Critical checks fail (e.g., broken hash chain, invalid schema) |

---

## 7. Troubleshooting: Five Most Common Failures

### 7.1 Wrong `transcript_version` Constant

**Symptom:** `schema_ok: false`, `ACTIS_NONCOMPLIANT`.

**Cause:** `transcript_version` is not the required value. ACTIS bundles MUST use **`"actis-transcript/1.0"`**. Common mistakes: using `"4.0"`, `"actis/1.0"`, or any other variant.

**Fix:** Set `transcript_version` to the exact string `"actis-transcript/1.0"`.

### 7.2 Round-0 `previous_round_hash` Format

**Symptom:** `hash_chain_ok: false`, hash chain broken at round 0.

**Cause:** `previous_round_hash` for round 0 was computed incorrectly. Common mistakes:
- Hashing `intent_id` as an object instead of a plain string
- Using a different encoding (e.g., Latin-1 instead of UTF-8)
- Including surrounding quotes in the hash input

**Fix:** Compute `SHA-256( intent_id )` where `intent_id` is the raw string value encoded as UTF-8 bytes. No JSON wrapping, no quotes.

### 7.3 Checksum File Self-Reference

**Symptom:** `checksums_ok: false`, checksum mismatch.

**Cause:** `checksums.sha256` includes a hash of itself, creating a circular reference that always fails.

**Fix:** Hash only `manifest.json` and `input/transcript.json`. Do not include `checksums.sha256` in its own content.

### 7.4 Missing Required Fields

**Symptom:** `schema_ok: false` or parse error.

**Cause:** A required field is missing from the transcript or round objects. The most commonly missed fields are:
- `identity_snapshot_hash` (top-level)
- `previous_round_hash` (in rounds)
- `envelope_hash` (in rounds — sometimes confused with `message_hash`)

**Fix:** Ensure all fields marked "Required" in §3.1 and §3.2 are present and non-null.

### 7.5 Signature Scheme Mismatch

**Symptom:** `signatures_ok: false`, signature verification fails.

**Cause:** The signature was created using a different scheme (e.g., secp256k1, RSA) but `scheme` is set to `"ed25519"`, or the signature was created over different data than `envelope_hash`.

**Fix:** ACTIS v1.0 supports **Ed25519 only**. The signature MUST be an Ed25519 detached signature over the `envelope_hash` string encoded as UTF-8 bytes. Verify that `signer_public_key_b58` matches the key that created the signature.

---

## 8. Quick Start Checklist

- [ ] Generate an Ed25519 keypair for your agent
- [ ] Create a transcript with `transcript_version: "actis-transcript/1.0"`
- [ ] Compute round-0 `previous_round_hash` as `SHA-256(intent_id)`
- [ ] Sign each round's `envelope_hash` with Ed25519
- [ ] Compute each round's `round_hash` (canonical JSON, sorted keys, excluding `round_hash`)
- [ ] Set each subsequent round's `previous_round_hash` to the prior round's `round_hash`
- [ ] Compute `final_hash` (canonical JSON of entire transcript, excluding `final_hash`)
- [ ] Create `manifest.json` with `standard.name: "ACTIS"` and `standard.version: "1.0"`
- [ ] Generate `checksums.sha256` (exclude the checksum file itself)
- [ ] Package as ZIP and submit to your verifier (e.g. `POST /v1/verify`)
  - [ ] Verify response: `actis_status: "ACTIS_COMPATIBLE"`

---

## 9. Next steps for implementers

- Produce real transaction transcripts (e.g. successful procurement, policy-driven rejection, terminal failure) with the structure above.
- Anonymize sensitive data while preserving hash chain and signature validity.
- Run the ACTIS conformance harness to validate your verifier. The harness exists in the ACTIS repository at `actis/test-vectors/run_conformance.sh`. If you are reading a vendored copy of ACTIS, ensure you have included the `actis/test-vectors/` directory (including `expected_results.json` and the `generated/` zip files). If you do not have the harness, you can still validate by running your verifier on each of tv-001..tv-008 and comparing the JSON output to the expected values in `expected_results.json`.

---

*Questions? File an issue in the ACTIS repository.*
