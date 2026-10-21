/**
 * src/app/[locale]/layout.tsx
 *
 * Purpose:   Root document shell for every route, per locale (English at /, Arabic at /ar).
 * Inputs:    The `locale` route param and the rendered route as `children`.
 * Outputs:   <html lang dir>, the site header (product name and language switch), the page.
 * Invariants:
 *   - `dir` comes from the locale, so Arabic mirrors the whole layout. Layout classes are
 *     direction-aware (flex order, start/end), never left/right.
 *   - All visible text comes from the message catalogue (CLAUDE.md non-negotiable 8).
 *   - Unknown locales 404 instead of silently falling back to English.
 */
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LocaleSwitcher } from '../../i18n/locale-switcher';
import { getDirection, routing } from '../../i18n/routing';
import '../globals.css';

/** Prerenders every supported locale at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Browser tab title, from the catalogue. */
export async function generateMetadata() {
  const t = await getTranslations('Layout');
  return { title: t('productName') };
}

/** Wraps every page in the localised document shell. */
export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations('Layout');

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider>
          <header className="flex items-center justify-between gap-4 border-b p-4">
            <span className="font-semibold">{t('productName')}</span>
            <LocaleSwitcher />
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
