# ACTIS Interoperability Event v1 — Specification and Runbook

**Status:** Informational  
**Version:** 1.0  
**Scope:** Defines the format, participant roles, test scenarios, interoperability matrix, pass criteria, and result reporting for the first ACTIS interoperability event, modeled on HL7 FHIR Connectathon structure.

---

## 1. Event Format

| Property | Value |
|---|---|
| **Format** | Virtual, async-friendly |
| **Duration** | 5 business days (participants work at their own pace) |
| **Communication** | Shared repository + async chat channel |
| **Artifact Exchange** | Shared cloud storage bucket or Git repository |
| **Coordination** | One synchronous kickoff call (30 min) + one results call (30 min) |

### 1.1 Why Async

Agent accountability is a global problem. Participants span time zones and organizations. An async-first format reduces coordination overhead while maintaining rigor through structured artifact exchange and automated validation.

---

## 2. Participant Roles

Each participating organization takes on one or more roles:

| Role | Responsibility | Minimum Participants |
|---|---|---|
| **Bundle Producer** | Generates ACTIS-compatible evidence bundles from real or simulated agent transactions | ≥ 2 independent organizations |
| **Bundle Verifier** | Independently verifies bundles produced by other participants using their own ACTIS verifier implementation | ≥ 1 independent organization |
| **Adjudication Provider** | Accepts bundles via API, runs full verification, and returns ACTIS status | ≥ 1 organization |

### 2.1 Independence Requirement

"Independent" means the implementation has no shared codebase with any other participant's implementation. Wrappers around the same library count as a single implementation. Fork-and-modify counts as independent if the verification logic has been independently reviewed and possibly modified.

### 2.2 Target Participants

| Organization | Primary Role | Secondary Role |
|---|---|---|
| Pact Protocol | Adjudication Provider, Bundle Verifier | Bundle Producer |
| Noble.xyz | Bundle Producer | Bundle Verifier |
| fin.com | Bundle Producer | — |
| natural.io | Bundle Producer | — |
| brickroadapp.com | Bundle Producer | — |

The **minimum viable event** requires at least 2 Bundle Producers and 1 Bundle Verifier from different organizations.

---

## 3. Test Scenarios

The event uses the ACTIS Test Vector Corpus (tv-001 through tv-008) as the standardized scenario set, plus a "real-world" scenario:

| Scenario ID | Source | Description | Required? |
|---|---|---|---|
| `ie-001` | tv-001 | Minimal valid bundle, all checks pass | Yes |
| `ie-002` | tv-002 | Invalid signature (one round) | Yes |
| `ie-003` | tv-003 | Wrong `transcript_version` constant | Yes |
| `ie-004` | tv-004 | Hash chain break at round 1 | Yes |
| `ie-005` | tv-005 | Checksum tamper (post-generation modification) | Bundle Verifiers only |
| `ie-006` | tv-006 | Missing `manifest.json` | Bundle Verifiers only |
| `ie-007` | tv-007 | Valid bundle with `failure_event` | Yes |
| `ie-008` | tv-008 | Zero valid signatures | Yes |
| `ie-009` | Original | Real-world bundle from participant's own agent system | Yes (Producers only) |

### 3.1 Scenario ie-009: Real-World Bundle

Each Bundle Producer MUST produce at least one bundle from their own agent system (not hand-crafted test data). This bundle MUST:

- Contain a transcript from an actual or realistic simulated agent transaction
- Use the producer's own Ed25519 keypair (not shared test keys)
- Be produced by the producer's own bundling code (not Pact's reference implementation)
- Pass ACTIS verification (ie, be a valid `ACTIS_COMPATIBLE` bundle)

---

## 4. Interoperability Matrix

Each cell indicates what the participant at the row must do with the artifact from the column:

### 4.1 Producer → Verifier Matrix

| | Pact Verifier | Noble Verifier | Independent Verifier |
|---|---|---|---|
| **Noble Bundle** | Verify ✓ | Self-verify ✓ | Verify ✓ |
| **fin.com Bundle** | Verify ✓ | Verify ✓ | Verify ✓ |
| **natural.io Bundle** | Verify ✓ | — | Verify ✓ |
| **brickroadapp Bundle** | Verify ✓ | — | Verify ✓ |
| **Pact Bundle** | Self-verify ✓ | Verify ✓ | Verify ✓ |

### 4.2 Test Vector Matrix

Each Verifier must verify **every test vector** (ie-001 through ie-008) and report results. Each Producer must produce bundles matching ie-001 through ie-004, ie-007, ie-008 (6 vectors minimum).

---

## 5. Pass Criteria

### 5.1 Event-Level Pass

The event achieves **ACTIS Interoperability Demonstrated** when:

1. ≥ 2 independent organizations produce bundles that pass ie-001 (valid bundle, ACTIS_COMPATIBLE)
2. ≥ 1 independent verifier accepts those bundles as ACTIS_COMPATIBLE
3. All participants agree on the verification outcome for ie-001 through ie-004, ie-007, ie-008

### 5.2 Participant-Level Pass

| Role | Pass Criteria |
|---|---|
| **Bundle Producer** | ≥ 1 valid bundle (ie-001 equivalent) verified as ACTIS_COMPATIBLE by ≥ 1 independent verifier; ie-009 (real-world bundle) produced and verified |
| **Bundle Verifier** | Correct verdict on ≥ 6 test vectors (ie-001 through ie-004, ie-007, ie-008); correct verdict on ≥ 2 real-world bundles from independent producers |
| **Adjudication Provider** | API accepts bundles from ≥ 2 independent producers; returns correct ACTIS status for all submitted bundles |

### 5.3 Disagreement Resolution

If two verifiers produce different verdicts for the same bundle:

1. Both verifiers MUST report their full verification output (all check fields + warnings)
2. The specific check(s) where they disagree are identified
3. The disagreement is traced to a spec ambiguity, implementation bug, or deviation from the test vector
4. Resolution is documented in the event results as a "spec clarification" item

---

## 6. Timeline

| Day | Activity |
|---|---|
| **Day 0** | Kickoff call: review scenarios, distribute test vector baselines, confirm participant roles |
| **Days 1-2** | Producers generate test vector bundles (ie-001 through ie-008) and upload to shared repository |
| **Day 3** | Producers generate real-world bundles (ie-009) and upload |
| **Days 3-4** | Verifiers download all bundles and run verification; upload results |
| **Day 4** | Adjudication Provider processes all submitted bundles; reports results |
| **Day 5** | Results call: review interoperability matrix, identify spec clarifications, publish results |

---

## 7. Result Reporting Format

Each participant submits a JSON results file:

```json
{
  "event_version": "1.0",
  "participant": {
    "organization": "Noble.xyz",
    "roles": ["bundle_producer", "bundle_verifier"],
    "implementation_name": "noble-actis-toolkit",
    "implementation_version": "0.1.0",
    "implementation_language": "TypeScript"
  },
  "produced_bundles": [
    {
      "scenario_id": "ie-001",
      "bundle_hash": "sha256-of-zip...",
      "bundle_uri": "shared-repo/noble/ie-001.zip",
      "expected_result": "ACTIS_COMPATIBLE"
    },
    {
      "scenario_id": "ie-009",
      "bundle_hash": "sha256-of-zip...",
      "bundle_uri": "shared-repo/noble/ie-009-real-world.zip",
      "expected_result": "ACTIS_COMPATIBLE",
      "description": "Real weather data procurement via Noble agent"
    }
  ],
  "verification_results": [
    {
      "scenario_id": "ie-001",
      "producer": "fin.com",
      "bundle_hash": "sha256-of-zip...",
      "verdict": "ACTIS_COMPATIBLE",
      "checks": {
        "signatures_ok": true,
        "hash_chain_ok": true,
        "schema_ok": true,
        "replay_ok": true,
        "checksums_ok": true
      },
      "integrity_status": "VALID",
      "warnings": [],
      "notes": "Verified in 12ms"
    }
  ],
  "issues": [
    {
      "scenario_id": "ie-003",
      "type": "spec_clarification",
      "description": "Should verifier check transcript_version before or after parsing rounds?",
      "proposed_resolution": "Check transcript_version first; short-circuit on schema failure"
    }
  ]
}
```

### 7.1 Aggregate Results Report

After all participants submit, Pact Protocol produces an aggregate report:

```json
{
  "event_id": "actis-interop-v1-2026Q1",
  "date_range": "2026-03-10 to 2026-03-14",
  "participants": 4,
  "independent_producers": 3,
  "independent_verifiers": 2,
  "interoperability_demonstrated": true,
  "matrix_summary": {
    "total_verifications": 48,
    "agreements": 46,
    "disagreements": 2,
    "disagreements_resolved": 2
  },
  "spec_clarifications_identified": 1,
  "ietf_style_claim": "Two independent interoperable implementations demonstrated for ACTIS v1.0 core verification."
}
```

---

## 8. Artifacts Produced

The interoperability event produces the following artifacts, suitable for public publication:

| Artifact | Description | Audience |
|---|---|---|
| **Aggregate Results Report** (JSON) | Machine-readable summary of all verification outcomes | Engineering teams, standards bodies |
| **Interoperability Statement** (Markdown) | Human-readable claim: "ACTIS v1.0 has been demonstrated with N independent implementations" | AI labs, enterprise adopters, regulators |
| **Spec Clarifications** (Markdown) | Issues discovered during the event and their resolutions | Standard maintainers, future implementers |
| **Participant Bundles** (ZIP archive) | All test and real-world bundles produced during the event | Future implementers (as additional test fixtures) |

---

## 9. Post-Event Actions

| Action | Owner | Timeline |
|---|---|---|
| Incorporate spec clarifications into ACTIS v1.x errata | Pact Protocol | 2 weeks post-event |
| Add participant bundles to public test vector corpus | Pact Protocol | 1 week post-event |
| Publish interoperability statement | Pact Protocol + participants | Day 5 |
| Update conformance test harness based on event findings | Pact Protocol | 30 days post-event |

---

*This specification enables Pact to run a credible interoperability event that produces an IETF-style "two interoperable implementations" evidence artifact for ACTIS v1.0.*
