import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const file = fileURLToPath(new URL('../data/directory.json', import.meta.url));
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const allowedCategories = new Set(['Research', 'Instrument', 'Institution']);
const allowedStatuses = new Set(['Orientation only', 'Live demonstration', 'Public record']);
const allowedHosts = new Set(['github.com', 'ascendancy-systems.github.io']);
assert.match(data.version, /^\d+\.\d+\.\d+$/);
assert.ok(Array.isArray(data.entries) && data.entries.length >= 8);
const seenIds = new Set();
for (const entry of data.entries) {
  for (const key of ['id','title','eyebrow','category','summary','detail','status','url','linkLabel','map']) {
    assert.ok(entry[key] !== undefined && entry[key] !== null, `${entry.id}: missing ${key}`);
  }
  assert.match(entry.id, /^[a-z0-9-]+$/);
  assert.ok(!seenIds.has(entry.id), `Duplicate ID: ${entry.id}`);
  seenIds.add(entry.id);
  assert.ok(allowedCategories.has(entry.category), `${entry.id}: category`);
  assert.ok(allowedStatuses.has(entry.status), `${entry.id}: status`);
  const parsed = new URL(entry.url);
  assert.equal(parsed.protocol, 'https:');
  assert.ok(allowedHosts.has(parsed.hostname), `${entry.id}: unapproved outbound hostname`);
  for (const axis of ['x','y']) assert.ok(Number.isFinite(entry.map[axis]) && entry.map[axis] >= 0 && entry.map[axis] <= 100, `${entry.id}: map ${axis}`);
}
for (const required of ['meta-gauge','institution','architectonics-knowledge']) assert.ok(seenIds.has(required), `${required} is missing`);
console.log(`Validated ${data.entries.length} curated public destinations; no duplicate IDs, unsafe links, or invalid map positions.`);
