# Authorization Evidence in ACTIS Bundles (Optional Field)

**Status:** Informational (optional appendix). Implementing this appendix is **NOT** required for ACTIS conformance and MUST NOT affect `actis_status`.  
**Version:** 1.0  
**Scope:** Defines the optional `authorization_evidence` field for ACTIS transcripts, enabling ACTIS to cover non-commerce use cases including access delegation, multi-agent coordination, and resource provisioning.  
**Position:** Appendix C of [ACTIS Standard v1](./ACTIS_STANDARD_v1.md)

> **Conformance note:** This appendix defines an optional evidence artifact. Implementing it is **NOT** required for ACTIS conformance. A verifier MUST NOT change `actis_status` (ACTIS_COMPATIBLE / ACTIS_PARTIAL / ACTIS_NONCOMPLIANT) based on the presence or absence of `authorization_evidence`.

---

## 1. Motivation

ACTIS v1.0 core defines integrity verification for hash-linked, signed transcripts. The core evidence model covers *what happened* and *that it is intact*, but does not standardize *under what authority* an action was taken.

For non-commerce use cases — access delegation, multi-agent coordination chains, and resource provisioning — the authority lineage is critical to accountability. An auditor needs to verify not only that the transcript is intact, but that the acting agent had authorization to perform the committed action.

This addendum defines a single optional field that references authorization artifacts without standardizing the authorization protocol itself. This follows the principle: **treat identity/authorization standards as inputs; ACTIS standardizes evidence semantics.**

---

## 2. Field Definition

### 2.1 `authorization_evidence` (Optional)

The `authorization_evidence` field MAY appear at the **transcript level** (alongside `transcript_version`, `rounds`, etc.) or at the **round level** (within a `TranscriptRound`).

```json
{
  "authorization_evidence": {
    "scheme": "oauth2-token-exchange",
    "artifact_hash": "a1b2c3d4e5f6...64-char-hex-sha256...",
    "lineage_depth": 2,
    "issuer_id": "https://auth.example.com",
    "subject_id": "agent:buyer-agent-v3",
    "actor_id": "agent:orchestrator-v2",
    "delegated_at_ms": 1709500000000,
    "constraints": {
      "scope": "weather.data:read",
      "max_commitment_usd": 1.00,
      "expires_at_ms": 1709503600000
    }
  }
}
```

### 2.2 Field Specification

| Field | Type | Required | Description |
|---|---|---|---|
| `scheme` | string | Yes | Authorization artifact type. See §3.1 for registered values. |
| `artifact_hash` | string | Yes | SHA-256 hex hash of the referenced authorization artifact. Enables integrity binding without embedding the artifact in the transcript. Format: `^[a-f0-9]{64}$`. |
| `lineage_depth` | integer | Yes | Number of delegation hops represented. `1` = direct authorization (no delegation). `2` = one intermediate delegator. `n` = `n-1` intermediate delegators. |
| `issuer_id` | string | No | Identifier of the authorization issuer (e.g., authorization server URL, SPIFFE trust domain). |
| `subject_id` | string | No | Identifier of the entity the authorization was issued *to* (the acting agent). |
| `actor_id` | string | No | Identifier of the entity that *delegated* authority (the delegating principal). Corresponds to the `actor` claim in OAuth 2.0 Token Exchange (RFC 8693 §4.1). |
| `delegated_at_ms` | integer | No | Unix timestamp (milliseconds) when the delegation occurred. |
| `constraints` | object | No | Constraints on the delegated authority. Open object; domain-specific. See §4 for common constraint fields. |

---

## 3. Scheme identifiers

### 3.1 Defined schemes

| Scheme Value | Protocol / Standard | Description |
|---|---|---|
| `oauth2-token-exchange` | RFC 8693 | OAuth 2.0 Token Exchange. `artifact_hash` is the SHA-256 of the token exchange response body. |
| `spiffe-svid` | SPIFFE | SPIFFE Verifiable Identity Document. `artifact_hash` is the SHA-256 of the X.509 SVID (DER-encoded) or JWT SVID. |
| `w3c-did-auth` | W3C DID Core | DID Authentication. `artifact_hash` is the SHA-256 of the DID Auth proof payload. |
| `api-key-bound` | N/A | API key authorization. `artifact_hash` is the SHA-256 of the API key metadata object (not the key itself). |
| `opaque-ref` | N/A | Opaque reference to an authorization artifact in an external system. `artifact_hash` binds to the artifact content. |

### 3.2 Adding new schemes

New schemes MAY be defined by submitting a profile or addendum that:

1. Defines the `scheme` value (lowercase, hyphenated).
2. Specifies what the `artifact_hash` covers (which bytes are hashed).
3. Provides at least one example with realistic values.

---

## 4. Common Constraint Fields

When `constraints` is present, the following fields have defined semantics across all schemes:

| Field | Type | Description |
|---|---|---|
| `scope` | string | Authorization scope (e.g., `"weather.data:read"`, `"compute:provision"`) |
| `max_commitment_usd` | number | Maximum financial commitment in USD |
| `max_commitment_units` | number | Maximum commitment in domain-specific units |
| `expires_at_ms` | integer | Unix timestamp (milliseconds) when authorization expires |
| `allowed_actions` | string[] | List of allowed action types |
| `denied_actions` | string[] | List of explicitly denied action types |

Additional domain-specific constraint fields MAY be added. They MUST NOT conflict with the fields defined above.

---

## 5. ACTIS Verification Behavior

### 5.1 Presence Does Not Affect Core Verification

The `authorization_evidence` field is **optional and nullable**. Its absence or presence MUST NOT affect ACTIS core verification outcome:

- A transcript without `authorization_evidence` can still be `ACTIS_COMPATIBLE`.
- A transcript with `authorization_evidence` is verified exactly the same way as one without it.
- ACTIS core verifiers MUST NOT fail a transcript because `authorization_evidence` is missing, malformed, or unverifiable.

### 5.2 Profile-Level Validation

Profiles (e.g., `actis-profile-access-delegation/1.0`) MAY define additional validation rules for `authorization_evidence`:

- REQUIRE the field to be present.
- REQUIRE specific `scheme` values.
- Validate `constraints` against domain rules.
- Verify `artifact_hash` against an external artifact store.

Such validation is reported as **profile-level compliance**, not as an ACTIS core integrity result.

### 5.3 Hash Chain Inclusion

When `authorization_evidence` is present at the transcript level, it is included in the canonical JSON serialization and therefore covered by `final_hash`. When present at the round level, it is included in `round_hash`. This provides cryptographic binding without requiring the verifier to understand the authorization protocol.

---

## 6. Examples

### 6.1 OAuth 2.0 Token Exchange (Delegation Chain)

```json
{
  "transcript_version": "actis-transcript/1.0",
  "transcript_id": "transcript-abc123...",
  "intent_id": "intent-delegation-example",
  "authorization_evidence": {
    "scheme": "oauth2-token-exchange",
    "artifact_hash": "e3b0c44298fc1c149afbf4c8996fb924...",
    "lineage_depth": 2,
    "issuer_id": "https://auth.acme-orchestrator.com",
    "subject_id": "agent:procurement-agent-v4",
    "actor_id": "agent:orchestrator-v2",
    "delegated_at_ms": 1709500000000,
    "constraints": {
      "scope": "weather.data:read",
      "max_commitment_usd": 5.00,
      "expires_at_ms": 1709503600000
    }
  },
  "rounds": []
}
```

**Reading this evidence:** Orchestrator v2 (`actor_id`) delegated authority to Procurement Agent v4 (`subject_id`) via ACME's authorization server (`issuer_id`). The delegation is 2 hops deep. The agent is authorized to read weather data with a maximum commitment of $5.00, expiring at the specified timestamp. The delegation artifact can be verified by hashing the original token exchange response and comparing to `artifact_hash`.

### 6.2 SPIFFE SVID (Workload Identity)

```json
{
  "authorization_evidence": {
    "scheme": "spiffe-svid",
    "artifact_hash": "7d865e959b2466918c9863afca942d0f...",
    "lineage_depth": 1,
    "issuer_id": "spiffe://cluster.local",
    "subject_id": "spiffe://cluster.local/ns/prod/sa/gpu-provisioner"
  }
}
```

**Reading this evidence:** The GPU provisioner workload authenticated via its SPIFFE SVID. Direct authorization (lineage_depth: 1, no delegation). The SVID can be verified by comparing its hash to `artifact_hash` against the SPIFFE trust domain's root certificates.

### 6.3 Round-Level Authorization

```json
{
  "round_number": 2,
  "round_type": "ACCEPT",
  "authorization_evidence": {
    "scheme": "oauth2-token-exchange",
    "artifact_hash": "f4e5d6c7b8a90...",
    "lineage_depth": 3,
    "actor_id": "human:jane.doe@acme.com",
    "subject_id": "agent:buyer-agent-v3",
    "constraints": {
      "scope": "compute:provision",
      "max_commitment_usd": 500.00
    }
  }
}
```

**Reading this evidence:** The ACCEPT round (commitment event) was authorized via a 3-hop delegation chain originating from a human principal. This is critical evidence for tracing accountability: the agent committed up to $500 in compute provisioning, and the authorization chain is verifiable back to a human.

---

## 7. Security Considerations

- **Never embed raw tokens or keys** in `authorization_evidence`. Use `artifact_hash` for integrity binding and reference the artifact via external stores.
- **Key rotation:** `artifact_hash` remains valid even after key rotation, since it binds to the artifact content, not the key. Verifiers SHOULD maintain historical trust anchors to validate authorization artifacts after rotation.
- **Ephemeral identities:** SPIFFE SVIDs and short-lived tokens are expected. The `artifact_hash` plus `issuer_id` provide a verification path even after the identity has expired, as long as the issuer's historical root certificates are available.
- **Privacy:** `authorization_evidence` may contain sensitive identity information. Evidence bundles that include this field SHOULD follow the `optional/vendor/` attachment model when the authorization details are not needed for ACTIS core verification.

---

*This addendum is suitable for inclusion in ACTIS v1.x as Appendix C. It does not modify any existing ACTIS core field or verification behavior.*
