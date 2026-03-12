#!/usr/bin/env node
/**
 * Generate all signed ACTIS test vectors from scratch using the 40-byte
 * domain-separated signing message: utf8("ACTIS/v1") || hex_decode(envelope_hash).
 *
 * Run from repo root: node actis/test-vectors/scripts/generate_signed_corpus.js
 *
 * Dependencies (from actis-verifier-ts/node_modules/): adm-zip, @noble/curves/ed25519.
 * Deterministic keypairs from fixed seeds; outputs tv-001 through tv-009 to generated/.
 * tv-010 and tv-011 are not generated (ZIP-structure-only vectors).
 */

"use strict";

const path = require("path");
const crypto = require("crypto");

const SCRIPT_DIR = path.resolve(__dirname);
const ROOT = path.resolve(SCRIPT_DIR, "../../..");
const GENERATED = path.resolve(SCRIPT_DIR, "../generated");

const AdmZip = require(path.join(ROOT, "actis-verifier-ts/node_modules/adm-zip"));
const { ed25519 } = require(path.join(ROOT, "actis-verifier-ts/node_modules/@noble/curves/ed25519.js"));

// Base58 encode (no external dep; alphabet per Bitcoin). Preserves leading zero bytes as leading '1's.
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Encode(buf) {
  let i = 0;
  while (i < buf.length && buf[i] === 0) i++;
  const leadingOnes = i;
  if (i === buf.length) return BASE58_ALPHABET[0].repeat(buf.length);
  let num = 0n;
  for (; i < buf.length; i++) num = num * 256n + BigInt(buf[i]);
  let s = "";
  while (num > 0n) {
    s = BASE58_ALPHABET[Number(num % 58n)] + s;
    num = num / 58n;
  }
  return BASE58_ALPHABET[0].repeat(leadingOnes) + s;
}

// ---------------------------------------------------------------------------
// Crypto / canonicalization (same as regenerate.js)
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
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
}

function omitKeys(obj, keys) {
  const omit = new Set(keys);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!omit.has(k)) result[k] = v;
  }
  return result;
}

function computeGenesisHash(intentId, createdAtMs) {
  return sha256hex(`${intentId}:${createdAtMs}`);
}

function computeRoundHash(round) {
  const obj = omitKeys(round, ["round_hash", "signature"]);
  return sha256hex(canonicalize(obj));
}

function computeFinalHash(transcript) {
  const obj = omitKeys(transcript, ["final_hash", "model_context"]);
  return sha256hex(canonicalize(obj));
}

/** Envelope = round fields except envelope_hash and signature (§2.1). */
function buildEnvelopeObject(round) {
  const allowed = new Set([
    "round_number", "round_type", "message_hash", "timestamp_ms",
    "previous_round_hash", "round_hash", "agent_id", "public_key_b58", "content_summary",
  ]);
  const out = {};
  for (const [k, v] of Object.entries(round)) {
    if (allowed.has(k) && k !== "envelope_hash" && k !== "signature") out[k] = v;
  }
  return out;
}

function computeEnvelopeHash(round) {
  const envelope = buildEnvelopeObject(round);
  return sha256hex(canonicalize(envelope));
}

/** 40-byte signing message: utf8("ACTIS/v1") || hex_decode(envelope_hash). */
function buildSigningMessage(envelopeHashHex) {
  const domain = Buffer.from("ACTIS/v1", "utf8");
  const hashBytes = Buffer.from(envelopeHashHex.toLowerCase(), "hex");
  if (hashBytes.length !== 32) throw new Error("envelope_hash must be 64 hex chars");
  return Buffer.concat([domain, hashBytes]);
}

// ---------------------------------------------------------------------------
// Deterministic keypairs (reproducible corpus)
// Buyer: seed = 32 bytes 0x01 → publicKey Base58 (computed below)
// Seller: seed = 32 bytes 0x02 → publicKey Base58 (computed below)
// ---------------------------------------------------------------------------

const buyerSeed = new Uint8Array(32);
buyerSeed.fill(0x01);
const sellerSeed = new Uint8Array(32);
sellerSeed.fill(0x02);

const buyerKeypair = ed25519.keygen(buyerSeed);
const sellerKeypair = ed25519.keygen(sellerSeed);

const BUYER_PUB_B58 = base58Encode(Buffer.from(buyerKeypair.publicKey));
const SELLER_PUB_B58 = base58Encode(Buffer.from(sellerKeypair.publicKey));
if (process.env.DEBUG_KEYPAIRS) {
  console.log("Buyer public key Base58:", BUYER_PUB_B58);
  console.log("Seller public key Base58:", SELLER_PUB_B58);
}

// ---------------------------------------------------------------------------
// Build base transcript (3 rounds: INTENT / ASK / ACCEPT)
// ---------------------------------------------------------------------------

const INTENT_ID = "intent-test-001";
const CREATED_AT_MS = 1000000000000;

/** Build the three signed rounds (INTENT / ASK / ACCEPT) for a given intent and time. */
function buildSignedRounds(intentId, createdAtMs) {
  const genesis = computeGenesisHash(intentId, createdAtMs);
  const rounds = [
    {
      round_number: 0,
      round_type: "INTENT",
      message_hash: "144090ff43d039c1ea7cae50824a1bc1376ca97f7fc326dfa8021315af47e077",
      timestamp_ms: createdAtMs,
      previous_round_hash: null,
      agent_id: "buyer",
      public_key_b58: BUYER_PUB_B58,
      content_summary: { intent_type: "weather.data" },
    },
    {
      round_number: 1,
      round_type: "ASK",
      message_hash: "e015292c0c930b5eafaba19abad0089b85946ca3e8799304f82eafcc4468dbcd",
      timestamp_ms: createdAtMs + 1000,
      agent_id: "seller",
      public_key_b58: SELLER_PUB_B58,
      content_summary: { price: 0.00005 },
    },
    {
      round_number: 2,
      round_type: "ACCEPT",
      message_hash: "f633291e56262ce469c5a4b0aaeb07ebd1db739ac4337671c68b21dc9d40714a",
      timestamp_ms: createdAtMs + 2000,
      agent_id: "buyer",
      public_key_b58: BUYER_PUB_B58,
      content_summary: { price: 0.00005 },
    },
  ];
  let prevHash = genesis;
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    round.previous_round_hash = prevHash;
    const envelopeHash = computeEnvelopeHash(round);
    round.envelope_hash = envelopeHash;
    const signingMessage = buildSigningMessage(envelopeHash);
    const signerSecret = i === 1 ? sellerKeypair.secretKey : buyerKeypair.secretKey;
    const sigBytes = ed25519.sign(signingMessage, signerSecret);
    round.signature = {
      signer_public_key_b58: i === 1 ? SELLER_PUB_B58 : BUYER_PUB_B58,
      signature_b58: base58Encode(Buffer.from(sigBytes)),
      signed_at_ms: round.timestamp_ms,
      scheme: "ed25519",
    };
    const roundHash = computeRoundHash(round);
    round.round_hash = roundHash;
    prevHash = roundHash;
  }
  return rounds;
}

function createBaseTranscript() {
  const intentId = INTENT_ID;
  const createdAtMs = CREATED_AT_MS;
  const transcriptId = "transcript-" + sha256hex(intentId + ":" + createdAtMs + ":corpus-v1");
  const rounds = buildSignedRounds(intentId, createdAtMs);
  const transcript = {
    transcript_version: "actis-transcript/1.0",
    transcript_id: transcriptId,
    intent_id: intentId,
    intent_type: "weather.data",
    created_at_ms: createdAtMs,
    policy_hash: "Policy satisfied",
    strategy_hash: "Verified strategy adherence",
    identity_snapshot_hash: "f4edf4b37099e97dd380c24c37496de32c341406c2901bd830d2e35386ca1c37",
    rounds,
  };
  transcript.final_hash = computeFinalHash(transcript);
  return transcript;
}

function serializeTranscript(t) {
  return JSON.stringify(t, null, 2);
}

const MANIFEST = {
  standard: { name: "ACTIS", version: "1.0" },
  core_files: ["checksums.sha256", "manifest.json", "input/transcript.json"],
  optional_files: [],
  created_at: "2026-03-04T00:00:00Z",
  producer: "actis-tv-corpus",
};
const MANIFEST_BYTES = Buffer.from(JSON.stringify(MANIFEST, null, 2), "utf8");

function buildChecksums(manifestBytes, transcriptBytes) {
  const manifestHash = sha256bytes(manifestBytes);
  const transcriptHash = sha256bytes(transcriptBytes);
  return `${manifestHash}  manifest.json\n${transcriptHash}  input/transcript.json\n`;
}

function writeStandardZip(filename, transcriptBytes, checksumContent) {
  const zip = new AdmZip();
  zip.addFile("manifest.json", MANIFEST_BYTES);
  zip.addFile("input/transcript.json", transcriptBytes);
  zip.addFile("checksums.sha256", Buffer.from(checksumContent, "utf8"));
  zip.writeZip(path.join(GENERATED, filename));
  console.log("  wrote " + filename);
}

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

// ---------------------------------------------------------------------------
// Vector writers
// ---------------------------------------------------------------------------

function write001(transcript) {
  console.log("tv-001: compatible-minimal");
  const tbytes = Buffer.from(serializeTranscript(transcript), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-001-compatible-minimal.zip", tbytes, checksums);
}

function write002(transcript) {
  console.log("tv-002: partial-invalid-signature");
  const t = recomputeHashChain(transcript);
  const origSig = t.rounds[1].signature.signature_b58;
  const badSig = origSig[0] === "3" ? "2" + origSig.slice(1) : "3" + origSig.slice(1);
  t.rounds[1].signature = { ...t.rounds[1].signature, signature_b58: badSig };
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-002-partial-invalid-signature.zip", tbytes, checksums);
}

function write003(transcript) {
  console.log("tv-003: noncompliant-schema-fail");
  const t = recomputeHashChain(transcript);
  t.transcript_version = "other-transcript/1.0";
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-003-noncompliant-schema-fail.zip", tbytes, checksums);
}

function write004(transcript) {
  console.log("tv-004: noncompliant-hash-chain-break");
  const t = recomputeHashChain(transcript);
  t.rounds[1].previous_round_hash = "0000000000000000000000000000000000000000000000000000000000000000";
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

function write005(transcript) {
  console.log("tv-005: noncompliant-checksum-tamper");
  const t = recomputeHashChain(transcript);
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const tamperedChecksums =
    sha256bytes(MANIFEST_BYTES) + "  manifest.json\n" +
    "0000000000000000000000000000000000000000000000000000000000000000  input/transcript.json\n";
  writeStandardZip("tv-005-noncompliant-checksum-tamper.zip", tbytes, tamperedChecksums);
}

function write006(transcript) {
  console.log("tv-006: noncompliant-missing-manifest");
  const t = recomputeHashChain(transcript);
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const transcriptHash = sha256bytes(tbytes);
  const checksums = transcriptHash + "  input/transcript.json\n";
  const zip = new AdmZip();
  zip.addFile("input/transcript.json", tbytes);
  zip.addFile("checksums.sha256", Buffer.from(checksums, "utf8"));
  zip.writeZip(path.join(GENERATED, "tv-006-noncompliant-missing-manifest.zip"));
  console.log("  wrote tv-006-noncompliant-missing-manifest.zip");
}

function write007() {
  console.log("tv-007: compatible-with-failure-event (generated from scratch)");

  // Build base transcript same as tv-001 but add a failure_event
  const intentId = INTENT_ID;
  const createdAtMs = CREATED_AT_MS;

  const rounds = buildSignedRounds(intentId, createdAtMs);

  const baseTranscript = {
    transcript_version: "actis-transcript/1.0",
    transcript_id: "transcript-" + sha256hex(`${intentId}:${createdAtMs}`),
    intent_id: intentId,
    intent_type: "weather.data",
    created_at_ms: createdAtMs,
    policy_hash: sha256hex("policy-test-001"),
    strategy_hash: sha256hex("strategy-test-001"),
    identity_snapshot_hash: sha256hex("identity-test-001"),
    rounds,
    failure_event: {
      code: "ACTIS-400",
      stage: "negotiation",
      fault_domain: "buyer",
      terminality: "terminal",
      evidence_refs: [
        intentId,
        rounds[0].round_hash
      ],
      timestamp: createdAtMs + 5000,
      transcript_hash: "0000000000000000000000000000000000000000000000000000000000000000"
    }
  };

  // Compute final_hash (excludes final_hash and model_context)
  baseTranscript.final_hash = computeFinalHash(baseTranscript);
  // Update transcript_hash in failure_event to match final_hash
  baseTranscript.failure_event.transcript_hash = baseTranscript.final_hash;
  // Recompute final_hash with updated failure_event
  baseTranscript.final_hash = computeFinalHash(baseTranscript);

  const tbytes = Buffer.from(serializeTranscript(baseTranscript), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-007-compatible-with-failure-event.zip", tbytes, checksums);
}

function write008(transcript) {
  console.log("tv-008: partial-zero-signatures");
  const t = recomputeHashChain(transcript);
  const zeroSig = "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
  for (const round of t.rounds) {
    round.signature = { ...round.signature, signature_b58: zeroSig };
  }
  t.final_hash = computeFinalHash(t);
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-008-partial-zero-signatures.zip", tbytes, checksums);
}

function write009(transcript) {
  console.log("tv-009: noncompliant-incorrect-final-hash");
  const t = recomputeHashChain(transcript);
  t.final_hash = "0000000000000000000000000000000000000000000000000000000000000000";
  const tbytes = Buffer.from(serializeTranscript(t), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-009-noncompliant-incorrect-final-hash.zip", tbytes, checksums);
}

function write012() {
  console.log("tv-012: compatible — keys in non-JCS order in raw JSON");
  // Take the tv-001 base transcript and write it with keys in reverse alphabetical order
  // Verifier must recompute hashes via JCS regardless of key order in the file
  const intentId = INTENT_ID;
  const createdAtMs = CREATED_AT_MS;
  const rounds = buildSignedRounds(intentId, createdAtMs);
  const transcript = {
    transcript_version: "actis-transcript/1.0",
    transcript_id: "transcript-" + sha256hex(`${intentId}:${createdAtMs}`),
    intent_id: intentId,
    intent_type: "weather.data",
    created_at_ms: createdAtMs,
    policy_hash: sha256hex("policy-test-001"),
    strategy_hash: sha256hex("strategy-test-001"),
    identity_snapshot_hash: sha256hex("identity-test-001"),
    rounds,
  };
  transcript.final_hash = computeFinalHash(transcript);

  // Serialize with keys in reverse order (non-JCS) to test that verifier canonicalizes
  function reverseKeys(obj) {
    if (Array.isArray(obj)) return obj.map(reverseKeys);
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.keys(obj).sort().reverse().map(k => [k, reverseKeys(obj[k])])
      );
    }
    return obj;
  }
  const scrambled = reverseKeys(transcript);
  const tbytes = Buffer.from(JSON.stringify(scrambled, null, 2), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-012-compatible-noncanonical-key-order.zip", tbytes, checksums);
}

function write013() {
  console.log("tv-013: compatible — extra whitespace in raw JSON");
  const intentId = INTENT_ID;
  const createdAtMs = CREATED_AT_MS;
  const rounds = buildSignedRounds(intentId, createdAtMs);
  const transcript = {
    transcript_version: "actis-transcript/1.0",
    transcript_id: "transcript-" + sha256hex(`${intentId}:${createdAtMs}`),
    intent_id: intentId,
    intent_type: "weather.data",
    created_at_ms: createdAtMs,
    policy_hash: sha256hex("policy-test-001"),
    strategy_hash: sha256hex("strategy-test-001"),
    identity_snapshot_hash: sha256hex("identity-test-001"),
    rounds,
  };
  transcript.final_hash = computeFinalHash(transcript);
  // Serialize with lots of extra whitespace
  const tbytes = Buffer.from(JSON.stringify(transcript, null, 8), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-013-compatible-extra-whitespace.zip", tbytes, checksums);
}

function write014() {
  console.log("tv-014: compatible — pretty-printed with CRLF line endings");
  const intentId = INTENT_ID;
  const createdAtMs = CREATED_AT_MS;
  const rounds = buildSignedRounds(intentId, createdAtMs);
  const transcript = {
    transcript_version: "actis-transcript/1.0",
    transcript_id: "transcript-" + sha256hex(`${intentId}:${createdAtMs}`),
    intent_id: intentId,
    intent_type: "weather.data",
    created_at_ms: createdAtMs,
    policy_hash: sha256hex("policy-test-001"),
    strategy_hash: sha256hex("strategy-test-001"),
    identity_snapshot_hash: sha256hex("identity-test-001"),
    rounds,
  };
  transcript.final_hash = computeFinalHash(transcript);
  // Serialize with CRLF line endings
  const json = JSON.stringify(transcript, null, 2).replace(/\n/g, "\r\n");
  const tbytes = Buffer.from(json, "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-014-compatible-crlf-line-endings.zip", tbytes, checksums);
}

function write015() {
  console.log("tv-015: compatible — compact JSON (no whitespace)");
  const intentId = INTENT_ID;
  const createdAtMs = CREATED_AT_MS;
  const rounds = buildSignedRounds(intentId, createdAtMs);
  const transcript = {
    transcript_version: "actis-transcript/1.0",
    transcript_id: "transcript-" + sha256hex(`${intentId}:${createdAtMs}`),
    intent_id: intentId,
    intent_type: "weather.data",
    created_at_ms: createdAtMs,
    policy_hash: sha256hex("policy-test-001"),
    strategy_hash: sha256hex("strategy-test-001"),
    identity_snapshot_hash: sha256hex("identity-test-001"),
    rounds,
  };
  transcript.final_hash = computeFinalHash(transcript);
  // Serialize with no whitespace at all
  const tbytes = Buffer.from(JSON.stringify(transcript), "utf8");
  const checksums = buildChecksums(MANIFEST_BYTES, tbytes);
  writeStandardZip("tv-015-compatible-compact-json.zip", tbytes, checksums);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("Generating ACTIS signed corpus (40-byte domain: ACTIS/v1 || hex_decode(envelope_hash))...\n");

const base = createBaseTranscript();
write001(base);
write002(base);
write003(base);
write004(base);
write005(base);
write006(base);
write007();
write008(base);
write009(base);
write012();
write013();
write014();
write015();

console.log("\ntv-010 and tv-011: skipped (ZIP-structure vectors).");
console.log("Done. Run conformance harness to verify.");
