import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareVersions,
  parseDistTags,
  parseTagVersion,
  shouldAdvanceNext,
} from '../tools/advance-next.mjs';

test('stable outranks its own prereleases', () => {
  assert.equal(compareVersions('0.3.0', '0.3.0-beta.1'), 1);
  assert.equal(compareVersions('0.3.0-beta.1', '0.3.0'), -1);
  assert.equal(compareVersions('0.3.0', '0.3.0'), 0);
});

test('cores order numerically and prereleases order by identifiers', () => {
  assert.equal(compareVersions('0.3.0-beta.1', '0.2.0-beta.2'), 1);
  assert.equal(compareVersions('0.2.0-beta.2', '0.3.0-beta.1'), -1);
  assert.equal(compareVersions('0.3.0-beta.10', '0.3.0-beta.2'), 1);
  assert.equal(compareVersions('0.3.0-rc.1', '0.3.0-beta.9'), 1);
  assert.equal(compareVersions('1.0.0', '0.9.9'), 1);
});

test('rejects unsupported version shapes', () => {
  assert.throws(() => parseTagVersion('v0.3.0'), /Unsupported version/);
  assert.throws(() => parseTagVersion('0.3'), /Unsupported version/);
});

test('parses npm dist-tag ls output', () => {
  assert.deepEqual(
    [...parseDistTags('latest: 0.3.0\nnext: 0.2.0-beta.2\n')],
    [['latest', '0.3.0'], ['next', '0.2.0-beta.2']],
  );
  assert.deepEqual([...parseDistTags('latest: 0.3.0\n')], [['latest', '0.3.0']]);
});

test('advances next only when it lags behind stable', () => {
  assert.equal(shouldAdvanceNext({ next: '0.2.0-beta.2', stable: '0.3.0' }), true);
  assert.equal(shouldAdvanceNext({ next: undefined, stable: '0.3.0' }), true);
  assert.equal(shouldAdvanceNext({ next: '0.3.0-rc.1', stable: '0.3.0' }), true);
  assert.equal(shouldAdvanceNext({ next: '0.3.0', stable: '0.3.0' }), false);
  assert.equal(shouldAdvanceNext({ next: '0.4.0-beta.2', stable: '0.3.0' }), false);
  assert.equal(shouldAdvanceNext({ next: '0.3.1-beta.0', stable: '0.3.0' }), false);
});

test('rejects an unparseable stable version', () => {
  assert.throws(
    () => shouldAdvanceNext({ next: '0.2.0-beta.2', stable: 'oops' }),
    /Unsupported version/,
  );
});
