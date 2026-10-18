import assert from 'node:assert/strict';
import test from 'node:test';

import { withNeonTimeoutDefaults } from '@/lib/prisma';

test('adds cold-start timeouts to a Neon runtime connection', () => {
  const result = withNeonTimeoutDefaults(
    'postgresql://user:password@example-pooler.us-east-1.aws.neon.tech/store?sslmode=require',
  );
  const url = new URL(result!);

  assert.equal(url.searchParams.get('connect_timeout'), '30');
  assert.equal(url.searchParams.get('pool_timeout'), '30');
  assert.equal(url.searchParams.get('sslmode'), 'require');
});

test('raises short timeout settings and keeps larger or disabled ones', () => {
  const result = withNeonTimeoutDefaults(
    'postgresql://user:password@example-pooler.us-east-1.aws.neon.tech/store?connect_timeout=12&pool_timeout=45',
  );
  const url = new URL(result!);

  assert.equal(url.searchParams.get('connect_timeout'), '30');
  assert.equal(url.searchParams.get('pool_timeout'), '45');

  const disabled = new URL(
    withNeonTimeoutDefaults(
      'postgresql://user:password@example.neon.tech/store?connect_timeout=0&pool_timeout=0',
    )!,
  );
  assert.equal(disabled.searchParams.get('connect_timeout'), '0');
  assert.equal(disabled.searchParams.get('pool_timeout'), '0');
});

test('does not change non-Neon or malformed connection strings', () => {
  const local = 'postgresql://user:password@localhost:5432/store';
  const malformed = 'not a connection string';

  assert.equal(withNeonTimeoutDefaults(local), local);
  assert.equal(withNeonTimeoutDefaults(malformed), malformed);
  assert.equal(withNeonTimeoutDefaults(undefined), undefined);
});
