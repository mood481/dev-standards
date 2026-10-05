import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const cli = join(root, 'bin', 'dev-standards.mjs');

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('installs, merges and preserves a consumer', async () => {
  const target = await mkdtemp(join(tmpdir(), 'dev-standards-'));
  await mkdir(join(target, 'docs', 'operations'), { recursive: true });
  await writeFile(
    join(target, 'docs', 'operations', 'development.md'),
    '# Local development\n',
  );

  let result = run([
    'install',
    'development',
    'quality',
    'typescript-javascript',
    '--path',
    target,
  ]);
  assert.equal(result.status, 0, result.stderr);

  const manifestPath = join(target, 'docs', 'manifest.json');
  let manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepEqual(manifest.rules, ['development', 'quality']);
  assert.deepEqual(manifest.guides, ['typescript-javascript']);
  assert.deepEqual(manifest.operations, ['docs/operations/development.md']);
  assert.equal(manifest.source.version, '0.1.0');

  result = run(['install', 'commits', 'angular', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepEqual(manifest.rules, ['commits', 'development', 'quality']);
  assert.deepEqual(manifest.guides, ['angular', 'typescript-javascript']);

  result = run(['install', 'commits', 'angular', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
});

test('refuses to overwrite a divergent installed standard', async () => {
  const target = await mkdtemp(join(tmpdir(), 'dev-standards-'));

  let result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const installed = join(target, 'docs', 'rules', 'development.md');
  await writeFile(installed, '# Local divergent version\n');

  result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to overwrite divergent file/);
});

test('preserves an existing AGENTS.md', async () => {
  const target = await mkdtemp(join(tmpdir(), 'dev-standards-'));
  await writeFile(join(target, 'AGENTS.md'), '# Existing instructions\n');

  const result = run(['install', 'quality', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(target, 'AGENTS.md'), 'utf8'),
    '# Existing instructions\n',
  );
});
