import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareVersions,
  parseDistTags,
  parseTagVersion,
  shouldAdvanceNext,
} from '../tools/advance-next.mjs';

import { packageVersions, prereleaseOf, releaseTag } from './helpers.mjs';

const pkg = await packageVersions();

test('stable outranks its own prereleases', () => {
  const beta = prereleaseOf(pkg.current, 'beta', 1);
  assert.equal(compareVersions(pkg.current, beta), 1);
  assert.equal(compareVersions(beta, pkg.current), -1);
  assert.equal(compareVersions(pkg.current, pkg.current), 0);
});

test('cores order numerically and prereleases order by identifiers', () => {
  assert.equal(
    compareVersions(prereleaseOf(pkg.current, 'beta', 1), prereleaseOf(pkg.previous, 'beta', 2)),
    1,
  );
  assert.equal(
    compareVersions(prereleaseOf(pkg.previous, 'beta', 2), prereleaseOf(pkg.current, 'beta', 1)),
    -1,
  );
  assert.equal(
    compareVersions(prereleaseOf(pkg.current, 'beta', 10), prereleaseOf(pkg.current, 'beta', 2)),
    1,
  );
  assert.equal(
    compareVersions(prereleaseOf(pkg.current, 'rc', 1), prereleaseOf(pkg.current, 'beta', 9)),
    1,
  );
  assert.equal(compareVersions('1.0.0', '0.9.9'), 1);
});

test('rejects unsupported version shapes', () => {
  assert.throws(() => parseTagVersion(releaseTag(pkg.current)), /Unsupported version/);
  assert.throws(
    () => parseTagVersion(pkg.current.split('.', 2).join('.')),
    /Unsupported version/,
  );
});

test('parses npm dist-tag ls output', () => {
  const laggingNext = prereleaseOf(pkg.previous, 'beta', 2);
  assert.deepEqual(
    [...parseDistTags(`latest: ${pkg.current}\nnext: ${laggingNext}\n`)],
    [['latest', pkg.current], ['next', laggingNext]],
  );
  assert.deepEqual([...parseDistTags(`latest: ${pkg.current}\n`)], [['latest', pkg.current]]);
});

test('advances next only when it lags behind stable', () => {
  assert.equal(
    shouldAdvanceNext({ next: prereleaseOf(pkg.previous, 'beta', 2), stable: pkg.current }),
    true,
  );
  assert.equal(shouldAdvanceNext({ next: undefined, stable: pkg.current }), true);
  assert.equal(
    shouldAdvanceNext({ next: prereleaseOf(pkg.current, 'rc', 1), stable: pkg.current }),
    true,
  );
  assert.equal(shouldAdvanceNext({ next: pkg.current, stable: pkg.current }), false);
  assert.equal(
    shouldAdvanceNext({ next: prereleaseOf(pkg.nextMinor, 'beta', 2), stable: pkg.current }),
    false,
  );
  assert.equal(
    shouldAdvanceNext({ next: prereleaseOf(pkg.next, 'beta'), stable: pkg.current }),
    false,
  );
});

test('rejects an unparseable stable version', () => {
  assert.throws(
    () => shouldAdvanceNext({ next: prereleaseOf(pkg.previous, 'beta', 2), stable: 'oops' }),
    /Unsupported version/,
  );
});
