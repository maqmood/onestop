// Vitest config. next-intl's ESM build imports 'next/server' without an extension, which Node's
// ESM loader cannot resolve (next has no "exports" map); inlining lets Vite resolve it instead.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: { deps: { inline: ['next-intl'] } },
  },
});
