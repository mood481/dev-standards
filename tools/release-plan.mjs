import { appendFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allowedPrereleaseChannels = new Map([
  ['devel', 'devel'],
  ['alpha', 'next'],
  ['beta', 'next'],
  ['rc', 'next'],
]);

export function parseVersion(version) {
  const match = /^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-(devel|alpha|beta|rc)\\.(0|[1-9]\\d*))?$/.exec(version);
  if (!match) {
    throw new Error(
      `Unsupported package version: ${version}. Use x.y.z or x.y.z-{devel|alpha|beta|rc}.N.`,
    );
  }

  return {
    version,
    prerelease: match[4] ?? null,
    prereleaseNumber: match[5] === undefined ? null : Number(match[5]),
  };
}

export function resolveReleasePlan({ version, refType, refName }) {
  const parsed = parseVersion(version);
  if (refType !== 'tag') {
    throw new Error('Publishing requires a Git tag.');
  }

  const expectedTag = `v${version}`;
  if (refName !== expectedTag) {
    throw new Error(
      `Release tag ${refName} does not match package version ${version}; expected ${expectedTag}.`,
    );
  }

  const distTag = parsed.prerelease === null
    ? 'latest'
    : allowedPrereleaseChannels.get(parsed.prerelease);

  return { version, gitTag: expectedTag, distTag };
}

async function run() {
  const packageJson = JSON.parse(
    await readFile(resolve(root, 'package.json'), 'utf8'),
  );
  const plan = resolveReleasePlan({
    version: packageJson.version,
    refType: process.env.GITHUB_REF_TYPE ?? '',
    refName: process.env.GITHUB_REF_NAME ?? '',
  });

  console.log(`Release ${plan.version}: ${plan.gitTag} -> ${plan.distTag}`);

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `version=${plan.version}\\ndist_tag=${plan.distTag}\\n`,
      'utf8',
    );
  }
}

const isMain = process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
