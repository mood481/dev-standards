import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parsePackageVersion,
  parseReleaseTag,
  resolveRelease,
} from '../tools/release-version.mjs';

test('package version is always a stable release line', () => {
  assert.equal(parsePackageVersion('0.3.1').core, '0.3.1');
  assert.throws(
    () => parsePackageVersion('0.3.1-beta.0'),
    /stable release line/,
  );
});

test('release tags resolve stable and prerelease channels', () => {
  assert.equal(parseReleaseTag('v0.3.1').distTag, 'latest');
  assert.equal(parseReleaseTag('v0.3.1-devel.0').distTag, 'devel');
  assert.equal(parseReleaseTag('v0.3.1-alpha.0').distTag, 'next');
  assert.equal(parseReleaseTag('v0.3.1-beta.2').distTag, 'next');
  assert.equal(parseReleaseTag('v0.3.1-rc.1').distTag, 'next');
});

test('release tags must match the package core and expected kind', () => {
  assert.equal(
    resolveRelease({
      packageVersion: '0.3.1',
      tag: 'v0.3.1',
      kind: 'stable',
    }).version,
    '0.3.1',
  );

  assert.equal(
    resolveRelease({
      packageVersion: '0.3.1',
      tag: 'v0.3.1-beta.0',
      kind: 'prerelease',
    }).version,
    '0.3.1-beta.0',
  );

  assert.throws(
    () => resolveRelease({
      packageVersion: '0.3.1',
      tag: 'v0.3.2-beta.0',
      kind: 'prerelease',
    }),
    /does not share package semver core/,
  );

  assert.throws(
    () => resolveRelease({
      packageVersion: '0.3.1',
      tag: 'v0.3.1',
      kind: 'prerelease',
    }),
    /Expected a prerelease release tag/,
  );
});
