import fs from 'node:fs';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../data/directory.json', import.meta.url));
const allowedTypes = new Set(['Institution', 'Canon', 'Discipline', 'Instrument', 'Infrastructure', 'Environment']);
const allowedMaturity = new Set(['Public record', 'Developing framework', 'Work in development', 'Active development', 'Experimental', 'Developing concept']);
const allowedAvailability = new Set(['Public orientation', 'Public description limited', 'Not publicly listed', 'Orientation only', 'Mixed public and private', 'Public demonstrator']);
const allowedDestinationKinds = new Set(['link', 'conceptual']);
const allowedHosts = new Set(['github.com', 'ascendancy-systems.github.io']);
const allowedRelations = new Set(['lists', 'contains']);

function safeUrl(value, label) {
  const parsed = new URL(value);
  assert.equal(parsed.protocol, 'https:', `${label}: URLs must use HTTPS`);
  assert.ok(allowedHosts.has(parsed.hostname), `${label}: unapproved outbound hostname`);
}

export function validateDirectory(data) {
  assert.equal(data.version, '0.2.0');
  assert.match(data.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(data.purpose.includes('not a canonical ontology'));
  assert.ok(Array.isArray(data.sources) && data.sources.length >= 4);
  assert.ok(Array.isArray(data.entries) && data.entries.length >= 12);

  const sourceIds = new Set();
  for (const source of data.sources) {
    assert.match(source.id, /^[a-z0-9-]+$/);
    assert.ok(!sourceIds.has(source.id), `Duplicate source ID: ${source.id}`);
    sourceIds.add(source.id);
    assert.ok(source.label);
    safeUrl(source.url, source.id);
  }

  const entryIds = new Set(data.entries.map((entry) => entry.id));
  assert.equal(entryIds.size, data.entries.length, 'Entry IDs must be unique');

  for (const entry of data.entries) {
    for (const key of ['id', 'title', 'type', 'maturity', 'availability', 'summary', 'detail', 'sourceIds', 'destination', 'relations']) {
      assert.notEqual(entry[key], undefined, `${entry.id}: missing ${key}`);
    }
    assert.match(entry.id, /^[a-z0-9-]+$/);
    assert.ok(allowedTypes.has(entry.type), `${entry.id}: unsupported type`);
    assert.ok(allowedMaturity.has(entry.maturity), `${entry.id}: unsupported maturity`);
    assert.ok(allowedAvailability.has(entry.availability), `${entry.id}: unsupported availability`);
    assert.ok(entry.sourceIds.length > 0 && entry.sourceIds.every((id) => sourceIds.has(id)), `${entry.id}: unknown source`);
    assert.ok(allowedDestinationKinds.has(entry.destination.kind), `${entry.id}: invalid destination kind`);
    assert.ok(entry.destination.label, `${entry.id}: destination label required`);
    if (entry.destination.kind === 'link') {
      assert.ok(entry.destination.url, `${entry.id}: linked destination requires URL`);
      safeUrl(entry.destination.url, entry.id);
    } else {
      assert.equal(entry.destination.url, undefined, `${entry.id}: conceptual destination must not expose a URL`);
    }
    const relationKeys = new Set();
    for (const relation of entry.relations) {
      assert.ok(entryIds.has(relation.target), `${entry.id}: unknown relation target ${relation.target}`);
      assert.notEqual(relation.target, entry.id, `${entry.id}: self relation`);
      assert.ok(allowedRelations.has(relation.kind), `${entry.id}: unsupported relation ${relation.kind}`);
      assert.ok(entry.sourceIds.includes(relation.sourceId), `${entry.id}: relation requires a cited source`);
      const key = `${relation.kind}:${relation.target}`;
      assert.ok(!relationKeys.has(key), `${entry.id}: duplicate relation ${key}`);
      relationKeys.add(key);
    }
  }

  for (const type of allowedTypes) assert.ok(data.entries.some((entry) => entry.type === type), `Missing public perspective: ${type}`);
  for (const id of ['institution', 'constitution', 'canonical-series', 'research-disciplines', 'meta-gauge', 'continuum', 'cathedral']) assert.ok(entryIds.has(id), `Missing required orientation: ${id}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  validateDirectory(data);
  console.log(`Validated ${data.entries.length} entries and their sources, destinations and connections.`);
}
