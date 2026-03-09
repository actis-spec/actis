# ACTIS Auditor Pack: Core vs Optional Attachments

**Status:** Normative  
**Scope:** Auditor pack (evidence bundle) manifest schema and verification for ACTIS-aligned packs.  
**Entrypoint:** [ACTIS_STANDARD_v1.md](./ACTIS_STANDARD_v1.md).

## 1. Overview

Auditor packs can be structured as **ACTIS** ([Audit-Compliant Transaction Integrity Standard](./ACTIS_STANDARD_v1.md)) packs. ACTIS verification requires only a minimal **core** set of files; vendor-specific artifacts (e.g. judgments, reputation snapshots, derived views) are **optional** and live under a dedicated path so they are clearly non-standard for ACTIS.

## 2. Manifest Schema

The pack `manifest.json` MAY include:

| Field | Type | Description |
|-------|------|-------------|
| `standard` | `{ name: "ACTIS", version: "1.0" }` | When present, pack is ACTIS; verification uses core-only rules. |
| `core_files` | `string[]` | Paths required for ACTIS verification. Default: `["checksums.sha256", "manifest.json", "input/transcript.json"]`. |
| `optional_files` | `string[]` | Paths that are **not** required for ACTIS validity. E.g. `["optional/vendor/derived/view.json", ...]`. |

Legacy packs (no `standard` field) are verified using the full required set (e.g. constitution, derived artifacts).

## 3. Core Files (ACTIS)

For ACTIS verification the following are **required**:

- `checksums.sha256`
- `manifest.json`
- `input/transcript.json`

All other files are **optional** for ACTIS validity. Checksums MUST validate for at least the core files.

## 4. Optional Vendor Attachments

Vendor-specific artifacts MUST be placed under a namespaced path:

```
optional/<vendor>/
  constitution/
    CONSTITUTION_v1.md
  derived/
    view.json
    judgment.json
    summary.json
    snapshot.json
    ...
```

The `<vendor>` segment is any vendor-specific namespace. **Vendors SHOULD use a DNS-derived namespace** such as `optional/com.acme/` or `optional/vendor.example/` to avoid collisions. Core ACTIS verification ignores all files under `optional/`; optional attachments never affect ACTIS pass/fail.

- Verifiers MAY resolve optional paths for display or compatibility; ACTIS verification MUST NOT require any file under `optional/` to pass.
- When optional vendor attachments are present, verifiers MAY report a neutral notice, e.g. `optional_attachments_present: ["vendor/*"]`.

## 5. Bundler Behavior

- **Default (full pack):** Emit ACTIS manifest (`standard`, `core_files`, `optional_files`) and place vendor artifacts under `optional/<vendor>/`.
- **`--actis-only`:** Emit only core files and manifest with `optional_files: []`; no vendor artifacts in the zip. ACTIS verification passes without any optional attachments.

## 6. Evidence Viewer

- **ACTIS Verified:** Shown when core verification passes (checksums, manifest, transcript integrity). Not contingent on optional vendor content.
- **Vendor panels (e.g. Judgment, Reputation, etc.):** Labeled as **Optional: Vendor Extensions** and never required for ACTIS.

---

**See also:** [ACTIS_STANDARD_v1.md](./ACTIS_STANDARD_v1.md) (normative entrypoint). Auditor pack manifest types and verifier logic may be implemented by any conforming implementation.
