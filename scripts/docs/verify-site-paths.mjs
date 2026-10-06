#!/usr/bin/env node
// Verify the /dev-standards/ site path contract against a built artifact.
// No network access.
//
// Usage: node scripts/docs/verify-site-paths.mjs [--dir <built-dir>]

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE_URL = 'https://tools.mood481.es/dev-standards/';
const BASE_PATH = '/dev-standards/';

const dir = parseDir(process.argv.slice(2));
const absDir = dir.startsWith('/') ? dir : join(repoRoot, dir);
const packageJson = JSON.parse(
  await readFile(join(repoRoot, 'package.json'), 'utf8'),
);
const version = packageJson.version;

let failed = false;
const ok = (message) => console.log(`ok: ${message}`);
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  failed = true;
};

const entry = await readFile(join(absDir, 'index.html'), 'utf8').catch(() => {
  console.error(`error: missing ${dir}/index.html; build first`);
  process.exit(1);
});
void entry;

for (const page of [
  'index.html',
  'getting-started/index.html',
  'cli-reference/index.html',
  'standards/index.html',
  'standards/manifest/index.html',
  'standards/rules/devel/index.html',
  'standards/guides/ts-js/index.html',
  'css/site.css',
  'sitemap.xml',
]) {
  try {
    await stat(join(absDir, page));
    ok(`exists ${page}`);
  } catch {
    fail(`missing ${page}`);
  }
}

const files = await listHtmlFiles(absDir);
const haystack = (
  await Promise.all(files.map((file) => readFile(file, 'utf8')))
).join('\n');

if (haystack.includes(BASE_URL)) {
  ok(`base URL ${BASE_URL} present`);
} else {
  fail(`base URL ${BASE_URL} not found in artifact`);
}

if (/triar\.mood481\.es/.test(haystack)) {
  fail('artifact references former triar.mood481.es address');
} else {
  ok('no triar.mood481.es references');
}

const hostRootLinks = haystack.match(/(href|src)="\/[^"]*"/g) ?? [];
const violations = hostRootLinks.filter(
  (link) => !link.startsWith('href="/dev-standards/') && !link.startsWith('src="/dev-standards/'),
);
if (violations.length > 0) {
  fail('host-root site-owned links found (must resolve under /dev-standards/):');
  for (const link of [...new Set(violations)]) console.error(`  ${link}`);
} else {
  ok('no host-root site-owned links');
}

for (const page of [
  join(absDir, 'index.html'),
  join(absDir, 'standards/rules/devel/index.html'),
]) {
  const content = await readFile(page, 'utf8');
  for (const want of [
    '/dev-standards/',
    '/dev-standards/getting-started/',
    '/dev-standards/cli-reference/',
    '/dev-standards/standards/',
  ]) {
    if (content.includes(want)) ok(`${short(page)} nav contains ${want}`);
    else fail(`${page} missing navigation link ${want}`);
  }
  const footer = `current version: ${version}`;
  if (content.includes(footer)) ok(`${short(page)} footer contains ${footer}`);
  else fail(`${page} missing footer "${footer}"`);
  if (/Generated from the maintained/i.test(content)) {
    fail(`${page} contains a generation notice (not wanted here)`);
  } else {
    ok(`${short(page)} has no generation notice`);
  }
}

if (/xmit/i.test(haystack)) {
  fail('artifact references xmit');
} else {
  ok('no xmit references');
}

if (failed) {
  console.error('site path contract FAILED');
  process.exit(1);
}
console.log(`site path contract passed for ${dir} (version ${version})`);

function parseDir(args) {
  let value = 'dist/docs-site';
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dir') {
      value = args[index + 1] ?? '';
      index += 1;
    } else if (arg.startsWith('--dir=')) {
      value = arg.slice('--dir='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return value;
}

async function listHtmlFiles(root) {
  const result = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await listHtmlFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}

function short(path) {
  return path.replace(`${absDir}/`, '');
}
