/**
 * src/vin/validate.test.ts
 * Check digits below were verified by hand against the ISO 3779 algorithm.
 */
import { describe, expect, it } from 'vitest';
import {
  computeCheckDigit,
  fixCommonOcrConfusions,
  isNorthAmericanWmi,
  normalizeVin,
  validateVin,
} from './validate';

describe('normalizeVin', () => {
  it('uppercases and strips separators and whitespace', () => {
    expect(normalizeVin(' 1hgcm-8263 3a004352 ')).toBe('1HGCM82633A004352');
  });
});

describe('fixCommonOcrConfusions', () => {
  it('maps I, O and Q to 1, 0 and 0', () => {
    expect(fixCommonOcrConfusions('1HGCM82633AOO4352')).toBe('1HGCM82633A004352');
    expect(fixCommonOcrConfusions('IHGCM82633AQ04352')).toBe('1HGCM82633A004352');
  });
});

describe('computeCheckDigit', () => {
  it('matches known valid VINs', () => {
    expect(computeCheckDigit('1HGCM82633A004352')).toBe('3');
    expect(computeCheckDigit('11111111111111111')).toBe('1');
    expect(computeCheckDigit('JHMCM56557C404453')).toBe('5');
  });
});

describe('isNorthAmericanWmi', () => {
  it('treats 1–5 as North American', () => {
    expect(isNorthAmericanWmi('1HGCM82633A004352')).toBe(true);
    expect(isNorthAmericanWmi('2T1BURHE0JC000000')).toBe(true);
    expect(isNorthAmericanWmi('JHMCM56557C404453')).toBe(false);
    expect(isNorthAmericanWmi('WVWZZZ3CZWE000001')).toBe(false);
  });
});

describe('validateVin', () => {
  it('accepts a valid North American VIN', () => {
    const result = validateVin('1HGCM82633A004352');
    expect(result.ok).toBe(true);
    expect(result.northAmericanWmi).toBe(true);
    expect(result.checkDigit).toBe('valid');
    expect(result.reasons).toEqual([]);
  });

  it('rejects a North American VIN with a bad check digit', () => {
    const result = validateVin('1HGCM82633A004353');
    expect(result.ok).toBe(false);
    expect(result.checkDigit).toBe('invalid');
    expect(result.reasons).toContain('check_digit_invalid');
  });

  it('accepts a non-NA VIN with a valid check digit and hints US market', () => {
    const result = validateVin('JHMCM56557C404453');
    expect(result.ok).toBe(true);
    expect(result.northAmericanWmi).toBe(false);
    expect(result.checkDigit).toBe('valid');
    expect(result.hints).toContain('likely_us_market');
  });

  it('accepts a non-NA VIN without a check digit and hints non-US market', () => {
    const result = validateVin('WVWZZZ3CZWE000001');
    expect(result.ok).toBe(true);
    expect(result.checkDigit).toBe('not_applicable');
    expect(result.hints).toContain('likely_non_us_market');
  });

  it('rejects wrong length', () => {
    const result = validateVin('1HGCM8263');
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('length');
  });

  it('rejects illegal characters without rewriting them', () => {
    const result = validateVin('1HGCM82633A00435O');
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('illegal_characters');
  });

  it('handles empty input', () => {
    expect(validateVin('').ok).toBe(false);
    expect(validateVin('').reasons).toEqual(['empty']);
  });
});
