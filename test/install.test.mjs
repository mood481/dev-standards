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
    manifest.context.map(({ type, id, path }) => ({ type, id, path })),
    [
      {
        type: 'rule',
        id: 'commits',
        path: 'docs/rules/commits.md',
      },
      {
        type: 'rule',
        id: 'development',
        path: 'docs/rules/development.md',
      },
      {
        type: 'rule',
        id: 'quality',
        path: 'docs/rules/quality.md',
      },
      {
        type: 'guide',
        id: 'angular',
        path: 'docs/guides/angular.md',
      },
      {
        type: 'guide',
        id: 'typescript-javascript',
        path: 'docs/guides/typescript-javascript.md',
      },
      {
        type: 'operation',
        id: 'development',
        path: 'docs/operations/development.md',
      },
    ],
  );
  assert.equal(manifest.source.version, packageData.version);
  assert.match(
    manifest.context.find(
      (entry) => entry.path === 'docs/rules/development.md',
    ).integrity,
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
  assert.match(result.stderr, /Manifest consumer-owned context does not match/);
});

test('indexes and checks the supported consumer-owned context types', async () => {
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

  let result = run(['install', 'development', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  const manifestPath = join(target, 'docs', 'manifest.json');

  result = run(['install', 'quality', '--path', target]);
  assert.equal(result.status, 0, result.stderr);
  result = run(['check', '--path', target]);
  assert.equal(result.status, 0, result.stderr);

  const updated = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.deepEqual(
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

test('installs hybrid context declared in catalog.json', async () => {
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
      const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
      catalog.adr['service-boundaries'] = 'adrs/service-boundaries.md';
      await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    },
  );

  let result = run(
    ['install', 'service-boundaries', '--path', target],
    packageCli,
  );
  assert.equal(result.status, 0, result.stderr);
  result = run(['check', '--path', target], packageCli);
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(
    await readFile(join(target, 'docs', 'manifest.json'), 'utf8'),
  );
  const adr = manifest.context.find((entry) => entry.type === 'adr');
  assert.equal(adr.id, 'service-boundaries');
  assert.match(adr.integrity, /^sha256:[a-f0-9]{64}$/);
});

test('rejects context types outside the schema vocabulary', async () => {
  const target = await makeTarget();
  let result = run(['install', 'development', '--path', target]);
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
