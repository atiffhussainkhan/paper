# One copy of Inkbound

Checked 18 Oct 2026. There is one game. The playable site is that same tree published for hosting, not a second game.

## The copy to keep

| What | Where |
| --- | --- |
| Source | [`inkbound/`](../) on `main` of [atiffhussainkhan/paper](https://github.com/atiffhussainkhan/paper) |
| Same source on Cursor Origin | [atiff-khan/paper](https://origin.cursor.com/atiff-khan/paper) `main`, one `inkbound/` folder |
| Play | https://atiffhussainkhan.github.io/paper/ |
| Deploy mirror | Branch `gh-pages`, folder `/ (root)`. Those files are the contents of `inkbound/` (`index.html` beside `css/`, `src/`, and `assets/`). Do not delete `gh-pages`. |

Open the play URL and press **Play**. Do not switch GitHub Pages to `main` / root. That root is a different project (Santa’s Visit) and would leave Inkbound under `/inkbound/`.

`inkbound/godot/` is an unfinished Godot scaffold inside this same tree. It is not a published second game.

## What was deleted

Stale full copies of the game, not the canonical tree and not the `gh-pages` branch:

| Path | What it was |
| --- | --- |
| `/tmp/headtree/inkbound` | Older Phase 0 prototype (no asset catalog). Parent `/tmp/headtree` removed with it. |
| `/tmp/inkbound-site-check` | Extra checkout of the current `inkbound/` tree. |
| `/tmp/inkbound-ghpages` | Second local clone of this repo, on `gh-pages`, with its remote pointed at `/workspace`. |
| `/workspace/dist/inkbound-site-root.tar.gz` | Gitignored 11 MB pack of the site root. The pack command in [PUBLIC_PLAY.md](PUBLIC_PLAY.md) can rebuild it. `dist/` was removed when it was empty. |

No second `inkbound/` directory was inside the repository. `main` already had exactly one.

## What remains

- **Game source:** `/workspace/inkbound` and `inkbound/` on `main`.
- **Deploy checkout:** `/tmp/inkbound-pages-wt` is the git worktree for `gh-pages`. It is the hosting tree, so it stays. This note is also at `docs/SINGLE_COPY.md` on that branch.
- **Symlink:** `/tmp/ghroot/paper` points at `/workspace/inkbound`. It is not another copy.
- **Local servers** that were already running (`8765`, `8771`, `8772`, `8774`, `8788`) serve `/workspace/inkbound`. Nothing was stopped.
- **`paper-io`:** [atiffhussainkhan/paper-io](https://github.com/atiffhussainkhan/paper-io) had no game files, only a one-line README. The repo was not deleted. Its README now points here (commit `7e1b510b9b8858190960d2c3017566678bb45c52`).
- **Image assets:** [atiffhussainkhan/Image](https://github.com/atiffhussainkhan/Image) stays. It is the art library, not the game. The local clone under `/tmp/image-repo` was left alone.
- **Other GitHub repos**, checked and left because they are different projects: `santas-visit`, `crossroad-hopper`, `Snake-and-ladder`, `Snake-and-ladder-web`, `minimax-ide` (a snake-and-ladder page under `game/`).
- **Cursor Origin** has one repo for this account, `atiff-khan/paper`.
- **Browser profiles** under `/tmp` whose names mention Inkbound (`inkbound-chrome`, `chrome-inkbound`, and similar) are Chrome user-data directories, not game source. They were not removed.

Feature branches on Origin are history of this same `inkbound/` tree. They are not extra game folders.
