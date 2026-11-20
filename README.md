# Ascendancy Systems — Front Desk

**Stage 1 (v0.1)** · Public reception, directory, and institutional navigation map.

This is the proposed starting site for `Ascendancy-Systems/ascendancy.systems`. It is static, dependency-free at runtime, and deliberately does not implement an AI agent. The Clerk is a guided welcoming interface. The Directory and Map work without the Clerk. All three read one approved public `data/directory.json` file.

## Local preview

With Python 3 installed, run from the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`. Use an HTTP server; opening `index.html` via `file://` will not load the JSON module data in most browsers.

## Validation

```sh
npm test
```

The tests check allowed public destinations, entry IDs, map coordinates, a consistent source directory, and presence of the three independent interfaces.

## Public-information boundary

- The six research fields reflect the current public [organization profile](https://github.com/Ascendancy-Systems/.github).
- Field listings are **orientation**, not assertions that complete public publications exist.
- The [GMG-A demonstrator](https://ascendancy-systems.github.io/meta-gauge/) is an **experimental geometric simulation**. No live telemetry or source-to-ring research calibration is claimed.
- No private vault, manuscripts, internal corpus, API key, user account, or unpublished content is bundled.
- To add a real public destination, update `data/directory.json` and let CI validate it. Changes should be reviewed before publication.

## Publication via GitHub

1. Create the **public** repository `Ascendancy-Systems/ascendancy.systems` (only after verifying none exists). Commit these files as the repository root, preferably through a PR if main-branch protections already exist.
2. Open Repository **Settings → Pages → Build and deployment** and choose **GitHub Actions**. The included workflow deploys only `index.html`, `assets/`, `src/main.js`, and `data/directory.json`.
3. Confirm the workflow **Verify Front Desk** and the Pages deployment pass. The default project Pages address will normally be `https://ascendancy-systems.github.io/ascendancy.systems/` once Pages is configured and deployed; this address has not been verified live.
4. **Do not point `ascendancy.systems` DNS yet.** The custom domain should be configured separately after checking DNS ownership, existing website use, HTTPS, and the intended hosting arrangement.

No separate Clerk repository, agent runtime, paid AI service, dependency installation, or publication database is needed for Stage 1.

## Project files

| Path | Role |
|---|---|
| `index.html` | Main Front Desk website |
| `assets/styles.css` | Interface visual design and responsive layout |
| `assets/ascendancy-double-star.png` | Existing Ascendancy emblem for public site presentation |
| `data/directory.json` | Single approved public navigation source |
| `src/main.js` | Directory search/filter, Clerk guided directions, and map interactions |
| `scripts/validate-directory.mjs` | Data validation |
| `tests/front-desk.test.mjs` | Stage 1 integrity tests |
| `.github/workflows/` | Validation and Pages deployment |

**Future Stage 2** may add link-health checks and publication-status maintenance after the initial site is reviewed. **Future Stage 3** may add a secure, source-bounded conversational Clerk. Neither is a prerequisite for publishing this version.

No license is granted by omission; the institution can determine its reuse policy separately.
