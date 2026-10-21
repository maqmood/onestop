/**
 * src/vin/validate.ts
 *
 * Purpose:   Normalise and validate 17-character VINs and compute the North American
 *            check digit (ISO 3779 / FMVSS 115 transliteration and weights).
 * Inputs:    Raw strings from manual entry, barcode payloads, or OCR post-processing.
 * Outputs:   A `VinValidation` result. Never throws on bad input.
 * Invariants:
 *   - A VIN is 17 characters from [A-HJ-NPR-Z0-9]; I, O and Q never appear.
 *   - The check digit (position 9) is REQUIRED for vehicles sold in the US/Canada and
 *     therefore for North American WMIs (first character 1–5). For other WMIs it is a
 *     HINT: a valid check digit on a J/K/W VIN suggests a US-market vehicle, an absent or
 *     invalid one suggests a non-US-market vehicle and therefore unlikely US records.
 *   - This module handles no personal data. A VIN alone is treated as non-personal here;
 *     logging elsewhere must still hash it (CLAUDE.md non-negotiable 4).
 */

/**
 * Transliteration table for the check-digit algorithm. Digits map to themselves.
 * Rows mirror the standard's letter groups (A–H, J–R, S–Z), hence the formatter opt-out.
 */
// prettier-ignore
const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

/** Position weights, left to right. Position 9 (index 8) is the check digit itself. */
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2] as const;

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export type CheckDigitStatus = 'valid' | 'invalid' | 'absent' | 'not_applicable';

export type VinReason =
  'empty' | 'length' | 'illegal_characters' | 'check_digit_invalid' | 'check_digit_absent';

export interface VinValidation {
  /** True when the VIN can be sent to providers. */
  ok: boolean;
  /** Normalised VIN (uppercase, non-alphanumerics stripped). Present even when `ok` is false. */
  vin: string;
  /** Why validation failed. Empty when `ok` is true. */
  reasons: VinReason[];
  /** First character 1–5: built for the US, Canada or Mexico market. */
  northAmericanWmi: boolean;
  /** Check-digit assessment; see module invariants. */
  checkDigit: CheckDigitStatus;
  /** Human-readable, non-blocking observations for the UI (message keys, not prose). */
  hints: Array<'likely_us_market' | 'likely_non_us_market'>;
}

/**
 * Uppercases and strips everything that is not A–Z or 0–9. Does not fix OCR confusions;
 * see `fixCommonOcrConfusions` for that, which callers apply explicitly.
 */
export function normalizeVin(raw: string): string {
  return (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Replaces characters that cannot occur in a VIN but that OCR commonly produces:
 * I → 1, O → 0, Q → 0. Apply only to OCR output, never to typed input, so that a typo
 * is reported rather than silently rewritten.
 */
export function fixCommonOcrConfusions(raw: string): string {
  return normalizeVin(raw).replace(/I/g, '1').replace(/[OQ]/g, '0');
}

/** True for WMIs assigned to the US (1, 4, 5), Canada (2) and Mexico (3). */
export function isNorthAmericanWmi(vin: string): boolean {
  return /^[1-5]/.test(vin);
}

/**
 * Computes the expected check digit for a structurally valid 17-character VIN.
 * Returns '0'–'9' or 'X' (for a remainder of 10). Caller must ensure `VIN_PATTERN` matches.
 */
export function computeCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const ch = vin[i] as string;
    const value = /[0-9]/.test(ch) ? Number(ch) : TRANSLITERATION[ch];
    if (value === undefined) {
      // Unreachable for inputs that match VIN_PATTERN; guards against misuse.
      throw new Error(`Illegal VIN character at position ${i + 1}`);
    }
    sum += value * (WEIGHTS[i] as number);
  }
  const remainder = sum % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

/**
 * Validates a VIN for use in the product.
 *
 * Rules:
 *   1. Structural: exactly 17 legal characters after normalisation.
 *   2. North American WMI: check digit must be present and valid, otherwise `ok` is false.
 *   3. Other WMIs: check digit is assessed but never blocks; the result carries a hint.
 */
export function validateVin(raw: string): VinValidation {
  const vin = normalizeVin(raw);
  const reasons: VinReason[] = [];

  if (vin.length === 0) {
    return {
      ok: false,
      vin,
      reasons: ['empty'],
      northAmericanWmi: false,
      checkDigit: 'absent',
      hints: [],
    };
  }
  if (vin.length !== 17) reasons.push('length');
  if (/[IOQ]/.test(vin) || (vin.length === 17 && !VIN_PATTERN.test(vin)))
    reasons.push('illegal_characters');

  if (reasons.length > 0) {
    return {
      ok: false,
      vin,
      reasons,
      northAmericanWmi: isNorthAmericanWmi(vin),
      checkDigit: 'absent',
      hints: [],
    };
  }

  const northAmericanWmi = isNorthAmericanWmi(vin);
  const positionNine = vin[8] as string;
  const hasCheckDigitChar = /[0-9X]/.test(positionNine);

  let checkDigit: CheckDigitStatus;
  if (!hasCheckDigitChar) {
    checkDigit = 'absent';
  } else {
    checkDigit = computeCheckDigit(vin) === positionNine ? 'valid' : 'invalid';
  }

  const hints: VinValidation['hints'] = [];

  if (northAmericanWmi) {
    if (checkDigit === 'absent') reasons.push('check_digit_absent');
    if (checkDigit === 'invalid') reasons.push('check_digit_invalid');
  } else {
    // Non-NA WMI: the check digit is informational only.
    if (checkDigit === 'valid') hints.push('likely_us_market');
    if (checkDigit === 'absent' || checkDigit === 'invalid') {
      hints.push('likely_non_us_market');
      checkDigit = 'not_applicable';
    }
  }

  return { ok: reasons.length === 0, vin, reasons, northAmericanWmi, checkDigit, hints };
}
