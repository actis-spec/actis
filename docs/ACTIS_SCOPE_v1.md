# ACTIS Scope and Boundary (v1.x)

**Status:** Normative (required for conformance in ACTIS v1.0.0)  
**Version:** 1.0  
**Scope:** Defines the boundary of the ACTIS standard: what is in scope, what is out of scope, and how vertical extensions are managed.

---

## 1. Core Boundary

ACTIS covers **agent actions that create irreversible commitments affecting rights, resources, or obligations**. An irreversible commitment is any action where:

- A binding agreement is formed or modified,
- A resource (compute, money, data, infrastructure) is allocated, consumed, or transferred,
- An authority is delegated or revoked, or
- A state change occurs that cannot be unilaterally reversed by the acting party.

ACTIS provides integrity verification and deterministic replay for the evidence produced by such actions. It answers one question: *"Is this evidence cryptographically intact and deterministically reproducible?"*

---

## 2. Commitment-Grade Events

A **commitment-grade event** is an action that crosses the irreversibility threshold defined above. ACTIS standardizes evidence for these events. The following are concrete examples across three domains:

### 2.1 Agent Commerce

An autonomous buyer agent issues an `INTENT` for weather data, a provider agent responds with an `ASK` (price quote), and the buyer issues an `ACCEPT`. The `ACCEPT` round creates an irreversible commitment: the buyer has agreed to pay for data delivery. The resulting transcript — with its hash-linked rounds, Ed25519 signatures, and final hash — is an ACTIS evidence artifact.

### 2.2 Access Delegation

An orchestration agent delegates API access to a sub-agent by exchanging an OAuth 2.0 token (per RFC 8693 Token Exchange). The sub-agent then makes a resource call using the delegated token. The delegation event — binding the delegating agent's identity to the sub-agent's identity and the scope of access granted — is a commitment-grade event. ACTIS records the delegation lineage as verifiable evidence attached to the transcript.

### 2.3 Resource Provisioning

An infrastructure agent provisions a GPU cluster on behalf of a workload orchestrator. The provisioning action consumes budget, allocates compute, and creates a billing obligation. The provisioning event — including the workload identity, resource identifiers, quota consumed, and authorization basis — is a commitment-grade event. ACTIS records the provisioning evidence as a verifiable bundle.

---

## 3. Profile Mechanism

ACTIS core defines neutral integrity verification. **Profiles** constrain ACTIS for specific domains, industries, or regulatory contexts without modifying the core standard.

### 3.1 What a Profile Is

A profile is a separate document that:

1. **References** a specific version of ACTIS core (e.g., `actis/1.0`).
2. **Constrains** which optional fields are REQUIRED in that domain.
3. **Defines** domain-specific validation rules that apply *in addition to* ACTIS core checks.
4. **Does not** relax, override, or contradict any ACTIS core requirement.

A bundle that passes ACTIS core verification but fails a profile's additional constraints is reported as ACTIS-valid with a profile-specific non-compliance notice — never as an ACTIS core failure.

### 3.2 Naming Convention

Profiles MUST use the following identifier format:

```
actis-profile-{domain}/{version}
```

**Examples:**

| Profile Identifier | Domain |
|---|---|
| `actis-profile-fintech/1.0` | Financial transactions (FIX-inspired ordering, settlement evidence) |
| `actis-profile-access-delegation/1.0` | OAuth/SPIFFE token exchange, delegation chain evidence |
| `actis-profile-healthcare-audit/1.0` | FHIR AuditEvent-aligned evidence for clinical AI decisions |
| `actis-profile-eu-ai-act/1.0` | EU AI Act Article 12 logging compliance constraints |
| `actis-profile-resource-provisioning/1.0` | Cloud/infrastructure provisioning evidence |

### 3.3 Profiles and naming

Profiles may exist (e.g. domain-specific constraints or regulatory profiles). ACTIS does not define a central list or authority for profiles in v1.0. Profile identifiers SHOULD follow the naming convention above; a normative profile document SHOULD reference the ACTIS core version it constrains and specify the additional requirements.

---

## 4. What ACTIS Is Not

ACTIS is explicitly **not** any of the following:

### 4.1 Not a General Audit Log Format

ACTIS does not standardize intermediate reasoning steps, tool calls, chain-of-thought traces, debug logs, or observability telemetry. These are valuable for debugging and monitoring but are not commitment-grade events. Systems that need general audit logging SHOULD use purpose-built observability standards (e.g., OpenTelemetry) and MAY attach such data as optional, non-ACTIS evidence in bundles.

### 4.2 Not an Observability Standard

ACTIS does not define metrics, traces, spans, or log aggregation semantics. It does not compete with or replace OpenTelemetry, CloudEvents, or similar standards. ACTIS evidence MAY reference trace IDs or correlation IDs from observability systems, but ACTIS verification does not depend on or validate observability data.

### 4.3 Not a Compliance Certifier

ACTIS verification reports whether evidence is cryptographically intact and replay-consistent. An `integrity_status: "VALID"` result does **not** certify that the underlying transaction was legal, ethical, fair, or compliant with any regulation. Compliance determination is the responsibility of the consuming organization, auditor, or regulator — not the ACTIS verifier.

### 4.4 Not a Blame or Reputation System

ACTIS does not determine fault, assign blame, score reputation, assess risk, or make settlement decisions. These functions belong to adjudication layers that consume ACTIS evidence as input. Adjudication outputs MUST be kept separate from ACTIS verification reports.

---

## 5. Canonical Answer

When asked *"Why doesn't ACTIS cover X?"* the answer follows this decision tree:

1. **Does X create an irreversible commitment affecting rights, resources, or obligations?**
   - **No** → X is out of ACTIS core scope. It MAY be logged via observability tools and attached as optional evidence.
   - **Yes** → Continue to 2.

2. **Is X covered by ACTIS core verification semantics (integrity, replay, signatures, schema, checksums)?**
   - **Yes** → X is in scope. ACTIS core handles it.
   - **No** → Continue to 3.

3. **Is X a domain-specific constraint (e.g., regulatory requirement, industry-specific field)?**
   - **Yes** → X belongs in a **profile**, not in ACTIS core.
   - **No** → X is an adjudication or application-layer concern, outside ACTIS entirely.

---

*ACTIS is an open standard. This scope statement is versioned alongside ACTIS core and updated only via the ACTIS change control process.*
