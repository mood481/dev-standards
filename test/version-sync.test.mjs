import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { escapeRegExp, loadCatalog, readPackageVersion, root } from './helpers.mjs';

const version = await readPackageVersion();
const catalog = await loadCatalog();

async function read(relativePath) {
  return readFile(join(root, relativePath), 'utf8');
}

function sha256(content) {
  return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`;
}

function manifestExamples(source) {
  return [...source.matchAll(/```json\n([\s\S]*?)```/g)]
    .map((match) => JSON.parse(match[1]))
    .filter((value) => value?.schemaVersion === 1 && typeof value?.source?.version === 'string');
}

async function assertManagedIntegrity(label, example) {
  for (const entry of example.context) {
    if (!entry.integrity) continue;
    const source = catalog[entry.type]?.[entry.id];
    assert.ok(
      source,
      `${label} references an uncataloged ${entry.type}/${entry.id}`,
    );
    assert.equal(entry.path, `docs/${source}`, `${label} drifted from catalog paths`);
    assert.equal(
      entry.integrity,
      sha256(await read(source)),
      `${label} drifted from the current ${source} contents`,
    );
  }
}

test('package.json holds a stable release line', () => {
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
});

for (const file of ['README.md', 'docs/site/content/standards/manifest.md']) {
  test(`${file} manifest examples track the package version and contents`, async () => {
    const examples = manifestExamples(await read(file));
    assert.ok(examples.length > 0, `${file} lost its manifest example`);
    for (const example of examples) {
      assert.equal(example.source.version, version, `${file} manifest example version drift`);
      await assertManagedIntegrity(file, example);
    }
  });
}

test('schemas/manifest.example.json tracks the package version and contents', async () => {
  const example = JSON.parse(await read(join('schemas', 'manifest.example.json')));
  assert.equal(example.source.version, version, 'manifest example version drift');
  await assertManagedIntegrity('schemas/manifest.example.json', example);
});

test('README prerelease example stays on the package release line', async () => {
  const readme = await read('README.md');
  const tags = [...readme.matchAll(/npm run prerelease:publish -- v([^\s`]+)/g)]
    .map((match) => match[1]);
  assert.ok(tags.length > 0, 'README lost its prerelease example');
  for (const tag of tags) {
    assert.match(
      tag,
      new RegExp(`^${escapeRegExp(version)}-(devel|alpha|beta|rc)\\.\\d+$`),
      `README prerelease example v${tag} is off the ${version} line`,
    );
  }
});

for (const file of ['.github/workflows/publish.yml', '.github/workflows/docs-publish.yml']) {
  test(`${file} stable tag example tracks the package version`, async () => {
    const examples = [...(await read(file)).matchAll(/for example v(\d+\.\d+\.\d+)/g)]
      .map((match) => match[1]);
    assert.deepEqual(examples, [version], `${file} tag example drift`);
  });
}
