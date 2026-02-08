from __future__ import annotations

import asyncio

from backend.config import DATA_DIR
from backend.services.layout_parser import LayoutParser


async def test_layout_parser() -> None:
    yaml_path = DATA_DIR / "data.txt"

    parser = LayoutParser()
    parsed = await parser.parse_layout_file(yaml_path)

    print("Canvas:", parsed.canvas_width, "x", parsed.canvas_height)
    print("Start:", parsed.start_x, parsed.start_y)
    print("Layer maps:", len(parsed.layer_maps))
    print("Polygons:", len(parsed.polygons))
    print("Labels:", len(parsed.labels))

    if parsed.polygons:
        print("First polygon:", parsed.polygons[0])
    if parsed.labels:
        print("First label:", parsed.labels[0])


if __name__ == "__main__":
    asyncio.run(test_layout_parser())
