import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      exclude: ['src/app/layout/header/*'],
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
});
