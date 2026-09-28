#!/usr/bin/env python3
"""Estimate referenced image bytes: originals vs smallest WebP variant per source."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
MANIFEST = IMAGES / "optimized" / "manifest.json"


def collect_refs() -> set[str]:
    refs: set[str] = set()
    pats = [
        re.compile(r"""['"]((?:\./)?images/[^'"]+\.(?:png|jpe?g|webp))['"]""", re.I),
        re.compile(r"""url\(\s*['"]?((?:\.\./)?images/[^)'"]+\.(?:png|jpe?g|webp))['"]?\s*\)""", re.I),
    ]
    for path in ROOT.rglob("*"):
        if path.suffix.lower() in {".html", ".css", ".js"} and "node_modules" not in path.parts:
            if "optimized-images-manifest.js" in path.name:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            for pat in pats:
                for m in pat.finditer(text):
                    raw = unquote(m.group(1).split("?")[0].replace("../", ""))
                    if raw.startswith("./"):
                        raw = raw[2:]
                    if "/optimized/" in raw:
                        continue
                    refs.add(raw.replace("\\", "/"))
    for name in ("icon.png", "apple-icon.png"):
        if (ROOT / name).is_file():
            refs.add(name)
    return refs


def main() -> None:
    refs = collect_refs()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = manifest.get("entries", manifest)

    orig_bytes = 0
    orig_count = 0
    largest_orig = ("", 0)
    smallest_webp_sum = 0
    default_webp_sum = 0
    largest_webp = ("", 0)

    for r in sorted(refs):
        if r.startswith("images/"):
            rel = r[len("images/") :]
            src = IMAGES / rel.replace("/", "\\") if False else IMAGES / Path(*rel.split("/"))
        else:
            src = ROOT / r
            rel = r
        if not src.is_file() or src.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        sz = src.stat().st_size
        orig_bytes += sz
        orig_count += 1
        if sz > largest_orig[1]:
            largest_orig = (r, sz)

        key = r if r.startswith("images/") else f"images/{r}" if r not in ("icon.png", "apple-icon.png") else r
        entry = entries.get(key) or entries.get(rel)
        if not entry:
            continue
        variants = entry.get("variants", {})
        if variants:
            smallest_path = min(
                variants.values(),
                key=lambda p: int(re.search(r"(\d+)w", Path(p).name).group(1)),
            )
            sp = ROOT / smallest_path.replace("/", "\\")
            if not sp.is_file():
                sp = ROOT / smallest_path
            if sp.is_file():
                wsz = sp.stat().st_size
                smallest_webp_sum += wsz
                if wsz > largest_webp[1]:
                    largest_webp = (str(sp.relative_to(ROOT)), wsz)
        def_path = entry.get("default")
        if def_path:
            dp = ROOT / def_path
            if dp.is_file():
                default_webp_sum += dp.stat().st_size

    opt_files = list((IMAGES / "optimized").rglob("*.webp"))
    opt_total = sum(p.stat().st_size for p in opt_files)

    print("REFERENCED ORIGINALS (what HTML/CSS/JS point at as fallbacks):")
    print(f"  count={orig_count}  bytes={orig_bytes} ({orig_bytes/1024/1024:.2f} MB)")
    print(f"  largest: {largest_orig[0]} ({largest_orig[1]/1024:.1f} KB)")
    print()
    print("IF each referenced image used its smallest WebP variant once:")
    print(f"  sum={smallest_webp_sum} ({smallest_webp_sum/1024/1024:.2f} MB)")
    print(f"  largest single variant: {largest_webp[0]} ({largest_webp[1]/1024:.1f} KB)")
    print()
    print("IF each used largest/default WebP variant once:")
    print(f"  sum={default_webp_sum} ({default_webp_sum/1024/1024:.2f} MB)")
    print()
    print(f"All files under images/optimized/: {len(opt_files)} files, {opt_total/1024/1024:.2f} MB total")


if __name__ == "__main__":
    main()
