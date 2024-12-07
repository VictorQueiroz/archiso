import test from 'ava';
import PackageNameParser from './PackageNameParser';

test('PackageNameParser should return package name and flags', (t) => {
  const parser = new PackageNameParser('foo;bar');
  t.deepEqual(parser.read(), { packageName: 'foo', flags: ['bar'] });
});

test('PackageNameParser should parse package-name-only string', (t) => {
  const parser = new PackageNameParser('foo');
  t.deepEqual(parser.read(), { packageName: 'foo', flags: [] });
});

test('PackageNameParser should return more than one flag in package name', (t) => {
  const parser = new PackageNameParser('foo;bar;baz');
  t.deepEqual(parser.read(), { packageName: 'foo', flags: ['bar', 'baz'] });
});
