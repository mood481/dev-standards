import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import {
  catalogLookup,
  entryFor,
  escapeRegExp,
  loadCatalog,
  makeNextPackage,
  makeTarget,
  readConsumerManifest,
  run,
} from './helpers.mjs';

test('update replaces unchanged installed files and advances version', async () => {
  const catalog = await loadCatalog();
  const managedId = [...catalogLookup(catalog).keys()][0];
  const { source, installPath } = entryFor(catalog, managedId);

  const target = await makeTarget();

  let result = run(['install', managedId, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const nextCli = await makeNextPackage('0.2.1-alpha.0', async (packageRoot) => {
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
  assert.equal(manifest.source.version, '0.2.1-alpha.0');
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

  const nextCli = await makeNextPackage('0.2.1-alpha.0', async (packageRoot) => {
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
