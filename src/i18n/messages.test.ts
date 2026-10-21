/**
 * src/i18n/messages.test.ts
 * Every catalogue must carry exactly the English keys, so no locale can render a missing string.
 */
import { describe, expect, it } from 'vitest';
import ar from './messages/ar.json';
import en from './messages/en.json';

function keyPaths(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('message catalogues', () => {
  it('ar.json has exactly the same keys as en.json', () => {
    expect(keyPaths(ar).sort()).toEqual(keyPaths(en).sort());
  });

  it('en.json has no empty strings', () => {
    const empty = keyPaths(en).filter(
      (path) =>
        path
          .split('.')
          .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], en) === '',
    );
    expect(empty).toEqual([]);
  });
});
