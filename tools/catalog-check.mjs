import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Verify catalog.json stays in sync with the shipped documentation sources:
// every catalog entry must point at an existing file with a valid id and
// path, and every rules/*.md and guides/*.md file must be registered in the
// catalog (no orphan documents). Content hashes need no maintenance: install,
// check and update compute integrity from file contents at runtime.
//
// Usage: node tools/catalog-check.mjs

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Source directory per catalogued context type. Orphan scanning below only
// applies to rule/guide: adr/runbook/reference also accept consumer-owned
// files that live in consumers, not in this repository.
const sourceDirs = new Map([
  ['rule', 'rules'],
  ['guide', 'guides'],
  ['adr', 'adrs'],
  ['runbook', 'runbooks'],
  ['reference', 'references'],
]);
const managedDirs = new Set(['rules', 'guides']);

const catalogData = JSON.parse(
  await readFile(join(root, 'catalog.json'), 'utf8'),
);
const errors = [];
const registered = new Set();

for (const [type, entries] of Object.entries(catalogData)) {
  const directory = sourceDirs.get(type);
  if (
    !directory || !entries || typeof entries !== 'object' ||
    Array.isArray(entries)
  ) {
    errors.push(`catalog.json contains an invalid context type: ${type}`);
    continue;
  }
  for (const [id, source] of Object.entries(entries)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      errors.push(`catalog.json contains an invalid ${type} id: ${id}`);
    }
    if (
      typeof source !== 'string' || !source.startsWith(`${directory}/`) ||
      !source.endsWith('.md')
    ) {
      errors.push(`catalog.json contains an invalid ${type} source: ${id}`);
      continue;
    }
    if (registered.has(source)) {
      errors.push(`catalog.json contains a duplicate source: ${source}`);
    }
    registered.add(source);
    try {
      await readFile(join(root, source), 'utf8');
    } catch {
      errors.push(`catalog.json points at a missing file: ${source}`);
    }
  }
}

for (const directory of managedDirs) {
  let files = [];
  try {
    files = await readdir(join(root, directory));
  } catch {
    continue;
  }
  for (const file of files.filter((name) => name.endsWith('.md'))) {
    if (!registered.has(`${directory}/${file}`)) {
      errors.push(`unregistered document is not installable: ${directory}/${file}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`catalog ok: ${registered.size} documents registered`);
