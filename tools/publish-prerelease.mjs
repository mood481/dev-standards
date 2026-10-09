import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRelease } from './release-version.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function resolvePrereleasePlan(packageVersion, tag) {
  return resolveRelease({
    packageVersion,
    tag,
    kind: 'prerelease',
  });
}

function command(program, args, { cwd = root, inherit = false, allowFailure = false } = {}) {
  const result = spawnSync(program, args, {
    cwd,
    env: process.env,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
  });

  if (!allowFailure && result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(
      `${program} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`,
    );
  }

  return result;
}

function output(program, args, options) {
  return (command(program, args, options).stdout || '').trim();
}

function resolveRegistry() {
  const configured = (process.env.GITEA_NPM_REGISTRY ?? '').trim();
  if (configured) return configured;

  const npmValue = output('npm', ['config', 'get', '@mood481:registry']);
  if (!npmValue || npmValue === 'undefined' || npmValue === 'null') {
    throw new Error(
      'Gitea registry is not configured. Set GITEA_NPM_REGISTRY or npm config @mood481:registry.',
    );
  }
  return npmValue;
}

async function createTarball(version) {
  const tempRoot = await mkdtemp(join(tmpdir(), 'dev-standards-prerelease-'));
  const packageRoot = join(tempRoot, 'package');
  const outputRoot = join(tempRoot, 'out');

  await cp(root, packageRoot, {
    recursive: true,
    filter(source) {
      const relative = source.slice(root.length);
      return !relative.startsWith('/.git') &&
        !relative.startsWith('/node_modules') &&
        !relative.startsWith('/dist');
    },
  });
  await mkdir(outputRoot, { recursive: true });

  const packagePath = join(packageRoot, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  packageJson.version = version;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const packed = JSON.parse(
    output('npm', ['pack', '--json', '--pack-destination', outputRoot], {
      cwd: packageRoot,
    }),
  );

  if (!Array.isArray(packed) || packed.length !== 1 || !packed[0].filename) {
    await rm(tempRoot, { recursive: true, force: true });
    throw new Error('npm pack did not return exactly one tarball.');
  }

  return {
    tempRoot,
    tarball: join(outputRoot, packed[0].filename),
  };
}

async function runPublish() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    throw new Error(
      'Usage: npm run prerelease:publish -- v<major>.<minor>.<patch>-<devel|alpha|beta|rc>.<n>',
    );
  }

  const tag = args[0];
  const packageJson = JSON.parse(
    await readFile(resolve(root, 'package.json'), 'utf8'),
  );
  const plan = resolvePrereleasePlan(packageJson.version, tag);

  if (output('git', ['status', '--porcelain']) !== '') {
    throw new Error('Working tree must be clean before publishing a prerelease.');
  }

  const head = output('git', ['rev-parse', 'HEAD']);
  const localTag = command(
    'git',
    ['rev-parse', '-q', '--verify', `refs/tags/${tag}`],
    { allowFailure: true },
  );

  if (localTag.status === 0 && (localTag.stdout || '').trim() !== head) {
    throw new Error(`Local tag ${tag} already points to another commit.`);
  }

  const remoteOutput = output(
    'git',
    ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`],
  );

  if (remoteOutput) {
    const remoteSha = remoteOutput.split(/\s+/)[0];
    if (remoteSha !== head) {
      throw new Error(`Remote tag ${tag} already points to another commit.`);
    }
  }

  const registry = resolveRegistry();
  if (!/^https?:\/\//.test(registry)) {
    throw new Error('Gitea registry must be a full http(s) URL.');
  }
  if (!(process.env.GITEA_TOKEN ?? '').trim()) {
    throw new Error('GITEA_TOKEN is required for prerelease publication.');
  }

  console.log(`Prerelease ${plan.version} -> npm dist-tag ${plan.distTag}`);
  console.log(`Source commit: ${head}`);
  console.log(`Registry: ${registry}`);

  command('npm', ['test'], { inherit: true });
  command('npm', ['run', 'catalog:check'], { inherit: true });
  command('npm', ['pack', '--dry-run'], { inherit: true });

  const createdLocalTag = localTag.status !== 0;
  if (createdLocalTag) {
    command('git', ['tag', tag]);
    console.log(`Created local tag ${tag}.`);
  }

  const artifact = await createTarball(plan.version);

  try {
    command(
      'npm',
      [
        'publish',
        artifact.tarball,
        '--registry',
        registry,
        '--tag',
        plan.distTag,
      ],
      { inherit: true },
    );
  } catch (error) {
    if (createdLocalTag) {
      command('git', ['tag', '-d', tag], { allowFailure: true });
    }
    throw error;
  } finally {
    await rm(artifact.tempRoot, { recursive: true, force: true });
  }

  if (!remoteOutput) {
    command('git', ['push', 'origin', `refs/tags/${tag}`], { inherit: true });
    console.log(`Pushed tag ${tag}.`);
  }

  console.log(
    `Published @mood481/dev-standards@${plan.version} as ${plan.distTag}.`,
  );
}

const isMain = process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runPublish().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
