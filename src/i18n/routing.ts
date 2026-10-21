/**
 * src/i18n/routing.ts
 *
 * Purpose:   The supported locales and how they appear in URLs: the one place to add a language.
 * Inputs:    None.
 * Outputs:   next-intl routing config, and each locale's text direction.
 * Invariants:
 *   - English has no URL prefix (`/`); Arabic lives under `/ar` (founder's choice, T0.3).
 *   - No locale cookie: ADR-0004 allows strictly necessary cookies only, so the URL alone
 *     decides the language.
 *   - No Accept-Language detection while ar.json holds English placeholders, so an
 *     Arabic-language browser is never sent to placeholder copy. Revisit with real Arabic.
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeCookie: false,
  localeDetection: false,
});

const RTL_LOCALES: ReadonlySet<string> = new Set(['ar']);

/** Text direction for `<html dir>`, which mirrors the whole layout. */
export function getDirection(locale: string): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}
