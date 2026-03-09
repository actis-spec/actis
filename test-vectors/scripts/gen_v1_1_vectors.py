#!/usr/bin/env python3
"""Generate tv-009, tv-010, tv-011 (v1.1) test vector zips. Run from actis/test-vectors/."""
import hashlib
import json
import zipfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
VECTORS_DIR = SCRIPT_DIR.parent
GEN = VECTORS_DIR / "generated"
TV001 = GEN / "tv-001-compatible-minimal.zip"


def main():
    # --- tv-009: incorrect final_hash ---
    with zipfile.ZipFile(TV001, "r") as z:
        manifest = z.read("manifest.json")
        transcript = json.loads(z.read("input/transcript.json").decode())
    transcript["final_hash"] = "0" * 64
    transcript_bytes = json.dumps(transcript, separators=(",", ":")).encode()
    h_manifest = hashlib.sha256(manifest).hexdigest()
    h_transcript = hashlib.sha256(transcript_bytes).hexdigest()
    checksums = f"{h_manifest}  manifest.json\n{h_transcript}  input/transcript.json\n"
    out = GEN / "tv-009-noncompliant-incorrect-final-hash.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", manifest)
        z.writestr("input/transcript.json", transcript_bytes)
        z.writestr("checksums.sha256", checksums)
    print("Created tv-009")

    # --- tv-010: duplicate core file (two entries "input/transcript.json") ---
    with zipfile.ZipFile(TV001, "r") as z:
        manifest = z.read("manifest.json")
        transcript_bytes = z.read("input/transcript.json")
        checksums = z.read("checksums.sha256")
    out = GEN / "tv-010-noncompliant-duplicate-core-file.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", manifest)
        z.writestr("checksums.sha256", checksums)
        info1 = zipfile.ZipInfo("input/transcript.json")
        info2 = zipfile.ZipInfo("input/transcript.json")
        z.writestr(info1, transcript_bytes)
        z.writestr(info2, transcript_bytes)
    print("Created tv-010")

    # --- tv-011: path traversal (entry named "../input/transcript.json") ---
    with zipfile.ZipFile(TV001, "r") as z:
        manifest = z.read("manifest.json")
        transcript_bytes = z.read("input/transcript.json")
        checksums = z.read("checksums.sha256")
    out = GEN / "tv-011-noncompliant-path-traversal.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", manifest)
        z.writestr("checksums.sha256", checksums)
        info = zipfile.ZipInfo("../input/transcript.json")
        z.writestr(info, transcript_bytes)
    print("Created tv-011")


if __name__ == "__main__":
    main()
