import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePrereleasePlan } from '../tools/publish-prerelease.mjs';
import { selectStableTag } from '../tools/stable-release-ref.mjs';

test('selectStableTag ignores prereleases and returns one stable tag', () => {
  assert.equal(
    selectStableTag(['v0.3.2-beta.0', 'v0.3.2']),
    'v0.3.2',
  );
  assert.equal(selectStableTag(['v0.3.2-beta.0']), null);
});

test('selectStableTag rejects multiple stable tags on the same commit', () => {
  assert.throws(
    () => selectStableTag(['v0.3.1', 'v0.3.2']),
    /Expected at most one stable release tag/,
  );
});

test('resolvePrereleasePlan accepts supported prerelease channels', () => {
  assert.equal(
    resolvePrereleasePlan('0.3.2', 'v0.3.2-devel.0').distTag,
    'devel',
  );
  assert.equal(
    resolvePrereleasePlan('0.3.2', 'v0.3.2-alpha.0').distTag,
    'next',
  );
  assert.equal(
    resolvePrereleasePlan('0.3.2', 'v0.3.2-beta.1').distTag,
    'next',
  );
  assert.equal(
    resolvePrereleasePlan('0.3.2', 'v0.3.2-rc.0').distTag,
    'next',
  );
});

test('resolvePrereleasePlan rejects stable and mismatched-core tags', () => {
  assert.throws(
    () => resolvePrereleasePlan('0.3.2', 'v0.3.2'),
    /requires a prerelease tag/,
  );
  assert.throws(
    () => resolvePrereleasePlan('0.3.2', 'v0.3.3-beta.0'),
    /does not share package semver core/,
  );
});
