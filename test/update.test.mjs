import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import {
  catalogLookup,
  entryFor,
  escapeRegExp,
  loadCatalog,
  makeNextPackage,
  makeTarget,
  packageVersions,
  prereleaseOf,
  readConsumerManifest,
  run,
} from './helpers.mjs';

const nextVersion = prereleaseOf((await packageVersions()).next, 'alpha');

test('update replaces unchanged installed files and advances version', async () => {
  const catalog = await loadCatalog();
  const managedId = [...catalogLookup(catalog).keys()][0];
  const { source, installPath } = entryFor(catalog, managedId);

  const target = await makeTarget();

  let result = run(['install', managedId, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const nextCli = await makeNextPackage(nextVersion, async (packageRoot) => {
    const path = join(packageRoot, source);
    const content = await readFile(path, 'utf8');
    await writeFile(path, `${content}\n<!-- next-version-test -->\n`);
  });

  result = run(['update', '--path', target], nextCli);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`update\\t${escapeRegExp(installPath)}`));

  const [directory, ...rest] = installPath.split('/');
  const installed = await readFile(
    join(target, directory, ...rest),
    'utf8',
  );
  assert.match(installed, /next-version-test/);

  const manifest = await readConsumerManifest(target);
  assert.equal(manifest.source.version, nextVersion);
});

test('update refuses to overwrite locally modified standards', async () => {
  const catalog = await loadCatalog();
  const managedId = [...catalogLookup(catalog).keys()][0];
  const { source, installPath } = entryFor(catalog, managedId);

  const target = await makeTarget();

  let result = run(['install', managedId, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const [directory, ...rest] = installPath.split('/');
  const installedPath = join(target, directory, ...rest);
  await writeFile(installedPath, '# Local divergent version\n');

  const nextCli = await makeNextPackage(nextVersion, async (packageRoot) => {
    const path = join(packageRoot, source);
    const content = await readFile(path, 'utf8');
    await writeFile(path, `${content}\n<!-- next-version-test -->\n`);
  });

  result = run(['update', '--path', target], nextCli);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to overwrite locally modified file/);

  const installed = await readFile(installedPath, 'utf8');
  assert.equal(installed, '# Local divergent version\n');
});


test('update preserves explicit consumer-owned context outside discovery directories', async () => {
  const catalog = await loadCatalog();
  const managedId = [...catalogLookup(catalog).keys()][0];
  const { source } = entryFor(catalog, managedId);
  const target = await makeTarget();

  let result = run(['install', managedId, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  await mkdir(join(target, 'docs', 'architecture'), { recursive: true });
  await writeFile(
    join(target, 'docs', 'architecture', 'runtime-persistence.md'),
    '# Runtime persistence\n',
  );
  await writeFile(
    join(target, 'docs', 'architecture', 'runtime-domain-contracts.md'),
    '# Runtime domain contracts\n',
  );

  const manifestPath = join(target, 'docs', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.source.version = '0.3.1';
  manifest.context.push(
    {
      type: 'adr',
      id: 'runtime-persistence',
      path: 'docs/architecture/runtime-persistence.md',
    },
    {
      type: 'reference',
      id: 'runtime-domain-contracts',
      path: 'docs/architecture/runtime-domain-contracts.md',
    },
  );
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const nextCli = await makeNextPackage(nextVersion, async (packageRoot) => {
    const path = join(packageRoot, source);
    const content = await readFile(path, 'utf8');
    await writeFile(path, `${content}\n<!-- next-version-test -->\n`);
  });

  result = run(['update', '--path', target], nextCli);
  assert.equal(result.status, 0, result.stderr);

  const updated = await readConsumerManifest(target);
  assert.equal(updated.source.version, nextVersion);
  assert.deepStrictEqual(
    updated.context
      .filter((entry) => !entry.integrity)
      .map(({ type, id, path }) => ({ type, id, path })),
    [
      {
        type: 'adr',
        id: 'runtime-persistence',
        path: 'docs/architecture/runtime-persistence.md',
      },
      {
        type: 'reference',
        id: 'runtime-domain-contracts',
        path: 'docs/architecture/runtime-domain-contracts.md',
      },
    ],
  );
});
