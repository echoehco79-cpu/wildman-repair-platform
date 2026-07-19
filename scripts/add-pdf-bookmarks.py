#!/usr/bin/env python3
"""Attach a navigable outline and metadata to the rendered showcase PDF."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: add-pdf-bookmarks.py INPUT.pdf PAGE_MAP.json OUTPUT.pdf")

    source = Path(sys.argv[1])
    page_map_path = Path(sys.argv[2])
    output = Path(sys.argv[3])
    page_map = json.loads(page_map_path.read_text(encoding="utf-8"))

    reader = PdfReader(source)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.add_metadata(
        {
            "/Title": "野人先生 AI设备维修协同方案看板",
            "/Subject": "离线横版方案看板 PDF 复刻版",
            "/Author": "项目交付团队",
            "/Keywords": "设备维修协同, AI, 规则, 统一工单, SLA, Demo模拟",
        }
    )

    parents: dict[str, object] = {}
    for item in page_map:
        page_index = int(item["page"])
        if page_index < 0 or page_index >= len(reader.pages):
            continue
        parent = parents.get(item.get("parent", ""))
        outline = writer.add_outline_item(item["title"], page_index, parent=parent)
        if item.get("key"):
            parents[item["key"]] = outline

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as handle:
        writer.write(handle)


if __name__ == "__main__":
    main()
