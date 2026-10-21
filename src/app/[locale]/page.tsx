/**
 * src/app/[locale]/page.tsx
 *
 * Purpose:   Home route placeholder; the VIN entry screen replaces it in T2.1.
 * Inputs:    None (the locale comes from the route, via next-intl).
 * Outputs:   The alpha status line.
 * Invariants:
 *   - Text comes only from the message catalogue.
 */
import { useTranslations } from 'next-intl';

/** Home page: a status line until VIN entry arrives. */
export default function HomePage() {
  const t = useTranslations('Home');
  return (
    <main className="p-4">
      <p>{t('status')}</p>
    </main>
  );
}
