import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import {
  catalogLookup,
  compareContextEntries,
  installPathFor,
  loadCatalog,
  makeNextPackage,
  makeTarget,
  readConsumerManifest,
  readPackageVersion,
  run,
} from './helpers.mjs';

test('installs, extends and checks a consumer', async () => {
  const catalog = await loadCatalog();
  const byId = catalogLookup(catalog);
  const allManaged = [...byId.keys()];
  assert.ok(
    allManaged.length >= 2,
    'catalog needs at least two managed ids for this test',
  );
  const split = Math.ceil(allManaged.length / 2);
  const firstBatch = allManaged.slice(0, split);
  const secondBatch = allManaged.slice(split);

  const target = await makeTarget();
  const operationId = 'local-notes';
  await mkdir(join(target, 'docs', 'operations'), { recursive: true });
  await writeFile(
    join(target, 'docs', 'operations', `${operationId}.md`),
    '# Local notes\n',
  );

  let result = run(['install', ...firstBatch, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  result = run(['check', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ok\t/m);

  result = run(['install', ...secondBatch, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const manifest = await readConsumerManifest(target);
  const expected = [
    ...firstBatch.map((id) => ({
      type: byId.get(id).type,
      id,
      path: byId.get(id).installPath,
    })),
    ...secondBatch.map((id) => ({
      type: byId.get(id).type,
      id,
      path: byId.get(id).installPath,
    })),
    {
      type: 'operation',
      id: operationId,
      path: `docs/operations/${operationId}.md`,
    },
  ].sort(compareContextEntries);

  assert.deepStrictEqual(
    manifest.context.map(({ type, id, path }) => ({ type, id, path })),
    expected,
  );
  assert.equal(manifest.source.version, await readPackageVersion());
  const samplePath = byId.get(firstBatch[0]).installPath;
  assert.match(
    manifest.context.find((entry) => entry.path === samplePath).integrity,
    /^sha256:[a-f0-9]{64}$/,
  );
});

test('installs hybrid context declared in catalog.json', async () => {
  const catalog = await loadCatalog();
  assert.ok(
    !catalog.adr?.['service-boundaries'],
    'fixture id service-boundaries should not already exist in catalog.json',
  );

  const target = await makeTarget();
  const packageCli = await makeNextPackage(
    '0.2.0-alpha.0',
    async (packageRoot) => {
      await mkdir(join(packageRoot, 'adrs'), { recursive: true });
      await writeFile(
        join(packageRoot, 'adrs', 'service-boundaries.md'),
        '# Shared service boundaries\n',
      );
      const catalogPath = join(packageRoot, 'catalog.json');
      const nextCatalog = JSON.parse(await readFile(catalogPath, 'utf8'));
      nextCatalog.adr['service-boundaries'] = 'adrs/service-boundaries.md';
      await writeFile(catalogPath, `${JSON.stringify(nextCatalog, null, 2)}\n`);
    },
  );

  let result = run(
    ['install', 'service-boundaries', '--path', target],
    packageCli,
  );
  assert.equal(result.status, 0, result.stderr);
  result = run(['check', '--path', target], packageCli);
  assert.equal(result.status, 0, result.stderr);

  const manifest = await readConsumerManifest(target);
  const adr = manifest.context.find((entry) => entry.type === 'adr');
  assert.equal(adr.id, 'service-boundaries');
  assert.equal(adr.path, 'docs/adrs/service-boundaries.md');
  assert.match(adr.integrity, /^sha256:[a-f0-9]{64}$/);
});

test('installs the lit guide with integrity and passes check', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog.guide?.lit, 'catalog must register the lit guide');
  const installPath = installPathFor(catalog, 'lit');

  const listed = run(['list']);
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /^guide\tlit$/m);

  const target = await makeTarget();
  let result = run(['install', 'lit', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  result = run(['check', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const manifest = await readConsumerManifest(target);
  const entry = manifest.context.find(({ id }) => id === 'lit');
  assert.equal(entry.type, 'guide');
  assert.equal(entry.path, installPath);
  assert.match(entry.integrity, /^sha256:[a-f0-9]{64}$/);

  const [directory, ...rest] = installPath.split('/');
  assert.match(
    await readFile(join(target, directory, ...rest), 'utf8'),
    /^# Lit guide$/m,
  );
});

test('install requires update before mixing package versions', async () => {
  const catalog = await loadCatalog();
  const byId = catalogLookup(catalog);
  const ids = [...byId.keys()];
  assert.ok(ids.length >= 2, 'catalog needs at least two managed ids');

  const target = await makeTarget();

  let result = run(['install', ids[0], '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const nextCli = await makeNextPackage('0.2.1-alpha.0');
  result = run(['install', ids[1], '--path', target], nextCli);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /run dev-standards update/);
});

test('preserves an existing AGENTS.md', async () => {
  const catalog = await loadCatalog();
  const ids = [...catalogLookup(catalog).keys()];
  assert.ok(ids.length >= 1, 'catalog needs at least one managed id');

  const target = await makeTarget();
  await writeFile(join(target, 'AGENTS.md'), '# Existing instructions\n');

  const result = run(['install', ids[0], '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(target, 'AGENTS.md'), 'utf8'),
    '# Existing instructions\n',
  );
});
