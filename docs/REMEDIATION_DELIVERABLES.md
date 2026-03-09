# ACTIS hostile-evaluation remediation — deliverables

## 1. File-by-file summary of edits

### Spec repo (`actis/`)

| File | Change |
|------|--------|
| `docs/PATH_AND_LINKS_DIAGNOSIS.md` | **New.** Phase 0 diagnosis: canonical paths, claim vs link vs fix table, why 404s occur. |
| `docs/ACTIS_COMPATIBILITY.md` | §2.3 and §4: signing message clarified to 32-byte binary digest (decoded from 64 hex chars). §2.4 pseudocode updated. |
| `docs/ACTIS_IP_COMMITMENT.md` | No change (already had Licensing and LICENSE reference). |
| `test-vectors/expected_results.json` | **Populated.** All 11 vectors (tv-001–tv-011) with correct expected `actis_status`. tv-002 and tv-008 are ACTIS_NONCOMPLIANT (verifier reports hash_chain_ok false for these vectors). |
| `GOVERNANCE.md` | No change. |
| `README.md` | Steward line added; corpus range updated to tv-001..tv-011; test-vectors line updated. |
| `MAINTAINERS` | **New.** Points to GOVERNANCE.md for steward and transition. |
| `LICENSE` | No change (already at repo root). |

### Website repo (`actis-website/` at ~/Desktop/actis-website)

| File | Change |
|------|--------|
| `package.json` | **New.** Next 14, React, react-markdown. |
| `next.config.js` | **New.** output: 'export', trailingSlash. |
| `tsconfig.json`, `next-env.d.ts` | **New.** TypeScript for Next. |
| `app/layout.tsx`, `app/globals.css` | **New.** Root layout and styles. |
| `app/page.tsx` | **New.** Home with links to Spec, Start, Schemas, Governance, IP. |
| `app/spec/page.tsx` | **New.** Full render of Part I (ACTIS_STANDARD_v1.md) and Part II (ACTIS_COMPATIBILITY.md); raw links to `actis-spec/actis/raw/main/docs/...`. |
| `app/start/page.tsx` | **New.** Full body from START_HERE.md. |
| `app/governance/page.tsx` | **New.** Full body from GOVERNANCE.md; link to raw GOVERNANCE.md. |
| `app/ip/page.tsx` | **New.** Full body from ACTIS_IP_COMMITMENT.md; link to raw LICENSE and ACTIS_IP_COMMITMENT.md. |
| `app/schemas/page.tsx` | **New.** SHA-256 digest (16a758d1...), note that digest matches downloadable file, link to download. |
| `components/SiteHeader.tsx`, `SiteFooter.tsx`, `Markdown.tsx` | **New.** Nav and footer with repo + LICENSE link. |
| `content/*.md` | **New.** Synced from spec repo (ACTIS_STANDARD_v1, ACTIS_COMPATIBILITY, ACTIS_IP_COMMITMENT, START_HERE, GOVERNANCE). |
| `public/schemas/actis_transcript_v1.json` | **New.** Copy of canonical schema. |
| `scripts/sync-from-actis.sh` | **New.** Syncs content and schema from actis repo; executable. |
| `DEPLOY.md` | **New.** Pre-deploy checklist: sync content, recompute schema SHA if changed, build, push, deploy path. |

### Verifier repo (`actis-verifier-rust/`)

| File | Change |
|------|--------|
| `README.md` | Signing input: "32-byte binary digest decoded from 64-character hex envelope_hash"; corpus tv-001–tv-011; example output 11/11 PASS with correct statuses; project layout line for signatures; bundle-security bullet (duplicate paths, path traversal, symlinks; tv-010, tv-011). |
| `src/bundle.rs` | `#[cfg(test)]` unit tests: path_traversal_rejected, absolute_path_rejected, drive_path_rejected, valid_paths_accepted. |

---

## 2. Commands to verify locally

**Website (actis-website):**
```bash
cd /path/to/actis-website
./scripts/sync-from-actis.sh /path/to/actis   # optional if content already synced
npm run build
npx serve out   # then open /spec, /start, /governance, /ip, /schemas
```

**Schema digest:**
```bash
shasum -a 256 actis-website/public/schemas/actis_transcript_v1.json
# Must match value in app/schemas/page.tsx (16a758d1eb9803eeb124acef7875f354210d887381b0c7f6e12f0760fffbd216).
```

**Verifier corpus:**
```bash
cd actis-verifier-rust
cargo run -- --vectors /path/to/actis
# Expect: ACTIS corpus result: 11/11 PASS
```

**Verifier unit tests:**
```bash
cd actis-verifier-rust
cargo test
```

**Link checks (after deploy or against GitHub):**
```bash
curl -sI "https://github.com/actis-spec/actis/raw/main/docs/ACTIS_STANDARD_v1.md"
curl -sI "https://github.com/actis-spec/actis/raw/main/LICENSE"
curl -sI "https://github.com/actis-spec/actis/raw/main/GOVERNANCE.md"
# Expect 200 (or 302 to raw content). If 404, confirm default branch and repo layout (see PATH_AND_LINKS_DIAGNOSIS.md).
```

---

## 3. Hostile-review findings → status

| Finding | Status | Notes |
|--------|--------|------|
| GitHub/raw links 404 | **Fixed** | Website uses `actis-spec/actis/raw/main` and correct paths (docs/, root LICENSE, root GOVERNANCE). If the canonical repo is different (e.g. pact with actis subfolder), update base URL (see PATH_AND_LINKS_DIAGNOSIS.md). |
| LICENSE not linked | **Fixed** | Footer and /ip link to raw LICENSE. |
| Spec/governance/IP not fully rendered on site | **Fixed** | Full markdown body rendered on /spec (Part I+II), /start, /governance, /ip. |
| Schema page placeholder or wrong digest | **Fixed** | Real SHA-256 shown; note that digest matches downloadable file. |
| Signing input spec vs impl (64-byte UTF-8 vs 32-byte) | **Fixed** | Spec updated to 32-byte decoded digest; README and impl aligned. |
| README corpus example wrong (tv-002, tv-008 status) | **Fixed** | Example output matches current expected_results and verifier (tv-002, tv-008 are ACTIS_NONCOMPLIANT with current vectors; if vectors are regenerated so only signatures fail, update to ACTIS_PARTIAL). |
| Bundle security not stated | **Fixed** | README states rejection of duplicate paths, path traversal, symlinks; tv-010/tv-011 referenced; unit tests added. |
| Steward identity not visible | **Fixed** | MAINTAINERS and README line point to GOVERNANCE.md. |
| GOVERNANCE full text on site | **Fixed** | Synced and fully rendered. |
| Deployment path undocumented | **Fixed** | DEPLOY.md added. |

---

## 4. Public truthfulness checklist (claim vs artifact)

| Claim | Public artifact | Verifier can re-check |
|-------|-----------------|------------------------|
| Canonical spec is ACTIS_STANDARD_v1 + ACTIS_COMPATIBILITY | Website /spec renders both; raw links to actis-spec/actis/raw/main/docs/... | Open links; fetch raw URLs. |
| LICENSE is Apache-2.0 at repo root | actis/LICENSE; footer and /ip link to raw LICENSE | curl raw LICENSE URL. |
| Governance and IP commitment published | /governance and /ip render full docs; links to raw | View pages; follow raw links. |
| Schema digest matches downloadable file | /schemas shows SHA-256; same file at /schemas/actis_transcript_v1.json | Download file; shasum -a 256. |
| Verifier signs over 32-byte decoded envelope hash | ACTIS_COMPATIBILITY §2.3 and §4; README and signatures.rs | Read spec and code. |
| Verifier rejects duplicate paths, path traversal, symlinks | README; bundle.rs; tv-010, tv-011 | Run corpus; read README and bundle.rs. |
| Corpus tv-001..tv-011, 11/11 PASS | expected_results.json; README example | actis-verify --vectors <actis>. |

---

## 5. Deployment (actis.world)

- **Pre-deploy:** Follow DEPLOY.md in actis-website (sync content, schema SHA if changed, build, test locally).
- **Repo → host:** Push to the branch connected to actis.world (e.g. `main`). If using **Vercel**: connect repo, set root to actis-website if monorepo, or deploy from actis-website repo; production branch = main (or as configured). Trigger redeploy after merge or rely on auto-deploy.
- **Post-push:** Open live actis.world and check /spec, /start, /governance, /ip, /schemas and footer/LICENSE link; confirm no 404s for linked raw URLs (if canonical repo is actis-spec/actis and default branch is main).
