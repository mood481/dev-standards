import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const root = resolve(import.meta.dirname, '..');
export const cli = join(root, 'bin', 'dev-standards.mjs');

export function run(args, executable = cli) {
  return spawnSync(process.execPath, [executable, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

export async function makeTarget() {
  return mkdtemp(join(tmpdir(), 'dev-standards-consumer-'));
}

export async function makeNextPackage(version, mutate) {
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

// Catalog-driven helpers: tests resolve every managed id and install path
// from catalog.json instead of hardcoding them, so renaming an id or moving
// a source file only requires updating the catalog (plus docs), not tests.

export async function loadCatalog() {
  return JSON.parse(await readFile(join(root, 'catalog.json'), 'utf8'));
}

export function catalogLookup(catalog) {
  const byId = new Map();
  for (const [type, entries] of Object.entries(catalog)) {
    for (const [id, source] of Object.entries(entries)) {
      byId.set(id, { type, source, installPath: `docs/${source}` });
    }
  }
  return byId;
}

export function entryFor(catalog, id) {
  const entry = catalogLookup(catalog).get(id);
  if (!entry) {
    throw new Error(`Test catalog is missing id: ${id}`);
  }
  return entry;
}

export function installPathFor(catalog, id) {
  return entryFor(catalog, id).installPath;
}

export function sourceFor(catalog, id) {
  return entryFor(catalog, id).source;
}

export function typeFor(catalog, id) {
  return entryFor(catalog, id).type;
}

export function idsOfType(catalog, type) {
  return Object.keys(catalog[type] ?? {});
}

export function managedIds(catalog) {
  return [...catalogLookup(catalog).keys()];
}

const typeOrder = new Map([
  ['rule', 0],
  ['guide', 1],
  ['operation', 2],
  ['adr', 3],
  ['runbook', 4],
  ['reference', 5],
]);

export function compareContextEntries(left, right) {
  const leftOrder = typeOrder.get(left.type) ?? 3;
  const rightOrder = typeOrder.get(right.type) ?? 3;
  return leftOrder - rightOrder ||
    left.type.localeCompare(right.type) ||
    left.id.localeCompare(right.id);
}

export function toManifestEntries(catalog, ids) {
  return ids
    .map((id) => {
      const entry = entryFor(catalog, id);
      return { type: entry.type, id, path: entry.installPath };
    })
    .sort(compareContextEntries);
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function readConsumerManifest(target) {
  return JSON.parse(
    await readFile(join(target, 'docs', 'manifest.json'), 'utf8'),
  );
}

export async function readPackageVersion() {
  return JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
}
