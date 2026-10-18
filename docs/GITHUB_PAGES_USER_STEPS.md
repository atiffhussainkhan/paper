# Put Inkbound on GitHub Pages

This environment cannot sign in to github.com. `gh auth status` reports no login, there is no `GITHUB_TOKEN`, no SSH key, and no GitHub connector. The Cursor Origin credential is not a GitHub token (`api.github.com/user` returns 401). You run the steps below once on your machine, in this project (`atiff-khan/paper` on Cursor Origin).

## The link you get

```text
https://atiffhussainkhan.github.io/paper/
```

That URL 404s until the push and the Pages click below are done.

## 1. Create the empty GitHub repository

1. Open https://github.com/new while logged in as **atiffhussainkhan**.
2. Repository name: `paper`
3. Visibility: **Public**
4. Leave **Add a README file**, **Add .gitignore**, and **Choose a license** unchecked.
5. Click **Create repository**.

`https://github.com/atiffhussainkhan/paper` does not exist yet (confirmed 18 Oct 2026). Leave the repo empty so this history can push without `--force`.

## 2. Sign in and push two branches

In a terminal, from the folder that contains `inkbound/index.html`:

```bash
gh auth login
```

Choose **GitHub.com**, **HTTPS**, and account **atiffhussainkhan**.

```bash
git fetch origin
git remote add github https://github.com/atiffhussainkhan/paper.git
git push github origin/cursor/github-pages-user-steps-0043:main
git push github origin/gh-pages:gh-pages
```

If a remote named `github` already exists:

```bash
git remote set-url github https://github.com/atiffhussainkhan/paper.git
```

What those refs are:

| Push this Cursor Origin ref | To GitHub branch | Why |
| --- | --- | --- |
| `origin/cursor/github-pages-user-steps-0043` | `main` | `inkbound/` plus `.github/workflows/pages.yml` |
| `origin/gh-pages` | `gh-pages` | Contents of `inkbound/` at the branch root (`index.html`, `.nojekyll`, `css/`, `src/`, `assets/`) |

Do **not** push a local branch named `main` when `git rev-parse main` prints `d6a49f2f8a5611e414b9afcf16266973b585bc9c`. That commit is Santa's Visit at the repository root and has no `inkbound/` folder. Cursor Origin `main` is already the game: `50c809f6dffa36417da4913b439800fc0cbfd540`. The instructions branch above is that commit plus this file. Pushing `origin/main` instead of the instructions branch also publishes the game:

```bash
git push github 50c809f6dffa36417da4913b439800fc0cbfd540:main
```

## 3. Turn Pages on

Use one source.

### Deploy from `gh-pages` (shortest)

1. Open https://github.com/atiffhussainkhan/paper/settings/pages
2. **Build and deployment** → **Source**: **Deploy from a branch**
3. **Branch**: `gh-pages` · **Folder**: `/ (root)`
4. **Save**

### Or GitHub Actions

The workflow `.github/workflows/pages.yml` publishes the `inkbound/` folder on every push to `main`.

1. Open https://github.com/atiffhussainkhan/paper/settings/pages
2. **Build and deployment** → **Source**: **GitHub Actions**
3. Open https://github.com/atiffhussainkhan/paper/actions
4. Open **Deploy Inkbound to GitHub Pages**. If the push ran before Pages was set to GitHub Actions, use **Re-run failed jobs**.

## 4. Confirm the site serves the game

Wait until the Pages settings page shows the site as live (often about a minute). Then:

```bash
curl -sI https://atiffhussainkhan.github.io/paper/ | head -n 1
curl -sI "https://atiffhussainkhan.github.io/paper/src/main.js?v=pages-1" | head -n 1
curl -sI "https://atiffhussainkhan.github.io/paper/css/style.css?v=pages-1" | head -n 1
```

Each status line should be `HTTP/2 200`. Open https://atiffhussainkhan.github.io/paper/ (keep the trailing slash) and press **Play**.

## Upload set for any other host

The site root is the contents of `inkbound/`, not the repository root. `index.html` must sit beside `css/`, `src/`, and `assets/`. `.nojekyll` is included so GitHub does not run Jekyll. `tools/`, `docs/`, and `godot/` are optional.

```bash
mkdir -p dist
tar --exclude='godot/.godot' --exclude='__pycache__' --exclude='*.pyc' \
  -C inkbound -czf dist/inkbound-site-root.tar.gz .
```

Unpack that archive so `index.html` is at the host root. `dist/` is a local build product; the folder `inkbound/` is the source upload set.

## Alternative: existing `paper-io` repo

`https://github.com/atiffhussainkhan/paper-io` is public, Pages is off, and `main` is only a one-line README (`size` 0, unrelated history). Expected URL if you publish there instead:

```text
https://atiffhussainkhan.github.io/paper-io/
```

Replacing that README needs `--force`:

```bash
git remote add github https://github.com/atiffhussainkhan/paper-io.git
git push --force github origin/cursor/github-pages-user-steps-0043:main
git push --force github origin/gh-pages:gh-pages
```

Then the same **Settings → Pages** click, with `paper-io` in the settings URL. Prefer the new `paper` repository so the force push is unnecessary.
