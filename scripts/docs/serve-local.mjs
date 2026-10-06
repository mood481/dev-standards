#!/usr/bin/env node
// Serve the built docsite locally under /dev-standards/, emulating
// https://tools.mood481.es/dev-standards/.
//
// The served artifact is identical to the pipeline one: unless --no-build is
// passed, this script rebuilds the default output with default options first
// and then serves it mounted at /dev-standards/. Only Node.js built-ins.
//
// Usage: node scripts/docs/serve-local.mjs [--port <n>] [--out <dir>] [--no-build]
//   --port <n>  local port (default 8080)
//   --out <dir> built artifact to serve (default dist/docs-site)
//   --no-build  skip the rebuild and serve the existing artifact

import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PREFIX = '/dev-standards/';

const options = parseArgs(process.argv.slice(2));
const absOut = options.out.startsWith('/')
  ? options.out
  : join(repoRoot, options.out);

if (!options.noBuild) {
  const built = spawnSync(
    process.execPath,
    [join(repoRoot, 'scripts', 'docs', 'build-docsite.mjs'), '--out', absOut],
    { cwd: repoRoot, encoding: 'utf8', stdio: 'inherit' },
  );
  if (built.status !== 0) {
    process.exit(built.status ?? 1);
  }
}

try {
  const entry = await stat(join(absOut, 'index.html'));
  if (!entry.isFile()) throw new Error('not a file');
} catch {
  console.error(`error: missing ${absOut}/index.html; run npm run docs:build first`);
  process.exit(1);
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(
      request.url ?? '/',
      'http://127.0.0.1',
    ).pathname;
    if (pathname !== '/dev-standards' && !pathname.startsWith(PREFIX)) {
      respond(response, 404, 'text/plain; charset=utf-8', 'not found\n');
      return;
    }
    const relative = pathname === '/dev-standards'
      ? ''
      : decodeURIComponent(pathname.slice(PREFIX.length));
    const file = await resolveFile(absOut, relative);
    if (!file) {
      respond(response, 404, 'text/plain; charset=utf-8', 'not found\n');
      return;
    }
    const body = await readFile(file);
    respond(response, 200, contentType(file), body);
  } catch {
    respond(response, 500, 'text/plain; charset=utf-8', 'internal error\n');
  }
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`error: port ${options.port} is already in use (try --port <n>)`);
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
});

server.listen(options.port, '127.0.0.1', () => {
  console.log(`serving ${options.out} at http://127.0.0.1:${options.port}/dev-standards/`);
});

function parseArgs(args) {
  const parsed = { port: 8080, out: 'dist/docs-site', noBuild: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--port') {
      const value = Number(args[index + 1]);
      if (!Number.isInteger(value) || value <= 0 || value > 65535) {
        throw new Error('Invalid value for --port');
      }
      parsed.port = value;
      index += 1;
    } else if (arg.startsWith('--port=')) {
      const value = Number(arg.slice('--port='.length));
      if (!Number.isInteger(value) || value <= 0 || value > 65535) {
        throw new Error('Invalid value for --port');
      }
      parsed.port = value;
    } else if (arg === '--out') {
      parsed.out = args[index + 1] ?? '';
      if (!parsed.out) throw new Error('Missing value for --out');
      index += 1;
    } else if (arg.startsWith('--out=')) {
      parsed.out = arg.slice('--out='.length);
      if (!parsed.out) throw new Error('Missing value for --out');
    } else if (arg === '--no-build') {
      parsed.noBuild = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

async function resolveFile(root, relative) {
  const normalized = normalize(relative);
  if (normalized.startsWith('..') || normalized.startsWith(sep)) return undefined;
  const direct = join(root, normalized);
  const candidates = normalized === '' || normalized === '.'
    ? [join(root, 'index.html')]
    : [direct, join(direct, 'index.html')];
  for (const candidate of candidates) {
    try {
      const entry = await stat(candidate);
      if (entry.isFile()) return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.xml')) return 'application/xml; charset=utf-8';
  return 'application/octet-stream';
}

function respond(response, status, type, body) {
  response.writeHead(status, { 'content-type': type });
  response.end(body);
}
