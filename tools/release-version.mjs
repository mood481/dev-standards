const prereleaseDistTags = new Map([
  ['devel', 'devel'],
  ['alpha', 'next'],
  ['beta', 'next'],
  ['rc', 'next'],
]);

export function parsePackageVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) {
    throw new Error(`package.json version must be a stable release line x.y.z: ${version}`);
  }
  return { version, core: version };
}

export function parseReleaseTag(tag) {
  if (!tag.startsWith('v')) {
    throw new Error(`Release tag ${tag} must start with v.`);
  }

  const version = tag.slice(1);
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(devel|alpha|beta|rc)\.(0|[1-9]\d*))?$/.exec(version);
  if (!match) {
    throw new Error(
      `Unsupported release tag ${tag}. Use vX.Y.Z or vX.Y.Z-{devel|alpha|beta|rc}.N.`,
    );
  }

  const prerelease = match[4] ?? null;
  return {
    tag,
    version,
    core: `${match[1]}.${match[2]}.${match[3]}`,
    prerelease,
    prereleaseNumber: match[5] === undefined ? null : Number(match[5]),
    kind: prerelease === null ? 'stable' : 'prerelease',
    distTag: prerelease === null ? 'latest' : prereleaseDistTags.get(prerelease),
  };
}

export function resolveRelease({ packageVersion, tag, kind }) {
  const pkg = parsePackageVersion(packageVersion);
  const release = parseReleaseTag(tag);

  if (release.core !== pkg.core) {
    throw new Error(
      `Release tag ${tag} does not share package semver core ${pkg.core}; bump package.json to ${release.core} first.`,
    );
  }

  if (kind !== undefined && release.kind !== kind) {
    throw new Error(`Expected a ${kind} release tag, got ${tag}.`);
  }

  return release;
}
