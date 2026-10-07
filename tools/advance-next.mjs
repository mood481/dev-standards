import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep the `next` dist-tag from lagging behind stable releases: advance it
// to the given version only when it is missing or points at an older
// version. A `next` already pointing at a newer prerelease (e.g. the next
// line's beta) is left untouched. Only Node.js built-ins.
//
// Usage: node tools/advance-next.mjs [--check|--apply] [--package <name>] [--stable <version>] [--registry <url>]
//   --check (default)  print the decision without writing dist-tags
//   --apply            move the `next` tag when the decision is `advance`
//   --package          package name (default: package.json name)
//   --stable           version `next` must at least point at (default: package.json version)
//   --registry         registry URL passed to npm (default: npm config)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function parseTagVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported version: ${version}.`);
  }
  return {
    version,
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] === undefined ? null : match[4].split('.'),
  };
}

export function compareVersions(leftVersion, rightVersion) {
  const left = parseTagVersion(leftVersion);
  const right = parseTagVersion(rightVersion);

  for (let index = 0; index < 3; index += 1) {
    if (left.core[index] !== right.core[index]) {
      return left.core[index] > right.core[index] ? 1 : -1;
    }
  }

  if (left.prerelease === null && right.prerelease === null) return 0;
  if (left.prerelease === null) return 1;
  if (right.prerelease === null) return -1;

  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const a = left.prerelease[index];
    const b = right.prerelease[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) > Number(b) ? 1 : -1;
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a > b ? 1 : -1;
  }
  return 0;
}

export function parseDistTags(output) {
  const tags = new Map();
  for (const line of output.split('\n')) {
    const match = /^([A-Za-z0-9_.-]+):\s*(\S+)\s*$/.exec(line);
    if (match) tags.set(match[1], match[2]);
  }
  return tags;
}

// `next` may be undefined when the tag does not exist yet.
export function shouldAdvanceNext({ next, stable }) {
  parseTagVersion(stable);
  if (next === undefined) return true;
  return compareVersions(stable, next) > 0;
}

function parseArgs(args) {
  const parsed = { mode: 'check', name: undefined, stable: undefined, registry: undefined };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--check') parsed.mode = 'check';
    else if (arg === '--apply') parsed.mode = 'apply';
    else if (arg === '--package' || arg === '--stable' || arg === '--registry') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      parsed[arg.slice(2)] = value;
      index += 1;
    } else if (arg.startsWith('--package=') || arg.startsWith('--stable=') || arg.startsWith('--registry=')) {
      const key = arg.slice(2, arg.indexOf('='));
      parsed[key] = arg.slice(arg.indexOf('=') + 1);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function npm(args) {
  const result = spawnSync('npm', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed: ${(result.stderr || '').trim()}`);
  }
  return (result.stdout || '').trim();
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const packageJson = JSON.parse(
    await readFile(resolve(root, 'package.json'), 'utf8'),
  );
  const name = options.package ?? packageJson.name;
  const stable = options.stable ?? packageJson.version;
  const registryArgs = options.registry ? ['--registry', options.registry] : [];

  const tags = parseDistTags(npm(['dist-tag', 'ls', name, ...registryArgs]));
  const next = tags.get('next');
  const advance = shouldAdvanceNext({ next, stable });

  console.log(`next: ${next ?? '(missing)'}; stable: ${stable}; decision: ${advance ? 'advance' : 'keep'}`);
  if (advance && options.mode === 'apply') {
    npm(['dist-tag', 'add', `${name}@${stable}`, 'next', ...registryArgs]);
    console.log(`moved next to ${stable}`);
  }
}

const isMain = process.argv[1] !== undefined &&
  // realpath: import.meta.url already carries the canonical path while
  // argv[1] may point through a symlink (e.g. /tmp on macOS).
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
