/**
 * src/i18n/app-config.d.ts
 *
 * Purpose:   Types next-intl's locales and message keys from our config and the English
 *            catalogue, so a missing or misspelled key fails `pnpm typecheck`.
 */
import type en from './messages/en.json';
import type { routing } from './routing';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof en;
  }
}
