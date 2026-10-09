import { appendFile, readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRelease } from './release-version.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stablePattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function selectStableTag(tags) {
  const matches = tags.filter((tag) => stablePattern.test(tag)).sort();
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(
      `Expected at most one stable release tag, found: ${matches.join(', ')}`,
    );
  }
  return matches[0];
}

function git(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (!allowFailure && result.status !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed: ${(result.stderr || '').trim()}`,
    );
  }
  return result;
}

async function writeOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const content = Object.entries(values)
    .map(([key, value]) => `${key}=${value}\n`)
    .join('');
  await appendFile(process.env.GITHUB_OUTPUT, content, 'utf8');
}

async function run() {
  const releaseSha = (process.env.RELEASE_SHA ?? '').trim();
  const releaseTag = (process.env.RELEASE_TAG ?? '').trim();

  if (Boolean(releaseSha) === Boolean(releaseTag)) {
    throw new Error('Provide exactly one of RELEASE_SHA or RELEASE_TAG.');
  }

  git(['fetch', '--tags', '--force', 'origin']);

  let tag;
  let revision;

  if (releaseTag) {
    if (!stablePattern.test(releaseTag)) {
      throw new Error(
        `Stable release tag must match v<major>.<minor>.<patch>: ${releaseTag}`,
      );
    }

    tag = releaseTag;
    revision = git(['rev-list', '-n', '1', `refs/tags/${tag}`]).stdout.trim();

    if (process.env.REQUIRE_MAIN === 'true') {
      git(['fetch', '--no-tags', 'origin', 'main:refs/remotes/origin/main']);
      const check = git(
        ['merge-base', '--is-ancestor', revision, 'refs/remotes/origin/main'],
        { allowFailure: true },
      );
      if (check.status !== 0) {
        throw new Error(`Stable tag ${tag} is not contained in main.`);
      }
    }
  } else {
    const tags = git(['tag', '--points-at', releaseSha]).stdout
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    tag = selectStableTag(tags);
    if (tag === null) {
      console.log(
        `No stable release tag points at merged PR head ${releaseSha}; nothing to publish.`,
      );
      await writeOutput({ publish: 'false' });
      return;
    }
    revision = releaseSha;
  }

  const packageJson = JSON.parse(
    await readFile(resolve(root, 'package.json'), 'utf8'),
  );

  resolveRelease({
    packageVersion: packageJson.version,
    tag,
    kind: 'stable',
  });

  console.log(`Stable release ${tag} at ${revision}.`);
  await writeOutput({
    publish: 'true',
    tag,
    revision,
  });
}

const isMain = process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
