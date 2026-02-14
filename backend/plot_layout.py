"""
Plot all layout elements from a data.txt YAML file using matplotlib.

Usage:
    python backend/plot_layout.py                          # default: data/data.txt
    python backend/plot_layout.py path/to/data.txt         # custom file
    python backend/plot_layout.py data/data.txt -o out.png # save to file
"""

import re
import sys
import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Patch

# ---------------------------------------------------------------------------
# Import display colours from sibling module
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).resolve().parent))
from display_config import display_colors  # noqa: E402


def _build_style_lookup() -> dict:
    """Flatten display_colors into a single {layer_name: style_dict} map."""
    lookup: dict = {}
    for _category, layers in display_colors.items():
        for layer_name, style in layers.items():
            lookup[layer_name] = style
    return lookup


# Fallback style for any layer not in display_config
_DEFAULT_STYLE = {
    "facecolor": "grey",
    "edgecolor": "black",
    "alpha": 0.4,
    "linewidth": 0.5,
    "zorder": 1,
}


# ---------------------------------------------------------------------------
# YAML-lite parser  (avoids needing a custom YAML constructor for the
# !!python/object tags that are embedded in the file)
# ---------------------------------------------------------------------------

_BBOX_FIELD = re.compile(
    r"_Boundbox__(?P<key>x0coord|y0coord|x1coord|y1coord):\s*(?P<val>[\d.eE+-]+)"
)


def parse_data_file(filepath: str) -> dict:
    """Return a dict with canvas info and a list of (layer, x0, y0, x1, y1) tuples."""
    text = Path(filepath).read_text()

    # ---- canvas metadata ---------------------------------------------------
    def _float_field(name: str) -> float:
        m = re.search(rf"^{name}:\s*([\d.eE+-]+)", text, re.MULTILINE)
        return float(m.group(1)) if m else 0.0

    canvas_w = _float_field("canvas_width")
    canvas_h = _float_field("canvas_height")
    start_x = _float_field("start_x")
    start_y = _float_field("start_y")

    # ---- polygons ----------------------------------------------------------
    # Each polygon block looks like:
    #   - - LayerName
    #     - !!python/object:...Boundbox
    #       _Boundbox__x0coord: ...
    #       _Boundbox__y0coord: ...
    #       _Boundbox__x1coord: ...
    #       _Boundbox__y1coord: ...
    #       height: ...  width: ...  area: ...
    #
    # Strategy: split on the "- - <LayerName>" pattern, then extract coords.

    # Grab everything between "polygons:" and "labels:" (or EOF)
    poly_section_match = re.search(
        r"^polygons:\s*\n(.*?)(?=^labels:|\Z)", text, re.MULTILINE | re.DOTALL
    )
    polygons: list[tuple[str, float, float, float, float]] = []

    if poly_section_match:
        poly_text = poly_section_match.group(1)

        # Split into individual polygon blocks
        blocks = re.split(r"^- - ", poly_text, flags=re.MULTILINE)
        for block in blocks:
            block = block.strip()
            if not block:
                continue

            # First line is the layer name
            layer_name = block.split("\n", 1)[0].strip()

            # Extract bounding-box coordinates
            coords: dict[str, float] = {}
            for m in _BBOX_FIELD.finditer(block):
                coords[m.group("key")] = float(m.group("val"))

            if len(coords) == 4:
                polygons.append(
                    (
                        layer_name,
                        coords["x0coord"],
                        coords["y0coord"],
                        coords["x1coord"],
                        coords["y1coord"],
                    )
                )

    return {
        "canvas_width": canvas_w,
        "canvas_height": canvas_h,
        "start_x": start_x,
        "start_y": start_y,
        "polygons": polygons,
    }


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------


def plot_layout(data: dict, output_path: str | None = None) -> None:
    style_lookup = _build_style_lookup()

    canvas_w = data["canvas_width"]
    canvas_h = data["canvas_height"]

    # Figure size proportional to canvas, with a reasonable scale factor
    scale = 2.0
    fig, ax = plt.subplots(
        figsize=(canvas_w * scale, canvas_h * scale),
        facecolor="#1e1e2e",
    )
    ax.set_facecolor("#1e1e2e")

    # Track which layers appear for the legend
    legend_layers: dict[str, dict] = {}

    for layer, x0, y0, x1, y1 in data["polygons"]:
        style = style_lookup.get(layer, _DEFAULT_STYLE)
        w = x1 - x0
        h = y1 - y0

        rect = patches.Rectangle(
            (x0, y0),
            w,
            h,
            linewidth=style.get("linewidth", 0.5),
            edgecolor=style.get("edgecolor", "black"),
            facecolor=style.get("facecolor", "grey"),
            alpha=style.get("alpha", 0.5),
            zorder=style.get("zorder", 1),
        )
        ax.add_patch(rect)

        if layer not in legend_layers:
            legend_layers[layer] = style

    # ---- Axes configuration ------------------------------------------------
    margin = 0.2
    ax.set_xlim(data["start_x"] - margin, data["start_x"] + canvas_w + margin)
    ax.set_ylim(data["start_y"] - margin, data["start_y"] + canvas_h + margin)
    ax.set_aspect("equal")
    ax.set_xlabel("X (µm)", color="white", fontsize=10)
    ax.set_ylabel("Y (µm)", color="white", fontsize=10)
    ax.set_title("IC Layout View", color="white", fontsize=14, fontweight="bold")
    ax.tick_params(colors="white", labelsize=8)
    for spine in ax.spines.values():
        spine.set_color("#555555")

    # ---- Legend ------------------------------------------------------------
    legend_handles = []
    for layer_name, style in sorted(legend_layers.items()):
        fc = style.get("facecolor", "grey")
        ec = style.get("edgecolor", "black")
        legend_handles.append(
            Patch(facecolor=fc, edgecolor=ec, alpha=0.85, label=layer_name)
        )

    legend = ax.legend(
        handles=legend_handles,
        loc="upper left",
        bbox_to_anchor=(1.01, 1),
        fontsize=7,
        frameon=True,
        fancybox=True,
        framealpha=0.8,
        facecolor="#2e2e3e",
        edgecolor="#555555",
        labelcolor="white",
        title="Layers",
        title_fontsize=9,
    )
    legend.get_title().set_color("white")

    plt.tight_layout()

    if output_path:
        fig.savefig(
            output_path, dpi=200, bbox_inches="tight", facecolor=fig.get_facecolor()
        )
        print(f"Saved layout plot to {output_path}")
    else:
        plt.show()

    plt.close(fig)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Plot IC layout from data.txt")
    parser.add_argument(
        "datafile",
        nargs="?",
        default=str(Path(__file__).resolve().parent.parent / "data" / "data.txt"),
        help="Path to the YAML data file (default: data/data.txt)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Save plot to file instead of showing interactively (e.g. layout.png)",
    )
    args = parser.parse_args()

    data = parse_data_file(args.datafile)
    n = len(data["polygons"])
    print(f"Parsed {n} polygons from {args.datafile}")
    print(f"Canvas: {data['canvas_width']} x {data['canvas_height']}")

    plot_layout(data, output_path=args.output)


if __name__ == "__main__":
    main()
