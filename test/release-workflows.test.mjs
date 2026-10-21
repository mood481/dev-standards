import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePrereleasePlan } from '../tools/publish-prerelease.mjs';

import { packageVersions, prereleaseOf, releaseTag } from './helpers.mjs';

const pkg = await packageVersions();

test('resolvePrereleasePlan accepts supported prerelease channels', () => {
  assert.equal(
    resolvePrereleasePlan(pkg.current, releaseTag(prereleaseOf(pkg.current, 'devel'))).distTag,
    'devel',
  );
  assert.equal(
    resolvePrereleasePlan(pkg.current, releaseTag(prereleaseOf(pkg.current, 'alpha'))).distTag,
    'next',
  );
  assert.equal(
    resolvePrereleasePlan(pkg.current, releaseTag(prereleaseOf(pkg.current, 'beta', 1))).distTag,
    'next',
  );
  assert.equal(
    resolvePrereleasePlan(pkg.current, releaseTag(prereleaseOf(pkg.current, 'rc'))).distTag,
    'next',
  );
});

test('resolvePrereleasePlan rejects stable and mismatched-core tags', () => {
  assert.throws(
    () => resolvePrereleasePlan(pkg.current, releaseTag(pkg.current)),
    /Expected a prerelease release tag/,
  );
  assert.throws(
    () => resolvePrereleasePlan(
      pkg.current,
      releaseTag(prereleaseOf(pkg.next, 'beta')),
    ),
    /does not share package semver core/,
  );
});
