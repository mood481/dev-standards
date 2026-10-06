import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import {
  catalogLookup,
  installPathFor,
  loadCatalog,
  makeTarget,
  run,
} from './helpers.mjs';

test('check detects local drift and changed operations', async () => {
  const catalog = await loadCatalog();
  const managedId = [...catalogLookup(catalog).keys()][0];
  const installedPath = installPathFor(catalog, managedId);

  const target = await makeTarget();

  let result = run(['install', managedId, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const [directory, ...rest] = installedPath.split('/');
  await writeFile(
    join(target, directory, ...rest),
    '# Local divergent version\n',
  );
  await mkdir(join(target, 'docs', 'operations'), { recursive: true });
  await writeFile(
    join(target, 'docs', 'operations', 'validation.md'),
    '# Validation\n',
  );

  result = run(['check', '--path', target]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Local drift detected/);
  assert.match(result.stderr, /Manifest consumer-owned context does not match/);
});

test('indexes and checks the supported consumer-owned context types', async () => {
  const catalog = await loadCatalog();
  const managed = [...catalogLookup(catalog).keys()];
  assert.ok(managed.length >= 2, 'catalog needs at least two managed ids');

  const target = await makeTarget();

  for (const [directory, id] of [
    ['adrs', 'service-boundaries'],
    ['runbooks', 'incident-response'],
    ['references', 'domain-glossary'],
  ]) {
    await mkdir(join(target, 'docs', directory), { recursive: true });
    await writeFile(
      join(target, 'docs', directory, `${id}.md`),
      `# ${id}\n`,
    );
  }

  let result = run(['install', managed[0], '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  const manifestPath = join(target, 'docs', 'manifest.json');

  result = run(['install', managed[1], '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  result = run(['check', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const updated = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepStrictEqual(
    updated.context
      .filter((entry) => ['adr', 'runbook', 'reference'].includes(entry.type))
      .map(({ type, id, path, integrity }) => ({
        type,
        id,
        path,
        integrity,
      })),
    [
      {
        type: 'adr',
        id: 'service-boundaries',
        path: 'docs/adrs/service-boundaries.md',
        integrity: undefined,
      },
      {
        type: 'runbook',
        id: 'incident-response',
        path: 'docs/runbooks/incident-response.md',
        integrity: undefined,
      },
      {
        type: 'reference',
        id: 'domain-glossary',
        path: 'docs/references/domain-glossary.md',
        integrity: undefined,
      },
    ],
  );
});

test('rejects context types outside the schema vocabulary', async () => {
  const catalog = await loadCatalog();
  const managedId = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  let result = run(['install', managedId, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const manifestPath = join(target, 'docs', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.context.push({
    type: 'architecture',
    id: 'overview',
    path: 'docs/architecture/overview.md',
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  result = run(['check', '--path', target]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid context entry/);
});
