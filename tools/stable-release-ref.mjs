import { appendFile, readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRelease } from './release-version.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stablePattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

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
  const tag = (process.env.RELEASE_TAG ?? '').trim();
  if (!tag) {
    throw new Error('RELEASE_TAG is required.');
  }
  if (!stablePattern.test(tag)) {
    throw new Error(
      `Stable release tag must match v<major>.<minor>.<patch>: ${tag}`,
    );
  }

  git(['fetch', '--tags', '--force', 'origin']);
  const revision = git(['rev-list', '-n', '1', `refs/tags/${tag}`]).stdout.trim();

  if (process.env.REQUIRE_MAIN === 'true') {
    git(['fetch', '--no-tags', 'origin', 'main:refs/remotes/origin/main']);
    const check = git(
      ['merge-base', '--is-ancestor', revision, 'refs/remotes/origin/main'],
      { allowFailure: true },
    );

    if (check.status !== 0) {
      if (process.env.MAIN_POLICY === 'skip') {
        console.log(
          `Stable tag ${tag} is not contained in main; publication skipped.`,
        );
        await writeOutput({ publish: 'false' });
        return;
      }

      throw new Error(`Stable tag ${tag} is not contained in main.`);
    }
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
