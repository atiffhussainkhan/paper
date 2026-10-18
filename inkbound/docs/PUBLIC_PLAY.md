# Play Inkbound

One game. The files you play, and the files you later copy onto your own website, are the `inkbound/` folder in this repository.

## Public link

**Not live.** No `https://*.github.io/...` URL serves this game. Checked again on 18 Oct 2026 from this workspace:

| URL | Result |
| --- | --- |
| `https://github.com/atiffhussainkhan/paper` | 404 — repository does not exist |
| `https://github.com/atiff-khan/paper` | 404 |
| `https://github.com/atiffhussainkhan/paper-io` | 200 — public repo, only a README, `has_pages: false` |
| `https://atiffhussainkhan.github.io/paper/` | 404 |
| `https://atiffhussainkhan.github.io/paper-io/` | 404 |
| `https://atiffhussainkhan.github.io/paper/src/main.js?v=pages-1` | 404 |
| `https://atiffhussainkhan.github.io/paper-io/src/main.js?v=pages-1` | 404 |

This copy of the game is on Cursor Origin (`origin.cursor.com/git/atiff-khan/paper`), not on github.com. Publishing is blocked here:

- `gh auth status`: not logged into any GitHub host
- `gh auth token`: no oauth token
- no `GITHUB_TOKEN` / `GH_TOKEN`, no `~/.ssh` key, `git credential fill` for `github.com` has no username
- no GitHub MCP server in this session
- the Cursor Origin access token and `CURSOR_AUTH_TOKEN` are rejected by `https://api.github.com/user` (401)

**Expected playable URL** after you create `atiffhussainkhan/paper`, push, and enable Pages:

```text
https://atiffhussainkhan.github.io/paper/
```

If you force-push into the existing empty `paper-io` repo instead, the URL is `https://atiffhussainkhan.github.io/paper-io/`.

Exact clicks and commands: [GITHUB_PAGES_USER_STEPS.md](GITHUB_PAGES_USER_STEPS.md).

## Refs that are ready to push

Cursor Origin already has the game. Do not push local `main` when it is `d6a49f2f8a5611e414b9afcf16266973b585bc9c` (no `inkbound/` folder).

| Ref | Tip | Push to GitHub as |
| --- | --- | --- |
| `origin/main` | `50c809f6dffa36417da4913b439800fc0cbfd540` | `main` (game + `.github/workflows/pages.yml`) |
| `origin/cursor/github-pages-user-steps-0043` | tip of that branch after `git fetch origin` (steps added in `efa18191f0d6443b3d0dd1dd607bc7a5a538daa3`) | `main` (same game, plus these instructions) |
| `origin/gh-pages` | `912904e1f90dccd035f87f1d60645217e38b93d0` | `gh-pages` (`inkbound/` contents at the branch root) |

## The one Settings click

On the **github.com** repository (not Cursor Origin), after the push:

1. **Settings → Pages**
2. **Build and deployment → Source: Deploy from a branch → `gh-pages` / `/ (root)`**

Or **Source: GitHub Actions**, which runs `.github/workflows/pages.yml` and publishes `inkbound/`.

Do not deploy `main` / root. That publishes a different project and leaves Inkbound under `/inkbound/`.

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
