# ACTIS Semantic Conventions (v1.0)

**Status:** Normative (required for conformance in ACTIS v1.0.0)  
**Version:** 1.0  
**Scope:** Defines the stable vocabulary for all field names, types, and allowed values across ACTIS core — including the transcript schema and the verification report schema.

---

## 1. Versioning Policy

Semantic conventions are versioned **independently** of ACTIS core.

| Change Type | Versioning Impact | Rule |
|---|---|---|
| **New field added** | Minor version bump (e.g., 1.0 → 1.1) | Additive. Non-breaking. Existing verifiers MAY ignore unknown fields. |
| **Field description clarified** | Patch version (e.g., 1.0 → 1.0.1) | No semantic change to allowed values or types. |
| **Allowed values changed** | Major version bump (e.g., 1.0 → 2.0) | Breaking. Requires new ACTIS major version. |
| **Field removed or renamed** | Major version bump | Breaking. Requires new ACTIS major version. |
| **Enum casing normalized** | Major version bump | Breaking. Transition period with dual acceptance RECOMMENDED. |

---

## 2. Transcript Schema Fields

Source: ACTIS v1.0 transcript schema ([actis/schemas/actis_transcript_v1.json](../schemas/actis_transcript_v1.json)).

### 2.1 Top-Level Transcript Fields

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `transcript_version` | string | Yes | v1.0 | Protocol version identifier | `"actis-transcript/1.0"` (const) | MUST be exactly this value for ACTIS v1.0 |
| `transcript_id` | string | Yes | v1.0 | Unique transcript identifier | `^transcript-[a-f0-9]{64}$` | Deterministic from `intent_id` + `created_at_ms` |
| `intent_id` | string | Yes | v1.0 | Intent identifier from protocol negotiation | Non-empty string | Used as seed for round-0 `previous_round_hash` |
| `intent_type` | string | Yes | v1.0 | Intent type identifier | Non-empty string (e.g., `"weather.data"`, `"llm.verify"`) | Describes the service category |
| `created_at_ms` | integer | Yes | v1.0 | Transcript creation timestamp | Unix milliseconds, ≥ 0 | MUST match first INTENT message timestamp |
| `policy_hash` | string | Yes | v1.0 | SHA-256 of canonical buyer policy | `^[a-f0-9]{64}$` | Deterministic canonical JSON serialization |
| `strategy_hash` | string | Yes | v1.0 | SHA-256 of canonical negotiation strategy | `^[a-f0-9]{64}$` | Includes all parameters affecting negotiation |
| `identity_snapshot_hash` | string | Yes | v1.0 | SHA-256 of canonical identity snapshot | `^[a-f0-9]{64}$` | Credentials, trust scores at negotiation start |
| `rounds` | array | Yes | v1.0 | Append-only array of negotiation rounds | Array of `TranscriptRound`, minItems: 1 | No insertion, no modification after append |
| `failure_event` | object | No | v1.0 | Terminal failure event | `FailureEvent` object | If present, transcript is terminal |
| `final_hash` | string | No | v1.0 | SHA-256 of canonical transcript | `^[a-f0-9]{64}$` | Excluding `final_hash` field itself; present for terminal transcripts |
| `arbiter_decision_ref` | string \| null | No | v1.0 | Reference to arbiter decision | String or null | Links to external adjudication artifact |
| `metadata` | object | No | v1.0 | Optional metadata | Open object with known subfields | MUST NOT affect deterministic serialization |
| `model_context` | object | No | v1.0 | MRM traceability | Object with `model_id` required | MUST NOT affect verification or hash computation |

### 2.2 TranscriptRound Fields

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `round_number` | integer | Yes | v1.0 | Zero-indexed round number | ≥ 0, sequential, no gaps | Round 0 is always INTENT |
| `round_type` | string | Yes | v1.0 | Negotiation round type | `"INTENT"` \| `"ASK"` \| `"BID"` \| `"COUNTER"` \| `"ACCEPT"` \| `"REJECT"` \| `"ABORT"` | UPPER_SNAKE_CASE canonical form |
| `message_hash` | string | Yes | v1.0 | SHA-256 of canonical message content | `^[a-f0-9]{64}$` | Excluding envelope wrapper |
| `envelope_hash` | string | Yes | v1.0 | SHA-256 of round envelope (see ACTIS_COMPATIBILITY.md §2) | `^[a-f0-9]{64}$` | Round-local object (excl. envelope_hash and signature); RFC 8785 + SHA-256; signature is over this hash |
| `signature` | object | Yes | v1.0 | Cryptographic signature of round | `Signature` object | MUST verify against `envelope_hash` |
| `timestamp_ms` | integer | Yes | v1.0 | Round creation timestamp | Unix milliseconds, ≥ 0 | MUST be non-decreasing across rounds |
| `previous_round_hash` | string | Yes | v1.0 | SHA-256 of previous round (canonical) | `^[a-f0-9]{64}$` | Round 0: SHA-256 of `intent_id` as UTF-8 |
| `round_hash` | string | No | v1.0 | SHA-256 of this round (canonical) | `^[a-f0-9]{64}$` | Excluding `round_hash` field itself |
| `agent_id` | string | No | v1.0 | Agent identifier for this round | Non-empty string (e.g., `"buyer"`, `"seller"`) | MUST match signer identity |
| `public_key_b58` | string | No | v1.0 | Base58-encoded Ed25519 public key | Non-empty Base58 string | MUST match signature verification key |
| `content_summary` | object | No | v1.0 | Human-readable round content summary | Open object | MUST NOT affect deterministic serialization |

### 2.3 Signature Fields

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `signer_public_key_b58` | string | Yes | v1.0 | Base58-encoded Ed25519 public key | Non-empty Base58 string | Signing agent's public key |
| `signature_b58` | string | Yes | v1.0 | Base58-encoded Ed25519 signature | Non-empty Base58 string | Over `envelope_hash` |
| `signed_at_ms` | integer | No | v1.0 | Signature creation timestamp | Unix milliseconds, ≥ 0 | |
| `signed_hash` | string | No | v1.0 | Hash that was signed | Hex string | For explicit binding verification |
| `scheme` | string | No | v1.0 | Cryptographic signature scheme | `"ed25519"` | v1.0 supports Ed25519 only |

### 2.4 FailureEvent Fields

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `code` | string | Yes | v1.0 | Canonical error code | `^ACTIS-[1-5][0-9]{2}$` | ACTIS-neutral namespace |
| `stage` | string | Yes | v1.0 | Protocol stage at failure | See §3.1 `stage` values | lowercase canonical form |
| `fault_domain` | string | Yes | v1.0 | Responsible subsystem | See §3.2 `fault_domain` values | **Casing inconsistency — see §3.2** |
| `terminality` | string | Yes | v1.0 | Terminal or non-terminal failure | `"terminal"` \| `"non_terminal"` | lowercase canonical form |
| `evidence_refs` | array | Yes | v1.0 | References to evidence artifacts | Array of non-empty strings, minItems: 1 | Transcript IDs, envelope hashes, etc. |
| `timestamp` | integer | Yes | v1.0 | Failure detection timestamp | Unix milliseconds, ≥ 0 | |
| `transcript_hash` | string | Yes | v1.0 | SHA-256 of transcript at failure point | `^[a-f0-9]{64}$` | Including all rounds and state changes up to failure |

### 2.5 Metadata Fields

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `contention_key` | string | No | v1.0 | Hash of intent_type + resource_id + scope + time_window | String | Multi-agent contention resolution |
| `contention_scope` | string | No | v1.0 | Contention scope | `"EXCLUSIVE"` \| `"NON_EXCLUSIVE"` | |
| `contention_window_ms` | integer | No | v1.0 | Contention window duration | Milliseconds, ≥ 0 | |
| `audit_tier` | string | No | v1.0 | Audit tier (informational) | `"T1"` \| `"T2"` \| `"T3"` | Default: T1 |
| `audit_sla` | string | No | v1.0 | Audit SLA identifier | String | |
| `settlement_artifacts` | array | No | v1.0 | Settlement attempt artifacts | Array of objects | Vendor-specific; e.g., Noble EVM settlement |

### 2.6 Model Context Fields

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `model_id` | string | Yes (within `model_context`) | v1.0 | Agent/model identifier | Non-empty string (e.g., `"agent-v2.3.1"`) | |
| `deployment_hash` | string \| null | No | v1.0 | Build/deployment hash | String or null (e.g., git SHA) | |
| `policy_version` | string \| null | No | v1.0 | Human label for policy version | String or null | `policy_hash` remains authoritative |
| `runtime` | string \| null | No | v1.0 | Runtime identifier | String or null | |
| `generated_at` | string \| null | No | v1.0 | ISO 8601 timestamp | Date-time string or null | MUST NOT be used for determinism checks |

---

## 3. Enumeration Values

### 3.1 `stage` (FailureEvent)

Canonical form: **lowercase**.

| Value | Description |
|---|---|
| `admission` | Pre-negotiation admission checks |
| `discovery` | Service/provider discovery |
| `negotiation` | Active negotiation rounds |
| `commitment` | Commitment formation |
| `reveal` | Data/service reveal |
| `settlement` | Payment/settlement |
| `fulfillment` | Service delivery |
| `verification` | Post-transaction verification |

### 3.2 `fault_domain` (FailureEvent)

ACTIS v1.0 requires **UPPER_SNAKE_CASE** for all `fault_domain` values. The lowercase values (`policy`, `identity`, `negotiation`, `settlement`, `recursive`) are deprecated as of v1.0 and MUST NOT be used in new implementations. Verifiers MUST accept both forms until **2027-01-01** (the transition end date) to allow existing deployments to migrate. After 2027-01-01 verifiers MAY reject lowercase values. ACTIS v2.0 will require UPPER_SNAKE_CASE only.

**Canonical values (UPPER_SNAKE_CASE):**

| Value | Description |
|---|---|
| `POLICY` | Policy subsystem failure |
| `IDENTITY` | Identity/credential subsystem failure |
| `NEGOTIATION` | Negotiation logic failure |
| `SETTLEMENT` | Settlement/payment subsystem failure |
| `RECURSIVE` | Recursive/cascading failure |
| `PROVIDER_AT_FAULT` | Provider-side fault |

#### Transition Note

Deprecated lowercase equivalents (MUST NOT be used in new implementations; verifiers MUST accept until 2027-01-01, after which verifiers MAY reject): `policy` → `POLICY`, `identity` → `IDENTITY`, `negotiation` → `NEGOTIATION`, `settlement` → `SETTLEMENT`, `recursive` → `RECURSIVE`. Transition end date: **2027-01-01**. ACTIS v2.0 MUST require UPPER_SNAKE_CASE only.

### 3.3 `round_type` (TranscriptRound)

Canonical form: **UPPER_SNAKE_CASE**.

| Value | Description |
|---|---|
| `INTENT` | Initial intent announcement (always round 0) |
| `ASK` | Provider price/terms offer |
| `BID` | Buyer counter-offer |
| `COUNTER` | Counter-proposal from either party |
| `ACCEPT` | Acceptance of terms (commitment event) |
| `REJECT` | Rejection of terms |
| `ABORT` | Unilateral abort of negotiation |

### 3.4 `contention_scope`

Canonical form: **UPPER_SNAKE_CASE**.

| Value | Description |
|---|---|
| `EXCLUSIVE` | Only one accept wins (first-come-first-served) |
| `NON_EXCLUSIVE` | Multiple accepts allowed |

### 3.5 `terminality` (FailureEvent)

Canonical form: **lowercase with underscore**.

| Value | Description |
|---|---|
| `terminal` | Intent cannot proceed; no further rounds |
| `non_terminal` | Retry possible |

---

## 4. Verification Report Fields

Source: ACTIS_STANDARD_v1.md §5 and ACTIS_COMPATIBILITY.md; verification report schema.

| Field Name | Type | Required | Stable Since | Description | Allowed Values / Format | Notes |
|---|---|---|---|---|---|---|
| `actis_version` | string | Yes | v1.0 | ACTIS standard version | `"1.0"` | |
| `actis_status` | string | Yes | v1.0 | **Canonical** conformance level; case-sensitive | `ACTIS_COMPATIBLE` \| `ACTIS_PARTIAL` \| `ACTIS_NONCOMPLIANT` | Required for conformance |
| `integrity_status` | string | No (deprecated) | v1.0 | Deprecated alias for conformance level | `"VALID"` \| `"TAMPERED"` \| `"INDETERMINATE"` | Accepted when actis_status absent; MUST match actis_status semantics when both present |
| `signatures_ok` | boolean | Yes | v1.0 | All required signatures verified | `true` \| `false` | |
| `hash_chain_ok` | boolean | Yes | v1.0 | Hash chain intact | `true` \| `false` | |
| `schema_ok` | boolean | Yes | v1.0 | Transcript schema valid | `true` \| `false` | |
| `replay_ok` | boolean | Yes | v1.0 | Deterministic replay succeeded | `true` \| `false` | |
| `warnings` | string[] | Yes | v1.0 | Neutral warnings | Array of strings | No blame or risk content |
| `evidence_refs_checked_count` | number | No | v1.0 | Number of evidence refs checked | Integer ≥ 0 | Maps to signature verification count |
| `files_hashed_count` | number | No | v1.0 | Number of files hashed in replay | Integer ≥ 0 | Maps to hash chain verification count |

### 4.1 `actis_status` (canonical) and `integrity_status` (deprecated)

**Canonical values for `actis_status` (case-sensitive):**

| Value | Condition |
|---|---|
| `ACTIS_COMPATIBLE` | All checks pass: layout, schema, hash chain, checksums, signatures |
| `ACTIS_PARTIAL` | Layout, schema, hash chain, checksums pass; one or more signatures missing or invalid |
| `ACTIS_NONCOMPLIANT` | Any other failure (e.g. schema failure, hash chain break, checksum mismatch) |

**Deprecated `integrity_status` values (when used as alias):** `VALID` (↔ ACTIS_COMPATIBLE), `INDETERMINATE` (↔ ACTIS_PARTIAL), `TAMPERED` (↔ ACTIS_NONCOMPLIANT or ACTIS_PARTIAL per ACTIS_COMPATIBILITY.md decision tree).

Consumers MUST determine conformance from `actis_status` only. `integrity_status` exists solely for backward compatibility.

---

## 5. Report Schema Exhaustiveness

Implementations MUST NOT include adjudication, reputation, risk scoring, or settlement fields as keys in the canonical ACTIS verification report. The report schema defined in ACTIS_STANDARD_v1.md §5 is exhaustive for normative output. Any fields beyond those defined in §5 are non-ACTIS extensions and MUST be clearly separated from the canonical report — for example, in a separate nested object labeled `extensions` or equivalent. Verifiers that produce canonical ACTIS reports MUST NOT include fields encoding fault determination, blame assignment, confidence scores, actuarial estimates, or settlement outcomes in the top-level report object.
