import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const directory = JSON.parse(fs.readFileSync(new URL('../data/directory.json', import.meta.url), 'utf8'));
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('directory data passes the independent validation script', () => {
  execFileSync(process.execPath, [new URL('../scripts/validate-directory.mjs', import.meta.url).pathname], { stdio: 'pipe' });
});

test('the Front Desk, Directory, and Map exist independently', () => {
  for (const id of ['front-desk', 'directory', 'institutional-map', 'clerk-response', 'directory-cards', 'map-nodes']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('research categories and public instruments originate in one directory', () => {
  assert.equal(directory.entries.filter(e => e.category === 'Research').length, 6);
  assert.equal(directory.entries.find(e => e.id === 'meta-gauge').url, 'https://ascendancy-systems.github.io/meta-gauge/');
  assert.match(js, /\.\.\/data\/directory\.json/);
  assert.match(js, /renderDirectory\(\)/);
  assert.match(js, /renderMap\(\)/);
});

test('the reception experience does not claim live AI capability', () => {
  assert.match(html, /not a live AI agent/);
  assert.doesNotMatch(html, /api\.openai\.com|api\.anthropic\.com/);
});
