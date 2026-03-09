# Phase 0 — Repo path and link diagnosis

**Purpose:** Document why reviewer-facing GitHub/raw links may 404 and what to fix.

## Canonical file locations (spec repo)

| Document               | Actual path in spec repo            |
| ---------------------- | ----------------------------------- |
| ACTIS_STANDARD_v1.md   | `actis/docs/ACTIS_STANDARD_v1.md`   |
| ACTIS_COMPATIBILITY.md | `actis/docs/ACTIS_COMPATIBILITY.md` |
| ACTIS_IP_COMMITMENT.md | `actis/docs/ACTIS_IP_COMMITMENT.md` |
| START_HERE.md          | `actis/docs/START_HERE.md`          |
| GOVERNANCE.md          | `actis/GOVERNANCE.md` (repo root)    |
| LICENSE                | `actis/LICENSE` (repo root)         |

## Public claim vs current linked path vs fix

| Public claim        | Current linked path (if any)              | Actual canonical path        | Fix required |
| ------------------- | ----------------------------------------- | ---------------------------- | ------------ |
| Canonical spec      | `.../actis/raw/main/docs/ACTIS_*.md`       | `actis/docs/ACTIS_*.md`      | Use repo default branch; if canonical repo is `pact` with `actis/` subfolder, use `.../pact/raw/main/actis/docs/...`. |
| Compatibility       | `.../actis/raw/main/docs/ACTIS_COMPATIBILITY.md` | `actis/docs/ACTIS_COMPATIBILITY.md` | Same as above. |
| LICENSE             | Often missing or under docs/              | `actis/LICENSE` at repo root | Link to `{BASE}/LICENSE` (root), not under docs/. |
| GOVERNANCE          | Sometimes under docs/                      | `actis/GOVERNANCE.md` at root| Link to `{BASE}/GOVERNANCE.md`. |
| IP commitment       | `.../docs/ACTIS_IP_COMMITMENT.md`          | `actis/docs/ACTIS_IP_COMMITMENT.md` | Use correct base and branch. |

## Why reviewer got 404s (diagnosis)

1. **Wrong branch:** If the public repo’s default branch is `master` (or other), `.../raw/main/...` returns 404. **Fix:** Use the repo’s actual default branch in all raw URLs.
2. **Wrong repo layout:** If the canonical public repo is the whole `pact` repo with `actis` as a subdirectory, raw paths must be `.../pact/raw/main/actis/docs/...` and `.../pact/raw/main/actis/LICENSE`. **Fix:** Decide canonical public repo (actis-spec/actis vs pact with actis subfolder) and align every link.
3. **LICENSE 404:** If any page links to LICENSE under `docs/`, fix that link to `.../LICENSE` at repo root.

## Decision needed

Before locking raw links on the website, confirm: (1) Which URL is the canonical public ACTIS repo? (2) What is its default branch? Then set all website and README links to that base and branch.
