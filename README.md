# Ascendancy Systems · Front Desk

[Visit the Front Desk](https://ascendancy-systems.github.io/front-desk/) · [Directory](https://ascendancy-systems.github.io/front-desk/#directory) · [Map](https://ascendancy-systems.github.io/front-desk/#map)

The Front Desk is the public entrance to Ascendancy Systems. Ask the Clerk for a direction, search by name or subject, or follow a documented connection on the map. Stage 1 uses a scripted guide and a static directory.

## What visitors can find

The directory covers the institution and its constitution, the six-book series, research and disciplines, systems and instruments, Continuum, and symbolic environments including Cathedral. Each entry gives its maturity and availability. A destination opens a public resource where one is linked. Conceptual entries offer a description and a source for their inclusion.

The [organization profile](https://github.com/Ascendancy-Systems/.github/blob/main/profile/README.md) introduces the research program. The [MG-001 record](https://github.com/Ascendancy-Systems/.github/blob/main/profile/META-GAUGE.md) carries the assessment. The [GMG-A demonstrator](https://ascendancy-systems.github.io/meta-gauge/) provides the experimental spatial view. The [v0.2 review](https://github.com/Ascendancy-Systems/front-desk/pull/1) records the scope of the conceptual entries.

## Maintaining the directory

Edit [`data/directory.json`](./data/directory.json). The Clerk, Directory, and Map read this file. Give each entry a stable ID, type, maturity, availability, description, source IDs, and destination. A public destination has an HTTPS URL. A conceptual destination has a label only.

Record each documented connection once, on its originating entry, with a target, relation kind, and source ID. The map derives the return route from that same record. The research overview’s membership also determines which entries its Clerk route includes.

When an entry gains a public destination, update its availability, destination, and supporting source together.

## Preview and publish

When adding a file the browser needs, include it in the [Pages staging step](./.github/workflows/pages.yml) and open its published URL after deployment.

Run `npm test` to check the data and navigation structure. Run `python -m http.server 8000` from this directory to preview the site at `http://localhost:8000/`. The runtime uses browser-native modules and has no package dependencies.

GitHub Pages publishes the static files from `main` to `/front-desk/`. Link to that project path. GitHub’s repository rename redirect applies to repository URLs. The former project-site path has no supported redirect. The name `ascendancy.systems` is reserved for the eventual institutional website.

No license has been selected for this repository.
