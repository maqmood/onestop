// Next.js config. Options below are the Next 16.4 template defaults; Tailwind runs as a Turbopack CSS loader.
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Wires src/i18n/request.ts into next-intl.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // CLAUDE.md is the only agent-instruction file; stop `next dev` writing AGENTS.md.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);
