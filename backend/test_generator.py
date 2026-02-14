from __future__ import annotations

import argparse
import shutil
import sys
import time
from pathlib import Path

try:
    from .config import DATA_DIR
except ImportError:  # Script execution fallback
    repo_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(repo_root))
    from backend.config import DATA_DIR


def _parse_polygon_layers(data_path: Path) -> list[str]:
    layers: list[str] = []
    in_polygons = False
    for raw_line in data_path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("polygons:"):
            in_polygons = True
            continue
        if line.startswith("labels:"):
            in_polygons = False
            continue
        if not in_polygons:
            continue
        if line.startswith("- - "):
            layers.append(line.replace("- - ", "", 1))
    return layers


def main() -> int:
    parser = argparse.ArgumentParser(description="Mock layout generator.")
    parser.add_argument("--output", required=True, help="Output YAML path.")
    parser.add_argument("--cell-name", default=None)
    parser.add_argument("--config", default=None, help="Optional config JSON path.")
    parser.add_argument("--delay-ms", type=int, default=200)
    args = parser.parse_args()

    data_path = DATA_DIR / "data.txt"
    if not data_path.exists():
        print(f"Data file not found: {data_path}", file=sys.stderr)
        return 1

    layers = _parse_polygon_layers(data_path)
    total = len(layers)
    delay = max(args.delay_ms, 0) / 1000.0

    print("Starting mock layout generation...")
    if args.cell_name:
        print(f"Cell name: {args.cell_name}")
    if args.config:
        print(f"Config file: {args.config}")
    print(f"Polygons: {total}")

    for index, layer in enumerate(layers, start=1):
        print(f"[{index}/{total}] Generate polygon layer={layer}")
        if delay:
            time.sleep(delay)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(data_path, output_path)
    print(f"Layout written to {output_path}")
    print("Mock layout generation complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
