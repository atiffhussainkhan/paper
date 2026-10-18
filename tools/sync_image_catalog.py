#!/usr/bin/env python3
"""Re-sync Inkbound's asset index from github.com/atiffhussainkhan/Image.

Mirrors upstream MASTER_ASSET_INDEX.* into inkbound/assets/upstream/ and
refreshes IMAGE_INDEX.json metadata. Does not invent or generate bitmap art.

--extract-plates copies the curated high-resolution members out of the
shorepine-kenney release zip (range requests, not a full 159MB download)
and rewrites each catalog file's provenance and sha256. Pixel-platformer
tiles and sub-64 UI icons are not in that list.

Usage:
  python3 tools/sync_image_catalog.py
  python3 tools/sync_image_catalog.py --image-repo /path/to/Image
  python3 tools/sync_image_catalog.py --fetch
  python3 tools/sync_image_catalog.py --extract-plates
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struct
import sys
import zlib
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

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


UPSTREAM_RAW = "https://raw.githubusercontent.com/atiffhussainkhan/Image/main/"
KENNEY_ZIP = (
    "https://github.com/atiffhussainkhan/Image/releases/download/"
    "mega-assets-expansion-v1/shorepine-kenney.zip"
)
KENNEY_ROOT = "shorepine-kenney/"

# Catalog id -> member inside shorepine-kenney.zip.
# These are the highest-resolution plates in the stored Kenney pack for each
# role: 4096 skyboxes, 1024 parchment and spheres, 512 splats and masks.
# Bindings stay on the same ids so stages and skins keep resolving.
CURATED_PLATES = {
    "bg-quiet-plane": ("2d/Cartography Pack/Textures/parchmentBasic.png", ["stage", "quiet-plane", "parchment", "paper"], "Stage plate for Quiet Plane — 1024 cartography parchment"),
    "bg-rimward-marsh": ("2d/Skyboxes/Skyboxes/skybox-day.png", ["stage", "rimward-marsh", "sky"], "Stage plate for Rimward Marsh — 4096 day sky field"),
    "bg-sumi-basin": ("2d/Skyboxes/Skyboxes/skybox-night.png", ["stage", "sumi-basin", "sky", "night"], "Stage plate for Sumi Basin — 4096 night sky field"),
    "bg-cinnabar-reach": ("2d/Skyboxes/Skyboxes/skybox-alien.png", ["stage", "cinnabar-reach", "sky"], "Stage plate for Cinnabar Reach — 4096 warm sky field"),
    "bg-obsidian-shallows": ("2d/Skyboxes/Skyboxes/skybox-space.png", ["stage", "obsidian-shallows", "sky"], "Stage plate for Obsidian Shallows — 4096 deep sky field"),
    "bg-unsealed-horizon": ("2d/Skyboxes/Skyboxes/skybox-morning.png", ["stage", "unsealed-horizon", "sky"], "Stage plate for Unsealed Horizon — 4096 dawn sky field"),
    "bg-plane-fallback": ("2d/Cartography Pack/Textures/parchmentAncient.png", ["fallback", "parchment", "paper"], "Fallback arena plate — 1024 ancient parchment"),
    "char-bead-red": ("2d/Planets/Parts/sphere0.png", ["bead", "player", "sphere"], "Player ink bead — 1024 shaded sphere"),
    "char-bead-blue": ("2d/Planets/Parts/sphere1.png", ["bead", "bot", "sphere"], "Bot ink bead — 1024 shaded sphere"),
    "char-bead-red-alt": ("2d/Planets/Parts/sphere2.png", ["bead", "alt", "sphere"], "Alternate player bead — 1024 shaded sphere"),
    "char-bead-blue-alt": ("2d/Planets/Planets/planet05.png", ["bead", "alt", "marble"], "Alternate bot bead — 1280 marble sphere"),
    "char-shape-circle": ("2d/Planets/Planets/planet02.png", ["shape", "circle", "marble"], "Circular bead — 1280 marble sphere"),
    "char-shape-squircle": ("2d/Planets/Planets/planet07.png", ["shape", "squircle", "marble"], "Soft bead accent — 1280 marble sphere"),
    "skin-splat-01": ("2d/Splat Pack/Double (512px)/splat01.png", ["splat", "seal", "pattern"], "Territory fill pattern — Seal, 512px"),
    "skin-splat-05": ("2d/Splat Pack/Double (512px)/splat05.png", ["splat", "tideglass", "pattern"], "Territory fill pattern — Tideglass, 512px"),
    "skin-splat-10": ("2d/Splat Pack/Double (512px)/splat10.png", ["splat", "emberline", "pattern"], "Territory fill pattern — Emberline, 512px"),
    "skin-splat-16": ("2d/Splat Pack/Double (512px)/splat16.png", ["splat", "nightquarry", "pattern"], "Territory fill pattern — Nightquarry, 512px"),
    "skin-splat-22": ("2d/Splat Pack/Double (512px)/splat22.png", ["splat", "bone", "pattern"], "Territory fill pattern — Bone, 512px"),
    "skin-paint-circle": ("2d/Yellow Paint Pack/Double/paint_circle_a_double.png", ["paint", "circle", "picker"], "Ink picker bead overlay — double paint"),
    "skin-paint-splat": ("2d/Yellow Paint Pack/Double/paint_splat_a_double.png", ["paint", "splat"], "Wet-ink accent splat — double paint"),
    "skin-paint-drips": ("2d/Yellow Paint Pack/Double/paint_drips_a_double.png", ["paint", "drips", "trail"], "Trail drip accent — double paint"),
    "ui-brand-seal": ("ui/UI Pack/Red/Double/button_round_depth_flat.png", ["brand", "seal", "button"], "Inkbound brand seal — double round button"),
    "ui-restart": ("ui/UI Pack/Red/Double/button_rectangle_depth_flat.png", ["restart", "button"], "Restart button face — double rectangle"),
    "ui-icon-circle": ("ui/UI Pack - Adventure/Double/minimap_ring_brown_detail.png", ["icon", "ring", "circle"], "Circular UI ring — 256 adventure minimap"),
    "ui-medal-lead": ("2d/Medals/shaded_medal9.png", ["medal", "leader", "crown"], "Leader mark — shaded medal (densest plate in the pack)"),
    "ui-medal-alt": ("2d/Medals/shaded_medal5.png", ["medal", "award"], "Stage clear mark — shaded medal"),
    "ui-check": ("ui/UI Pack/Red/Double/check_round_round_circle.png", ["check", "confirm"], "Equipped mark — double round check"),
    "vfx-explosion-03": ("2d/Smoke Particles/Explosion/explosion00.png", ["explosion", "death", "burst"], "Death burst — large smoke explosion"),
    "vfx-magic-01": ("2d/Particle Pack/PNG (Transparent)/magic_02.png", ["magic", "spark", "claim"], "Claim sparkle — 512 magic particle"),
    "terrain-grass": ("2d/Cartography Pack/Textures/parchmentFolded.png", ["parchment", "floor", "paper"], "Quiet Plane floor — 1024 folded parchment"),
    "terrain-foliage-01": ("2d/Light Masks/Transparent/foliage_canopy_c_blur.png", ["foliage", "canopy", "mask"], "Marsh floor — 512 canopy light mask"),
    "terrain-abstract-01": ("2d/Cartography Pack/Textures/parchmentCrinkled.png", ["parchment", "grain", "paper"], "Sumi / plane grain — 1024 crinkled parchment"),
    "terrain-pixel-01": ("2d/Cartography Pack/Textures/parchmentFoldedCrinkled.png", ["parchment", "floor", "paper"], "Cinnabar floor — 1024 folded crinkle parchment"),
    "terrain-abstract-02": ("2d/Light Masks/Transparent/water_caustics_b.png", ["water", "caustics", "mask"], "Shallows floor — 512 water caustics"),
    "terrain-pixel-02": ("2d/Light Masks/Transparent/water_caustics_d.png", ["water", "caustics", "mask"], "Horizon floor — 512 water caustics"),
    "terrain-abstract-03": ("2d/Light Masks/Transparent/foliage_canopy_a_blur.png", ["foliage", "canopy", "mask"], "Sumi accent — 512 canopy light mask"),
    "terrain-abstract-04": ("2d/Light Masks/Transparent/foliage_canopy_b_blur.png", ["foliage", "canopy", "mask"], "Cinnabar accent — 512 canopy light mask"),
    "terrain-pixel-03": ("2d/Light Masks/Transparent/water_caustics_c.png", ["water", "caustics", "mask"], "Sumi grain — 512 water caustics"),
    "terrain-pixel-04": ("2d/Foliage Sprites/Shaded/sprite_0094.png", ["foliage", "stamp"], "Horizon rim stamp — 1024 shaded foliage"),
    "terrain-foliage-02": ("2d/Foliage Sprites/Shaded/sprite_0097.png", ["foliage", "stamp"], "Quiet Plane rim stamp — 1024 shaded foliage"),
    "terrain-foliage-03": ("2d/Foliage Sprites/Shaded/sprite_0096.png", ["foliage", "stamp"], "Marsh rim stamp — 1024 shaded foliage"),
    "terrain-foliage-04": ("2d/Foliage Sprites/Shaded/sprite_0098.png", ["foliage", "stamp"], "Shallows rim stamp — 1024 shaded foliage"),
    "terrain-pixel-bg-1": ("2d/Light Masks/Transparent/foliage_canopy_d.png", ["foliage", "canopy", "mask"], "Cinnabar grain — 512 canopy light mask"),
}


def fetch_image_repo(dest: Path) -> bool:
    """Download the upstream index files (not bitmap packs) into a repo-shaped tree."""
    ok = False
    for rel in DEFAULT_UPSTREAM_FILES:
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        url = UPSTREAM_RAW + rel
        try:
            with urlopen(url, timeout=60) as response:
                target.write_bytes(response.read())
            print(f"fetched {rel}")
            ok = True
        except Exception as exc:
            print(f"skip fetch {rel}: {exc}", file=sys.stderr)
    return ok


def _request(url: str, start: int | None = None, end: int | None = None):
    headers = {"User-Agent": "inkbound-catalog-sync"}
    if start is not None:
        headers["Range"] = f"bytes={start}-" if end is None else f"bytes={start}-{end}"
    req = Request(url, headers=headers)
    return urlopen(req, timeout=180)


def resolve_zip(url: str) -> tuple[str, int]:
    with _request(url, 0, 0) as response:
        final = response.geturl()
        cr = response.headers.get("Content-Range", "")
        response.read()
    if "/" not in cr:
        raise RuntimeError(f"zip length missing ({cr})")
    return final, int(cr.rsplit("/", 1)[-1])


def _find_eocd(blob: bytes) -> int:
    idx = blob.rfind(b"PK\x05\x06")
    if idx < 0:
        raise RuntimeError("zip EOCD not found")
    return idx


def zip_central_directory(final: str, total: int) -> list[dict]:
    tail_len = min(total, 128 * 1024)
    with _request(final, total - tail_len, total - 1) as response:
        tail = response.read()
    eocd_rel = _find_eocd(tail)
    eocd = tail[eocd_rel:eocd_rel + 22]
    cd_size, cd_off = struct.unpack_from("<II", eocd, 12)
    if cd_size == 0xFFFFFFFF or cd_off == 0xFFFFFFFF:
        loc = tail[eocd_rel - 20:eocd_rel]
        if loc[:4] != b"PK\x06\x07":
            raise RuntimeError("zip64 locator missing")
        z64_off = struct.unpack_from("<Q", loc, 8)[0]
        with _request(final, z64_off, z64_off + 200) as response:
            z64 = response.read()
        cd_size, cd_off = struct.unpack_from("<QQ", z64, 40)
    with _request(final, cd_off, cd_off + cd_size - 1) as response:
        cd = response.read()
    entries = []
    i = 0
    while i + 46 <= len(cd) and cd[i:i + 4] == b"PK\x01\x02":
        method = struct.unpack_from("<H", cd, i + 10)[0]
        comp, uncomp = struct.unpack_from("<II", cd, i + 20)
        name_len, extra_len, comment_len = struct.unpack_from("<HHH", cd, i + 28)
        local_off = struct.unpack_from("<I", cd, i + 42)[0]
        name = cd[i + 46:i + 46 + name_len].decode("utf-8", "replace")
        extra = cd[i + 46 + name_len:i + 46 + name_len + extra_len]
        if uncomp == 0xFFFFFFFF or comp == 0xFFFFFFFF or local_off == 0xFFFFFFFF:
            j = 0
            vals = []
            while j + 4 <= len(extra):
                hid, hlen = struct.unpack_from("<HH", extra, j)
                chunk = extra[j + 4:j + 4 + hlen]
                if hid == 1:
                    p = 0
                    for flag in (uncomp, comp, local_off):
                        if flag == 0xFFFFFFFF and p + 8 <= len(chunk):
                            vals.append(struct.unpack_from("<Q", chunk, p)[0])
                            p += 8
                j += 4 + hlen
            k = 0
            if uncomp == 0xFFFFFFFF:
                uncomp = vals[k]
                k += 1
            if comp == 0xFFFFFFFF:
                comp = vals[k]
                k += 1
            if local_off == 0xFFFFFFFF:
                local_off = vals[k]
        entries.append({
            "name": name,
            "method": method,
            "comp": comp,
            "uncomp": uncomp,
            "local": local_off,
        })
        i += 46 + name_len + extra_len + comment_len
    return entries


def extract_member(final: str, entry: dict) -> bytes:
    local = entry["local"]
    name = entry["name"]
    comp = entry["comp"]
    window = 30 + len(name.encode()) + 128 + comp
    with _request(final, local, local + window) as response:
        blob = response.read()
    if blob[:4] != b"PK\x03\x04":
        raise RuntimeError(f"bad local header for {name}")
    name_len, extra_len = struct.unpack_from("<HH", blob, 26)
    data_off = 30 + name_len + extra_len
    data = blob[data_off:data_off + comp]
    if len(data) < comp:
        start = local + data_off
        with _request(final, start, start + comp - 1) as response:
            data = response.read()
    if entry["method"] == 0:
        raw = data
    elif entry["method"] == 8:
        raw = zlib.decompress(data, -15)
    else:
        raise RuntimeError(f"unsupported zip method {entry['method']} for {name}")
    if len(raw) != entry["uncomp"]:
        raise RuntimeError(f"size mismatch for {name}: {len(raw)} != {entry['uncomp']}")
    if raw[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"{name} is not a PNG")
    return raw


def png_size(raw: bytes) -> tuple[int, int]:
    return struct.unpack(">II", raw[16:24])


def extract_plates(index_path: Path) -> int:
    index = json.loads(index_path.read_text())
    by_id = {img["id"]: img for img in index.get("images") or []}
    missing = [plate_id for plate_id in CURATED_PLATES if plate_id not in by_id]
    if missing:
        print(f"catalog missing ids: {missing}", file=sys.stderr)
        return 1
    print("resolving Kenney release zip")
    final, total = resolve_zip(KENNEY_ZIP)
    print(f"zip {total} bytes")
    entries = {item["name"]: item for item in zip_central_directory(final, total)}
    low = []
    for plate_id, (rel, tags, usage) in CURATED_PLATES.items():
        member = KENNEY_ROOT + rel
        entry = entries.get(member)
        if entry is None:
            print(f"missing zip member {member}", file=sys.stderr)
            return 1
        raw = extract_member(final, entry)
        width, height = png_size(raw)
        short = min(width, height)
        # Medals in this pack have no larger master. Everything else must clear 64px.
        if short < 64 and plate_id not in {"ui-medal-lead", "ui-medal-alt"}:
            low.append(f"{plate_id} {width}x{height}")
        img = by_id[plate_id]
        dest = INKBOUND / img["path"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        digest = hashlib.sha256(raw).hexdigest()[:16]
        img["tags"] = tags
        img["recommended_usage"] = usage
        img["sha256_16"] = digest
        upstream = img.setdefault("upstream", {})
        upstream["repository"] = "https://github.com/atiffhussainkhan/Image"
        upstream["pack_id"] = "shorepine-kenney"
        upstream["release_tag"] = "mega-assets-expansion-v1"
        upstream["release_asset"] = "shorepine-kenney.zip"
        upstream["release_url"] = KENNEY_ZIP
        upstream["source_path"] = rel
        upstream["license"] = "CC0-1.0"
        print(f"{plate_id:22} {width:5}x{height:<5} {digest}  {rel}")
    if low:
        print("plates below 64px:", ", ".join(low), file=sys.stderr)
        return 1
    index.setdefault("source_of_truth", {})
    index["source_of_truth"]["plate_policy"] = (
        "Curated from shorepine-kenney high-resolution plates only: "
        "4096 skyboxes, 1024 parchment and spheres, 512 splats, particles, and light masks. "
        "Pixel-platformer tiles are not used as stage or pattern art."
    )
    index["source_of_truth"]["plates_extracted_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    index["description"] = (
        "Curated game images for Inkbound, mirrored from atiffhussainkhan/Image. "
        "Stage plates are 4096 sky fields or 1024 parchment. Beads are 1024+ spheres. "
        "Skin patterns, UI seals, and VFX resolve through bindings. Do not AI-generate bitmap art."
    )
    index_path.write_text(json.dumps(index, indent=2) + "\n")
    print(f"extracted {len(CURATED_PLATES)} plates into {index_path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--image-repo",
        type=Path,
        default=None,
        help="Local clone of atiffhussainkhan/Image (default: try /tmp/image-repo/Image)",
    )
    parser.add_argument(
        "--fetch",
        action="store_true",
        help="Download MASTER index JSON from GitHub when a local clone is not present",
    )
    parser.add_argument(
        "--extract-plates",
        action="store_true",
        help="Pull curated high-resolution plates from the Kenney release zip into assets/catalog/",
    )
    args = parser.parse_args()
    if args.extract_plates and not args.fetch and args.image_repo is None:
        return extract_plates(INKBOUND / "assets" / "IMAGE_INDEX.json")
    image_repo = args.image_repo or Path("/tmp/image-repo/Image")
    if not image_repo.is_dir():
        if not args.fetch:
            print(f"Image repo not found at {image_repo}", file=sys.stderr)
            print("Clone https://github.com/atiffhussainkhan/Image or pass --fetch", file=sys.stderr)
            return 1
        image_repo = Path("/tmp/image-repo/Image")
        if not fetch_image_repo(image_repo):
            print("upstream fetch failed", file=sys.stderr)
            return 1
    elif args.fetch:
        fetch_image_repo(image_repo)

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
        index["source_of_truth"]["synced_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        index_path.write_text(json.dumps(index, indent=2) + "\n")
        print(f"updated {index_path} (local images={index.get('total')})")
    if args.extract_plates:
        return extract_plates(index_path)
    print("done — catalog bitmaps stay as curated local copies under assets/catalog/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
