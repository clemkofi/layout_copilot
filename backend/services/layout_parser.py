from __future__ import annotations

from pathlib import Path
from typing import Any

import aiofiles
import yaml

from ..models import Label, LayoutData, Polygon
# helper function to construct a boundbox from a yaml node
def _boundbox_constructor(
    loader: yaml.SafeLoader, node: yaml.nodes.MappingNode
) -> dict[str, Any]:
    values = loader.construct_mapping(node, deep=True)
    return {
        "x0": values.get("_Boundbox__x0coord"),
        "y0": values.get("_Boundbox__y0coord"),
        "x1": values.get("_Boundbox__x1coord"),
        "y1": values.get("_Boundbox__y1coord"),
        "width": values.get("width"),
        "height": values.get("height"),
        "area": values.get("area"),
    }


class _LayoutLoader(yaml.SafeLoader):
    pass


_LayoutLoader.add_constructor(
    "tag:yaml.org,2002:python/object:bin.utilities.geometryutils.Boundbox",
    _boundbox_constructor,
)


class LayoutParser:
    def __init__(self) -> None:
        self._cache: dict[Path, tuple[float, LayoutData]] = {}

    async def parse_layout_file(self, path: Path) -> LayoutData:
        path = path.resolve()
        stat = path.stat()
        cached = self._cache.get(path)
        if cached and cached[0] == stat.st_mtime:
            return cached[1]

        async with aiofiles.open(path, "r") as handle:
            content = await handle.read()

        data = yaml.load(content, Loader=_LayoutLoader) or {}
        layout = self._to_parsed_layout(data)
        self._cache[path] = (stat.st_mtime, layout)
        return layout

    def _to_parsed_layout(self, data: dict[str, Any]) -> LayoutData:
        layer_maps = data.get("layer_maps", {}) or {}
        polygons_raw = data.get("polygons", []) or []
        labels_raw = data.get("labels", []) or []

        polygons: list[Polygon] = []
        for entry in polygons_raw:
            if not entry or len(entry) < 2:
                continue
            layer = entry[0]
            boundbox = entry[1] or {}
            polygons.append(
                Polygon(
                    layer=layer,
                    x0=boundbox.get("x0"),
                    y0=boundbox.get("y0"),
                    x1=boundbox.get("x1"),
                    y1=boundbox.get("y1"),
                    width=boundbox.get("width"),
                    height=boundbox.get("height"),
                )
            )

        labels: list[Label] = []
        for entry in labels_raw:
            if not entry or len(entry) < 3:
                continue
            layer = entry[0]
            boundbox = entry[1] or {}
            text = entry[2]
            x0 = boundbox.get("x0")
            y0 = boundbox.get("y0")
            x1 = boundbox.get("x1")
            y1 = boundbox.get("y1")
            if x0 is None or y0 is None or x1 is None or y1 is None:
                continue
            labels.append(
                Label(
                    layer=layer,
                    x=(x0 + x1) / 2,
                    y=(y0 + y1) / 2,
                    text=text,
                )
            )

        return LayoutData(
            canvas_width=data.get("canvas_width", 0.0),
            canvas_height=data.get("canvas_height", 0.0),
            start_x=data.get("start_x", 0.0),
            start_y=data.get("start_y", 0.0),
            layer_maps=layer_maps,
            polygons=polygons,
            labels=labels,
        )
