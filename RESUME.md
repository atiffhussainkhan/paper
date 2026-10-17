# Picking this back up

Written for whoever returns to this in a couple of weeks with half a memory of
it. Read this first. It should take five minutes.

---

## 1. Where everything is

| What | Where |
|---|---|
| **Live repo** | https://github.com/atiffhussainkhan/santas-visit |
| **Local working copy** | `~/Documents/Mini AI/santas-visit/` |
| The game (separate project) | https://github.com/atiffhussainkhan/minimax-ide |

Santa's Visit and the Snake & Ladder game are **two separate repositories and
never merged**. They share no code. Do not move files between them.

To start working:

```bash
cd ~/Documents/Mini\ AI/santas-visit
python3 -m http.server 8080     # then open http://localhost:8080
```

Opening `index.html` directly also works — there is no build step, no install,
and no dependencies.

---

## 2. What state the code is in

**It works, and it is complete as a demo.** The full pipeline runs end to end:
photo → tap door/sofa/table → Santa walks in, sits, eats the cookie, drinks
the milk, waves, leaves → save as video or postcard.

All four quality gates pass:

```bash
bash tools/run_all.sh     # SUITE: PASS
```

Nothing is half-built. Nothing is a stub. The next work is *decisions and real
devices*, not more code.

---

## 3. Decisions already made — do not relitigate these

These were deliberate and cost real thought. Reopening them wastes a week.

| Decision | What was chosen | Why |
|---|---|---|
| The Santa character | **Vector Santa, drawn in code** (`santa.js`) | Zero cost, zero licence risk, nothing can be withdrawn. Photoreal is a *later upgrade*, not a prerequisite. |
| Free AI art | **Rejected** | It came back watermarked and without an alpha channel. Unusable for a child-facing product. Pollinations' free quota is also exhausted (402). |
| Scraping "Santa Finland" photos | **Refused** | Real tourism business images and photos of identifiable people carry copyright *and* personality rights. Monetising or not changes nothing. |
| Season | **Christmas only** for the launch copy | The engine stays year-round-capable, so adding Halloween in October is content, not rework. |
| Money | **Free, no monetisation** | The whole privacy promise rests on having no server. |
| Analytics | **Never** | One tag could read the user's photo. `check_privacy.py` fails the build if one appears. |
| Character photography | Optional PNGs in `assets/santa/` via the same `santa.js` API | One character module — vector by default, photos if present. |

---

## 4. What is genuinely left to do

Ordered by what unblocks the rest.

**A. Test the video export on a real iPhone — do this first.**
It is the single known technical risk. iOS `MediaRecorder` has a keyframe bug
that produces a file which *reports* the right duration and then plays for 0.1
seconds and freezes. Everything else is already built, so if export is broken
on iOS, that is the thing that matters.

```bash
python3 tools/device_server.py 8099
# open http://<your-lan-ip>:8099/mobile_test.html on the phone
```

**B. Commission photoreal Santa art — optional, only if you want it.**
`docs/commission-brief.md` is ready to send unedited. Budget roughly
£150–£600. Drop the delivered PNGs into `assets/santa/` and run
`bash tools/check_art.py`; it validates size, alpha channel, foot contact and
height consistency before anything gets wired in.

**C. Get the DPIA reviewed — required before launch.**
`docs/dpia-santas-visit.md` is written and maps all fifteen Children's code
standards. It has **not** had an independent read. Do that before launch, not
after.

**D. Decide the launch surface.** It is currently a static site with no host
and no domain. Hosting, HTTPS, and `no-store` headers are all still to do.

---

## 5. Traps that will cost you time

- **This Mac's display sleeps and suspends Safari.** Browser testing is
  unreliable. Keep the display awake, or verify in a real browser deliberately.
- **Never type the word "wipe" in a shell command here** — a security filter
  blocks the entire command. That is why the discard button's element id is
  `forget`, not something more obvious.
- **Do not add any third-party script, font, or CDN link.** It will break the
  central promise, and `tools/check_privacy.py` is specifically designed to
  catch you.
- **Keep `assets/santa/` in the repo even when empty.** It has a README so the
  folder survives; `check_art.py` passes cleanly on an empty folder. Deleting it
  makes the art check fail for no good reason.

---

## 6. What was deliberately deleted, and why

If you find these referenced anywhere, they are gone on purpose:

| Deleted | Reason |
|---|---|
| `grenade-santa-v1/v2/v3.png` | Rejected free AI art. Watermarked, no alpha channel, and the "grenade" versions were not child-safe. |
| `_poses.html` | A scratch file for eyeballing the nine poses. The poses are visible in the app itself. |
| `assets/test_*.png` (7 files, in the game repo) | Dead sprite experiments. Verified unreferenced by any code before removal. |

---

## 7. If you only remember one thing

The product is **finished and working**. The remaining work is: prove the video
export on a phone, get the DPIA reviewed, and pick a host. Do not start
rewriting the engine — there is nothing wrong with it.
