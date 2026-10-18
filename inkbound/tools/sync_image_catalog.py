#!/usr/bin/env python3
"""Re-sync Inkbound's asset index from github.com/atiffhussainkhan/Image.

Mirrors upstream MASTER_ASSET_INDEX.* into inkbound/assets/upstream/ and
refreshes IMAGE_INDEX.json metadata. Does not invent or generate bitmap art.

Usage:
  python3 tools/sync_image_catalog.py
  python3 tools/sync_image_catalog.py --image-repo /path/to/Image
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

INKBOUND = Path(__file__).resolve().parents[1]
DEFAULT_UPSTREAM_FILES = [
    "catalog/MASTER_ASSET_INDEX.json",
    "catalog/MASTER_ASSET_INDEX.csv",
    "catalog/assets.json",
    "catalog/repository_manifest.json",
    "catalog/storage_status.json",
    "catalog/user-artwork-active-library.json",
    "AI_ASSET_INDEX.md",
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--image-repo",
        type=Path,
        default=None,
        help="Local clone of atiffhussainkhan/Image (default: try /tmp/image-repo/Image)",
    )
    args = parser.parse_args()
    image_repo = args.image_repo or Path("/tmp/image-repo/Image")
    if not image_repo.is_dir():
        print(f"Image repo not found at {image_repo}", file=sys.stderr)
        print("Clone https://github.com/atiffhussainkhan/Image and pass --image-repo", file=sys.stderr)
        return 1

    dest_dir = INKBOUND / "assets" / "upstream"
    dest_dir.mkdir(parents=True, exist_ok=True)
    for rel in DEFAULT_UPSTREAM_FILES:
        src = image_repo / rel
        if not src.exists():
            print(f"skip missing {rel}", file=sys.stderr)
            continue
        shutil.copy2(src, dest_dir / Path(rel).name)
        print(f"mirrored {rel}")

    master = dest_dir / "MASTER_ASSET_INDEX.json"
    index_path = INKBOUND / "assets" / "IMAGE_INDEX.json"
    if master.exists() and index_path.exists():
        master_data = json.loads(master.read_text())
        index = json.loads(index_path.read_text())
        index.setdefault("source_of_truth", {})
        index["source_of_truth"]["repository"] = "https://github.com/atiffhussainkhan/Image"
        index["source_of_truth"]["canonical_index"] = "catalog/MASTER_ASSET_INDEX.json"
        index["source_of_truth"]["mirrored_at"] = "assets/upstream/MASTER_ASSET_INDEX.json"
        index["source_of_truth"]["upstream_counts"] = master_data.get("counts", {})
        index["source_of_truth"]["upstream_item_count"] = len(master_data.get("items") or [])
        index_path.write_text(json.dumps(index, indent=2) + "\n")
        print(f"updated {index_path} (local images={index.get('total')})")
    print("done — catalog bitmaps stay as curated local copies under assets/catalog/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
