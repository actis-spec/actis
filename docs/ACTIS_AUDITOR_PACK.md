# ACTIS Auditor Pack: Core vs Optional Attachments

**Status:** Normative  
**Scope:** Auditor pack (evidence bundle) manifest schema and verification for ACTIS-aligned packs.  
**Entrypoint:** [ACTIS_STANDARD_v1.md](./ACTIS_STANDARD_v1.md).

## 1. Overview

Auditor packs can be structured as **ACTIS** ([Autonomous Coordination & Transaction Integrity Standard](./ACTIS_STANDARD_v1.md)) packs. ACTIS verification requires only a minimal **core** set of files; vendor-specific artifacts (e.g. judgments, reputation snapshots, derived views) are **optional** and live under a dedicated path so they are clearly non-standard for ACTIS.

## 2. Manifest Schema (normative)

`manifest.json` is a normative ACTIS artifact. Its required shape is defined here and by the schema [actis/schemas/actis_manifest_v1.json](../schemas/actis_manifest_v1.json).

**Required:**

- **`core_files`** (array of strings): List of relative paths that MUST be present in the bundle and are covered by ACTIS verification (checksums, layout, transcript). Each path MUST appear only once. Path format: relative path using forward slashes; MUST NOT contain `../`, MUST NOT be absolute or include drive prefixes. For ACTIS v1.0 the minimal core set is: `["checksums.sha256", "manifest.json", "input/transcript.json"]`. Producers MUST include these three paths in `core_files` for a minimal ACTIS bundle.

**Optional:**

- **`standard`** (object): When present as `{ "name": "ACTIS", "version": "1.0" }`, the pack is ACTIS-aligned; verifiers use core-only rules.
- **`optional_files`** (array of strings): Paths that are not required for ACTIS pass/fail. Same path format rules as `core_files`. May be empty or omitted.

**Path normalization:** Verifiers MUST treat paths as relative to the bundle root. Paths are compared case-sensitively. No Unicode normalization is applied to path strings beyond what the archive format requires.

**Checksums:** The file `checksums.sha256` (or equivalent) MUST contain a line for each of the other core files (e.g. `manifest.json`, `input/transcript.json`). The checksum file MUST NOT list itself in its own content. Only files listed in `core_files` are in the ACTIS checksum verification surface; `manifest.json` itself is included in `core_files` and MAY be included in the checksum file.

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

## 5. Bundle Security (normative)

Verifiers MUST enforce:

- **Unique core paths:** Each path in `core_files` MUST appear at most once in the archive. Duplicate entries for the same core path MUST yield ACTIS_NONCOMPLIANT.
- **No symlinks for core paths:** Core files MUST be regular files. Symlinks (or equivalent) for any core path MUST be rejected (ACTIS_NONCOMPLIANT).
- **No path traversal:** Core paths MUST be relative; MUST NOT contain `../`, absolute paths, or drive prefixes. Reject such entries for core paths.
- **Unlisted files:** Files in the archive that are not in `core_files` (or `optional_files`) MUST NOT affect actis_status. Verifiers SHOULD warn when unlisted files exist. Only the core surface is cryptographically verified; ACTIS_COMPATIBLE does not mean the entire ZIP is safe to execute or trust beyond that surface.

## 6. Bundler Behavior

- **Default (full pack):** Emit ACTIS manifest (`standard`, `core_files`, `optional_files`) and place vendor artifacts under `optional/<vendor>/`.
- **`--actis-only`:** Emit only core files and manifest with `optional_files: []`; no vendor artifacts in the zip. ACTIS verification passes without any optional attachments.

## 7. Evidence Viewer

- **ACTIS Verified:** Shown when core verification passes (checksums, manifest, transcript integrity). Not contingent on optional vendor content.
- **Vendor panels (e.g. Judgment, Reputation, etc.):** Labeled as **Optional: Vendor Extensions** and never required for ACTIS.

---

**See also:** [ACTIS_STANDARD_v1.md](./ACTIS_STANDARD_v1.md) (normative entrypoint). Auditor pack manifest types and verifier logic may be implemented by any conforming implementation.
