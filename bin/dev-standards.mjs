#!/usr/bin/env node

import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));

const catalog = new Map([
  ['development', { kind: 'rules', source: 'rules/development.md' }],
  ['quality', { kind: 'rules', source: 'rules/quality.md' }],
  ['commits', { kind: 'rules', source: 'rules/commits.md' }],
  ['pull-requests', { kind: 'rules', source: 'rules/pull-requests.md' }],
  ['triar', { kind: 'rules', source: 'rules/triar.md' }],
  ['typescript-javascript', { kind: 'guides', source: 'guides/typescript-javascript.md' }],
  ['angular', { kind: 'guides', source: 'guides/angular.md' }],
  ['pocketbase', { kind: 'guides', source: 'guides/pocketbase.md' }],
  ['go', { kind: 'guides', source: 'guides/go.md' }],
  ['nx-pnpm', { kind: 'guides', source: 'guides/nx-pnpm.md' }],
]);

const exitCode = await main(process.argv.slice(2));
process.exitCode = exitCode;

async function main(args) {
  const command = args[0];
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return command ? 0 : 1;
  }

  if (command === 'list') {
    printCatalog();
    return 0;
  }

  if (command === 'install') {
    try {
      const options = parseInstall(args.slice(1));
      await install(options);
      return 0;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  return 1;
}

function printHelp() {
  console.log(`Usage:
  dev-standards list
  dev-standards install <id> [<id> ...] [--path <repository>]

The bootstrap installer copies selected standards into docs/rules and
docs/guides, writes docs/manifest.json, discovers docs/operations/*.md,
and creates AGENTS.md only when it does not already exist.`);
}

function printCatalog() {
  for (const [id, item] of catalog) {
    console.log(`${item.kind.slice(0, -1)}\t${id}`);
  }
}

function parseInstall(args) {
  let path = '.';
  const ids = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--path') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --path');
      }
      path = value;
      index += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      ids.push(arg);
    }
  }

  if (ids.length === 0) {
    throw new Error('install requires at least one standard id');
  }

  const unknown = ids.filter((id) => !catalog.has(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown standard id(s): ${unknown.join(', ')}`);
  }

  return { repository: resolve(path), ids: [...new Set(ids)] };
}

async function install({ repository, ids }) {
  await mkdir(repository, { recursive: true });

  const existingManifest = await readManifest(repository);
  const selected = mergeSelection(existingManifest, ids);

  for (const id of selected.rules) {
    await installStandard(repository, id, catalog.get(id));
  }
  for (const id of selected.guides) {
    await installStandard(repository, id, catalog.get(id));
  }

  const operations = await discoverOperations(repository);
  const manifest = {
    schemaVersion: 1,
    source: {
      repository: 'mood481/dev-standards',
      version: packageJson.version,
    },
    rules: selected.rules,
    guides: selected.guides,
    operations,
  };

  await writeJsonIfSafe(join(repository, 'docs', 'manifest.json'), manifest, {
    allowManifestUpdate: true,
  });

  const agentsSource = await readFile(join(packageRoot, 'templates', 'AGENTS.md'), 'utf8');
  const agentsPath = join(repository, 'AGENTS.md');
  if (!(await exists(agentsPath))) {
    await writeText(agentsPath, agentsSource);
  } else {
    console.log('preserve\tAGENTS.md');
  }

  console.log(`installed\t${repository}`);
}

function mergeSelection(manifest, ids) {
  const rules = new Set(manifest?.rules ?? []);
  const guides = new Set(manifest?.guides ?? []);
  for (const id of ids) {
    const item = catalog.get(id);
    if (item.kind === 'rules') {
      rules.add(id);
    } else {
      guides.add(id);
    }
  }
  return {
    rules: [...rules].sort(),
    guides: [...guides].sort(),
  };
}

async function installStandard(repository, id, item) {
  const source = await readFile(join(packageRoot, item.source), 'utf8');
  const destination = join(repository, 'docs', item.kind, `${id}.md`);
  await writeTextIfIdenticalOrMissing(destination, source);
}

async function readManifest(repository) {
  const path = join(repository, 'docs', 'manifest.json');
  if (!(await exists(path))) {
    return undefined;
  }

  let value;
  try {
    value = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse existing docs/manifest.json: ${error.message}`);
  }

  if (
    value?.schemaVersion !== 1 ||
    !Array.isArray(value.rules) ||
    !Array.isArray(value.guides)
  ) {
    throw new Error('Existing docs/manifest.json is not a supported schemaVersion 1 manifest');
  }

  for (const id of [...value.rules, ...value.guides]) {
    if (!catalog.has(id)) {
      throw new Error(`Existing manifest references unknown standard id: ${id}`);
    }
  }

  return value;
}

async function discoverOperations(repository) {
  const directory = join(repository, 'docs', 'operations');
  if (!(await exists(directory))) {
    return [];
  }

  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `docs/operations/${entry.name}`)
    .sort();
}

async function writeTextIfIdenticalOrMissing(path, content) {
  if (await exists(path)) {
    const current = await readFile(path, 'utf8');
    if (current !== content) {
      throw new Error(`Refusing to overwrite divergent file: ${relativeDisplay(path)}`);
    }
    console.log(`unchanged\t${relativeDisplay(path)}`);
    return;
  }
  await writeText(path, content);
  console.log(`create\t${relativeDisplay(path)}`);
}

async function writeJsonIfSafe(path, value) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  await writeText(path, content);
  console.log(`write\t${relativeDisplay(path)}`);
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function relativeDisplay(path) {
  return path.replace(process.cwd() + '/', '');
}
