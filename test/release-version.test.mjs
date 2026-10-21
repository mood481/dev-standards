import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parsePackageVersion,
  parseReleaseTag,
  resolveRelease,
} from '../tools/release-version.mjs';

import { packageVersions, prereleaseOf, releaseTag } from './helpers.mjs';

const pkg = await packageVersions();

test('package version is always a stable release line', () => {
  assert.equal(parsePackageVersion(pkg.current).core, pkg.current);
  assert.throws(
    () => parsePackageVersion(prereleaseOf(pkg.current, 'beta')),
    /stable release line/,
  );
});

test('release tags resolve stable and prerelease channels', () => {
  assert.equal(parseReleaseTag(releaseTag(pkg.current)).distTag, 'latest');
  assert.equal(
    parseReleaseTag(releaseTag(prereleaseOf(pkg.current, 'devel'))).distTag,
    'devel',
  );
  assert.equal(
    parseReleaseTag(releaseTag(prereleaseOf(pkg.current, 'alpha'))).distTag,
    'next',
  );
  assert.equal(
    parseReleaseTag(releaseTag(prereleaseOf(pkg.current, 'beta', 2))).distTag,
    'next',
  );
  assert.equal(
    parseReleaseTag(releaseTag(prereleaseOf(pkg.current, 'rc'))).distTag,
    'next',
  );
});

test('release tags must match the package core and expected kind', () => {
  assert.equal(
    resolveRelease({
      packageVersion: pkg.current,
      tag: releaseTag(pkg.current),
      kind: 'stable',
    }).version,
    pkg.current,
  );

  const beta = prereleaseOf(pkg.current, 'beta');
  assert.equal(
    resolveRelease({
      packageVersion: pkg.current,
      tag: releaseTag(beta),
      kind: 'prerelease',
    }).version,
    beta,
  );

  assert.throws(
    () => resolveRelease({
      packageVersion: pkg.current,
      tag: releaseTag(prereleaseOf(pkg.next, 'beta')),
      kind: 'prerelease',
    }),
    /does not share package semver core/,
  );

  assert.throws(
    () => resolveRelease({
      packageVersion: pkg.current,
      tag: releaseTag(pkg.current),
      kind: 'prerelease',
    }),
    /Expected a prerelease release tag/,
  );
});
