# Play Inkbound

One game. The files that you play, and the files you later copy onto your own website, are the `inkbound/` folder in this repository.

## Public link

GitHub Pages is **not live**. These URLs were fetched on 18 Oct 2026 and do not serve the game:

| URL | What came back |
| --- | --- |
| `https://github.com/atiff-khan/paper` | 404 |
| `https://github.com/atiffhussainkhan/paper` | 404 |
| `https://atiffhussainkhan.github.io/paper/` | 404 |
| `https://atiffhussainkhan.github.io/paper-io/` | 404 |

`https://github.com/atiffhussainkhan/paper-io` exists and is an empty README. Pages is off there. This repository (`atiff-khan/paper`) is on Cursor Origin, not on github.com, and this session has no GitHub login, so Pages cannot be switched on from here.

**Expected playable URL** after this repository is on GitHub as `atiffhussainkhan/paper` and Pages is enabled:

```text
https://atiffhussainkhan.github.io/paper/
```

That address 404s until the click below. Do not treat it as the live game yet.

If the GitHub repository name is different, the pattern is `https://atiffhussainkhan.github.io/<repo>/`.

## The one Settings click

On the **github.com** repository (not Cursor Origin):

1. **Settings → Pages**
2. **Build and deployment → Source: GitHub Actions**

`.github/workflows/pages.yml` then publishes the contents of `inkbound/` on every push to `main`. `index.html` is the site root.

If GitHub Actions is not offered, use the other source instead:

**Settings → Pages → Deploy from a branch → `gh-pages` / `/ (root)`**

The `gh-pages` branch is the contents of `inkbound/` (`index.html` at the root, plus `.nojekyll`). Do not deploy `main` / root: that publishes a different project and leaves Inkbound under `/inkbound/`.

Getting the repository onto github.com is required before that click does anything. Push or import this Origin repo (`atiff-khan/paper`) to `atiffhussainkhan/paper`. `gh` in this environment is not logged in (`gh auth status`: not logged into any GitHub hosts).

## Your own website later

Upload the **contents** of `inkbound/` (the same files GitHub Pages publishes) into the site’s web root:

```text
index.html
.nojekyll
css/
src/
assets/
```

`tools/`, `docs/`, and `godot/` may go along. The game does not need them. Keep `index.html` beside `css/`, `src/`, and `assets/`. No build step. Serve the folder over HTTP so the ES modules load. Details: [DEPLOY.md](DEPLOY.md).
