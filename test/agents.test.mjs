import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  catalogLookup,
  loadCatalog,
  makeNextPackage,
  makeTarget,
  readConsumerManifest,
  root,
  run,
} from './helpers.mjs';

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readTemplate() {
  return readFile(join(root, 'templates', 'AGENTS.md'), 'utf8');
}

test('install without --agents does not create AGENTS.md', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  const result = run(['install', id, '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await exists(join(target, 'AGENTS.md')), false);
  assert.doesNotMatch(result.stdout, /AGENTS\.md/);

  const manifest = await readConsumerManifest(target);
  assert.ok(
    manifest.context.every((entry) => entry.path !== 'AGENTS.md'),
    'AGENTS.md must stay outside docs/manifest.json',
  );
});

test('install with --agents creates the packaged template when absent', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  const result = run(['install', id, '--path', target, '--agents']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /create\tAGENTS\.md/);
  assert.equal(await readFile(join(target, 'AGENTS.md'), 'utf8'), await readTemplate());

  const manifest = await readConsumerManifest(target);
  assert.ok(
    manifest.context.every((entry) => entry.path !== 'AGENTS.md'),
    'AGENTS.md must stay outside docs/manifest.json',
  );
});

test('install with --agents preserves an existing AGENTS.md', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  await writeFile(join(target, 'AGENTS.md'), '# Existing instructions\n');

  const result = run(['install', id, '--path', target, '--agents']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /preserve\tAGENTS\.md/);
  assert.equal(
    await readFile(join(target, 'AGENTS.md'), 'utf8'),
    '# Existing instructions\n',
  );
});

test('install without --agents preserves an existing AGENTS.md', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  await writeFile(join(target, 'AGENTS.md'), '# Existing instructions\n');

  const result = run(['install', id, '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(target, 'AGENTS.md'), 'utf8'),
    '# Existing instructions\n',
  );
});

test('check with no AGENTS.md succeeds without warning', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  let result = run(['install', id, '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await exists(join(target, 'AGENTS.md')), false);

  result = run(['check', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ok\t/m);
  assert.doesNotMatch(result.stdout, /AGENTS\.md/);
  assert.doesNotMatch(result.stderr, /AGENTS\.md/);
});

test('update with no AGENTS.md never creates it', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  let result = run(['install', id, '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await exists(join(target, 'AGENTS.md')), false);

  result = run(['update', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await exists(join(target, 'AGENTS.md')), false);
  assert.doesNotMatch(result.stdout, /AGENTS\.md/);
});

test('update preserves an existing AGENTS.md', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];

  const target = await makeTarget();
  let result = run(['install', id, '--path', target, '--agents']);
  assert.equal(result.status, 0, result.stderr);

  const custom = '# Custom instructions, not the template\n';
  await writeFile(join(target, 'AGENTS.md'), custom);

  result = run(['update', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(join(target, 'AGENTS.md'), 'utf8'), custom);
  assert.doesNotMatch(result.stdout, /AGENTS\.md/);

  const manifest = await readConsumerManifest(target);
  assert.ok(
    manifest.context.every((entry) => entry.path !== 'AGENTS.md'),
    'AGENTS.md must stay outside docs/manifest.json',
  );
});

test('update across versions preserves an existing AGENTS.md', async () => {
  const catalog = await loadCatalog();
  const entries = [...catalogLookup(catalog).entries()];
  assert.ok(entries.length >= 1, 'catalog needs at least one managed id');
  const [id, item] = entries[0];

  const target = await makeTarget();
  let result = run(['install', id, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const custom = '# Repository-owned instructions\n';
  await writeFile(join(target, 'AGENTS.md'), custom);

  const nextCli = await makeNextPackage('0.3.2-alpha.0', async (packageRoot) => {
    const path = join(packageRoot, item.source);
    const content = await readFile(path, 'utf8');
    await writeFile(path, `${content}\n<!-- next-version-test -->\n`);
  });

  result = run(['update', '--path', target], nextCli);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(join(target, 'AGENTS.md'), 'utf8'), custom);
});

test('rejects unsupported --agents combinations', async () => {
  const catalog = await loadCatalog();
  const id = [...catalogLookup(catalog).keys()][0];
  const target = await makeTarget();

  let result = run(['install', id, '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  result = run(['check', '--path', target, '--agents']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option: --agents/);

  result = run(['update', '--path', target, '--agents']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option: --agents/);

  result = run(['install', id, '--path', target, '--agents=true']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option/);

  result = run(['install', '--agents', '--path', target]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires at least one standard id/);
});
