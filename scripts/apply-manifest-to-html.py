#!/usr/bin/env python3
"""Wrap index.html <img> tags with <picture> WebP sources from images/optimized/manifest.json."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "images" / "optimized" / "manifest.json"
INDEX = ROOT / "index.html"

IMG_RE = re.compile(
    r'<img\b([^>]*?)\bsrc="(images/[^"]+)"([^>]*)>',
    re.I,
)
PICTURE_SPLIT = re.compile(r"(<picture\b[\s\S]*?</picture>)", re.I)


def manifest_key(src: str) -> str:
    path = unquote(src.split("?")[0])
    if not path.startswith("images/"):
        path = "images/" + path
    return path.replace("\\", "/")


def sizes_for(key: str) -> str:
    if "/awards/" in key:
        return "(max-width: 767px) 42vw, 180px"
    if "/home/gallery/" in key or "campus-" in key:
        return "(max-width: 767px) 45vw, 280px"
    if re.search(r"lp[1-4]\.(jpe?g)", key, re.I):
        return "(max-width: 767px) 88vw, 400px"
    if "/parents/" in key:
        return "200px"
    if "allencoloured" in key or "trishacoloured" in key:
        return "140px"
    if "/brand/" in key:
        return "(max-width: 767px) 160px, 220px"
    if "/icons/" in key:
        return "32px"
    if "boarding-day" in key or "facilities-grounds" in key:
        return "(max-width: 767px) 100vw, 560px"
    if "Untitled" in key or "designasd" in key:
        return "(max-width: 767px) 92vw, 480px"
    return "100vw"


def wrap_chunk(chunk: str, entries: dict) -> str:
    def repl(m: re.Match) -> str:
        src = m.group(2)
        if not src or src == "":
            return m.group(0)
        key = manifest_key(src)
        entry = entries.get(key)
        if not entry or not entry.get("srcset"):
            return m.group(0)
        sizes = sizes_for(key)
        srcset = entry["srcset"]
        return (
            f'<picture><source type="image/webp" srcset="{srcset}" sizes="{sizes}">'
            f'<img{m.group(1)}src="{src}"{m.group(3)}></picture>'
        )

    return IMG_RE.sub(repl, chunk)


def main() -> None:
    if not MANIFEST.is_file():
        print("Run optimize-images.py first.", file=sys.stderr)
        sys.exit(1)
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = data.get("entries", data)
    html = INDEX.read_text(encoding="utf-8")
    parts = PICTURE_SPLIT.split(html)
    new_parts = [parts[0]]
    for part in parts[1:]:
        if part.lower().startswith("<picture"):
            new_parts.append(part)
        else:
            new_parts.append(wrap_chunk(part, entries))
    new_html = "".join(new_parts)
    if new_html == html:
        print("No img changes.")
    else:
        INDEX.write_text(new_html, encoding="utf-8")
        print(f"Updated {INDEX}")


if __name__ == "__main__":
    main()
