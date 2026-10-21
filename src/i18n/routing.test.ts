/**
 * src/i18n/routing.test.ts
 */
import { describe, expect, it } from 'vitest';
import { getDirection, routing } from './routing';

describe('getDirection', () => {
  it('is right-to-left for Arabic', () => {
    expect(getDirection('ar')).toBe('rtl');
  });

  it('is left-to-right for English', () => {
    expect(getDirection('en')).toBe('ltr');
  });

  it('has an answer for every supported locale', () => {
    for (const locale of routing.locales) {
      expect(['ltr', 'rtl']).toContain(getDirection(locale));
    }
  });
});
