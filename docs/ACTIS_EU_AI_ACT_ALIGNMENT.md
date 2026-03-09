# ACTIS → EU AI Act Alignment (Article 12)

**Status:** Informational  
**Version:** 1.0  
**Scope:** Maps ACTIS v1.0 capabilities to EU AI Act Article 12 (Logging) requirements. Identifies coverage, gaps, and recommended supplementary practices.

> **Disclaimer:** This document is for informational purposes only. It does not constitute legal advice, a compliance certification, or a guarantee of compliance with the EU AI Act. ACTIS may support evidence integrity relevant to Article 12 logging requirements; organizations are responsible for their own compliance assessment and should seek qualified legal counsel.

---

## 1. Context

The EU AI Act (Regulation 2024/1689) Article 12 requires "high-risk AI systems" to include automatic logging of events ("logs") relevant to identifying risks and enabling post-market monitoring. Autonomous agent systems that make financial commitments, delegate access, or provision resources may qualify as high-risk under Annex III categories.

ACTIS provides a standardized, verifiable evidence format for commitment-grade agent events. This document maps how ACTIS may support evidence integrity relevant to Article 12's specific requirements, making explicit what ACTIS covers, what it does not, and what supplementary practices are needed. ACTIS does not provide compliance; it provides evidence format and verification.

---

## 2. Alignment Matrix

| EU AI Act Article 12 Requirement | ACTIS Element | Coverage | Limitations | Recommended Supplementary Practice |
|---|---|---|---|---|
| **§1: Automatic recording of events (logs)** | Hash-linked transcript with append-only rounds | ✅ Full | ACTIS records commitment-grade events only, not intermediate reasoning. | Pair with OpenTelemetry or equivalent for sub-decision telemetry. |
| **§1: Enable traceability of AI system functioning** | `round_type` sequence, `content_summary`, `model_context.model_id` | ✅ Full | `content_summary` is optional and human-readable only. | Require `model_context` in profiles targeting Article 12 compliance. |
| **§2: Traceable to risk situations** | `failure_event` with `code`, `stage`, `fault_domain`, `terminality` | ✅ Full | Failure taxonomy uses ACTIS-neutral error code namespace (e.g. `ACTIS-XXX`). | Extend code namespace in semantic conventions as needed for cross-vendor risk identification. |
| **§2: Identification of situations involving risk** | `integrity_status: "TAMPERED"` / `"INDETERMINATE"` in verification report | ✅ Full | ACTIS identifies evidence-level integrity risks, not business-logic risks. | Layer domain-specific risk identification above ACTIS (in profiles or adjudication). |
| **§2: Substantial modification** | Hash chain (`previous_round_hash` → `round_hash` → `final_hash`) + `deployment_hash` in `model_context` | ✅ Full | ACTIS detects transcript modification, not model/system modification between versions. | Use `model_context.deployment_hash` to link transcripts to specific model builds; maintain separate deployment records or a deployment inventory. |
| **§3: Logging capabilities for high-risk AI** | Append-only rounds, Ed25519 signatures, SHA-256 hash chain | ✅ Full | ACTIS does not prescribe log storage duration or access control. | See §2.1 (Retention) and §2.2 (Access) below. |
| **§3: Logging proportionate to intended purpose** | ACTIS records only commitment-grade events (per ACTIS Scope v1) | ✅ Full | The "proportionate" determination is a legal judgment, not a technical one. | Document the scoping rationale (why only commitment-grade events are logged) in the AI system's technical documentation per Article 11. |
| **§4: Integration of logging capabilities** | ACTIS CLI (`actis-verify`), bundle format (ZIP), JSON schema | ✅ Full | ACTIS is a verification standard, not a logging integration SDK. | Provide SDK wrappers or adapters for common agent frameworks (e.g., LangChain, AutoGPT) as part of an `actis-profile-eu-ai-act/1.0` profile. |

---

## 2.1 Retention (Article 12 §3; Article 19 §1)

**EU Requirement:** High-risk AI system logs MUST be retained for a period appropriate to the intended purpose and at least 6 months (unless otherwise provided by specific EU or national law).

**ACTIS Coverage:** ACTIS defines the evidence *format* but does not enforce retention. Evidence bundles are self-contained ZIP archives with cryptographic integrity, making them suitable for long-term archival storage.

**Recommendation:**
- Store ACTIS bundles in immutable object storage (e.g., S3 with versioning, Azure Blob with immutability policies).
- Set retention period to ≥ 6 months. Profile `actis-profile-eu-ai-act/1.0` SHOULD specify `metadata.retention_until_ms` as a REQUIRED field.
- Maintain a retention log (timestamps of storage events) separate from the ACTIS bundle.

## 2.2 Access (Article 12 §3; Article 64)

**EU Requirement:** Logs MUST be accessible to competent national authorities upon request.

**ACTIS Coverage:** ACTIS bundles are self-contained, portable, and verifiable by any party with the ACTIS verifier. No special software or credentials are needed to verify integrity.

**Recommendation:**
- Establish an access procedure for responding to competent authority requests.
- Provide authorities with the ACTIS CLI (`actis-verify`) or a web-based verification tool.
- Ensure bundles do not contain personal data beyond what is necessary for the audit trail. If personal data is present, apply GDPR-compliant access controls and document the legal basis.

## 2.3 Privacy Conflict Resolution (GDPR × AI Act)

**Tension:** AI Act Article 12 requires logging; GDPR requires data minimization and may require deletion (right to erasure, Article 17).

**ACTIS Position:** ACTIS evidence MAY contain personal data (e.g., `agent_id` linked to a natural person, authorization chain referencing a human delegator). The hash chain makes selective deletion impossible without breaking integrity.

**Recommendation:**
- Use pseudonymized identifiers (`agent_id: "agent-a1b2c3"`) in transcripts.
- Maintain a **mapping table** (pseudonym → identity) under strict access control, separate from the ACTIS bundle.
- Document the legal basis for retention (legitimate interest under GDPR Article 6(1)(f), or legal obligation under GDPR Article 6(1)(c) for AI Act compliance).
- If deletion is legally required, the entire transcript MAY be deleted, but this MUST be documented and the deletion event itself SHOULD be recorded in a separate audit log.

---

## 4. Gap Summary

| Gap | Severity | Mitigation Path |
|---|---|---|
| No retention enforcement | Medium | Profile `actis-profile-eu-ai-act/1.0` with `retention_until_ms` field |
| Vendor-specific failure codes in core schema | Low | Use ACTIS-neutral error code namespace (ACTIS-XXX) per semantic conventions |
| No sub-decision logging | Medium | Out of ACTIS scope; pair with OpenTelemetry |
| GDPR × AI Act tension on deletion | High | Pseudonymization + separate mapping table + documented legal basis |
| No SDK for common agent frameworks | Medium | Planned for Phase 2 (see 90-Day Roadmap) |

---

## Appendix A: NON-NORMATIVE SAMPLE LANGUAGE (NOT LEGAL ADVICE; NOT A COMPLIANCE CLAIM)

The following sample text may be adapted for an organization's AI system technical documentation (Article 11). It is **not** legal advice and does **not** constitute a compliance claim or certification.

> **ACTIS evidence note**
>
> This AI system generates evidence bundles conforming to ACTIS v1.0 (Autonomous Coordination & Transaction Integrity Standard) for commitment-grade agent events. ACTIS may support evidence integrity relevant to EU AI Act Article 12 logging requirements by providing:
>
> - **Automatic event recording** via append-only, hash-linked transcripts with Ed25519 digital signatures (Article 12 §1, §3).
> - **Traceability** of AI system functioning through sequential round recording with model/deployment context (Article 12 §1).
> - **Risk identification** through standardized failure events with fault domain classification (Article 12 §2).
> - **Substantial modification detection** through cryptographic hash chains that detect post-hoc modification to recorded events (Article 12 §2).
> - **Integrity verification** via an independent, vendor-neutral verification tool.
>
> Evidence bundles conform to the schema `actis-transcript/1.0` and are verifiable using any ACTIS v1.0-compatible verifier. Bundles are retained for [RETENTION PERIOD] in immutable storage.
>
> For sub-decision telemetry not covered by ACTIS, this system uses [OBSERVABILITY SYSTEM] with retention [RETENTION PERIOD].
>
> *This note is sample language only. It does not constitute legal advice or a compliance certification. Organizations MUST seek qualified legal counsel for EU AI Act compliance.*

---

*This document is informational and does not constitute legal advice. Organizations SHOULD seek legal counsel to assess their specific compliance obligations under the EU AI Act.*
