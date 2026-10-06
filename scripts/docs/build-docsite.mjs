#!/usr/bin/env node
// Build the complete dev-standards documentation artifact destined for
// site/dev-standards/ in mood481/tools-docs.
//
// Documentation-only toolchain: only Node.js built-ins, no dependencies.
// Content lives in docs/site/content/ plus the packaged rules/ and guides/
// sources rendered through catalog.json, so the site always matches the
// shipped package. No per-page generation notices are emitted.
//
// Usage: node scripts/docs/build-docsite.mjs [--out <dir>]
// Default output: dist/docs-site (copied as site/dev-standards/ by publication).

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE_URL = 'https://tools.mood481.es/dev-standards/';
const BASE_PATH = '/dev-standards/';

const pageSources = [
  { route: '', file: 'docs/site/content/_index.md' },
  { route: 'getting-started/', file: 'docs/site/content/getting-started.md' },
  { route: 'cli-reference/', file: 'docs/site/content/cli-reference.md' },
  { route: 'standards/', file: 'docs/site/content/standards/_index.md' },
  {
    route: 'standards/manifest/',
    file: 'docs/site/content/standards/manifest.md',
  },
];

const out = parseOut(process.argv.slice(2));
const packageJson = JSON.parse(
  await readFile(join(repoRoot, 'package.json'), 'utf8'),
);
const version = packageJson.version;
if (typeof version !== 'string' || version.length === 0) {
  throw new Error('package.json must declare a version string.');
}
const catalogData = JSON.parse(
  await readFile(join(repoRoot, 'catalog.json'), 'utf8'),
);

const pages = [];
for (const entry of pageSources) {
  const raw = await readFile(join(repoRoot, entry.file), 'utf8');
  const { meta, body } = splitFrontmatter(raw);
  pages.push({
    route: entry.route,
    title: meta.title ?? routeFallbackTitle(entry.route),
    description: meta.description ?? '',
    body,
  });
}

for (const [type, entries] of Object.entries(catalogData)) {
  if (!entries || typeof entries !== 'object') continue;
  for (const [id, source] of Object.entries(entries)) {
    const raw = await readFile(join(repoRoot, source), 'utf8');
    const { meta, body } = splitFrontmatter(raw);
    pages.push({
      route: `standards/${type}s/${id}/`,
      title: meta.title ?? firstHeading(body) ?? id,
      description: meta.description ?? `${type} ${id}`,
      body,
    });
  }
}

const absOut = resolve(repoRoot, out);
await rm(absOut, { recursive: true, force: true });
await mkdir(absOut, { recursive: true });

for (const page of pages) {
  const html = renderPage(page);
  const dir = join(absOut, page.route);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
}

const css = await readFile(
  join(repoRoot, 'docs/site/static/css/site.css'),
  'utf8',
);
await mkdir(join(absOut, 'css'), { recursive: true });
await writeFile(join(absOut, 'css', 'site.css'), css, 'utf8');

await writeFile(join(absOut, 'sitemap.xml'), renderSitemap(pages), 'utf8');

// Reproducibility guard: entry page and hierarchy must exist.
for (const required of [
  'index.html',
  'getting-started/index.html',
  'cli-reference/index.html',
  'standards/index.html',
  'standards/manifest/index.html',
  'css/site.css',
  'sitemap.xml',
]) {
  await readFile(join(absOut, required), 'utf8').catch(() => {
    throw new Error(`missing built page ${out}/${required}`);
  });
}
const catalogRoutes = pages.filter((page) =>
  page.route.startsWith('standards/rules/'),
);
if (catalogRoutes.length === 0) {
  throw new Error('no catalog rule pages were rendered.');
}

const fileCount = pages.length + 2;
console.log(`built ${out} (${fileCount} pages + assets, version ${version})`);

function parseOut(args) {
  let value = 'dist/docs-site';
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--out') {
      value = args[index + 1] ?? '';
      index += 1;
    } else if (arg.startsWith('--out=')) {
      value = arg.slice('--out='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!value) throw new Error('Missing value for --out');
  return value;
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { meta: {}, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { meta: {}, body: raw };
  const head = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const meta = {};
  for (const line of head.split('\n')) {
    const match = /^([A-Za-z0-9_-]+):\s*"(.*)"\s*$/.exec(line.trim());
    if (match) meta[match[1]] = match[2];
  }
  return { meta, body };
}

function routeFallbackTitle(route) {
  if (route === '') return 'dev-standards';
  const parts = route.replace(/\/$/, '').split('/');
  return parts[parts.length - 1];
}

function firstHeading(body) {
  const match = /^#{1,3}\s+(.+)$/m.exec(body);
  return match ? match[1].trim() : undefined;
}

function renderPage(page) {
  const content = renderMarkdown(page.body);
  const canonical =
    page.route === '' ? BASE_URL : `${BASE_URL}${page.route}`;
  const description = escapeHtml(page.description);
  const title = escapeHtml(page.title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · dev-standards</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="${BASE_PATH}css/site.css">
</head>
<body>
<header class="site-header">
<nav class="site-nav" aria-label="Primary">
<a class="brand" href="${BASE_PATH}">dev-standards</a>
<a href="${BASE_PATH}getting-started/">Getting started</a>
<a href="${BASE_PATH}cli-reference/">CLI reference</a>
<a href="${BASE_PATH}standards/">Standards</a>
</nav>
</header>
<main class="site-main">
<article class="content">
${content}
</article>
</main>
<footer class="site-footer">
<p>dev-standards by mood481 &middot; current version: ${escapeHtml(version)} &middot; <a href="${BASE_PATH}cli-reference/">Command reference</a></p>
</footer>
</body>
</html>
`;
}

function renderSitemap(entries) {
  const urls = entries
    .map((page) => `  <url><loc>${BASE_URL}${page.route}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function renderMarkdown(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let html = '';
  let index = 0;

  const flushParagraph = (buffer) => {
    if (buffer.length === 0) return;
    html += `<p>${renderInline(buffer.join(' '))}</p>\n`;
  };

  while (index < lines.length) {
    const line = lines[index];

    if (/^\s*$/.test(line)) {
      index += 1;
      continue;
    }

    const fence = /^(\s*)```(\w*)\s*$/.exec(line);
    if (fence) {
      const language = fence[2] ? ` class="language-${fence[2]}"` : '';
      const code = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      html += `<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>\n`;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html += `<h${level}>${renderInline(heading[2].trim())}</h${level}>\n`;
      index += 1;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      html += '<hr>\n';
      index += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*> ?/, ''));
        index += 1;
      }
      html += `<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>\n`;
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && isTableDelimiter(lines[index + 1])) {
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      html += '<table>\n<thead><tr>';
      for (const cell of headers) html += `<th>${renderInline(cell)}</th>`;
      html += '</tr></thead>\n<tbody>\n';
      for (const row of rows) {
        html += '<tr>';
        for (const cell of row) html += `<td>${renderInline(cell)}</td>`;
        html += '</tr>\n';
      }
      html += '</tbody>\n</table>\n';
      continue;
    }

    if (/^\s*([-*])\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*([-*])\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*([-*])\s+/, ''));
        index += 1;
      }
      html += '<ul>\n';
      for (const item of items) html += `<li>${renderInline(item)}</li>\n`;
      html += '</ul>\n';
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      html += '<ol>\n';
      for (const item of items) html += `<li>${renderInline(item)}</li>\n`;
      html += '</ol>\n';
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      !/^\s*$/.test(lines[index]) &&
      !/^(#{1,4}\s|```|\s*>|\s*---+\s*|(\s*([-*])\s+)|(\s*\d+\.\s+))/.test(
        lines[index],
      ) &&
      !(/^\s*\|.*\|\s*$/.test(lines[index]) && isTableDelimiter(lines[index + 1]))
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    flushParagraph(paragraph);
  }

  return html.trimEnd();
}

function isTableDelimiter(line) {
  return (
    typeof line === 'string' && /^\s*\|?[\s:|-]+\|?[\s:|-]+\s*$/.test(line) &&
    line.includes('|') && /-/.test(line)
  );
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|\W)\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, label, target) => `<a href="${normalizeHref(target)}">${label}</a>`,
  );
  return out;
}

function normalizeHref(target) {
  if (
    target.startsWith('http://') || target.startsWith('https://') ||
    target.startsWith('#') || target.startsWith('mailto:')
  ) {
    return target;
  }
  return target;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
