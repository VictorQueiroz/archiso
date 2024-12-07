import test from 'ava';
import processPackageItem from './processPackageItem';

test('processPackageItem should return package name and flags', (t) => {
  const packages = processPackageItem('foo;bar');
  t.deepEqual(packages, ['foo;bar']);
});
