# Inkbound assets

All bitmap art is selected from the GitHub image library
[`atiffhussainkhan/Image`](https://github.com/atiffhussainkhan/Image).

| File | Role |
|------|------|
| `IMAGE_INDEX.json` | Runtime catalog (id, path, category, tags, bindings) |
| `upstream/MASTER_ASSET_INDEX.json` | Mirrored upstream source-of-truth pack index |
| `catalog/<category>/` | Local copies of indexed images used by the game |

**Do not AI-generate or invent new bitmap art.** Add images by syncing from the
Image repo (see `tools/sync_image_catalog.py`), then wiring ids in `IMAGE_INDEX.json`.

Licence for vendored Kenney files: CC0-1.0 (see `upstream/KENNEY_LICENSE.txt`).
