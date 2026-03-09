# ACTIS Governance

ACTIS is maintained by **ACTIS Maintainers**. This document defines versioning, the change process, maintainer responsibilities, and the transition to independent governance.

---

## Versioning Policy

- **Major version (e.g. 1.0 → 2.0):** Breaking changes to the specification, report schema, or verification semantics. Requires explicit decision by the Maintainers and a new normative release.
- **Minor version (e.g. 1.0 → 1.1):** Backward-compatible additions (e.g. optional report fields, optional manifest fields). Implementations that conform to the prior minor version remain conformant.
- **Patch (e.g. 1.0.0 → 1.0.1):** Clarifications, typo fixes, and non-normative documentation updates that do not change verification behavior.

---

## Change Process

- **Normative changes** to the specification (ACTIS_STANDARD_v1.md, ACTIS_COMPATIBILITY.md), transcript schema, or verification report schema require:
  - A proposal (pull request or design doc) describing the change and impact on existing implementations.
  - A review period; at least one Maintainer MUST review.
  - Consensus among Maintainers before merge. Breaking changes require a major version bump and MUST be explicitly agreed.
- **Non-normative changes** (documentation, governance, IP commitment) follow the same repository workflow; Maintainers may merge after review.
- All normative documents are versioned and published; the changelog or release notes document what changed between versions.
- **Breaking vs additive:** A change is breaking if it changes verification semantics, removes or renames required fields, or changes canonical enum values. Additive changes (new optional fields, clarifications that do not change behavior) do not require a major version bump.

---

## Maintainers

- The **current steward** (organization or named maintainers) is identified in the repository. See **MAINTAINERS** in this repository for steward identification; README and the repository description may also list named maintainers. This identification MUST be kept accurate so that evaluators and implementers know who maintains ACTIS.
- **Initial maintainers** are listed in the repository (e.g. in MAINTAINERS or the repository description).
- **Future maintainers** are added by the existing Maintainers via the governance process. Criteria include sustained contribution to the specification, implementations, or tooling, and commitment to vendor-neutral stewardship.
- Maintainers are responsible for: reviewing and merging normative and non-normative changes, publishing releases, and representing ACTIS in standards-related discussions.

---

## Transition to Independent Governance

ACTIS governance will transition to a multi-maintainer model when:

- **Two independent conformant implementations exist** (each passing the ACTIS test vector corpus and producing the canonical verification report).
- **At least one implementation is maintained outside the steward organization** (e.g. by a different company or community).

When these conditions are met, the current steward will propose an updated governance structure (e.g. a formal maintainer panel, contribution policy, and decision process) and will step back to a single maintainer role among peers. This ensures the standard is not controlled by a single vendor and that adoption is measurable before transition.
