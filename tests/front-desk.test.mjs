import test from 'node:test';
import { validateDirectory } from '../scripts/validate-directory.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const script = read('../src/main.js');
const directory = JSON.parse(read('../data/directory.json'));

test('directory data passes the independent validator on this platform', () => {
  const validator = fileURLToPath(new URL('../scripts/validate-directory.mjs', import.meta.url));
  execFileSync(process.execPath, [validator], { cwd: root, stdio: 'pipe' });
});

test('the Clerk, Directory, and Map remain independently navigable', () => {
  assert.match(html, /id="front-desk"/);
  assert.match(html, /id="directory-panel"/);
  assert.match(html, /id="map-panel"/);
  assert.match(html, /role="tablist"/);
  assert.match(script, /ArrowLeft/);
  assert.match(script, /data-open-view/);
});

test('v0.2 presents the six approved perspectives without claiming an ontology', () => {
  const types = new Set(directory.entries.map((entry) => entry.type));
  assert.deepEqual(types, new Set(['Institution', 'Canon', 'Discipline', 'Instrument', 'Infrastructure', 'Environment']));
  assert.match(directory.purpose, /not a canonical ontology/);
  for (const id of ['canonical-series', 'continuum', 'cathedral']) assert.ok(directory.entries.some((entry) => entry.id === id));
});

test('conceptual destinations cannot masquerade as public links', () => {
  const conceptual = directory.entries.filter((entry) => entry.destination.kind === 'conceptual');
  const linked = directory.entries.filter((entry) => entry.destination.kind === 'link');
  assert.ok(conceptual.length > 0 && linked.length > 0);
  assert.ok(conceptual.every((entry) => !('url' in entry.destination)));
  assert.ok(linked.every((entry) => entry.destination.url.startsWith('https://')));
  assert.match(script, /destination\.kind === 'link'/);
});

test('the experience stays static and explicitly discloses that the Clerk is not live AI', () => {
  assert.match(html, /scripted guide/i);
  assert.doesNotMatch(html + script, /openai|anthropic|apiKey|websocket/i);
  assert.match(script, /fetch\(DIRECTORY_URL\)/);
});

test('repository and Pages references use front-desk, not the retired project path', () => {
  const files = [html, read('../README.md'), read('../.github/workflows/pages.yml')].join('\n');
  assert.match(files, /Ascendancy-Systems\/front-desk/);
  assert.match(files, /ascendancy-systems\.github\.io\/front-desk\//);
  assert.doesNotMatch(files, /Ascendancy-Systems\/ascendancy\.systems/);
  assert.doesNotMatch(files, /ascendancy-systems\.github\.io\/ascendancy\.systems\//);
});

test('map connections require a known target and a source cited by their owner', () => {
  for (const [property, message] of [['target', /unknown relation target/], ['sourceId', /requires a cited source/]]) {
    const copy = structuredClone(directory);
    copy.entries.find((entry) => entry.relations.length).relations[0][property] = 'missing';
    assert.throws(() => validateDirectory(copy), message);
  }
});

test('every map destination needs a region and valid coordinates', () => {
  for (const [field, invalid] of [['region', ''], ['x', -1], ['y', 101]]) {
    const copy = structuredClone(directory);
    copy.entries[0].map[field] = invalid;
    assert.throws(() => validateDirectory(copy), /map/);
  }
});

test('the Map tab includes its diagram alongside the destination picker and detail record', () => {
  const panel = html.match(/<section id="map-panel"[\s\S]*?<\/section>/)[0];
  for (const id of ['map-canvas', 'map-nodes', 'map-lines', 'map-entry', 'map-detail-facts', 'map-relations', 'map-sources']) {
    assert.ok(panel.includes(`id="${id}"`), `missing map element: ${id}`);
  }
});

test('the research overview connects all six public fields, including infrastructure', () => {
  const research = directory.entries.find((entry) => entry.id === 'research-disciplines');
  const fields = research.relations.filter((edge) => edge.kind === 'contains');
  assert.equal(new Set(fields.map((edge) => edge.target)).size, 6);
  assert.ok(fields.some((edge) => edge.target === 'research-infrastructure'));
});
