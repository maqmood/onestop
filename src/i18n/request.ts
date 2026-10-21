/**
 * src/i18n/request.ts
 *
 * Purpose:   Per-request next-intl config: resolves the locale and loads its message catalogue.
 * Inputs:    The `[locale]` root param (via next/root-params), or a locale passed explicitly.
 * Outputs:   `{ locale, messages }` for server and client components.
 * Invariants:
 *   - An unsupported locale is a 404, never a silent fallback to English.
 *   - Messages come only from src/i18n/messages/<locale>.json.
 */
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const param = await rootParams.locale();
    if (!hasLocale(routing.locales, param)) notFound();
    locale = param;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
