#!/usr/bin/env node
/**
 * Regenerate all ACTIS test vector ZIPs after the §3.2 spec change:
 *   round_hash now excludes BOTH "round_hash" AND "signature" keys.
 *
 * Run from the repo root:
 *   node actis/test-vectors/scripts/regenerate.js
 *
 * tv-010 and tv-011 are intentionally left unchanged — their test results
 * depend on ZIP-level structure (duplicate entry, path traversal), not transcript
 * hashes, and the verifier rejects them before parsing the transcript.
 */

"use strict";

const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Use adm-zip from actis-verifier-ts
const AdmZip = require(
  path.resolve(__dirname, "../../../actis-verifier-ts/node_modules/adm-zip")
);

const GENERATED = path.resolve(__dirname, "../generated");

// ---------------------------------------------------------------------------
// Crypto / canonicalization helpers
// ---------------------------------------------------------------------------

function sha256hex(input) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function sha256bytes(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!isFinite(value)) throw new Error("Non-finite number in JCS");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const keys = Object.keys(value).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") +
    "}"
  );
}

function omitKeys(obj, keys) {
  const omit = new Set(keys);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!omit.has(k)) result[k] = v;
  }
  return result;
}

/** §3.1 genesis hash */
function computeGenesisHash(intentId, createdAtMs) {
  return sha256hex(`${intentId}:${createdAtMs}`);
}

/** §3.2 round hash — excludes round_hash AND signature */
function computeRoundHash(round) {
  const obj = omitKeys(round, ["round_hash", "signature"]);
  return sha256hex(canonicalize(obj));
}

/** §3.4 final hash */
function computeFinalHash(transcript) {
  const obj = omitKeys(transcript, ["final_hash", "model_context"]);
  return sha256hex(canonicalize(obj));
}

/**
 * Recompute all round_hash and previous_round_hash values in a transcript.
 * Returns a deep-cloned transcript with updated hash fields.
 * Does NOT touch signature or final_hash — those must be handled by the caller.
 */
function recomputeHashChain(transcript) {
  const t = JSON.parse(JSON.stringify(transcript));
  let prevHash = computeGenesisHash(t.intent_id, t.created_at_ms);
  for (const round of t.rounds) {
    round.previous_round_hash = prevHash;
    const rh = computeRoundHash(round);
    round.round_hash = rh;
    prevHash = rh;
  }
  return t;
}

/** Serialize transcript to the file format used in ZIPs (2-space indent). */
function serializeTranscript(t) {
  return JSON.stringify(t, null, 2);
}

/** Build checksums.sha256 content for manifest.json + input/transcript.json */
function buildChecksums(manifestBytes, transcriptBytes) {
  const manifestHash = sha256bytes(manifestBytes);
  const transcriptHash = sha256bytes(transcriptBytes);
  return `${manifestHash}  manifest.json\n${transcriptHash}  input/transcript.json\n`;
}

// ---------------------------------------------------------------------------
// Standard manifest JSON (all vectors share this manifest)
// ---------------------------------------------------------------------------
const MANIFEST = {
  standard: { name: "ACTIS", version: "1.0" },
  core_files: ["checksums.sha256", "manifest.json", "input/transcript.json"],
  optional_files: [],
  created_at: "2026-03-04T00:00:00Z",
  producer: "actis-tv-corpus",
};
const MANIFEST_BYTES = Buffer.from(JSON.stringify(MANIFEST, null, 2), "utf8");

// ---------------------------------------------------------------------------
// Write a ZIP helper
// ---------------------------------------------------------------------------

function writeStandardZip(filename, transcriptBytes, checksumContent) {
  const zip = new AdmZip();
  zip.addFile("manifest.json", MANIFEST_BYTES);
  zip.addFile("input/transcript.json", transcriptBytes);
  zip.addFile(
    "checksums.sha256",
    Buffer.from(checksumContent, "utf8")
  );
  zip.writeZip(path.join(GENERATED, filename));
  console.log(`  wrote ${filename}`);
}

// ---------------------------------------------------------------------------
// Read a base transcript from an existing ZIP
// ---------------------------------------------------------------------------

function readTranscriptFromZip(filename) {
  const zip = new AdmZip(path.join(GENERATED, filename));
  const entry = zip.getEntry("input/transcript.json");
  if (!entry) throw new Error(`No input/transcript.json in ${filename}`);
  return JSON.parse(entry.getData().toString("utf8"));
}

// ---------------------------------------------------------------------------
// tv-001: compatible-minimal — all valid
// ---------------------------------------------------------------------------

function regen001() {
  console.log("tv-001: compatible-minimal");
  const base = readTranscriptFromZip("tv-001-compatible-minimal.zip");
  const t = recomputeHashChain(base);
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-001-compatible-minimal.zip", tbytes, checksums);
  return t; // return for other vectors to use as base
}

// ---------------------------------------------------------------------------
// tv-002: partial-invalid-signature — round 1 has bad signature
// ---------------------------------------------------------------------------

function regen002(baseTranscript) {
  console.log("tv-002: partial-invalid-signature");
  const t = recomputeHashChain(baseTranscript);
  // Corrupt round 1's signature (flip one char in signature_b58)
  const origSig = t.rounds[1].signature.signature_b58;
  // Change the first character: if it starts with a letter, flip case or change digit
  const badSig = origSig[0] === "3" ? "2" + origSig.slice(1) : "3" + origSig.slice(1);
  t.rounds[1].signature = { ...t.rounds[1].signature, signature_b58: badSig };
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-002-partial-invalid-signature.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// tv-003: noncompliant-schema-fail — wrong transcript_version
// ---------------------------------------------------------------------------

function regen003(baseTranscript) {
  console.log("tv-003: noncompliant-schema-fail");
  const t = recomputeHashChain(baseTranscript);
  t.transcript_version = "other-transcript/1.0";
  // Compute final_hash with the wrong version — so the final_hash is correct
  // for this (wrong-version) transcript; schema validation fails but final_hash
  // check would pass, so we don't get spurious hash_chain_ok=false from Rust.
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-003-noncompliant-schema-fail.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// tv-004: noncompliant-hash-chain-break — round 1 previous_round_hash is 0s
// ---------------------------------------------------------------------------

function regen004(baseTranscript) {
  console.log("tv-004: noncompliant-hash-chain-break");
  const t = recomputeHashChain(baseTranscript);
  // Break the chain at round 1
  t.rounds[1].previous_round_hash =
    "0000000000000000000000000000000000000000000000000000000000000000";
  // Recompute round 1 and round 2 hashes with the broken chain in place
  // (round_hash for round 1 uses the broken previous_round_hash field)
  const r1hash = computeRoundHash(t.rounds[1]);
  t.rounds[1].round_hash = r1hash;
  t.rounds[2].previous_round_hash = r1hash;
  const r2hash = computeRoundHash(t.rounds[2]);
  t.rounds[2].round_hash = r2hash;
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-004-noncompliant-hash-chain-break.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// tv-005: noncompliant-checksum-tamper — valid transcript, wrong checksums
// ---------------------------------------------------------------------------

function regen005(baseTranscript) {
  console.log("tv-005: noncompliant-checksum-tamper");
  const t = recomputeHashChain(baseTranscript);
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  // Use all-zeros as the tampered checksum for input/transcript.json
  const tamperedChecksums =
    sha256bytes(MANIFEST_BYTES) +
    "  manifest.json\n" +
    "0000000000000000000000000000000000000000000000000000000000000000" +
    "  input/transcript.json\n";
  writeStandardZip("tv-005-noncompliant-checksum-tamper.zip", tbytes, tamperedChecksums);
}

// ---------------------------------------------------------------------------
// tv-006: noncompliant-missing-manifest — no manifest.json
// ---------------------------------------------------------------------------

function regen006(baseTranscript) {
  console.log("tv-006: noncompliant-missing-manifest");
  const t = recomputeHashChain(baseTranscript);
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  // No manifest — compute checksums without manifest entry
  const transcriptHash = sha256bytes(tbytes);
  const checksums = `${transcriptHash}  input/transcript.json\n`;
  const zip = new AdmZip();
  zip.addFile("input/transcript.json", tbytes);
  zip.addFile("checksums.sha256", Buffer.from(checksums, "utf8"));
  zip.writeZip(path.join(GENERATED, "tv-006-noncompliant-missing-manifest.zip"));
  console.log("  wrote tv-006-noncompliant-missing-manifest.zip");
}

// ---------------------------------------------------------------------------
// tv-007: compatible-with-failure-event — 1 round, failure_event, all valid
// ---------------------------------------------------------------------------

function regen007() {
  console.log("tv-007: compatible-with-failure-event");
  const base = readTranscriptFromZip("tv-007-compatible-with-failure-event.zip");
  const t = recomputeHashChain(base);
  // Update transcript_hash in failure_event to use new round 0 hash
  if (t.failure_event) {
    const refs = t.failure_event.evidence_refs;
    // Replace the old round hash in refs with the new round 0 hash
    // The 2nd element is the round hash
    if (Array.isArray(refs) && refs.length >= 2) {
      refs[1] = t.rounds[0].round_hash;
    }
    // transcript_hash in failure_event — update to new final hash
    // Compute final_hash with current transcript (before updating transcript_hash)
    t.final_hash = computeFinalHash(t);
    // Now update transcript_hash in failure_event to match final_hash
    t.failure_event.transcript_hash = t.final_hash;
    // Recompute final_hash with updated failure_event
    t.final_hash = computeFinalHash(t);
  } else {
    t.final_hash = computeFinalHash(t);
  }
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-007-compatible-with-failure-event.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// tv-008: partial-zero-signatures — all signatures are null/zeroed
// ---------------------------------------------------------------------------

function regen008(baseTranscript) {
  console.log("tv-008: partial-zero-signatures");
  const t = recomputeHashChain(baseTranscript);
  // Set all signatures to the zeroed Base58 pattern (111...1)
  for (const round of t.rounds) {
    round.signature = {
      ...round.signature,
      signature_b58:
        "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
    };
  }
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-008-partial-zero-signatures.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// tv-009: noncompliant-incorrect-final-hash — valid chain, wrong final_hash
// ---------------------------------------------------------------------------

function regen009(baseTranscript) {
  console.log("tv-009: noncompliant-incorrect-final-hash");
  const t = recomputeHashChain(baseTranscript);
  // Set final_hash to all zeros (wrong)
  t.final_hash =
    "0000000000000000000000000000000000000000000000000000000000000000";
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-009-noncompliant-incorrect-final-hash.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("Regenerating ACTIS test vectors (new §3.2: exclude round_hash + signature)...\n");

const base001 = regen001();
regen002(base001);
regen003(base001);
regen004(base001);
regen005(base001);
regen006(base001);
regen007();
regen008(base001);
regen009(base001);

console.log("\ntv-010 and tv-011: skipped (ZIP-structure vectors, transcript hashes irrelevant)");
console.log("\nDone. Run conformance harness to verify.");
