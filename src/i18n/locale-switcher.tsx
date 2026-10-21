'use client';
/**
 * src/i18n/locale-switcher.tsx
 *
 * Purpose:   Links to the current page in every other supported language.
 * Inputs:    The active locale and pathname from next-intl.
 * Outputs:   A labelled <nav> with one link per other language, named in that language.
 * Invariants:
 *   - Each link carries `lang` and `hrefLang`, so screen readers pronounce the language name
 *     correctly and the target language is declared.
 *   - Stays on the same page: only the locale changes.
 */
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from './navigation';
import { routing } from './routing';

/** Language switch for the site header. */
export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t('label')}>
      {routing.locales
        .filter((other) => other !== locale)
        .map((other) => (
          <Link
            key={other}
            href={pathname}
            locale={other}
            lang={other}
            hrefLang={other}
            className="underline"
          >
            {t(other)}
          </Link>
        ))}
    </nav>
  );
}
