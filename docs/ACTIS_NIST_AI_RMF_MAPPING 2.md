# ACTIS → NIST AI Risk Management Framework (AI RMF 1.0) Mapping

**Status:** Informational  
**Version:** 1.0  
**Scope:** Maps ACTIS v1.0 conformance claims to the NIST AI RMF's four core functions (GOVERN, MAP, MEASURE, MANAGE).

---

## 1. Framework Overview

The NIST AI Risk Management Framework (AI RMF 1.0, January 2023) provides voluntary guidance for managing AI system risks. It organizes risk management into four core functions, each containing categories and subcategories with specific outcomes.

ACTIS contributes primarily to **accountability**, **transparency**, **traceability**, and **post-incident analysis** — cutting across all four functions.

---

## 2. Mapping Table

### GOVERN

| NIST Subcategory | ACTIS Contribution | Evidence Artifact |
|---|---|---|
| **GOVERN 1.1** — Legal and regulatory requirements are identified | ACTIS provides a neutral, vendor-agnostic evidence format that supports compliance with emerging AI logging regulations (EU AI Act Article 12, sector-specific requirements) | [ACTIS_EU_AI_ACT_ALIGNMENT.md](./ACTIS_EU_AI_ACT_ALIGNMENT.md) |
| **GOVERN 1.2** — Trustworthy AI characteristics are integrated into policies | ACTIS enforces accountability and transparency through append-only, hash-linked transcripts with digital signatures — making agent actions non-repudiable | `ActisVerificationReport.signatures_ok`, `hash_chain_ok` |
| **GOVERN 1.5** — Ongoing monitoring processes are in place | ACTIS bundles produce verifiable evidence that can be continuously ingested by monitoring systems; verification is deterministic and automatable | `actis-verify` CLI, CI/CD integration via conformance test harness |
| **GOVERN 4.1** — Organizational practices for AI risk management are in place and documented | ACTIS provides standardized evidence for documenting AI system decisions — supporting the organizational practice of "every commitment is recorded and verifiable" | ACTIS bundles as audit artifacts |
| **GOVERN 6.1** — Policies addressing continual improvement are in place | ACTIS versioning policy (semantic conventions v1.0, profile mechanism, change control) demonstrates a structured approach to standard evolution | [ACTIS_SEMANTIC_CONVENTIONS_v1.md](./ACTIS_SEMANTIC_CONVENTIONS_v1.md), [ACTIS_SCOPE_v1.md](./ACTIS_SCOPE_v1.md) |

### MAP

| NIST Subcategory | ACTIS Contribution | Evidence Artifact |
|---|---|---|
| **MAP 1.1** — Intended purposes and operational context are documented | `intent_type`, `content_summary`, and `model_context` fields capture the purpose and context of each agent transaction | Transcript `intent_type`, `model_context.model_id`, `model_context.runtime` |
| **MAP 2.3** — Scientific integrity and TEVV (Test, Evaluation, Verification, Validation) are prioritized | ACTIS test vector corpus provides standardized TEVV artifacts for agent evidence verification | [Test Vector Corpus](../test-vectors/README.md) |
| **MAP 3.4** — Risks related to third-party entities are documented | `authorization_evidence` field traces delegation chains across organizational boundaries, making third-party authority lineage verifiable | [ACTIS_AUTHORIZATION_EVIDENCE.md](./ACTIS_AUTHORIZATION_EVIDENCE.md) |
| **MAP 5.1** — Likelihood and magnitude of each identified impact is assessed | `failure_event` with `fault_domain`, `terminality`, and `evidence_refs` provides structured data for assessing incident impact | FailureEvent fields in transcript |

### MEASURE

| NIST Subcategory | ACTIS Contribution | Evidence Artifact |
|---|---|---|
| **MEASURE 1.1** — Approaches for measurement are selected | ACTIS verification report provides five deterministic boolean measurements: `signatures_ok`, `hash_chain_ok`, `schema_ok`, `replay_ok`, `checksums_ok` | `ActisVerificationReport` interface |
| **MEASURE 2.5** — AI system is evaluated for safety | `integrity_status` classification (`VALID`, `TAMPERED`, `INDETERMINATE`) provides a safety-relevant signal: evidence tampering indicates a potential safety concern | `ActisVerificationReport.integrity_status` |
| **MEASURE 2.6** — AI system is evaluated regularly for deployment-relevant risks | ACTIS bundles are produced per-transaction, enabling continuous per-event evaluation rather than periodic batch audits | Bundle production workflow |
| **MEASURE 2.11** — Fairness and bias assessment | ACTIS does not assess fairness or bias (explicitly out of scope). However, ACTIS evidence *enables* fairness analysis by third parties who can replay transcripts and evaluate outcomes. | Not directly applicable; supports external fairness analysis |
| **MEASURE 4.1** — Measurement approaches are documented | ACTIS semantic conventions document every field, type, and allowed value used in verification | [ACTIS_SEMANTIC_CONVENTIONS_v1.md](./ACTIS_SEMANTIC_CONVENTIONS_v1.md) |

### MANAGE

| NIST Subcategory | ACTIS Contribution | Evidence Artifact |
|---|---|---|
| **MANAGE 1.1** — A process for risk response is documented | ACTIS provides deterministic evidence for post-incident analysis: replay the transcript, verify signatures, check hash chain, identify where integrity was compromised | `buildActisReport()` function, `actis-verify` CLI |
| **MANAGE 1.3** — Responses to identified risks are documented | `failure_event` in transcripts documents risk events with structured metadata (error code, stage, fault domain, evidence references) | FailureEvent in transcript |
| **MANAGE 2.1** — Resources required for risk management are identified | ACTIS verification requires minimal resources: a JSON parser, SHA-256 hash function, and Ed25519 signature verification. No proprietary tools or cloud services required. | ACTIS verifier implementation |
| **MANAGE 2.4** — Mechanisms are in place for incident response | ACTIS bundles serve as forensic evidence for incident response: self-contained, cryptographically bound, and independently verifiable | ACTIS bundle format |
| **MANAGE 3.1** — AI risks and benefits are regularly monitored | Per-transaction ACTIS verification enables continuous monitoring of evidence integrity across all agent commitments | CI/CD pipeline integration |
| **MANAGE 4.1** — Post-deployment AI system monitoring | `model_context.deployment_hash` links each transcript to a specific model deployment, enabling monitoring of behavior changes across deployments | `model_context` fields |

---

## 3. Coverage Summary

| NIST Function | Subcategories Mapped | Primary ACTIS Contribution |
|---|---|---|
| **GOVERN** | 5 | Accountability, policy documentation, compliance support |
| **MAP** | 4 | Context documentation, third-party risk, impact assessment |
| **MEASURE** | 5 | Deterministic measurement, continuous evaluation |
| **MANAGE** | 6 | Incident response, forensic evidence, continuous monitoring |
| **Total** | 20 | |

---

## 4. Limitations

| Limitation | Description | Mitigation |
|---|---|---|
| **No fairness/bias assessment** | ACTIS verifies evidence integrity, not decision quality or fairness | ACTIS evidence enables external fairness analysis — pair with fairness tooling |
| **No model explainability** | ACTIS does not capture reasoning chains or feature attributions | Pair with explainability tools; attach explanations as optional bundle evidence |
| **No privacy risk assessment** | ACTIS does not evaluate privacy impact of recorded data | Apply privacy-by-design practices to transcript content; see EU AI Act alignment for GDPR guidance |
| **No human oversight verification** | ACTIS does not verify that a human was in the loop | `authorization_evidence` with `actor_id` referencing a human principal provides partial coverage; not enforceable by ACTIS core |

---

*This mapping is informational and does not constitute a compliance certification. Organizations using the NIST AI RMF should evaluate ACTIS's contribution within their specific risk management context.*
