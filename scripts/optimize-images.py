#!/usr/bin/env python3
"""
Generate WebP (and optional width variants) under images/optimized/.
Does NOT modify originals. Re-run after adding new source images.

Usage:
  python scripts/optimize-images.py
  python scripts/optimize-images.py --only images/lp3.jpeg
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

try:
    from PIL import Image
except ImportError:
    print("Pillow is required: pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
OUT = IMAGES / "optimized"
MANIFEST_PATH = OUT / "manifest.json"

RASTER_EXT = {".png", ".jpg", ".jpeg", ".webp"}

# Max widths per category (never upscale)
RULES = [
    (re.compile(r"achievements/students/", re.I), [320, 480], 80),
    (re.compile(r"home/awards/", re.I), [200, 400], 88),
    (re.compile(r"home/parents/", re.I), [200, 360], 82),
    (re.compile(r"brand/logo", re.I), [320, 512], 90),
    (re.compile(r"icons/", re.I), [64, 128], 90),
    (re.compile(r"allencoloured|trishacoloured", re.I), [140, 280], 88),
    (re.compile(r"Untitled|herolp|designasd", re.I), [480, 720, 960], 82),
    (re.compile(r"^lp[1-4]\.", re.I), [480, 800], 82),
    (re.compile(r"home/gallery/", re.I), [400, 800, 1200], 82),
    (re.compile(r"boarding-day|facilities-grounds|co-curricular", re.I), [640, 1000], 82),
]

DEFAULT_WIDTHS = [480, 800]
DEFAULT_QUALITY = 82


def collect_referenced_paths() -> set[str]:
    refs: set[str] = set()
    patterns = [
        re.compile(
            r"""['"]((?:\./)?images/[^'?"]+\.(?:png|jpe?g|webp)(?:\?[^'"]*)?)['"]""",
            re.I,
        ),
        re.compile(
            r"""url\(\s*['"]?((?:\.\./)?images/[^)'"?]+\.(?:png|jpe?g|webp)(?:\?[^)'"]*)?)['"]?\s*\)""",
            re.I,
        ),
    ]
    scan_dirs = [ROOT]
    for path in ROOT.rglob("*"):
        if path.name == "optimized-images-manifest.js":
            continue
        if path.suffix.lower() in {".html", ".css", ".js"} and "node_modules" not in path.parts:
            text = path.read_text(encoding="utf-8", errors="ignore")
            for pat in patterns:
                for m in pat.finditer(text):
                    raw = unquote(m.group(1).split("?")[0].replace("../", ""))
                    if raw.startswith("./"):
                        raw = raw[2:]
                    path = raw.replace("\\", "/")
                    if "/optimized/" in path or path.startswith("images/optimized/"):
                        continue
                    refs.add(path)
    # Root icons
    for name in ("icon.png", "apple-icon.png"):
        p = ROOT / name
        if p.is_file():
            refs.add(name)
    return refs


def rule_for(rel: str) -> tuple[list[int], int]:
    for pat, widths, q in RULES:
        if pat.search(rel):
            return widths, q
    return DEFAULT_WIDTHS, DEFAULT_QUALITY


def save_webp(img: Image.Image, dest: Path, quality: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    img.save(dest, "WEBP", quality=quality, method=6)


def optimize_file(src: Path, rel: str) -> dict:
    widths, quality = rule_for(rel)
    img = Image.open(src)
    img.load()
    w, h = img.size
    entry: dict = {"source": rel.replace("\\", "/"), "variants": {}}

    for max_w in sorted(set(widths)):
        if w <= max_w:
            target_w = w
        else:
            target_w = max_w
        key = f"{target_w}w"
        if key in entry["variants"]:
            continue
        resized = img if target_w == w else img.resize(
            (target_w, max(1, round(h * target_w / w))), Image.Resampling.LANCZOS
        )
        out_path = OUT / f"{Path(rel).with_suffix('').as_posix()}-{key}.webp"
        save_webp(resized, out_path, quality)
        entry["variants"][key] = ("images/optimized/" + out_path.relative_to(OUT).as_posix()).replace("\\", "/")

    # Default src = largest variant
    largest = max(entry["variants"], key=lambda k: int(k.replace("w", "")))
    entry["default"] = entry["variants"][largest]
    entry["srcset"] = ", ".join(
        f"{entry['variants'][k]} {k.replace('w', '')}w" for k in sorted(entry["variants"], key=lambda x: int(x.replace("w", "")))
    )
    return entry


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Optimize a single images/... path")
    args = parser.parse_args()

    refs = collect_referenced_paths()
    if args.only:
        refs = {args.only.replace("\\", "/")}

    manifest: dict = {"generated": [], "entries": {}}
    if MANIFEST_PATH.is_file():
        try:
            existing = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            manifest["entries"] = dict(existing.get("entries", {}))
        except json.JSONDecodeError:
            pass
    OUT.mkdir(parents=True, exist_ok=True)

    for rel in sorted(refs):
        if not rel.startswith("images/"):
            if rel in ("icon.png", "apple-icon.png"):
                src = ROOT / rel
                rel_key = rel
            else:
                continue
        else:
            src = ROOT / Path(*rel.split("/"))
            rel_key = rel[len("images/") :]

        if "optimized" in src.parts or src.suffix.lower() not in RASTER_EXT or not src.is_file():
            continue

        print(f"Optimizing {rel_key}")
        try:
            entry = optimize_file(src, rel_key)
            manifest["entries"][rel.replace("\\", "/")] = entry
            manifest["generated"].append(rel)
        except Exception as exc:
            print(f"  SKIP {rel_key}: {exc}", file=sys.stderr)

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    js_path = ROOT / "js" / "optimized-images-manifest.js"
    js_path.write_text(
        "window.OPTIMIZED_IMAGE_MANIFEST=" + json.dumps(manifest["entries"], separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {MANIFEST_PATH} and {js_path}")
    print(f"Optimized {len(manifest['generated'])} source images.")


if __name__ == "__main__":
    main()
