# 🎅 Santa's Visit

Put Santa in your own living room.

Upload a photo of your room, tap where your **door**, **sofa** and **table**
are, and watch Santa walk in, sit down, eat the cookie, drink the milk and
slip away. Then keep it — as a video, a vertical clip for Stories, or a printed
postcard.

**Your photo is never uploaded. It stays on your device, always.**

---

## Why this exists

Ten competing apps do this by transforming *your face*. Nobody composes a
character into the room itself. Here you mark the furniture, and Santa is
placed in **your** space — scaled to it, walking the distances between the
points you chose. That is the whole product.

## Run it

Open `index.html` in any modern browser. There is no build step, no install,
no dependencies, no server.

To try it on a phone on your Wi-Fi:

```bash
python3 tools/device_server.py 8099
# then open http://<your-lan-ip>:8099/mobile_test.html
```

## Verify it

```bash
bash tools/run_all.sh
```

Three gates, all of which must pass:

| Gate | Proves |
|---|---|
| `check_privacy.py` | No third-party script, remote resource or beacon on a page that handles a photo. **Fails the build.** |
| file integrity | Every source file present and balanced |
| `check_art.py` | Any commissioned Santa art is usable before it is wired in |

## The privacy promise, and why it is real

The claim is that nothing about your photo reaches us. Three things make that
true rather than aspirational:

1. **There is no backend.** The photo is decoded into page memory, drawn on,
   and released when you close the tab.
2. **No third-party scripts, ever.** One analytics tag could observe the canvas
   and the file input. `tools/check_privacy.py` fails the build if one appears,
   so nobody can add it by accident.
3. **A visible kill switch.** One button discards the photo, the output and
   every derived object.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The tool. Photo → three anchors → play → save |
| `santa.js` | The character (one module): vector poses by default; optional PNGs in `assets/santa/` |
| `engine.js` | Anchors, walk path, sofa seating, table treats, light matching |
| `postcards.js` | Three keepsakes built from the room |
| `export.js` | Frame-paced video export, 9:16 vertical cut |
| `mobile_test.html` | On-device export test that reports its verdict back |
| `tools/` | The QA suite, the art intake checker, the commission helpers |
| `docs/` | Requirements, DPIA, commission brief, reviews |

## Documents

| Document | For |
|---|---|
| [Requirements](docs/santa-visit-requirements.md) | What gets built, and why |
| [DPIA](docs/dpia-santas-visit.md) | Data protection assessment — **review before launch** |
| [Commission brief](docs/commission-brief.md) | **Send this unedited** to a photographer or studio |
| [Model release](docs/model-release-template.md) | Required if a real person plays Santa |
| [Asset provenance](docs/asset-provenance.md) | Where every asset came from and whether it is safe |
| [UK law review](docs/uk-law-privacy-review.md) | Children's code, PECR, EAA, consumer protection |
| [Next steps](docs/santa-visit-next-steps.md) | The plan |
| **[Picking this back up](RESUME.md)** | **Start here after a break — state, decisions, what's left, traps** |

## Credits

Built by **Atif Hussain** — <atiff.khan@yahoo.com>

No accounts. No payment. No advertising. No tracking. The character is drawn in
code, so there is no third-party art licence attached to this project.

> The DPIA is an engineering record, not legal advice. Have it reviewed before
> publishing.
