#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(
  await readFile(join(packageRoot, 'package.json'), 'utf8'),
);
const contextTypes = new Map([
  ['rule', { directory: 'rules', ownership: 'managed' }],
  ['guide', { directory: 'guides', ownership: 'managed' }],
  ['operation', { directory: 'operations', ownership: 'consumer' }],
  ['adr', { directory: 'adrs', ownership: 'hybrid' }],
  ['runbook', { directory: 'runbooks', ownership: 'hybrid' }],
  ['reference', { directory: 'references', ownership: 'hybrid' }],
]);
const catalogData = JSON.parse(
  await readFile(join(packageRoot, 'catalog.json'), 'utf8'),
);
const catalog = buildCatalog(catalogData);

const exitCode = await main(process.argv.slice(2));
process.exitCode = exitCode;

async function main(args) {
  if (args[0] === '--version' || args[0] === '-v') {
    console.log(packageJson.version);
    return 0;
  }

  const command = args[0];
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return command ? 0 : 1;
  }

  try {
    if (command === 'list') {
      printCatalog();
      return 0;
    }

    if (command === 'install') {
      await install(parseInstallCommand(args.slice(1)));
      return 0;
    }

    if (command === 'check') {
      await check(parseRepositoryCommand(args.slice(1), 'check'));
      return 0;
    }

    if (command === 'update') {
      await update(parseRepositoryCommand(args.slice(1), 'update'));
      return 0;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  return 1;
}

function printHelp() {
  console.log(`Usage:
  dev-standards list
  dev-standards install <id> [<id> ...] [--path <repository>] [--agents]
  dev-standards check [--path <repository>]
  dev-standards update [--path <repository>]
  dev-standards --version

install adds selected standards for the current package version.
install writes AGENTS.md from the packaged template only with --agents
and only when it does not exist; an existing AGENTS.md is never overwritten.
check validates the installed manifest and detects local drift.
update upgrades every installed standard to the running package version
when the installed files still match their recorded hashes.`);
}

function printCatalog() {
  for (const [id, item] of catalog) {
    console.log(`${item.type}\t${id}`);
  }
}

function parseInstallCommand(args) {
  const parsed = parsePath(args, { booleanFlags: ['--agents'] });
  if (parsed.positionals.length === 0) {
    throw new Error('install requires at least one standard id');
  }

  const unknown = parsed.positionals.filter((id) => !catalog.has(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown standard id(s): ${unknown.join(', ')}`);
  }

  return {
    repository: parsed.repository,
    ids: [...new Set(parsed.positionals)],
    agents: parsed.flags.has('--agents'),
  };
}

function parseRepositoryCommand(args, command) {
  const parsed = parsePath(args);
  if (parsed.positionals.length > 0) {
    throw new Error(
      `${command} does not accept standard ids; it operates on docs/manifest.json`,
    );
  }
  return { repository: parsed.repository };
}

function parsePath(args, options = {}) {
  const booleanFlags = new Set(options.booleanFlags ?? []);
  let path = '.';
  const positionals = [];
  const flags = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--path') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --path');
      }
      path = value;
      index += 1;
      continue;
    }

    if (booleanFlags.has(arg)) {
      flags.add(arg);
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positionals.push(arg);
  }

  return {
    repository: resolve(path),
    positionals,
    flags,
  };
}

async function install({ repository, ids, agents }) {
  await mkdir(repository, { recursive: true });

  const existingManifest = await readManifest(repository, { required: false });
  if (
    existingManifest &&
    existingManifest.source.version !== packageJson.version
  ) {
    throw new Error(
      `Installed standards are ${existingManifest.source.version}; run dev-standards update with ${packageJson.version} before adding standards from this version.`,
    );
  }

  const selected = mergeSelection(existingManifest, ids);
  const plan = await planSelectedStandards(repository, selected, {
    mode: 'install',
    manifest: existingManifest,
  });

  for (const item of plan) {
    if (item.action === 'create') {
      await writeText(item.absolutePath, item.content);
      console.log(`create\t${item.relativePath}`);
    } else {
      console.log(`unchanged\t${item.relativePath}`);
    }
  }

  await writeConsumerManifest(repository, plan);
  if (agents) {
    await ensureAgents(repository);
  }
  console.log(`installed\t${repository}`);
}

async function check({ repository }) {
  const manifest = await readManifest(repository, { required: true });
  const issues = [];
  const selected = selectionFromManifest(manifest);
  const expectedPaths = selectedPaths(selected);

  const managedContexts = manifest.context.filter((entry) => entry.integrity);
  const manifestPaths = managedContexts.map((entry) => entry.path).sort();
  if (!sameArray(expectedPaths, manifestPaths)) {
    issues.push(
      'Manifest context does not match the selected managed documents.',
    );
  }

  for (const relativePath of expectedPaths) {
    const absolutePath = join(repository, relativePath);
    const expectedHash = managedContexts.find(
      (entry) => entry.path === relativePath,
    )?.integrity;

    if (!(await exists(absolutePath))) {
      issues.push(`Missing installed standard: ${relativePath}`);
      continue;
    }

    const content = await readFile(absolutePath, 'utf8');
    const actualHash = sha256(content);
    if (actualHash !== expectedHash) {
      issues.push(`Local drift detected: ${relativePath}`);
    }
  }

  const consumerContext = await discoverConsumerContext(
    repository,
    manifestPaths,
  );
  const indexedConsumerPaths = manifest.context
    .filter((entry) => !entry.integrity)
    .map((entry) => entry.path)
    .sort();
  if (!sameArray(
    consumerContext.map((entry) => entry.path).sort(),
    indexedConsumerPaths,
  )) {
    issues.push(
      'Manifest consumer-owned context does not match its docs directories.',
    );
  }

  if (issues.length > 0) {
    throw new Error(issues.join('\n'));
  }

  console.log(
    `ok\t${manifest.source.version}\t${countSelected(selected, 'rule')} rules\t${countSelected(selected, 'guide')} guides`,
  );
}

async function update({ repository }) {
  const manifest = await readManifest(repository, { required: true });
  const comparison = compareSemver(packageJson.version, manifest.source.version);

  if (comparison < 0) {
    throw new Error(
      `Refusing to downgrade standards from ${manifest.source.version} to ${packageJson.version}.`,
    );
  }

  const selected = selectionFromManifest(manifest);
  const expectedPaths = selectedPaths(selected);
  const manifestPaths = manifest.context
    .filter((entry) => entry.integrity)
    .map((entry) => entry.path)
    .sort();

  if (!sameArray(expectedPaths, manifestPaths)) {
    throw new Error(
      'Manifest context does not match the selected managed documents; run check and repair the manifest before updating.',
    );
  }

  const plan = await planSelectedStandards(repository, selected, {
    mode: 'update',
    manifest,
  });

  for (const item of plan) {
    if (item.action === 'update') {
      await writeText(item.absolutePath, item.content);
      console.log(`update\t${item.relativePath}`);
    } else {
      console.log(`unchanged\t${item.relativePath}`);
    }
  }

  await writeConsumerManifest(repository, plan);

  if (comparison === 0) {
    console.log(`current\t${packageJson.version}`);
  } else {
    console.log(
      `updated\t${manifest.source.version}\t->\t${packageJson.version}`,
    );
  }
}

function mergeSelection(manifest, ids) {
  const selected = new Set(manifest ? selectionFromManifest(manifest) : []);
  ids.forEach((id) => selected.add(id));
  return [...selected].sort();
}

async function planSelectedStandards(repository, selected, options) {
  const plan = [];

  for (const id of selected) {
    const item = catalog.get(id);
    if (!item) {
      throw new Error(`Manifest references unknown standard id: ${id}`);
    }

    const content = await readFile(join(packageRoot, item.source), 'utf8');
    const relativePath = item.path;
    const absolutePath = join(repository, relativePath);
    const nextHash = sha256(content);

    if (!(await exists(absolutePath))) {
      if (options.mode === 'update') {
        throw new Error(
          `Cannot update because an installed standard is missing: ${relativePath}`,
        );
      }

      plan.push({
        id,
        relativePath,
        absolutePath,
        content,
        hash: nextHash,
        action: 'create',
      });
      continue;
    }

    const current = await readFile(absolutePath, 'utf8');
    const currentHash = sha256(current);

    if (options.mode === 'install') {
      if (currentHash !== nextHash) {
        throw new Error(
          `Refusing to overwrite divergent file: ${relativePath}`,
        );
      }

      plan.push({
        id,
        relativePath,
        absolutePath,
        content,
        hash: nextHash,
        action: 'unchanged',
      });
      continue;
    }

    const installedHash = options.manifest.context.find(
      (entry) => entry.path === relativePath,
    )?.integrity;
    if (!installedHash) {
      throw new Error(
        `Manifest does not record an installed hash for ${relativePath}`,
      );
    }

    if (currentHash !== installedHash) {
      throw new Error(
        `Refusing to overwrite locally modified file: ${relativePath}`,
      );
    }

    plan.push({
      id,
      relativePath,
      absolutePath,
      content,
      hash: nextHash,
      action: currentHash === nextHash ? 'unchanged' : 'update',
    });
  }

  return plan.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function writeConsumerManifest(
  repository,
  plan,
) {
  const managedContext = plan.map((item) => ({
    type: catalog.get(item.id).type,
    id: item.id,
    path: item.relativePath,
    integrity: item.hash,
  }));
  const consumerContext = await discoverConsumerContext(
    repository,
    managedContext.map((entry) => entry.path),
  );
  const context = [
    ...managedContext,
    ...consumerContext,
  ].sort(compareContextEntries);

  const manifest = {
    schemaVersion: 1,
    source: {
      repository: 'mood481/dev-standards',
      version: packageJson.version,
    },
    context,
  };

  await writeJson(join(repository, 'docs', 'manifest.json'), manifest);
  console.log('write\tdocs/manifest.json');
}

async function readManifest(repository, { required }) {
  const path = join(repository, 'docs', 'manifest.json');
  if (!(await exists(path))) {
    if (required) {
      throw new Error(
        'docs/manifest.json was not found; install standards before using this command.',
      );
    }
    return undefined;
  }

  let value;
  try {
    value = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `Cannot parse existing docs/manifest.json: ${error.message}`,
    );
  }

  if (
    value?.schemaVersion !== 1 ||
    value?.source?.repository !== 'mood481/dev-standards' ||
    typeof value?.source?.version !== 'string' ||
    !Array.isArray(value.context)
  ) {
    throw new Error(
      'Existing docs/manifest.json is not a supported dev-standards schemaVersion 1 manifest.',
    );
  }

  parseSemver(value.source.version);

  const contextKeys = new Set();
  const contextPaths = new Set();
  for (const entry of value.context) {
    if (!isContextEntry(entry)) {
      throw new Error(
        'Existing docs/manifest.json contains an invalid context entry.',
      );
    }

    const key = `${entry.type}\0${entry.id}`;
    if (contextKeys.has(key) || contextPaths.has(entry.path)) {
      throw new Error(
        `Existing manifest contains duplicate context: ${entry.type}/${entry.id}`,
      );
    }
    contextKeys.add(key);
    contextPaths.add(entry.path);

    const item = catalog.get(entry.id);
    const ownership = contextTypes.get(entry.type).ownership;
    const directory = contextTypes.get(entry.type).directory;
    if (ownership === 'consumer' && entry.integrity) {
      throw new Error(
        `Consumer-owned context cannot declare integrity: ${entry.type}/${entry.id}`,
      );
    }

    if (ownership === 'managed' || entry.integrity) {
      if (
        item?.type !== entry.type ||
        entry.path !== item?.path ||
        !entry.integrity
      ) {
        throw new Error(
          `Existing manifest references an invalid managed ${entry.type}: ${entry.id}`,
        );
      }
    } else {
      // Consumer-owned entries (operations and hybrid types without
      // integrity) are discovered from filenames, so id and path stay
      // coupled here. Managed entries are validated against the catalog
      // above and may decouple id from filename.
      if (entry.path !== `docs/${directory}/${entry.id}.md`) {
        throw new Error(
          `Existing manifest references an invalid consumer-owned ${entry.type}: ${entry.id}`,
        );
      }
    }
  }

  return value;
}

async function discoverConsumerContext(repository, excludedPaths = []) {
  const excluded = new Set(excludedPaths);
  const context = [];

  for (const [type, config] of contextTypes) {
    if (config.ownership === 'managed') {
      continue;
    }

    const directory = join(repository, 'docs', config.directory);
    if (!(await exists(directory))) {
      continue;
    }

    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      const value = {
        type,
        id: entry.name.slice(0, -3),
        path: `docs/${config.directory}/${entry.name}`,
      };
      if (!isContextEntry(value)) {
        throw new Error(
          `Context filename cannot be represented in the manifest: ${value.path}`,
        );
      }
      if (!excluded.has(value.path)) {
        context.push(value);
      }
    }
  }

  return context.sort(compareContextEntries);
}

async function ensureAgents(repository) {
  const agentsPath = join(repository, 'AGENTS.md');
  if (await exists(agentsPath)) {
    console.log('preserve\tAGENTS.md');
    return;
  }

  const source = await readFile(
    join(packageRoot, 'templates', 'AGENTS.md'),
    'utf8',
  );
  await writeText(agentsPath, source);
  console.log('create\tAGENTS.md');
}

function selectedPaths(selected) {
  return selected.map((id) => catalog.get(id).path).sort();
}

function selectionFromManifest(manifest) {
  return manifest.context
    .filter((entry) => entry.integrity)
    .map((entry) => entry.id)
    .sort();
}

function buildCatalog(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('catalog.json must contain an object keyed by context type.');
  }

  const result = new Map();
  for (const [type, entries] of Object.entries(value)) {
    const config = contextTypes.get(type);
    if (
      !config ||
      config.ownership === 'consumer' ||
      !entries ||
      typeof entries !== 'object' ||
      Array.isArray(entries)
    ) {
      throw new Error(`catalog.json contains an invalid context type: ${type}`);
    }

    for (const [id, source] of Object.entries(entries)) {
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
        typeof source !== 'string' ||
        !source.startsWith(`${config.directory}/`) ||
        !source.endsWith('.md') ||
        source.includes('\\') ||
        source.split('/').some((part) => part === '.' || part === '..')
      ) {
        throw new Error(`catalog.json contains an invalid ${type}: ${id}`);
      }
      if (result.has(id)) {
        throw new Error(`catalog.json contains a duplicate id: ${id}`);
      }
      const installPath = `docs/${source}`;
      for (const existing of result.values()) {
        if (existing.path === installPath) {
          throw new Error(`catalog.json contains a duplicate path: ${installPath}`);
        }
      }

      // IDs are decoupled from filenames (e.g. `devel` lives in
      // `rules/development.md`). The install destination always follows the
      // catalog source, never the id.
      result.set(id, {
        type,
        source,
        path: installPath,
      });
    }
  }

  return result;
}

function isContextEntry(entry) {
  if (
    !entry ||
    typeof entry !== 'object' ||
    Array.isArray(entry) ||
    typeof entry.type !== 'string' ||
    !contextTypes.has(entry.type) ||
    typeof entry.id !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) ||
    typeof entry.path !== 'string' ||
    (
      entry.integrity !== undefined &&
      !/^sha256:[a-f0-9]{64}$/.test(entry.integrity)
    ) ||
    Object.keys(entry).some(
      (key) => !['type', 'id', 'path', 'integrity'].includes(key),
    )
  ) {
    return false;
  }

  // Syntactic check only: the path must live under the type directory.
  // Semantic coupling (id === filename) applies solely to consumer-owned
  // entries and is enforced in readManifest; managed entries may decouple
  // id from filename via catalog.json.
  const directory = contextTypes.get(entry.type).directory;
  const prefix = `docs/${directory}/`;
  if (!entry.path.startsWith(prefix) || !entry.path.endsWith('.md')) {
    return false;
  }
  const rest = entry.path.slice(prefix.length);
  return Boolean(rest) &&
    !rest.includes('\\') &&
    !rest.split('/').some((part) => !part || part === '.' || part === '..');
}

function compareContextEntries(left, right) {
  const typeOrder = new Map([
    ['rule', 0],
    ['guide', 1],
    ['operation', 2],
    ['adr', 3],
    ['runbook', 4],
    ['reference', 5],
  ]);
  const leftOrder = typeOrder.get(left.type) ?? 3;
  const rightOrder = typeOrder.get(right.type) ?? 3;
  return leftOrder - rightOrder ||
    left.type.localeCompare(right.type) ||
    left.id.localeCompare(right.id);
}

function countSelected(selected, type) {
  return selected.filter((id) => catalog.get(id).type === type).length;
}

function sameArray(left, right) {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function parseSemver(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match) {
    throw new Error(`Invalid SemVer version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  };
}

function compareSemver(leftVersion, rightVersion) {
  const left = parseSemver(leftVersion);
  const right = parseSemver(rightVersion);

  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) {
      return left[key] > right[key] ? 1 : -1;
    }
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) {
    return 0;
  }
  if (left.prerelease.length === 0) {
    return 1;
  }
  if (right.prerelease.length === 0) {
    return -1;
  }

  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const a = left.prerelease[index];
    const b = right.prerelease[index];

    if (a === undefined) {
      return -1;
    }
    if (b === undefined) {
      return 1;
    }
    if (a === b) {
      continue;
    }

    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);

    if (aNumeric && bNumeric) {
      return Number(a) > Number(b) ? 1 : -1;
    }
    if (aNumeric !== bNumeric) {
      return aNumeric ? -1 : 1;
    }

    return a > b ? 1 : -1;
  }

  return 0;
}

async function writeJson(path, value) {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
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

function sha256(content) {
  return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`;
}
