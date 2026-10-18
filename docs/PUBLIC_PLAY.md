# Play Inkbound

One game. The files you play, and the files you later copy onto your own website, are the `inkbound/` folder in this repository.

## Public link

**Live:**

```text
https://atiffhussainkhan.github.io/paper/
```

Verified 18 Oct 2026: `https://atiffhussainkhan.github.io/paper/` and `https://atiffhussainkhan.github.io/paper/src/main.js` both return HTTP 200. Open that URL and press **Play**.

Repository: https://github.com/atiffhussainkhan/paper (public).

Pages source: branch `gh-pages`, folder `/ (root)`. That branch is the contents of `inkbound/` (`index.html` beside `css/`, `src/`, and `assets/`). Commit `912904e1f90dccd035f87f1d60645217e38b93d0`.

`main` on GitHub is `8f7ec23f95cffbdbf38bd18e1efdc374a4c58adf` (game plus `.github/workflows/pages.yml`). Do not switch Pages to `main` / root. That publishes a different project and leaves Inkbound under `/inkbound/`.

## Your own website later

Upload the **contents** of `inkbound/` (the same files GitHub Pages publishes) into the site’s web root:

```text
index.html
.nojekyll
css/
src/
assets/
```

`tools/`, `docs/`, and `godot/` may go along. The game does not need them. Keep `index.html` beside `css/`, `src/`, and `assets/`. No build step. Serve the folder over HTTP so the ES modules load. A packed copy of that tree:

```bash
mkdir -p dist
tar --exclude='godot/.godot' --exclude='__pycache__' --exclude='*.pyc' \
  -C inkbound -czf dist/inkbound-site-root.tar.gz .
```

Details: [DEPLOY.md](DEPLOY.md).
