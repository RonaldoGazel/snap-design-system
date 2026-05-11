import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['e2e/**/*.spec.ts', 'tests/**/*.test.ts', 'src/app/features/person/**/*.spec.ts'],
    globals: true,
    setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    alias: {
      // Allow importing from src/ in tests
      '@app': path.resolve(__dirname, 'src/app'),
    },
  },
});
