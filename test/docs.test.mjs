import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadCatalog, managedIds, readPackageVersion, root, run } from './helpers.mjs';

const BASE_URL = 'https://tools.mood481.es/dev-standards/';
const buildScript = join(root, 'scripts', 'docs', 'build-docsite.mjs');
const verifyScript = join(root, 'scripts', 'docs', 'verify-site-paths.mjs');

async function buildDocsite() {
  const target = await mkdtemp(join(tmpdir(), 'dev-standards-docsite-'));
  const out = join(target, 'site');
  const built = run(['--out', out], buildScript);
  assert.equal(built.status, 0, `docsite build failed: ${built.stderr}`);
  return out;
}

async function listHtmlFiles(dir) {
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await listHtmlFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}

test('docsite builds every catalog entry with the packaged version in the footer', async () => {
  const out = await buildDocsite();
  const catalog = await loadCatalog();
  const version = await readPackageVersion();

  for (const page of [
    'index.html',
    'getting-started/index.html',
    'cli-reference/index.html',
    'standards/index.html',
    'standards/manifest/index.html',
  ]) {
    await readFile(join(out, page), 'utf8');
  }

  const byId = new Map();
  for (const [type, entries] of Object.entries(catalog)) {
    for (const id of Object.keys(entries)) byId.set(id, type);
  }
  assert.deepEqual([...byId.keys()].sort(), managedIds(catalog).sort());
  for (const [id, type] of byId) {
    await readFile(join(out, 'standards', `${type}s`, id, 'index.html'), 'utf8');
  }

  for (const page of ['index.html', 'standards/rules/devel/index.html']) {
    const content = await readFile(join(out, page), 'utf8');
    assert.match(content, new RegExp(`current version: ${version}`));
    assert.doesNotMatch(content, /Generated from the maintained/i);
  }

  const entry = await readFile(join(out, 'index.html'), 'utf8');
  assert.ok(entry.includes(BASE_URL));
});

test('built docsite has no host-root links outside /dev-standards/', async () => {
  const out = await buildDocsite();
  const files = await listHtmlFiles(out);
  assert.ok(files.length > 0);
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const links = content.match(/(href|src)="\/[^"]*"/g) ?? [];
    for (const link of links) {
      assert.ok(
        link.startsWith('href="/dev-standards/') || link.startsWith('src="/dev-standards/'),
        `${file} escapes the site prefix: ${link}`,
      );
    }
  }
});

test('verify-site-paths passes on a fresh build', async () => {
  const out = await buildDocsite();
  const verified = run(['--dir', out], verifyScript);
  assert.equal(verified.status, 0, `site path contract failed: ${verified.stderr}`);
});
