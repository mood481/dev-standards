import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
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
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(devel|alpha|beta|rc)\.(0|[1-9]\d*))?$/.exec(version);
  if (!match) {
    throw new Error(
      `Unsupported package version: ${version}. Use x.y.z or x.y.z-{devel|alpha|beta|rc}.N.`,
    );
  }

  return {
    version,
    core: `${match[1]}.${match[2]}.${match[3]}`,
    prerelease: match[4] ?? null,
    prereleaseNumber: match[5] === undefined ? null : Number(match[5]),
  };
}

export function resolveReleasePlan({ version, refType, refName }) {
  const pkg = parseVersion(version);
  if (refType !== 'tag') {
    throw new Error('Publishing requires a Git tag.');
  }

  if (!refName.startsWith('v')) {
    throw new Error(`Release tag ${refName} must start with v.`);
  }
  // The published version comes from the tag. The tag must share the
  // package.json semver core (major.minor.patch) but may add a prerelease
  // suffix, so prereleases never require a package.json bump: package.json
  // holds the release line (e.g. 0.2.0) and CI stamps it to the tag version
  // before testing and publishing.
  const tag = parseVersion(refName.slice(1));
  if (tag.core !== pkg.core) {
    throw new Error(
      `Release tag ${refName} does not share package semver core ${pkg.core}; bump package.json to the ${tag.core} release line first.`,
    );
  }

  const distTag = tag.prerelease === null
    ? 'latest'
    : allowedPrereleaseChannels.get(tag.prerelease);

  return { version: tag.version, gitTag: refName, distTag };
}

async function run() {
  const packagePath = resolve(root, 'package.json');
  const packageJson = JSON.parse(
    await readFile(packagePath, 'utf8'),
  );
  const plan = resolveReleasePlan({
    version: packageJson.version,
    refType: process.env.GITHUB_REF_TYPE ?? '',
    refName: process.env.GITHUB_REF_NAME ?? '',
  });

  if (process.argv.includes('--stamp') && packageJson.version !== plan.version) {
    packageJson.version = plan.version;
    await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log(`Stamped package.json version to ${plan.version}`);
  }

  console.log(`Release ${plan.version}: ${plan.gitTag} -> ${plan.distTag}`);

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `version=${plan.version}\ndist_tag=${plan.distTag}\n`,
      'utf8',
    );
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
