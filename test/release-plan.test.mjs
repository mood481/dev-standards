import assert from 'node:assert/strict';
import test from 'node:test';

import { parseVersion, resolveReleasePlan } from '../tools/release-plan.mjs';

test('accepts stable and supported prerelease versions', () => {
  assert.equal(parseVersion('0.1.0').prerelease, null);
  assert.equal(parseVersion('0.1.0-devel.0').prerelease, 'devel');
  assert.equal(parseVersion('1.2.3-alpha.2').prerelease, 'alpha');
  assert.equal(parseVersion('1.2.3-beta.4').prerelease, 'beta');
  assert.equal(parseVersion('1.2.3-rc.1').prerelease, 'rc');
});

test('rejects unsupported version shapes and prerelease channels', () => {
  assert.throws(() => parseVersion('0.1.0-preview.0'), /Unsupported package version/);
  assert.throws(() => parseVersion('0.1.0-devel'), /Unsupported package version/);
  assert.throws(() => parseVersion('v0.1.0'), /Unsupported package version/);
});

test('stable tags publish the tag version as latest', () => {
  assert.deepEqual(
    resolveReleasePlan({
      version: '0.1.0',
      refType: 'tag',
      refName: 'v0.1.0',
    }),
    {
      version: '0.1.0',
      gitTag: 'v0.1.0',
      distTag: 'latest',
    },
  );
});

test('prerelease suffixes are accepted without a package.json bump', () => {
  assert.deepEqual(
    resolveReleasePlan({
      version: '0.2.0',
      refType: 'tag',
      refName: 'v0.2.0-beta.4',
    }),
    {
      version: '0.2.0-beta.4',
      gitTag: 'v0.2.0-beta.4',
      distTag: 'next',
    },
  );
});

test('development prereleases publish devel', () => {
  assert.equal(
    resolveReleasePlan({
      version: '0.2.0',
      refType: 'tag',
      refName: 'v0.2.0-devel.3',
    }).distTag,
    'devel',
  );
});

test('alpha beta and rc publish next', () => {
  for (const channel of ['alpha', 'beta', 'rc']) {
    assert.equal(
      resolveReleasePlan({
        version: '0.2.0',
        refType: 'tag',
        refName: `v0.2.0-${channel}.0`,
      }).distTag,
      'next',
    );
  }
});

test('rejects tags on another semver core and non-tag publication', () => {
  assert.throws(
    () => resolveReleasePlan({
      version: '0.2.1',
      refType: 'tag',
      refName: 'v0.2.0',
    }),
    /does not share package semver core/,
  );
  assert.throws(
    () => resolveReleasePlan({
      version: '0.2.0',
      refType: 'tag',
      refName: 'v0.3.0-beta.0',
    }),
    /does not share package semver core/,
  );
  assert.throws(
    () => resolveReleasePlan({
      version: '0.1.0-devel.0',
      refType: 'branch',
      refName: 'devel',
    }),
    /requires a Git tag/,
  );
});

test('rejects malformed release tags', () => {
  assert.throws(
    () => resolveReleasePlan({
      version: '0.2.0',
      refType: 'tag',
      refName: '0.2.0',
    }),
    /must start with v/,
  );
  assert.throws(
    () => resolveReleasePlan({
      version: '0.2.0',
      refType: 'tag',
      refName: 'v0.2.0-preview.1',
    }),
    /Unsupported package version/,
  );
});
