import assert from 'node:assert/strict';
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const cli = join(root, 'bin', 'dev-standards.mjs');

function run(args, executable = cli) {
  return spawnSync(process.execPath, [executable, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

async function makeTarget() {
  return mkdtemp(join(tmpdir(), 'dev-standards-consumer-'));
}

async function makeNextPackage(version, mutate) {
  const target = await mkdtemp(join(tmpdir(), 'dev-standards-package-'));
  await cp(root, target, {
    recursive: true,
    filter(source) {
      return !source.includes('/.git') &&
        !source.includes('/node_modules') &&
        !source.includes('/tmp');
    },
  });

  const packagePath = join(target, 'package.json');
  const packageData = JSON.parse(await readFile(packagePath, 'utf8'));
  packageData.version = version;
  await writeFile(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);

  if (mutate) {
    await mutate(target);
  }

  return join(target, 'bin', 'dev-standards.mjs');
}

test('installs, extends and checks a consumer', async () => {
  const target = await makeTarget();
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

  result = run(['check', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ok\t/m);

  result = run(['install', 'commits', 'angular', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(
    await readFile(join(target, 'docs', 'manifest.json'), 'utf8'),
  );
  const packageData = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  );

  assert.deepEqual(
    manifest.rules,
    ['commits', 'development', 'quality'],
  );
  assert.deepEqual(
    manifest.guides,
    ['angular', 'typescript-javascript'],
  );
  assert.deepEqual(
    manifest.operations,
    ['docs/operations/development.md'],
  );
  assert.equal(manifest.source.version, packageData.version);
  assert.match(
    manifest.files['docs/rules/development.md'],
    /^sha256:[a-f0-9]{64}$/,
  );
});

test('check detects local drift and changed operations', async () => {
  const target = await makeTarget();

  let result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  await writeFile(
    join(target, 'docs', 'rules', 'development.md'),
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
  assert.match(result.stderr, /Manifest operations do not match/);
});

test('update replaces unchanged installed files and advances version', async () => {
  const target = await makeTarget();

  let result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const nextCli = await makeNextPackage('0.2.1-alpha.0', async (packageRoot) => {
    const path = join(packageRoot, 'rules', 'development.md');
    const content = await readFile(path, 'utf8');
    await writeFile(path, `${content}\n<!-- next-version-test -->\n`);
  });

  result = run(['update', '--path', target], nextCli);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /update\tdocs\/rules\/development.md/);

  const installed = await readFile(
    join(target, 'docs', 'rules', 'development.md'),
    'utf8',
  );
  assert.match(installed, /next-version-test/);

  const manifest = JSON.parse(
    await readFile(join(target, 'docs', 'manifest.json'), 'utf8'),
  );
  assert.equal(manifest.source.version, '0.2.1-alpha.0');
});

test('update refuses to overwrite locally modified standards', async () => {
  const target = await makeTarget();

  let result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  await writeFile(
    join(target, 'docs', 'rules', 'development.md'),
    '# Local divergent version\n',
  );

  const nextCli = await makeNextPackage('0.2.1-alpha.0', async (packageRoot) => {
    const path = join(packageRoot, 'rules', 'development.md');
    const content = await readFile(path, 'utf8');
    await writeFile(path, `${content}\n<!-- next-version-test -->\n`);
  });

  result = run(['update', '--path', target], nextCli);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to overwrite locally modified file/);

  const installed = await readFile(
    join(target, 'docs', 'rules', 'development.md'),
    'utf8',
  );
  assert.equal(installed, '# Local divergent version\n');
});

test('install requires update before mixing package versions', async () => {
  const target = await makeTarget();

  let result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const nextCli = await makeNextPackage('0.2.1-alpha.0');
  result = run(['install', 'quality', '--path', target], nextCli);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /run dev-standards update/);
});

test('preserves an existing AGENTS.md', async () => {
  const target = await makeTarget();
  await writeFile(join(target, 'AGENTS.md'), '# Existing instructions\n');

  const result = run(['install', 'quality', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(join(target, 'AGENTS.md'), 'utf8'),
    '# Existing instructions\n',
  );
});
