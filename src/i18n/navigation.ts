/**
 * src/i18n/navigation.ts
 *
 * Purpose:   Locale-aware `Link` and `usePathname`, bound to our routing config.
 * Inputs:    The routing config from ./routing.
 * Outputs:   Navigation helpers that add or drop the `/ar` prefix as needed.
 * Invariants: Use these instead of next/link so links keep the visitor's language.
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, usePathname } = createNavigation(routing);
