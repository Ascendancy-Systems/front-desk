# Ascendancy Systems — Front Desk

**Stage 1 · v0.2** — compact public reception, grounded directory, and institutional navigation map.

The Front Desk is a static, dependency-free public entrance for Ascendancy Systems. Its recognizable Clerk offers guided directions, while the Directory and Map remain independently navigable. All three views read the single approved `data/directory.json` source. There is no live AI backend, account system, private corpus, or runtime service.

## Public site

The repository is `Ascendancy-Systems/front-desk` and its GitHub Pages project address is:

<https://ascendancy-systems.github.io/front-desk/>

The former repository name redirects on GitHub, but GitHub Pages project URLs are path-based and the former Pages URL should not be treated as a supported redirect. Links should use `/front-desk/`.

The `ascendancy.systems` name is reserved for a future full institutional website. This repository does not configure a `CNAME`, alter DNS, or claim a custom-domain deployment.

## What v0.2 changes

- Compresses the oversized landing, reception, directory, and map into one cohesive reception-and-navigation workspace.
- Keeps the Clerk visible and recognizable without making conversation a prerequisite.
- Adds explicit perspectives for institution and constitution, the canonical six-book series, research and disciplines, systems and instruments, Continuum and knowledge infrastructure, and symbolic or experiential environments including Cathedral.
- Preserves the six publicly described research groupings without presenting them as a finalized taxonomy.
- Extends the single-source directory schema with `type`, `maturity`, `availability`, `destination`, `sourceIds`, and declared `relations`.
- Distinguishes a verified public link from a conceptual destination that has no public edition or endpoint.
- Limits references to public organizational records and an approved high-level orientation; it does not publish manuscript titles, contents, private archives, or an invented canonical ontology.

## Local preview and validation

With Python 3 installed, run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`. The page must be served over HTTP so its module can load `data/directory.json`.

Run all integrity checks with:

```sh
npm test
```

The validator checks source IDs, allowed public hosts, type and maturity values, availability, link-versus-concept boundaries, map coordinates, relation targets, and the six approved perspectives. The test suite also checks the accessible Directory/Map tabs, the static Clerk disclosure, the renamed repository references, and the Pages path.

## Source and publication boundaries

- The public organization profile grounds the institution, stewardship, research fields, development status, and public/private distinction.
- The MG-001 record and Meta-Gauge repository ground the instrument entry.
- The approved v0.2 orientation permits limited naming of the six-book series, Continuum, and Cathedral. Their entries deliberately expose no unpublished titles, contents, private implementation, or fabricated public links.
- Map relations are declared navigation statements in the directory. Their screen positions do not define a canonical ontology or theoretical dependency.

## Project files

| Path | Role |
|---|---|
| `index.html` | Compact reception and hybrid navigator |
| `assets/styles.css` | Responsive, accessible visual system |
| `assets/ascendancy-double-star.png` | Existing public emblem |
| `data/directory.json` | Single approved public data and relations source |
| `src/main.js` | Clerk routing, directory, tabs, and map interactions |
| `scripts/validate-directory.mjs` | Schema and public-boundary validation |
| `tests/front-desk.test.mjs` | Structural and integrity regression tests |
| `.github/workflows/` | Validation and GitHub Pages deployment |

Future conversational behavior would require a separate, source-bounded review. It is not part of Stage 1.

No license is granted by omission; the institution can determine its reuse policy separately.
