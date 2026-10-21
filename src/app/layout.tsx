/**
 * src/app/layout.tsx
 *
 * Purpose:   Root document shell for every route.
 * Inputs:    The rendered route as `children`.
 * Outputs:   The <html> and <body> elements.
 * Invariants:
 *   - `lang` and `dir` are fixed to English and LTR until T0.3 drives them from the locale.
 *   - No metadata or visible text: UI strings must come from the message catalogue
 *     (CLAUDE.md non-negotiable 8), which T0.3 adds.
 */
import './globals.css';

/** Wraps every page in the document shell. */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
