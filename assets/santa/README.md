# Commissioned Santa art goes here

Drop the nine transparent PNGs here. `santa.js` is the only character module —
if these files are present it uses them; otherwise it draws the vector Santa.
No second adapter file.

```
stand.png  walk.png  walk2.png  sit.png  reach.png
drink.png  eat.png   wave.png   cheer.png
```

Check a delivery before shipping it:

```bash
python3 tools/check_art.py
```

The brief to give an artist is `docs/commission-brief.md`. A model release is
required if a real person plays Santa — see `docs/model-release-template.md`.
