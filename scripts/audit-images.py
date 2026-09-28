#!/usr/bin/env python3
"""Report image inventory: referenced vs unused, sizes."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
RASTER = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"}


def collect_refs() -> set[str]:
    refs: set[str] = set()
    pats = [
        re.compile(r"""['"]((?:\./)?images/[^'"]+\.(?:png|jpe?g|webp))['"]""", re.I),
        re.compile(r"""url\(\s*['"]?((?:\.\./)?images/[^)'"]+\.(?:png|jpe?g|webp))['"]?\s*\)""", re.I),
    ]
    for path in ROOT.rglob("*"):
        if path.suffix.lower() in {".html", ".css", ".js"} and "node_modules" not in path.parts:
            text = path.read_text(encoding="utf-8", errors="ignore")
            for pat in pats:
                for m in pat.finditer(text):
                    raw = unquote(m.group(1).split("?")[0].replace("../", ""))
                    if raw.startswith("./"):
                        raw = raw[2:]
                    refs.add(raw.replace("\\", "/"))
    for name in ("icon.png", "apple-icon.png"):
        if (ROOT / name).is_file():
            refs.add(name)
    return refs


def main() -> None:
    refs = collect_refs()
    all_files = [p for p in IMAGES.rglob("*") if p.is_file() and p.suffix.lower() in RASTER]
    opt_files = [p for p in (IMAGES / "optimized").rglob("*.webp")] if (IMAGES / "optimized").is_dir() else []

    def rel(p: Path) -> str:
        try:
            return str(p.relative_to(IMAGES)).replace("\\", "/")
        except ValueError:
            return str(p)

    referenced_paths = set()
    for r in refs:
        if r.startswith("images/"):
            referenced_paths.add(r[len("images/") :])
        elif r in ("icon.png", "apple-icon.png"):
            referenced_paths.add(r)

    unused = [p for p in all_files if "optimized" not in p.parts and rel(p) not in referenced_paths]

    orig_bytes = sum(p.stat().st_size for p in all_files if "optimized" not in p.parts)
    opt_bytes = sum(p.stat().st_size for p in opt_files)

    print("REFERENCED RASTER (originals):")
    ref_orig = [p for p in all_files if "optimized" not in p.parts and rel(p) in referenced_paths]
    ref_b = sum(p.stat().st_size for p in ref_orig)
    print(f"  count={len(ref_orig)} bytes={ref_b} ({ref_b/1024/1024:.2f} MB)")
    print("ALL ORIGINALS (excl optimized/):")
    print(f"  count={len([p for p in all_files if 'optimized' not in p.parts])} bytes={orig_bytes} ({orig_bytes/1024/1024:.2f} MB)")
    print("OPTIMIZED WEBP:")
    print(f"  count={len(opt_files)} bytes={opt_bytes} ({opt_bytes/1024/1024:.2f} MB)")
    if opt_files:
        top = max(opt_files, key=lambda p: p.stat().st_size)
        print(f"  largest={top.name} ({top.stat().st_size/1024:.1f} KB)")

    print("\nUNUSED ORIGINALS (not deleted):")
    for p in sorted(unused, key=lambda x: x.stat().st_size, reverse=True)[:40]:
        print(f"  {rel(p)} ({p.stat().st_size/1024:.1f} KB)")
    if len(unused) > 40:
        print(f"  ... and {len(unused) - 40} more")

    out = ROOT / "scripts" / "image-audit.json"
    out.write_text(
        json.dumps(
            {
                "referenced_count": len(ref_orig),
                "referenced_bytes": ref_b,
                "optimized_count": len(opt_files),
                "optimized_bytes": opt_bytes,
                "unused": [rel(p) for p in unused],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
