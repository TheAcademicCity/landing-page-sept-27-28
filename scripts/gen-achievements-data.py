import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME_TS = Path(r"D:\Work\TAC_Main_Website_2026_27\src\data\home.ts")
OUT = ROOT / "js" / "achievements-gallery-data.js"

text = HOME_TS.read_text(encoding="utf-8")
start = text.index("export const achievementsGalleryContent")
items_start = text.index("items: [", start) + len("items: ")
depth = 0
i = items_start
while i < len(text):
    if text[i] == "[":
        depth += 1
    elif text[i] == "]":
        depth -= 1
        if depth == 0:
            items_block = text[items_start : i + 1]
            break
    i += 1
else:
    raise SystemExit("Could not find items array end")

img_pat = re.compile(
    r'label: "([^"]+)",\s*category: "([^"]+)",\s*caption: "([^"]+)",\s*detail: "([^"]+)",\s*'
    r'image: createImage\(\s*"([^"]+)"',
    re.DOTALL,
)

ordered = []
for chunk in re.split(r'(\{ kind: "words"[^}]+\})', items_block):
    chunk = chunk.strip().strip(",").strip()
    if not chunk or chunk in ("[", "]"):
        continue
    if chunk.startswith('{ kind: "words"'):
        m = re.search(r"lines: \[(.*?)\]", chunk, re.DOTALL)
        lines = re.findall(r'"([^"]+)"', m.group(1)) if m else []
        ordered.append({"kind": "words", "lines": lines})
        continue
    for m in img_pat.finditer(chunk):
        ordered.append(
            {
                "label": m.group(1),
                "category": m.group(2),
                "caption": m.group(3),
                "detail": m.group(4),
                "src": m.group(5).lstrip("/"),
            }
        )

OUT.write_text(
    "window.ACHIEVEMENTS_GALLERY_ITEMS = "
    + json.dumps(ordered, indent=2, ensure_ascii=False)
    + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(ordered)} items to {OUT}")
